import React, { useState, useEffect, useCallback, useRef, createRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Container, FormHelperText, FormControl, InputLabel, Select, MenuItem, Typography, Box, CircularProgress, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // Import icon
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'; // Add this for question add button
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { collection, addDoc, query, where, getDocs, limit } from "firebase/firestore"; // Added query, where, getDocs, limit
import { visitsCollection } from '../firebase';
import { notifyDataChange } from '../events';
import LoadingSpinner from '../components/LoadingSpinner';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const datePickerSx = {
  '& .MuiInputBase-root': {
    direction: 'ltr',
  },
  '& .MuiInputLabel-root': {
    transform: 'translate(14px, 16px) scale(1)',
    // Adjust label position in RTL
    right: 'auto',
    left: 0,
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(14px, -9px) scale(0.75)',
  }
};

const inputStyles = (isRtl) => ({
  '& .MuiInputBase-input': {
    textAlign: isRtl ? 'right' : 'left',
  },
  '& .MuiInputLabel-root': {
    transformOrigin: isRtl ? 'right' : 'left',
  },
  // Keep number inputs LTR while maintaining RTL alignment
  '& input[type="number"], & input[type="tel"]': {
    direction: 'ltr',
    textAlign: isRtl ? 'right' : 'left'
  }
});

// Add number conversion utilities
const convertToEnglishNumbers = (str) => {
  return str.replace(/[٠١٢٣٤٥٦٧٨٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
};

const convertToUrduNumbers = (str) => {
  return str.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
};

// Add OFFICERS constant at the top after imports
const OFFICERS = ['Naeem', 'Abid', 'Sajid', 'Raza Muhammed', 'Masood'];

// Add exact officer match function for permission checks
const exactOfficerMatch = (officerNameInRecord, currentOfficerName) => {
  if (!officerNameInRecord || !currentOfficerName) return false;
  
  // If the names are exactly the same (case insensitive), it's a match
  if (officerNameInRecord.toLowerCase() === currentOfficerName.toLowerCase()) return true;
  
  // No fuzzy matching for officer permissions - must be exact
  return false;
};

function NewEntry({ refreshData, visit, onUpdate, isEditing }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const theme = useTheme(); // Add theme definition
  
  // Add auth hook to get user role info
  const { userRole, officerName: currentUserOfficerName, isAdmin, isOfficer } = useAuth();
  
  const [name, setName] = useState(visit?.name || '');
  const [phone, setPhone] = useState(visit?.phone || '');
  const [date, setDate] = useState(visit?.date ? dayjs(visit.date) : dayjs());
  const [timeIn, setTimeIn] = useState(visit?.timeIn ? dayjs(visit.timeIn, 'HH:mm') : dayjs());
  const [timeOut, setTimeOut] = useState(visit?.timeOut ? dayjs(visit.timeOut, 'HH:mm') : dayjs());
  const [responseDate, setResponseDate] = useState(visit?.responseDate ? dayjs(visit.responseDate) : dayjs());
  
  // Initialize questions as an array of tags
  const initialQuestions = visit?.userQuestion 
    ? visit.userQuestion.split(/\(\d+\)/).filter(q => q.trim()).map(q => q.trim())
    : [];
  const [questions, setQuestions] = useState(initialQuestions);
  const [currentQuestion, setCurrentQuestion] = useState('');
  
  const [officerAnswer, setOfficerAnswer] = useState(visit?.officerAnswer || '');
  const [address, setAddress] = useState(visit?.address || '');
  
  // For officer role, automatically set their name
  const [officerName, setOfficerName] = useState(
    isOfficer ? currentUserOfficerName : (visit?.officerName || '')
  );
  
  const [matchedClients, setMatchedClients] = useState([]);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  // Add validation states
  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    address: '',
    questions: '',
    timeIn: '',
    timeOut: '',
    officerName: '',
  });

  // Add language changing state
  const [isLanguageChanging, setIsLanguageChanging] = useState(false);

  // Move preventClickDuringTransition inside component
  const preventClickDuringTransition = (e) => {
    if (isLanguageChanging) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const isRtl = i18n.language === 'ur';

  // Create refs array for question fields
  const questionRefs = useRef(Array(questions.length).fill().map(() => createRef()));

  // Update refs when questions length changes
  useEffect(() => {
    questionRefs.current = Array(questions.length).fill().map((_, i) => 
      questionRefs.current[i] || createRef()
    );
  }, [questions.length]);

  // Updated validation function
  const validateForm = () => {
    const newErrors = {
      questions: ''
    };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = t('nameRequired');
      isValid = false;
    }

    if (!phone.trim()) {
      newErrors.phone = t('phoneRequired');
      isValid = false;
    } else if (!/^\d{10,11}$/.test(phone)) {
      newErrors.phone = t('invalidPhone');
      isValid = false;
    }

    if (!address.trim()) {
      newErrors.address = t('addressRequired');
      isValid = false;
    }

    // Validate questions
    if (questions.length === 0) {
      newErrors.questions = t('questionRequired');
      isValid = false;
    }

    if (!timeIn) {
      newErrors.timeIn = t('timeInRequired');
      isValid = false;
    }
    if (!timeOut) {
      newErrors.timeOut = t('timeOutRequired');
      isValid = false;
    }
    if (timeIn && timeOut && timeIn.isAfter(timeOut)) {
      newErrors.timeOut = t('invalidTimeOut');
      isValid = false;
    }

    if (!officerName) {
      newErrors.officerName = t('officerNameRequired');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handlePhoneChange = (e) => {
    let val = e.target.value;
    // Convert Urdu numbers to English if needed
    val = convertToEnglishNumbers(val);
    // Remove non-digits
    val = val.replace(/\D/g, '');
    setPhone(val);
    if (errors.phone) {
      setErrors({ ...errors, phone: '' });
    }
  };

  const formatDisplayPhone = (phone) => {
    if (i18n.language === 'ur') {
      return convertToUrduNumbers(phone);
    }
    return phone;
  };

  // Debounced function to check for existing names and get data
  const checkExistingName = useCallback(async (currentName) => {
    const trimmedName = currentName.trim();
    if (!trimmedName || trimmedName.length < 3) {
      setMatchedClients([]);
      setIsCheckingName(false);
      return;
    }
    setIsCheckingName(true);
    setMatchedClients([]);
    try {
      const q = query(
        visitsCollection,
        where('name', '==', trimmedName)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        // Collect all matches
        const clients = querySnapshot.docs.map(doc => doc.data());
        setMatchedClients(clients);
      } else {
        setMatchedClients([]);
      }
    } catch (error) {
      console.error("Error checking name:", error);
      setMatchedClients([]);
    } finally {
      setIsCheckingName(false);
    }
  }, []);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    if (errors.name) {
      setErrors({ ...errors, name: '' });
    }
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    const newTimeout = setTimeout(() => {
      checkExistingName(newName);
    }, 500);
    setDebounceTimeout(newTimeout);
    setMatchedClients([]);
  };

  // Function to apply matched data to the form
  const applyMatchedData = (client) => {
    if (client) {
      setPhone(client.phone || '');
      setAddress(client.address || '');
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);


  const calculateDuration = (timeIn, timeOut) => {
    if (!timeIn || !timeOut) return '';
    const duration = timeOut.diff(timeIn, 'minute');
    return i18n.language === 'ur' ? convertToUrduNumbers(duration.toString()) : duration.toString();
  };

  // When editing, check if the current user has permission to edit this visit
  useEffect(() => {
    if (isEditing && visit) {
      // If user is an officer, they can only edit their own visits
      if (isOfficer && !exactOfficerMatch(visit.officerName, currentUserOfficerName)) {
        // Redirect back to dashboard with error
        navigate('/');
        // You could add a notification here about not having permission
        console.error('Permission denied: Officer can only edit their own visits');
      }
    }
  }, [isEditing, visit, isOfficer, currentUserOfficerName, navigate]);

  // Handle adding a question tag when Enter is pressed
  const handleAddQuestionTag = (e) => {
    e.preventDefault();
    const trimmedQuestion = currentQuestion.trim();
    
    if (trimmedQuestion) {
      setQuestions([...questions, trimmedQuestion]);
      setCurrentQuestion('');
      
      // Clear question error if any
      if (errors.questions) {
        setErrors({ ...errors, questions: '' });
      }
    }
  };
  
  // Handle deleting a question tag
  const handleDeleteQuestionTag = (indexToDelete) => {
    setQuestions(questions.filter((_, index) => index !== indexToDelete));
  };
  
  // Handle question text change
  const handleQuestionChange = (e) => {
    setCurrentQuestion(e.target.value);
  };
  
  // Handle key press in question field
  const handleQuestionKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddQuestionTag(e);
    }
  };

  const handleFormSubmit = async (e) => {
    if (isLanguageChanging) {
      preventClickDuringTransition(e);
      return;
    }

    try {
      if (!validateForm()) {
        return;
      }

      setLoading(true);
      setLoadingMessage(t('savingChanges'));
      const duration = calculateDuration(timeIn, timeOut);

      // Format questions as "(1)question1 (2)question2..." format
      const formattedQuestions = questions
        .map((q, i) => `(${i+1})${q}`)
        .join(' ');

      // If officer, ensure their name is set correctly
      const submittedOfficerName = isOfficer ? currentUserOfficerName : officerName;

      const formattedData = {
        name: name.trim(),
        phone: convertToEnglishNumbers(phone.trim()),
        address: address.trim(),
        date: date.format('YYYY-MM-DD'),
        timeIn: timeIn.format('HH:mm'),
        timeOut: timeOut.format('HH:mm'),
        duration: duration.toString(),
        responseDate: responseDate.format('YYYY-MM-DD'),
        userQuestion: formattedQuestions,
        officerAnswer: officerAnswer.trim() || t('pendingStatus'),
        officerName: submittedOfficerName,
        // Add fields for audit tracking
        lastUpdatedBy: isAdmin ? 'admin' : currentUserOfficerName,
        lastUpdatedAt: new Date().toISOString()
      };

      if (!isEditing) {
        // Add creation audit fields for new entries
        formattedData.createdBy = isAdmin ? 'admin' : currentUserOfficerName;
        formattedData.createdAt = new Date().toISOString();
        formattedData.status = 'pending';
        await addDoc(visitsCollection, formattedData);
      } else {
        // Update existing entry
        await onUpdate(formattedData);
      }

      notifyDataChange();
      
      if (refreshData) {
        await refreshData();
      }
      
      navigate('/');
    } catch (error) {
      console.error('Form error:', error);
      alert(t('errorSavingVisit'));
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Track language changes for smooth transitions
  useEffect(() => {
    const handleLanguageChange = () => {
      setIsLanguageChanging(true);
      setTimeout(() => setIsLanguageChanging(false), 300);
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  if (loading) {
    return <LoadingSpinner fullscreen />;
  }

  return (
    <Container 
      maxWidth="md" 
      className="new-entry-page"
      style={{
        opacity: isLanguageChanging ? 0.5 : 1,
        transition: 'opacity 0.3s ease-in-out',
        pointerEvents: isLanguageChanging ? 'none' : 'auto'
      }}
    >
      <div className="form-container-inner" dir={i18n.language === 'ur' ? 'rtl' : 'ltr'}>
        <h2 className="form-title">
          {isEditing ? t('editVisit') : t('createNewVisit')}
        </h2>
        <div className="form-fields">
          <TextField
            required
            fullWidth
            label={t('name')}
            value={name}
            onChange={handleNameChange}
            margin="normal"
            error={!!errors.name}
            helperText={
              errors.name && (
                <span style={{ display: 'flex', alignItems: 'center', color: '#d32f2f' }}>
                  <ErrorOutlineIcon fontSize="small" style={{ marginRight: 4 }} />
                  {errors.name}
                </span>
              )
            }
            inputProps={{
              dir: i18n.language === 'ur' ? 'rtl' : 'ltr'
            }}
            sx={inputStyles(isRtl)}
          />
          {/* Display Name Check Status and Autofill Suggestion */}
          <Box sx={{ minHeight: '36px', mt: 1, mb: 1, textAlign: isRtl ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {isCheckingName && <CircularProgress size={20} />}
            {!isCheckingName && matchedClients.length === 1 && (
              <>
                <Typography variant="caption" color="info.main">
                  {t('clientFoundSuggestion', { name: matchedClients[0].name })}
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => applyMatchedData(matchedClients[0])}
                  startIcon={<CheckCircleOutlineIcon fontSize="small" />}
                  sx={{ textTransform: 'none', ml: 0.5 }}
                >
                  {t('useDataButton')}
                </Button>
              </>
            )}
            {!isCheckingName && matchedClients.length > 1 && (
              <>
                <Typography variant="caption" color="info.main" sx={{ mr: 1 }}>
                  {t('multipleClientsFound')}
                </Typography>
                {matchedClients.map((client, idx) => (
                  <Button
                    key={idx}
                    size="small"
                    variant="outlined"
                    onClick={() => applyMatchedData(client)}
                    sx={{ textTransform: 'none', ml: 0.5, mb: 0.5 }}
                  >
                    {client.name} ({formatDisplayPhone(client.phone)})
                  </Button>
                ))}
              </>
            )}
            {!isCheckingName && matchedClients.length === 0 && name.trim().length > 0 && name.trim().length < 3 && (
              <Typography variant="caption" color="text.secondary">
                {t('typeMoreCharsForCheck')}
              </Typography>
            )}
          </Box>
          <TextField
            required
            fullWidth
            label={t('phone')}
            value={formatDisplayPhone(phone)}
            onChange={handlePhoneChange}
            margin="normal"
            error={!!errors.phone}
            helperText={
              errors.phone && (
                <span style={{ display: 'flex', alignItems: 'center', color: '#d32f2f' }}>
                  <ErrorOutlineIcon fontSize="small" style={{ marginRight: 4 }} />
                  {errors.phone}
                </span>
              )
            }
            inputProps={{
              maxLength: 11,
              inputMode: 'numeric',
              pattern: '[0-9٠١٢٣٤٥٦٧٨٩]*',
              dir: 'ltr'
            }}
            sx={inputStyles(isRtl)}
          />
          <TextField
            required
            fullWidth
            label={t('address')}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            margin="normal"
            error={!!errors.address}
            helperText={
              errors.address && (
                <span style={{ display: 'flex', alignItems: 'center', color: '#d32f2f' }}>
                  <ErrorOutlineIcon fontSize="small" style={{ marginRight: 4 }} />
                  {errors.address}
                </span>
              )
            }
            inputProps={{
              dir: i18n.language === 'ur' ? 'rtl' : 'ltr'
            }}
            multiline
            rows={2}
            sx={inputStyles(isRtl)}
          />
          <FormControl 
            fullWidth
            required
            error={!!errors.officerName}
            margin="normal"
          >
            <InputLabel>{t('officerName')}</InputLabel>
            {isAdmin ? (
              // Admin can select any officer
              <Select
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                label={t('officerName')}
                disabled={isLanguageChanging}
                sx={{
                  textAlign: isRtl ? 'right' : 'left',
                  direction: 'inherit'
                }}
              >
                {OFFICERS.map((officer) => (
                  <MenuItem key={officer} value={officer}>
                    {officer}
                  </MenuItem>
                ))}
              </Select>
            ) : (
              // Officer sees read-only field with their name
              <TextField
                value={officerName}
                label={t('officerName')}
                disabled={true}
                InputProps={{
                  readOnly: true,
                }}
                sx={{
                  textAlign: isRtl ? 'right' : 'left',
                  direction: 'inherit',
                  '& .MuiInputBase-input': {
                    color: theme.palette.text.secondary,
                  }
                }}
              />
            )}
            {errors.officerName && (
              <FormHelperText>
                <span style={{ display: 'flex', alignItems: 'center', color: '#d32f2f' }}>
                  <ErrorOutlineIcon fontSize="small" style={{ marginRight: 4 }} />
                  {errors.officerName}
                </span>
              </FormHelperText>
            )}
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              required
              label={t('date')}
              value={date}
              onChange={(newDate) => setDate(newDate)}
              sx={datePickerSx}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!errors.date,
                  helperText: errors.date,
                  sx: inputStyles(isRtl)
                },
                popper: {
                  sx: {
                    direction: 'ltr',
                    '& .MuiPickersCalendarHeader-root': {
                      direction: 'ltr'
                    }
                  }
                }
              }}
            />
            <TimePicker
              required
              label={t('timeIn')}
              value={timeIn}
              onChange={(newTime) => {
                setTimeIn(newTime);
                if (errors.timeIn) {
                  setErrors({ ...errors, timeIn: '' });
                }
              }}
              sx={datePickerSx}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!errors.timeIn,
                  helperText: errors.timeIn && (
                    <span style={{ display: 'flex', alignItems: 'center', color: '#d32f2f' }}>
                      <ErrorOutlineIcon fontSize="small" style={{ marginRight: 4 }} />
                      {errors.timeIn}
                    </span>
                  ),
                  sx: inputStyles(isRtl)
                }
              }}
            />
            <TimePicker
              required
              label={t('timeOut')}
              value={timeOut}
              onChange={(newTime) => {
                setTimeOut(newTime);
                if (errors.timeOut) {
                  setErrors({ ...errors, timeOut: '' });
                }
              }}
              sx={datePickerSx}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  error: !!errors.timeOut,
                  helperText: errors.timeOut && (
                    <span style={{ display: 'flex', alignItems: 'center', color: '#d32f2f' }}>
                      <ErrorOutlineIcon fontSize="small" style={{ marginRight: 4 }} />
                      {errors.timeOut}
                    </span>
                  ),
                  sx: inputStyles(isRtl)
                }
              }}
            />
            <DatePicker
              label={t('officerResponseDate')}
              value={responseDate}
              onChange={(newDate) => setResponseDate(newDate)}
              sx={datePickerSx}
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: inputStyles(isRtl)
                },
                popper: {
                  sx: {
                    direction: 'ltr',
                    '& .MuiPickersCalendarHeader-root': {
                      direction: 'ltr'
                    }
                  }
                }
              }}
            />
          </LocalizationProvider>
          <Typography variant="subtitle1" style={{ 
            textAlign: i18n.language === 'ur' ? 'right' : 'left',
            marginTop: '16px',
            marginBottom: '8px'
          }}>
            {t('questions')} * ({questions.length} {t('questions')})
          </Typography>
          
          {/* Question input field */}
          <form onSubmit={handleAddQuestionTag} style={{ marginBottom: '8px' }} noValidate>
            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={6}
              value={currentQuestion}
              onChange={handleQuestionChange}
              onKeyPress={handleQuestionKeyPress}
              placeholder={t('typeQuestionAndPressEnter')}
              margin="dense"
              error={!!errors.questions}
              helperText={
                errors.questions && (
                  <span style={{ display: 'flex', alignItems: 'center', color: '#d32f2f' }}>
                    <ErrorOutlineIcon fontSize="small" style={{ marginRight: 4 }} />
                    {errors.questions}
                  </span>
                )
              }
              inputProps={{
                dir: i18n.language === 'ur' ? 'rtl' : 'ltr'
              }}
              sx={inputStyles(isRtl)}
            />
          </form>
          
          {/* Display question tags */}
          <Box 
            sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1,
              mb: 2
            }}
          >
            {questions.map((question, index) => (
              <Chip
                key={index}
                label={question}
                onDelete={() => handleDeleteQuestionTag(index)}
                color="primary"
                variant="outlined"
                sx={{ 
                  direction: 'ltr',
                  '& .MuiChip-label': {
                    direction: i18n.language === 'ur' ? 'rtl' : 'ltr'
                  }
                }}
              />
            ))}
          </Box>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label={t('officerAnswer')}
            value={officerAnswer}
            onChange={(e) => setOfficerAnswer(e.target.value)}
            margin="normal"
            inputProps={{
              dir: i18n.language === 'ur' ? 'rtl' : 'ltr'
            }}
            sx={inputStyles(isRtl)}
          />
        </div>
        <div className="form-actions" style={{
          flexDirection: isRtl ? 'row-reverse' : 'row'
        }}>
          <Button
            className="save-visit-button"
            variant="contained"
            onClick={handleFormSubmit}
            disabled={loading || isLanguageChanging}
          >
            {isEditing ? t('updateVisit') : t('saveVisit')}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            className="close-form-btn"
            onClick={(e) => {
              preventClickDuringTransition(e);
              if (!isLanguageChanging) {
                navigate('/');
              }
            }}
            disabled={loading || isLanguageChanging}
          >
            {t('cancel')}
          </Button>
        </div>
        <FormHelperText style={{ 
          textAlign: i18n.language === 'ur' ? 'right' : 'left',
          marginTop: '1rem'
        }}>
          {t('requiredFields')}
        </FormHelperText>
      </div>
    </Container>
  );
}

export default NewEntry;
