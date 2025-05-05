import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Container, FormHelperText, FormControl, InputLabel, Select, MenuItem, Typography, Box, CircularProgress } from '@mui/material';
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
  
  // Replace single userQuestion with questions array
  const initialQuestions = visit?.userQuestion 
    ? visit.userQuestion.split(/\(\d+\)/).filter(q => q.trim()).map(q => q.trim())
    : [''];
  const [questions, setQuestions] = useState(initialQuestions);
  
  const [officerAnswer, setOfficerAnswer] = useState(visit?.officerAnswer || '');
  const [address, setAddress] = useState(visit?.address || '');
  
  // For officer role, automatically set their name
  const [officerName, setOfficerName] = useState(
    isOfficer ? currentUserOfficerName : (visit?.officerName || '')
  );
  
  const [matchedClientData, setMatchedClientData] = useState(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [debounceTimeout, setDebounceTimeout] = useState(null);

  // Add validation states
  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    address: '',
    questions: [],
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

  // Update error messages to use translations
  const validateForm = () => {
    const newErrors = {
      questions: Array(questions.length).fill('')
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

    // Validate all questions
    let hasValidQuestion = false;
    questions.forEach((question, index) => {
      if (question.trim()) {
        hasValidQuestion = true;
      }
    });

    if (!hasValidQuestion) {
      newErrors.questions[0] = t('questionRequired');
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
    if (!trimmedName || trimmedName.length < 3) { // Only search if name has at least 3 chars
      setMatchedClientData(null); // Clear any previous match
      setIsCheckingName(false);
      return;
    }
    setIsCheckingName(true);
    setMatchedClientData(null); // Clear previous match before new search
    try {
      const q = query(
        visitsCollection,
        where('name', '==', trimmedName),
        limit(1) // We only need the first match to autofill
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        // Found a match, store its data
        const firstMatchData = querySnapshot.docs[0].data();
        setMatchedClientData({
          name: firstMatchData.name, // Keep name for display
          phone: firstMatchData.phone,
          address: firstMatchData.address
        });
      } else {
        setMatchedClientData(null); // No match found
      }
    } catch (error) {
      console.error("Error checking name:", error);
      setMatchedClientData(null); // Clear matches on error
    } finally {
      setIsCheckingName(false);
    }
  }, []); // Empty dependency array

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    if (errors.name) {
      setErrors({ ...errors, name: '' }); // Clear name error on change
    }

    // Clear previous debounce timer
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Set a new timer
    const newTimeout = setTimeout(() => {
      checkExistingName(newName);
    }, 500); // 500ms delay
    setDebounceTimeout(newTimeout);
    setMatchedClientData(null); // Clear match data immediately when user types again
  };

  // Function to apply matched data to the form
  const applyMatchedData = () => {
    if (matchedClientData) {
      setPhone(matchedClientData.phone || ''); // Use matched phone or empty string
      setAddress(matchedClientData.address || ''); // Use matched address or empty string
      // Optionally clear the suggestion after applying
      // setMatchedClientData(null); 
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
        .filter(q => q.trim())
        .map((q, i) => `(${i+1})${q.trim()}`)
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

  // Handle adding a new question
  const handleAddQuestion = () => {
    setQuestions([...questions, '']);
    setErrors({...errors, questions: [...errors.questions, '']});
  };
  
  // Handle question change
  const handleQuestionChange = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
    
    // Clear error for this question if any
    if (errors.questions && errors.questions[index]) {
      const newQuestionErrors = [...errors.questions];
      newQuestionErrors[index] = '';
      setErrors({...errors, questions: newQuestionErrors});
    }
  };
  
  // Handle key press in question field
  const handleQuestionKeyPress = (e, index) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (index === questions.length - 1) {
        // If it's the last question, add a new one
        handleAddQuestion();
        // Focus will be handled in useEffect
      } else {
        // Focus the next question field
        const nextField = document.getElementById(`question-${index + 1}`);
        if (nextField) nextField.focus();
      }
    }
  };
  
  // Focus the newly added question field
  useEffect(() => {
    const lastIndex = questions.length - 1;
    if (lastIndex > 0) {
      const lastField = document.getElementById(`question-${lastIndex}`);
      if (lastField) lastField.focus();
    }
  }, [questions.length]);

  // Question Input Component
  const QuestionInputs = () => {
    return (
      <div className="questions-container">
        {questions.map((question, index) => (
          <div key={index} className="question-field-container" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <Typography variant="body1" style={{ marginRight: '8px', minWidth: '24px' }}>
              {(index + 1) + '.'}
            </Typography>
            <TextField
              id={`question-${index}`}
              fullWidth
              multiline
              rows={2}
              placeholder={index === 0 ? t('question') : t('additionalQuestion')}
              value={question}
              onChange={(e) => handleQuestionChange(index, e.target.value)}
              onKeyPress={(e) => handleQuestionKeyPress(e, index)}
              margin="dense"
              error={!!(errors.questions && errors.questions[index])}
              helperText={errors.questions && errors.questions[index]}
              inputProps={{
                dir: i18n.language === 'ur' ? 'rtl' : 'ltr'
              }}
              sx={inputStyles(isRtl)}
            />
          </div>
        ))}
        <Button
          variant="text"
          color="primary"
          startIcon={<AddCircleOutlineIcon />}
          onClick={handleAddQuestion}
          sx={{ mt: 1 }}
        >
          {t('addQuestion')}
        </Button>
      </div>
    );
  };

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
            onChange={handleNameChange} // Use the new handler
            margin="normal"
            error={!!errors.name}
            helperText={errors.name}
            inputProps={{
              dir: i18n.language === 'ur' ? 'rtl' : 'ltr'
            }}
            sx={inputStyles(isRtl)}
          />
          {/* Display Name Check Status and Autofill Suggestion */}
          <Box sx={{ minHeight: '36px', mt: 1, mb: 1, textAlign: isRtl ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 1 }}>
            {isCheckingName && <CircularProgress size={20} />}
            {!isCheckingName && matchedClientData && (
              <>
                <Typography variant="caption" color="info.main"> {/* Changed color */}
                  {t('clientFoundSuggestion', { name: matchedClientData.name })}
                </Typography>
                <Button 
                  size="small" 
                  variant="text" // Change variant to text
                  onClick={applyMatchedData}
                  startIcon={<CheckCircleOutlineIcon fontSize="small" />} // Add icon
                  sx={{ textTransform: 'none', ml: 0.5 }} // Adjust styling
                >
                  {t('useDataButton')}
                </Button>
              </>
            )}
             {!isCheckingName && !matchedClientData && name.trim().length > 0 && name.trim().length < 3 && (
               <Typography variant="caption" color="text.secondary"> {/* Adjusted color */}
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
            helperText={errors.phone}
            inputProps={{
              maxLength: 11,
              inputMode: 'numeric',
              pattern: '[0-9٠١٢٣٤٥٦٧٨٩]*',
              dir: 'ltr' // Keep phone numbers left-to-right
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
            helperText={errors.address}
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
              <FormHelperText>{errors.officerName}</FormHelperText>
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
                    // Ensure calendar popup is always LTR
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
                  helperText: errors.timeIn,
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
                  helperText: errors.timeOut,
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
            {t('questions')} *
          </Typography>
          <QuestionInputs />
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
