import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, Grid, FormControl, InputLabel,
  Select, MenuItem, TextField, AppBar, Toolbar, Typography,
  CircularProgress, TablePagination, Tooltip, Checkbox,
  TableSortLabel, InputAdornment, Card, CardContent, Box, Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Autocomplete from '@mui/material/Autocomplete';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import DateRangeIcon from '@mui/icons-material/DateRange';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useTheme as useMUITheme } from '@mui/material/styles';
import { useTheme as useAppTheme } from '../ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useAuth } from '../contexts/AuthContext';

// List of officers - must match the ones used in the system
const OFFICERS = ['Naeem', 'Abid', 'Sajid', 'Raza Muhammed', 'Masood'];

const formatDate = (dateString, language) => {
  if (!dateString) return 'N/A';
  const date = dayjs(dateString);
  if (language === 'ur') {
    // Use Arabic numerals for Urdu dates
    return date.format('YYYY-MM-DD').replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  }
  return date.format('YYYY-MM-DD');
};

const formatTime = (timeString, language) => {
  if (!timeString) return 'N/A';
  if (language === 'ur') {
    return timeString.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  }
  return timeString;
};

// Add number formatter for Urdu
const formatNumber = (num, language) => {
  if (language === 'ur') {
    return String(num).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  }
  return num;
};

// Add search handling utils
const normalizeText = (text) => {
  if (!text) return '';
  return text.toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // Normalize unicode characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    // Keep non-Latin characters for languages like Urdu
    .replace(/[^\p{L}\p{N}\s]/gu, '') // Remove special characters but keep all letters from all languages
    .replace(/\s+/g, ' '); // Normalize whitespace
};

const fuzzyMatch = (text, search) => {
  if (!search) return true;
  if (!text) return false;

  const normalizedText = normalizeText(text);
  const normalizedSearch = normalizeText(search);
  const searchWords = normalizedSearch.split(' ').filter(word => word.length > 0);

  return searchWords.every(searchWord => {
    // Check for exact match
    if (normalizedText.includes(searchWord)) return true;

    // Check for partial match (at least 2 characters)
    if (searchWord.length >= 2) {
      return normalizedText.split(' ').some(word => {
        if (word.length < 2) return false;
        // Allow matches with up to 1 typo for every 4 characters
        const maxDistance = Math.floor(Math.max(searchWord.length, word.length) / 4);
        let errors = 0;
        let searchIndex = 0;

        for (let i = 0; i < word.length && errors <= maxDistance; i++) {
          if (searchWord[searchIndex] === word[i]) {
            searchIndex++;
          } else {
            errors++;
          }
        }

        return errors <= maxDistance && searchIndex >= searchWord.length * 0.75;
      });
    }

    return false;
  });
};

// New function for strict officer name matching (used for permissions)
const exactOfficerMatch = (officerNameInRecord, currentOfficerName) => {
  if (!officerNameInRecord || !currentOfficerName) return false;
  
  // Simple exact match only - case insensitive
  const recordName = String(officerNameInRecord).toLowerCase().trim();
  const currentName = String(currentOfficerName).toLowerCase().trim();
  
  console.log(`Strict comparing: "${recordName}" with "${currentName}"`);
  
  // First check - direct string comparison (case insensitive)
  if (recordName === currentName) {
    console.log(`EXACT MATCH: ${recordName} = ${currentName}`);
    return true;
  }
  
  // Check if both names are in our official OFFICERS list (normalized)
  const standardizedRecordName = OFFICERS.find(name => 
    name.toLowerCase().trim() === recordName
  );
  const standardizedCurrentName = OFFICERS.find(name => 
    name.toLowerCase().trim() === currentName
  );
  
  // Only match if both names are found in OFFICERS list and are the same
  const isExactMatch = standardizedRecordName === standardizedCurrentName;
  console.log(`Standardized match result: ${isExactMatch}`);
  
  return isExactMatch;
};

// Function to count questions in visits
const countQuestionsInVisits = (visits, selectedMonth = null, officerName = null) => {
  // First filter the visits by month and officer if needed
  const filteredVisits = visits.filter(visit => {
    // If selectedMonth is provided, filter by month
    if (selectedMonth) {
      const visitMonth = dayjs(visit.date).format('MM');
      if (visitMonth !== selectedMonth) {
        return false;
      }
    }
    
    // If officerName is provided, filter by officer
    if (officerName) {
      // Use EXACT matching for officer name to avoid counting other officers' questions
      return exactOfficerMatch(visit.officerName, officerName);
    }
    
    return true;
  });
  
  // Count the questions in the filtered visits by looking for the (n) pattern in userQuestion
  return filteredVisits.reduce((total, visit) => {
    // Use regex to count (1), (2), etc. patterns in the question
    const questionMatches = visit.userQuestion ? visit.userQuestion.match(/\(\d+\)/g) : null;
    const questionCount = questionMatches ? questionMatches.length : 0;
    
    // If there are no numbered questions but there is text, count it as 1 question
    return total + (questionCount > 0 ? questionCount : (visit.userQuestion ? 1 : 0));
  }, 0);
};

// Function to count visits per officer
const countVisitsPerOfficer = (visits, officerName, selectedMonth = null) => {
  return visits.filter(visit => {
    // Filter by officer name using exact match
    if (!exactOfficerMatch(visit.officerName, officerName)) return false;
    
    // If selectedMonth is provided, filter by month as well
    if (selectedMonth) {
      const visitMonth = dayjs(visit.date).format('MM');
      return visitMonth === selectedMonth;
    }
    
    return true;
  }).length;
};

function Dashboard({ visits = [], onDelete }) {
  // Add auth hook
  const { logout, userRole, officerName, isAdmin, isOfficer } = useAuth();
  const [localVisits, setLocalVisits] = useState(visits);
  const [filters, setFilters] = useState({
    sNo: '',
    clientName: '',
    contactNumber: '',
    address: '',
    duration: '',
    officerName: '',
    question: '',
    officerResponseDate: '',
    officerAnswer: '',
  });
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [isLanguageChanging, setIsLanguageChanging] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [visitsPerMonth, setVisitsPerMonth] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalMonthlyQuestions, setTotalMonthlyQuestions] = useState(0);
  const [currentMonthName, setCurrentMonthName] = useState('');
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useMUITheme();
  const { darkMode, toggleTheme } = useAppTheme();
  const isRtl = i18n.language === 'ur';
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('date');
  const [order, setOrder] = useState('desc');
  const [selected, setSelected] = useState([]);

  // State for unique filter values
  const [uniqueOfficerNames, setUniqueOfficerNames] = useState([]);
  const [uniqueDates, setUniqueDates] = useState([]);
  const [uniqueDurations, setUniqueDurations] = useState([]);
  const [uniqueAddresses, setUniqueAddresses] = useState([]);

  const tableStyles = {
    container: {
      margin: '32px 0',
      padding: '24px',
      overflowX: 'auto',
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : theme.palette.background.paper,
      borderRadius: '20px',
      boxShadow: theme.palette.mode === 'dark' 
        ? '0 8px 32px rgba(0, 0, 0, 0.7)' 
        : '0 10px 40px rgba(64, 181, 173, 0.12)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)'}`,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    table: {
      minWidth: 'auto',
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: '0 4px', // Add spacing between rows
    },
    headerCell: {
      backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f3f8fa',
      color: theme.palette.mode === 'dark' ? '#e0e0e0' : '#445A74',
      padding: '14px 10px',
      fontWeight: 700,
      fontSize: '0.875rem',
      borderBottom: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#e6ebf1'}`,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      whiteSpace: 'nowrap',
    },
    cell: {
      padding: '12px 10px',
      borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f0f4f7'}`,
      color: theme.palette.text.primary,
      fontSize: '0.875rem',
      transition: 'all 0.2s ease-in-out',
      maxWidth: '150px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    textCell: {
      maxWidth: '120px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    actionButtons: {
      display: 'flex',
      gap: '6px',
      alignItems: 'center'
    },
    numberCell: {
      width: '40px',
      textAlign: 'center',
      fontWeight: 600,
      color: theme.palette.mode === 'dark' ? '#40B5AD' : '#40B5AD',
    },
    phoneCell: {
      width: '100px',
    },
    dateCell: {
      width: '90px',
    },
    timeCell: {
      width: '70px',
    },
    durationCell: {
      width: '70px',
    },
    actionCell: {
      width: '110px',
      padding: '4px',
      display: 'flex',
      gap: '2px',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    iconButton: {
      padding: '6px',
      borderRadius: '8px',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(64, 181, 173, 0.1)',
        transform: 'translateY(-2px)',
      }
    }
  };

  const filterStyles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
      padding: '0 16px',
      marginBottom: '2rem',
      '@media screen and (maxWidth: 600px)': {
        flexDirection: 'column !important',
        gap: '16px',
        padding: '20px',
      },
    },
    innerContainer: {
      display: 'flex',
      gap: '16px',
      padding: '24px',
      alignItems: 'center',
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.25)' : theme.palette.background.paper,
      borderRadius: '24px',
      boxShadow: theme.palette.mode === 'dark' 
        ? '0 8px 32px rgba(0, 0, 0, 0.7)' 
        : '0 15px 35px rgba(64, 181, 173, 0.12)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)'}`,
      maxWidth: '800px',
      width: '100%',
      flexDirection: isRtl ? 'row-reverse' : 'row',
      justifyContent: 'center',
      margin: '0 auto',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      backgroundImage: theme.palette.mode === 'dark'
        ? 'linear-gradient(145deg, #1e1e1e, #121212)'
        : 'linear-gradient(145deg, #ffffff, #f5f9fa)',
      '@media (max-width: 600px)': {
        flexDirection: 'column !important',
        gap: '16px',
        padding: '20px',
      },
    },
    searchField: {
      minWidth: '220px',
      maxWidth: '300px',
      flex: 1,
      '& .MuiInputBase-root': {
        borderRadius: '16px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
        '&:hover': {
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(64, 181, 173, 0.08)'
        },
        '&.Mui-focused': {
          boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(64, 181, 173, 0.15)'
        }
      },
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'transparent'
      },
      '& .MuiInputBase-input': {
        textAlign: isRtl ? 'right' : 'left',
        direction: 'inherit',
        padding: '14px 16px',
      }
    },
    monthSelect: {
      minWidth: '140px',
      maxWidth: '200px',
      flex: 1,
      '& .MuiOutlinedInput-root': {
        borderRadius: '16px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
        '&:hover': {
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(64, 181, 173, 0.08)'
        },
        '&.Mui-focused': {
          boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(64, 181, 173, 0.15)'
        }
      },
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'transparent'
      },
      '& .MuiSelect-select': {
        textAlign: isRtl ? 'right' : 'left',
        paddingRight: isRtl ? '14px' : '32px',
        paddingLeft: isRtl ? '32px' : '14px',
        padding: '14px 16px',
      },
      '& .MuiSelect-icon': {
        right: isRtl ? 'auto' : '7px',
        left: isRtl ? '7px' : 'auto'
      }
    }
  };

  // Animation variants
  const tableContainerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20
      }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    exit: {
      opacity: 0,
      x: 20,
      transition: { duration: 0.2 }
    }
  };

  // Add month names array
  const months = [
    { value: '01', label: 'january' },
    { value: '02', label: 'february' },
    { value: '03', label: 'march' },
    { value: '04', label: 'april' },
    { value: '05', label: 'may' },
    { value: '06', label: 'june' },
    { value: '07', label: 'july' },
    { value: '08', label: 'august' },
    { value: '09', label: 'september' },
    { value: '10', label: 'october' },
    { value: '11', label: 'november' },
    { value: '12', label: 'december' }
  ];

  // Filter visits based on user role when visits prop changes
  useEffect(() => {
    // Add debugging information
    console.log("Current user role:", userRole);
    console.log("Is officer:", isOfficer);
    console.log("Officer name:", officerName);
    console.log("Is admin:", isAdmin);
    
    // If user is an officer, only show their visits
    if (isOfficer && officerName) {
      console.log("Filtering visits for officer:", officerName);
      console.log("Total visits before filtering:", visits.length);
      
      const officerVisits = visits.filter(visit => {
        // Important: Use EXACT matching here - make sure officers only see their own visits
        const isMatch = exactOfficerMatch(visit.officerName, officerName);
        
        // Debug info
        console.log(`Visit officer: "${visit.officerName}", Current officer: "${officerName}", Match: ${isMatch}`);
        
        if (isMatch) {
          console.log("MATCHED VISIT:", visit);
        }
        return isMatch;
      });
      
      console.log("Officer visits after filtering:", officerVisits.length);
      setLocalVisits(officerVisits);
    } else if (isAdmin) {
      // For admin, show all visits
      console.log("Showing all visits for admin");
      setLocalVisits(visits);
    } else {
      // For regular users, show no visits
      console.log("Regular user - No access to visits");
      setLocalVisits([]);
    }
    setIsLoading(true);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300); // Reduced from 500ms to 300ms

    // Extract unique values for dropdowns (only for admin and officers)
    if (isAdmin || isOfficer) {
      const officerNames = [...new Set(visits.map(visit => visit.officerName).filter(name => name))];
      const dates = [...new Set(visits.map(visit => visit.date).filter(date => date))].sort();
      const durations = [...new Set(visits.map(visit => visit.duration).filter(duration => duration))].sort((a, b) => parseInt(a) - parseInt(b));
      const addresses = [...new Set(visits.map(visit => visit.address).filter(address => address))];

      setUniqueOfficerNames(officerNames);
      setUniqueDates(dates);
      setUniqueDurations(durations);
      setUniqueAddresses(addresses);

      // Get current month
      const currentMonth = dayjs().format('MM');
      const currentMonthNameKey = months.find(m => m.value === currentMonth)?.label || '';
      setCurrentMonthName(currentMonthNameKey);

      // Count total questions for current month
      // If officer, only count their questions
      let visitsToCount = visits;
      if (isOfficer && officerName) {
        console.log(`Filtering questions count for officer: ${officerName}`);
        // Use strict exact matching for officer name to ensure we only count THIS officer's questions
        visitsToCount = visits.filter(v => {
          const isMatch = exactOfficerMatch(v.officerName, officerName);
          console.log(`Visit by ${v.officerName}, match with ${officerName}: ${isMatch}`);
          return isMatch;
        });
        console.log(`After filtering: ${visitsToCount.length} visits belong to ${officerName}`);
      }
      
      // Count questions in the current month using proper question counting
      const filteredVisits = visitsToCount.filter(v => dayjs(v.date).format('MM') === currentMonth);
      const questionsCount = countQuestionsInVisits(filteredVisits);
      
      console.log(`Total questions for ${isOfficer ? officerName : 'admin'}: ${questionsCount}`);
      setTotalMonthlyQuestions(questionsCount);

      // Prepare data for the chart
      const monthlyData = {};
      visitsToCount.forEach(visit => {
        const month = dayjs(visit.date).format('YYYY-MM');
        if (monthlyData[month]) {
          monthlyData[month]++;
        } else {
          monthlyData[month] = 1;
        }
      });

      const chartData = Object.keys(monthlyData).map(month => ({
        month: month,
        visits: monthlyData[month]
      }));

      setVisitsPerMonth(chartData);
    } else {
      // Reset all data for regular users
      setUniqueOfficerNames([]);
      setUniqueDates([]);
      setUniqueDurations([]);
      setUniqueAddresses([]);
      setTotalMonthlyQuestions(0);
      setVisitsPerMonth([]);
    }
    
    return () => clearTimeout(timer);
  }, [visits, isOfficer, officerName, isAdmin, userRole]);

  const handleDelete = async (id) => {
    try {
      // Check if user has permission to delete
      if (!isAdmin && !isOfficer) {
        console.error('Permission denied: Only admin or officer can delete visits');
        return;
      }
      
      // Officer can only delete their own visits
      if (isOfficer) {
        const visitToDelete = visits.find(v => v.id === id);
        if (!visitToDelete || !exactOfficerMatch(visitToDelete.officerName, officerName)) {
          console.error('Permission denied: Officer can only delete their own visits');
          return;
        }
      }
      
      // First update local state to give immediate feedback
      setLocalVisits(current => current.filter(visit => visit.id !== id));
      // Then perform the actual deletion
      await onDelete(id);
    } catch (error) {
      console.error('Error deleting visit:', error);
      // Restore the original state if deletion failed
      setLocalVisits(visits);
    }
  };

  const changeLanguage = async (lng) => {
    try {
      setIsLanguageChanging(true);
      setLoadingMessage(t('changingLanguage'));
      await i18n.changeLanguage(lng);
      // Add delay to ensure smooth transition
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setLoadingMessage('');
      setIsLanguageChanging(false);
    }
  };

  const preventClickDuringTransition = (e) => {
    if (isLanguageChanging) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleFilterChange = (filterName, value) => {
    if (isLanguageChanging) return;
    setFilters({...filters, [filterName]: value});
  };

  const handleMonthChange = (event) => {
    const value = event.target.value;
    if (value.includes('all')) {
      if (!selectedMonths.includes('all')) {
        const allMonths = Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0'));
        setSelectedMonths(['all', ...allMonths]);
      } else {
        setSelectedMonths([]);
      }
    } else {
      const newSelection = value.filter(month => month !== 'all');
      setSelectedMonths(newSelection);
    }
  };

  // Replace multiple filter states with unified search
  const [searchCategory, setSearchCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState(null);

  // Add categories for search
  const searchCategories = [
    { value: 'all', label: 'All Categories' },
    { value: 'sNo', label: 'Serial Number' },
    { value: 'clientName', label: 'Client Name' },
    { value: 'contactNumber', label: 'Contact Number' },
    { value: 'address', label: 'Address' },
    { value: 'duration', label: 'Duration' },
    { value: 'officerName', label: 'Officer Name' },
    { value: 'question', label: 'Question' },
    { value: 'date', label: 'Date' },
    { value: 'officerAnswer', label: 'Officer Answer' }
  ];

  // Unified search function
  const getFilteredVisits = () => {
    const filteredResults = localVisits.filter(visit => {
      // First apply month filter
      if (selectedMonths.length > 0 && !selectedMonths.includes('all')) {
        const visitMonth = dayjs(visit.date).format('MM');
        if (!selectedMonths.includes(visitMonth)) {
          return false;
        }
      }

      // Then apply category search
      if (searchCategory === 'date' && searchDate) {
        const visitDate = dayjs(visit.date);
        return visitDate.format('YYYY-MM-DD') === searchDate.format('YYYY-MM-DD');
      }

      if (!searchQuery && searchCategory !== 'date') return true;

      const normalizedQuery = normalizeText(searchQuery);
      
      if (searchCategory === 'all') {
        return (
          fuzzyMatch(visit.name, normalizedQuery) ||
          fuzzyMatch(visit.phone, normalizedQuery) ||
          fuzzyMatch(visit.address, normalizedQuery) ||
          fuzzyMatch(visit.duration, normalizedQuery) ||
          fuzzyMatch(visit.officerName, normalizedQuery) ||
          fuzzyMatch(visit.userQuestion, normalizedQuery) ||
          fuzzyMatch(visit.date, normalizedQuery) ||
          fuzzyMatch(visit.officerAnswer, normalizedQuery)
        );
      }

      // Category specific search
      switch (searchCategory) {
        case 'sNo':
          return fuzzyMatch((localVisits.indexOf(visit) + 1).toString(), normalizedQuery);
        case 'clientName':
          return fuzzyMatch(visit.name, normalizedQuery);
        case 'contactNumber':
          return fuzzyMatch(visit.phone, normalizedQuery);
        case 'address':
          return fuzzyMatch(visit.address, normalizedQuery);
        case 'duration':
          return fuzzyMatch(visit.duration, normalizedQuery);
        case 'officerName':
          return fuzzyMatch(visit.officerName, normalizedQuery);
        case 'question':
          return fuzzyMatch(visit.userQuestion, normalizedQuery);
        case 'officerAnswer':
          return fuzzyMatch(visit.officerAnswer, normalizedQuery);
        default:
          return true;
      }
    });

    // Update the total questions count - simply use the filtered visit count
    const currentMonth = dayjs().format('MM');
    if (searchCategory === 'officerName' && searchQuery) {
      // Count questions for this officer using the proper question counting function
      const officerQuestionsCount = countQuestionsInVisits(
        filteredResults.filter(v => dayjs(v.date).format('MM') === currentMonth),
        currentMonth,
        searchQuery
      );
      setTotalMonthlyQuestions(officerQuestionsCount);
    } else if (searchQuery || searchCategory === 'date') {
      // For other search types, count questions in the filtered results
      const filteredQuestionsCount = countQuestionsInVisits(
        filteredResults.filter(v => dayjs(v.date).format('MM') === currentMonth)
      );
      setTotalMonthlyQuestions(filteredQuestionsCount);
    } else {
      // If no search is active, count all questions for the current month
      const allQuestionsCount = countQuestionsInVisits(
        localVisits.filter(v => dayjs(v.date).format('MM') === currentMonth)
      );
      setTotalMonthlyQuestions(allQuestionsCount);
    }

    return filteredResults;
  };

  // Add date picker reset when changing category
  const handleCategoryChange = (newCategory) => {
    setSearchCategory(newCategory);
    if (newCategory !== 'date') {
      setSearchDate(null);
    }
    setSearchQuery('');
  };

  // Get filtered visits
  const filteredVisits = useMemo(() => getFilteredVisits(), [localVisits, searchCategory, searchQuery, selectedMonths, searchDate]);

  const renderCell = (value, type) => {
    if (!value) return 'N/A';
    switch(type) {
      case 'date':
        return formatDate(value, i18n.language);
      case 'time':
        return formatTime(value, i18n.language);
      case 'duration':
        const duration = i18n.language === 'ur' 
          ? value.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d])
          : value;
        return `${duration} ${t('minutesShort')}`;
      default:
        return value;
    }
  };

  // Add keyboard handler for language switch
  const handleLanguageKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isLanguageChanging) {
        changeLanguage(i18n.language === 'en' ? 'ur' : 'en');
      }
    }
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      setSelected(filteredVisits.map(visit => visit.id));
      return;
    }
    setSelected([]);
  };

  const handleCheckboxClick = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, id];
    } else {
      newSelected = selected.filter(itemId => itemId !== id);
    }

    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Add role-specific batch delete handler
  const handleBatchDelete = async () => {
    try {
      // Check permissions first
      if (!isAdmin && !isOfficer) {
        console.error('Permission denied: Only admin or officer can delete visits');
        return;
      }
      
      setIsLoading(true);
      setLoadingMessage(t('deletingEntries'));

      // Create a copy of selected IDs before deletion
      const selectedIds = [...selected];
      
      // If officer, filter out visits not belonging to them
      let visitsToDelete = selectedIds;
      if (isOfficer) {
        const officerVisits = visits.filter(v => exactOfficerMatch(v.officerName, officerName));
        const officerVisitIds = officerVisits.map(v => v.id);
        visitsToDelete = selectedIds.filter(id => officerVisitIds.includes(id));
        
        if (visitsToDelete.length !== selectedIds.length) {
          console.warn('Some selected visits were skipped as they do not belong to this officer');
        }
      }
      
      // First update local state to give immediate feedback
      setLocalVisits(current => current.filter(visit => !visitsToDelete.includes(visit.id)));
      
      // Then perform the actual deletion
      for (const id of visitsToDelete) {
        await onDelete(id);
      }
      
      setSelected([]); // Clear selection after successful deletion
      
    } catch (error) {
      console.error('Error in batch delete:', error);
      // Restore the original state if deletion failed
      setLocalVisits(visits);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const sortFunction = (a, b) => {
    if (!a[orderBy] || !b[orderBy]) return 0;
    
    const aValue = a[orderBy].toString().toLowerCase();
    const bValue = b[orderBy].toString().toLowerCase();
    
    if (order === 'asc') {
      return aValue.localeCompare(bValue);
    }
    return bValue.localeCompare(aValue);
  };

  // Apply sorting and pagination to filtered visits
  const sortedAndPaginatedVisits = React.useMemo(() => {
    return [...filteredVisits]
      .sort(sortFunction)
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredVisits, orderBy, order, page, rowsPerPage]);

  // Add table header cells with sorting
  const TableHeaderCell = ({ id, label, sortable = true }) => (
    <TableCell 
      style={{ ...tableStyles.headerCell }}
      sortDirection={orderBy === id ? order : false}
    >
      {sortable ? (
        <TableSortLabel
          active={orderBy === id}
          direction={orderBy === id ? order : 'asc'}
          onClick={() => handleRequestSort(id)}
        >
          {t(label)}
        </TableSortLabel>
      ) : (
        t(label)
      )}
    </TableCell>
  );

  // Add logout handler
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{opacity: isLanguageChanging ? 0.5 : 1}}>
      {isLanguageChanging && (
        <LoadingSpinner fullscreen message={t('changingLanguage')} />
      )}

      <AppBar 
        position="fixed" 
        className="navbar"
        elevation={0}
        sx={{
          width: '100%',
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(18, 18, 20, 0.8)' 
            : 'rgba(255, 255, 255, 0.9)',
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 20px rgba(0, 0, 0, 0.5)' 
            : '0 4px 20px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(10px)',
          zIndex: theme.zIndex.drawer + 1
        }}
      >
        <Toolbar 
          className="navbar-toolbar" 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1.5rem',
            position: 'relative',
            '@media (max-width: 600px)': {
              padding: '0.5rem 1rem'
            }
          }}
        >
          {/* Language Switch Button - Left Side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button 
              className="language-switch-btn"
              onClick={(e) => {
                preventClickDuringTransition(e);
                if (!isLanguageChanging) {
                  changeLanguage(i18n.language === 'en' ? 'ur' : 'en');
                }
              }}
              onKeyDown={handleLanguageKeyPress}
              disabled={isLanguageChanging}
              aria-label={t('changingLanguage')}
              aria-pressed={isLanguageChanging}
              role="switch"
              aria-checked={i18n.language === 'ur'}
              sx={{
                color: theme.palette.text.primary,
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                borderRadius: '12px',
                padding: '8px 16px',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
                },
                minWidth: '100px',
                opacity: isLanguageChanging ? 0.7 : 1,
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
            >
              <span className="language-switch-text" aria-hidden="true">
                {i18n.language === 'en' ? 'اردو | EN' : 'EN | اردو'}
              </span>
              <span className="visually-hidden">
                {i18n.language === 'en' ? 'Switch to Urdu' : 'Switch to English'}
              </span>
            </Button>
            
            {/* User role badge */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                backgroundColor: isAdmin 
                  ? theme.palette.mode === 'dark' ? 'rgba(64, 181, 173, 0.15)' : 'rgba(64, 181, 173, 0.1)'
                  : theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.15)' : 'rgba(255, 152, 0, 0.1)',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '0.85rem',
                border: `1px solid ${isAdmin 
                  ? theme.palette.mode === 'dark' ? 'rgba(64, 181, 173, 0.2)' : 'rgba(64, 181, 173, 0.2)'
                  : theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.2)'}`,
                '@media (max-width: 600px)': {
                  display: 'none'
                }
              }}
            >
              {isAdmin ? t('adminRole') : isOfficer ? t('officerRole') : t('userRole')}
              {isOfficer && officerName && `: ${officerName}`}
            </Box>
          </div>

          {/* Centered Logo and Title */}
          <div style={{ 
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            '@media (max-width: 600px)': {
              gap: '0.5rem'
            }
          }}>
            <img 
              src={isRtl ? '/public/logo-ur.png' : '/download.png'} 
              alt="Logo"
              style={{
                height: '45px',
                width: 'auto',
                transition: 'opacity 0.3s ease-in-out',
                opacity: isLanguageChanging ? 0.5 : 1
              }}
            />
            <Typography 
              variant="h6" 
              component="div" 
              className="navbar-title"
              sx={{ 
                color: '#40B5AD',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                fontSize: '1.5rem',
                textShadow: theme.palette.mode === 'dark' 
                  ? '0 2px 4px rgba(0, 0, 0, 0.5)' 
                  : '0 2px 4px rgba(64, 181, 173, 0.2)',
                '@media (max-width: 600px)': {
                  fontSize: '1.25rem'
                }  
              }}
            >
              {t('title')}
            </Typography>
          </div>

          {/* Create New Entry Button - Right Side */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <IconButton
              onClick={() => toggleTheme()}
              color="inherit"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              sx={{
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                width: '40px',
                height: '40px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <Button
              variant="contained"
              onClick={handleLogout}
              sx={{
                mr: 2,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(64, 181, 173, 0.8)' : '#40B5AD',
                color: 'white',
                borderRadius: '12px',
                p: '10px 16px',
                textTransform: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                  : '0 4px 12px rgba(64, 181, 173, 0.2)',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(64, 181, 173, 0.9)' : '#369E97',
                  transform: 'translateY(-2px)',
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 6px 14px rgba(0, 0, 0, 0.4)' 
                    : '0 6px 14px rgba(64, 181, 173, 0.3)'
                },
                '@media (max-width: 600px)': {
                  display: 'none'
                }
              }}
            >
              {t('logout')}
            </Button>
            <Button
              variant="contained"
              onClick={(e) => {
                preventClickDuringTransition(e);
                if (!isLanguageChanging) {
                  navigate('/new-entry');
                }
              }}
              disabled={isLanguageChanging}
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(64, 181, 173, 0.8)' : '#40B5AD',
                color: 'white',
                borderRadius: '12px',
                p: '10px 16px',
                textTransform: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                  : '0 4px 12px rgba(64, 181, 173, 0.2)',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(64, 181, 173, 0.9)' : '#369E97',
                  transform: 'translateY(-2px)',
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 6px 14px rgba(0, 0, 0, 0.4)' 
                    : '0 6px 14px rgba(64, 181, 173, 0.3)'
                },
                opacity: isLanguageChanging ? 0.7 : 1
              }}
            >
              {t('createNewEntry')}
            </Button>
          </div>
        </Toolbar>
      </AppBar>

      <motion.div style={{ marginTop: '80px', minHeight: 'calc(100vh - 180px)', padding: '24px' }}>
        {isLoading ? (
          <LoadingSpinner message={t('loadingVisits')} />
        ) : (
          <>
            {/* Show message for regular users with no access */}
            {!isAdmin && !isOfficer && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '40px',
                  margin: '40px auto',
                  maxWidth: '600px',
                  borderRadius: '20px',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
                  boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0, 0, 0, 0.5)' : '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
              >
                <Typography variant="h4" sx={{ mb: 3, color: theme.palette.mode === 'dark' ? '#ff9800' : '#e65100' }}>
                  {t('permissionDenied')}
                </Typography>
                <Typography variant="body1" sx={{ mb: 4 }}>
                  {t('userAccessRestricted')}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  {t('contactAdminForAccess')}
                </Typography>
              </Box>
            )}

            {/* Only show stats and data for admin and officers */}
            {(isAdmin || isOfficer) && (
              <>
                {/* Overall Stats Cards */}
                <Box sx={{ 
                  mb: 4, 
                  display: 'flex', 
                  gap: 3, 
                  flexWrap: 'wrap', 
                  justifyContent: 'center',
                  alignItems: 'stretch' 
                }}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      flex: '1 1 240px',
                      maxWidth: '320px',
                      minWidth: '240px',
                      height: '100%',
                      boxShadow: theme.palette.mode === 'dark' 
                        ? '0 10px 30px rgba(0, 0, 0, 0.8)' 
                        : '0 15px 35px rgba(64,181,173,0.18)',
                      borderRadius: '24px',
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(0, 0, 0, 0.25)' 
                        : 'linear-gradient(145deg, #ffffff, #f5f9fa)',
                      backgroundImage: theme.palette.mode === 'dark'
                        ? 'linear-gradient(145deg, #1e1e1e, #121212)'
                        : 'linear-gradient(145deg, #ffffff, #f5f9fa)',
                      border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)'}`,
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: theme.palette.mode === 'dark' 
                          ? '0 15px 35px rgba(0, 0, 0, 0.9)' 
                          : '0 20px 40px rgba(64,181,173,0.25)',
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: theme.palette.mode === 'dark'
                          ? 'linear-gradient(45deg, rgba(64,181,173,0.05) 0%, rgba(0,0,0,0) 70%)'
                          : 'linear-gradient(45deg, rgba(64,181,173,0.08) 0%, rgba(255,255,255,0) 70%)',
                        zIndex: 1
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3, position: 'relative', zIndex: 2 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 2,
                        pb: 2,
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(64, 181, 173, 0.15)' : 'rgba(64, 181, 173, 0.1)',
                          borderRadius: '12px',
                          width: '48px',
                          height: '48px',
                          mr: 2
                        }}>
                          <PeopleAltIcon sx={{ fontSize: 28, color: '#40B5AD' }} />
                        </Box>
                        <Typography variant="h6" component="div" sx={{ 
                          fontWeight: 700, 
                          color: theme.palette.mode === 'dark' ? '#fff' : '#40B5AD',
                          fontSize: '1.125rem',
                          letterSpacing: '-0.5px'
                        }}>
                          {t('totalVisits')}
                        </Typography>
                      </Box>
                      <Typography variant="h2" component="div" sx={{ 
                        fontWeight: 800, 
                        color: theme.palette.text.primary,
                        fontSize: '2.5rem',
                        textAlign: 'center',
                        mt: 2
                      }}>
                        {formatNumber(filteredVisits.length, i18n.language)}
                      </Typography>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    elevation={0}
                    sx={{ 
                      flex: '1 1 240px',
                      maxWidth: '320px',
                      minWidth: '240px',
                      height: '100%',
                      boxShadow: theme.palette.mode === 'dark' 
                        ? '0 10px 30px rgba(0, 0, 0, 0.8)' 
                        : '0 15px 35px rgba(64,181,173,0.18)',
                      borderRadius: '24px',
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(0, 0, 0, 0.25)' 
                        : 'linear-gradient(145deg, #ffffff, #f5f9fa)',
                      backgroundImage: theme.palette.mode === 'dark'
                        ? 'linear-gradient(145deg, #1e1e1e, #121212)'
                        : 'linear-gradient(145deg, #ffffff, #f5f9fa)',
                      border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)'}`,
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: theme.palette.mode === 'dark' 
                          ? '0 15px 35px rgba(0, 0, 0, 0.9)' 
                          : '0 20px 40px rgba(64,181,173,0.25)',
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: theme.palette.mode === 'dark'
                          ? 'linear-gradient(45deg, rgba(64,181,173,0.05) 0%, rgba(0,0,0,0) 70%)'
                          : 'linear-gradient(45deg, rgba(64,181,173,0.08) 0%, rgba(255,255,255,0) 70%)',
                        zIndex: 1
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3, position: 'relative', zIndex: 2 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 2,
                        pb: 2,
                        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`
                      }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(64, 181, 173, 0.15)' : 'rgba(64, 181, 173, 0.1)',
                          borderRadius: '12px',
                          width: '48px',
                          height: '48px',
                          mr: 2
                        }}>
                          <QuestionAnswerIcon sx={{ fontSize: 28, color: '#40B5AD' }} />
                        </Box>
                        <Typography variant="h6" component="div" sx={{ 
                          fontWeight: 700, 
                          color: theme.palette.mode === 'dark' ? '#fff' : '#40B5AD',
                          fontSize: '1.125rem',
                          letterSpacing: '-0.5px'
                        }}>
                          {t('totalQuestionsThisMonth', { month: t(currentMonthName) })}
                        </Typography>
                      </Box>
                      <Typography variant="h2" component="div" sx={{ 
                        fontWeight: 800, 
                        color: theme.palette.text.primary,
                        fontSize: '2.5rem',
                        textAlign: 'center',
                        mt: 2
                      }}>
                        {formatNumber(totalMonthlyQuestions, i18n.language)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                {/* Add Officer Statistics Section */}
                {isAdmin && (
                  <Box sx={{ 
                    mb: 4, 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 2,
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.25)' : theme.palette.background.paper,
                    borderRadius: '24px',
                    padding: '20px',
                    boxShadow: theme.palette.mode === 'dark' 
                      ? '0 8px 32px rgba(0, 0, 0, 0.7)' 
                      : '0 15px 35px rgba(64, 181, 173, 0.12)',
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)'}`,
                  }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 700, 
                      color: theme.palette.mode === 'dark' ? '#fff' : '#40B5AD',
                      borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
                      pb: 1,
                      mb: 2
                    }}>
                      {t('officerStatistics')}
                    </Typography>
                    
                    <Grid container spacing={3}>
                      {OFFICERS.map(officer => {
                        // For each officer, calculate their total visits and questions
                        const currentMonth = dayjs().format('MM');
                        const selectedMonthValue = selectedMonths.length > 0 && !selectedMonths.includes('all') ? selectedMonths[0] : currentMonth;
                        
                        // Count visits for this officer in the selected month
                        const officerVisits = countVisitsPerOfficer(visits, officer, selectedMonthValue);
                        
                        // Count questions using the improved function that detects question numbers (n)
                        const officerQuestions = countQuestionsInVisits(visits, selectedMonthValue, officer);
                        
                        return (
                          <Grid item xs={12} sm={6} md={4} lg={2.4} key={officer}>
                            <Card 
                              elevation={0}
                              sx={{ 
                                height: '100%',
                                boxShadow: theme.palette.mode === 'dark' 
                                  ? '0 5px 15px rgba(0, 0, 0, 0.5)' 
                                  : '0 5px 15px rgba(64,181,173,0.1)',
                                borderRadius: '16px',
                                backgroundColor: theme.palette.mode === 'dark' 
                                  ? 'rgba(0, 0, 0, 0.25)' 
                                  : 'linear-gradient(145deg, #ffffff, #f5f9fa)',
                                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)'}`,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'translateY(-5px)',
                                  boxShadow: theme.palette.mode === 'dark' 
                                    ? '0 8px 20px rgba(0, 0, 0, 0.6)' 
                                    : '0 8px 20px rgba(64,181,173,0.2)',
                                }
                              }}
                            >
                              <CardContent sx={{ p: 2 }}>
                                <Typography variant="subtitle1" sx={{ 
                                  fontWeight: 700, 
                                  color: theme.palette.mode === 'dark' ? '#fff' : '#40B5AD',
                                  mb: 2,
                                  textAlign: 'center'
                                }}>
                                  {officer}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                    {t('visits')}:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    {formatNumber(officerVisits, i18n.language)}
                                  </Typography>
                                </Box>
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                    {t('questions')}:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    {formatNumber(officerQuestions, i18n.language)}
                                  </Typography>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                )}

                <motion.div variants={tableContainerVariants} initial="hidden" animate="visible">
                  <div style={filterStyles.container}>
                    <div style={filterStyles.innerContainer}>
                      <Grid container spacing={2}>
                        {/* Month Filter */}
                        <Grid item xs={12} md={12}>
                          <FormControl fullWidth size="small">
                            <InputLabel>{t('selectMonths')}</InputLabel>
                            <Select
                              multiple
                              value={selectedMonths}
                              onChange={handleMonthChange}
                              label={t('selectMonths')}
                              renderValue={(selected) => {
                                if (selected.includes('all')) return t('allMonths');
                                return selected
                                  .map(monthValue => {
                                    const month = months.find(m => m.value === monthValue);
                                    return month ? t(month.label) : '';
                                  })
                                  .filter(Boolean)
                                  .join(', ');
                              }}
                            >
                              <MenuItem value="all">
                                <Checkbox checked={selectedMonths.includes('all')} />
                                {t('allMonths')}
                              </MenuItem>
                              {months.map((month) => (
                                <MenuItem key={month.value} value={month.value}>
                                  <Checkbox checked={selectedMonths.includes(month.value)} />
                                  {t(month.label)}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        {/* Category Filter - Hide officer name category for officers since they already see only their visits */}
                        <Grid item xs={12} md={3}>
                          <FormControl
                            fullWidth
                            variant="outlined"
                            size="small"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderTopRightRadius: isRtl ? '15px' : '0',
                                borderBottomRightRadius: isRtl ? '15px' : '0',
                                borderTopLeftRadius: isRtl ? '0' : '15px',
                                borderBottomLeftRadius: isRtl ? '0' : '15px',
                              }
                            }}
                          >
                            <InputLabel>{t('searchCategory')}</InputLabel>
                            <Select
                              value={searchCategory}
                              onChange={(e) => handleCategoryChange(e.target.value)}
                              label={t('searchCategory')}
                              disabled={isLanguageChanging}
                            >
                              {searchCategories
                                .filter(category => isAdmin || category.value !== 'officerName')
                                .map((category) => (
                                  <MenuItem 
                                    key={category.value} 
                                    value={category.value}
                                    sx={{ textAlign: isRtl ? 'right' : 'left' }}
                                  >
                                    {t(category.label)}
                                  </MenuItem>
                                ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        {/* Search Input */}
                        <Grid item xs={12} md={9}>
                          {searchCategory === 'date' ? (
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <DatePicker
                                value={searchDate}
                                onChange={(newValue) => setSearchDate(newValue)}
                                format="YYYY-MM-DD"
                                slotProps={{
                                  textField: {
                                    fullWidth: true,
                                    size: "small",
                                    sx: {
                                      '& .MuiOutlinedInput-root': {
                                        borderTopLeftRadius: isRtl ? '15px' : '0',
                                        borderBottomLeftRadius: isRtl ? '15px' : '0',
                                        borderTopRightRadius: isRtl ? '0' : '15px',
                                        borderBottomRightRadius: isRtl ? '0' : '15px',
                                      }
                                    }
                                  }
                                }}
                              />
                            </LocalizationProvider>
                          ) : (
                            <TextField
                              fullWidth
                              variant="outlined"
                              size="small"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder={t('searchPlaceholder')}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <SearchIcon />
                                  </InputAdornment>
                                ),
                                style: {
                                  borderTopLeftRadius: isRtl ? '15px' : '0',
                                  borderBottomLeftRadius: isRtl ? '15px' : '0',
                                  borderTopRightRadius: isRtl ? '0' : '15px',
                                  borderBottomRightRadius: isRtl ? '0' : '15px',
                                }
                              }}
                              disabled={isLanguageChanging}
                            />
                          )}
                        </Grid>
                      </Grid>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  variants={tableContainerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <TableContainer 
                    component={Paper} 
                    style={{
                      ...tableStyles.container,
                      backgroundColor: theme.palette.mode === 'dark' ? '#121212' : theme.palette.background.paper,
                    }}
                  >
                    <AnimatePresence>
                      {selected.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ 
                            padding: '12px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            borderTopLeftRadius: '8px',
                            borderTopRightRadius: '8px',
                          }}
                        >
                          <Typography variant="subtitle1" component="div" style={{ flex: 1 }}>
                            {t('selectedItems', { count: selected.length })}
                          </Typography>
                          <Button 
                            color="inherit"
                            onClick={() => {
                              if (window.confirm(t('confirmBatchDelete'))) {
                                handleBatchDelete();
                              }
                            }}
                            disabled={isLanguageChanging || isLoading}
                            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                            sx={{
                              borderColor: 'rgba(255, 255, 255, 0.5)',
                              '&:hover': {
                                borderColor: 'rgba(255, 255, 255, 0.8)',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                              }
                            }}
                          >
                            {t('deleteSelected')}
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Table style={tableStyles.table}>
                      <TableHead>
                        <TableRow sx={{
                          backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f8f9fa',
                          '& th': {
                            color: theme.palette.text.primary,
                          }
                        }}>
                          <TableCell padding="checkbox" style={{ width: '40px' }}>
                            <Checkbox
                              indeterminate={selected.length > 0 && selected.length < filteredVisits.length}
                              checked={filteredVisits.length > 0 && selected.length === filteredVisits.length}
                              onChange={handleSelectAllClick}
                            />
                          </TableCell>
                          <TableCell style={{ ...tableStyles.headerCell, ...tableStyles.numberCell }}>{t('number')}</TableCell>
                          <TableCell style={{ ...tableStyles.headerCell, width: '120px' }}>{t('clientName')}</TableCell>
                          <TableCell style={{ ...tableStyles.headerCell, ...tableStyles.phoneCell }}>{t('contactNumber')}</TableCell>
                          <TableCell style={{ ...tableStyles.headerCell, width: '150px' }}>{t('address')}</TableCell>
                          <TableCell style={{ ...tableStyles.headerCell, ...tableStyles.dateCell }}>{t('dateOfVisit')}</TableCell>
                          <TableCell style={{ ...tableStyles.headerCell, ...tableStyles.timeCell }}>{t('timeIn')}</TableCell>
                          <TableCell style={{ ...tableStyles.headerCell, ...tableStyles.timeCell }}>{t('timeOut')}</TableCell>
                          <TableCell style={{ ...tableStyles.headerCell, ...tableStyles.durationCell }}>{t('duration')}</TableCell>
                          <TableCell style={{ ...tableStyles.headerCell, width: '120px' }}>{t('officerName')}</TableCell>
                          <TableCell style={{ ...tableStyles.headerCell, width: '150px' }}>{t('question')}</TableCell>
                          <TableCell style={{ ...tableStyles.headerCell, ...tableStyles.dateCell }}>{t('officerResponseDate')}</TableCell>
                          <TableCell style={{ ...tableStyles.headerCell, width: '150px' }}>{t('officerAnswer')}</TableCell>
                          <TableCell style={{ ...tableStyles.headerCell, width: '100px' }}>{t('actions')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <AnimatePresence mode="popLayout">
                          {sortedAndPaginatedVisits.length === 0 ? (
                            <motion.tr
                              variants={rowVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                            >
                              <TableCell 
                                colSpan={13} 
                                align="center"
                                sx={{ textAlign: 'center !important' }}
                              >
                                {t('noVisitsFound')}
                              </TableCell>
                            </motion.tr>
                          ) : (
                            sortedAndPaginatedVisits.map((visit, index) => {
                              const isSelected = selected.includes(visit.id);
                              const isPending = !visit.officerAnswer || visit.officerAnswer === t('pendingStatus');
                              
                              return (
                                <motion.tr
                                  key={visit.id}
                                  variants={rowVariants}
                                  initial="hidden"
                                  animate="visible"
                                  exit="exit"
                                  layout
                                  style={{
                                    cursor: 'pointer',
                                    backgroundColor: isPending 
                                      ? (theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.08)' : 'rgba(255, 152, 0, 0.03)')
                                      : (theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.6)'),
                                    transition: 'all 0.15s ease-in-out',
                                    '&:hover': {
                                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(64, 181, 173, 0.1)' : 'rgba(64, 181, 173, 0.05)',
                                      transform: 'translateY(-2px)',
                                      boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.08)',
                                    },
                                    boxShadow: theme.palette.mode === 'dark' 
                                      ? '0 1px 3px rgba(0, 0, 0, 0.3)' 
                                      : '0 1px 3px rgba(0, 0, 0, 0.05)',
                                    borderRadius: '8px',
                                    margin: '8px 0',
                                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'}`,
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = theme.palette.mode === 'dark' 
                                      ? 'rgba(64, 181, 173, 0.1)' 
                                      : 'rgba(64, 181, 173, 0.05)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = theme.palette.mode === 'dark' 
                                      ? '0 4px 12px rgba(0, 0, 0, 0.4)' 
                                      : '0 4px 12px rgba(0, 0, 0, 0.08)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = isPending 
                                      ? (theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.08)' : 'rgba(255, 152, 0, 0.03)')
                                      : (theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.6)');
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = theme.palette.mode === 'dark' 
                                      ? '0 1px 3px rgba(0, 0, 0, 0.3)' 
                                      : '0 1px 3px rgba(0, 0, 0, 0.05)';
                                  }}
                                >
                                  <TableCell padding="checkbox">
                                    <Checkbox
                                      checked={isSelected}
                                      onChange={() => handleCheckboxClick(visit.id)}
                                    />
                                  </TableCell>
                                  <TableCell style={{ ...tableStyles.cell, ...tableStyles.numberCell }}>
                                    {formatNumber((page * rowsPerPage) + index + 1, i18n.language)}
                                  </TableCell>
                                  <TableCell style={{ ...tableStyles.cell, maxWidth: '120px' }}>
                                    <Tooltip title={visit?.name || 'N/A'} arrow>
                                      <span>{visit?.name || 'N/A'}</span>
                                    </Tooltip>
                                  </TableCell>
                                  <TableCell style={{ ...tableStyles.cell, ...tableStyles.phoneCell }}>{visit?.phone || 'N/A'}</TableCell>
                                  <TableCell style={{ ...tableStyles.cell, maxWidth: '150px' }}>
                                    <Tooltip title={visit?.address || 'N/A'} arrow>
                                      <span>{visit?.address || 'N/A'}</span>
                                    </Tooltip>
                                  </TableCell>
                                  <TableCell style={{ ...tableStyles.cell, ...tableStyles.dateCell }}>
                                    {renderCell(visit?.date, 'date')}
                                  </TableCell>
                                  <TableCell style={{ ...tableStyles.cell, ...tableStyles.timeCell }}>
                                    {renderCell(visit?.timeIn, 'time')}
                                  </TableCell>
                                  <TableCell style={{ ...tableStyles.cell, ...tableStyles.timeCell }}>
                                    {renderCell(visit?.timeOut, 'time')}
                                  </TableCell>
                                  <TableCell style={{ ...tableStyles.cell, ...tableStyles.durationCell }}>
                                    {renderCell(visit?.duration, 'duration')}
                                  </TableCell>
                                  <TableCell style={{ ...tableStyles.cell, maxWidth: '150px' }}>
                                    <Tooltip title={visit?.officerName || 'N/A'} arrow>
                                      <span>{visit?.officerName || 'N/A'}</span>
                                    </Tooltip>
                                  </TableCell>
                                  <TableCell style={{ ...tableStyles.cell, maxWidth: '150px' }}>
                                    <Tooltip title={visit?.userQuestion || 'N/A'} arrow>
                                      <span>{visit?.userQuestion || 'N/A'}</span>
                                    </Tooltip>
                                  </TableCell>
                                  <TableCell style={{ ...tableStyles.cell, ...tableStyles.dateCell }}>
                                    {renderCell(visit?.responseDate, 'date')}
                                  </TableCell>
                                  <TableCell style={{ ...tableStyles.cell, maxWidth: '150px' }}>
                                    <Tooltip title={visit?.officerAnswer || 'N/A'} arrow>
                                      <span>{visit?.officerAnswer || 'N/A'}</span>
                                    </Tooltip>
                                  </TableCell>
                                  <TableCell style={{ ...tableStyles.cell, ...tableStyles.actionCell }}>
                                    <div className="action-buttons" style={{ display: 'flex', gap: '6px' }}>
                                      <Tooltip title={t('viewDetails')} arrow>
                                        <IconButton
                                          component={Link}
                                          to={`/visit/${visit.id}`}
                                          color="primary"
                                          size="small"
                                          onClick={preventClickDuringTransition}
                                          disabled={isLanguageChanging}
                                          sx={{
                                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.1)' : 'rgba(25, 118, 210, 0.05)',
                                            padding: '6px',
                                            borderRadius: '8px',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.2)' : 'rgba(25, 118, 210, 0.1)',
                                              transform: 'translateY(-2px)',
                                              boxShadow: theme.palette.mode === 'dark' ? '0 4px 8px rgba(0, 0, 0, 0.4)' : '0 4px 8px rgba(25, 118, 210, 0.15)'
                                            }
                                          }}
                                        >
                                          <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      
                                      {/* Only show edit button for admin or if officer owns this visit */}
                                      {(isAdmin || (isOfficer && exactOfficerMatch(visit.officerName, officerName))) && (
                                        <Tooltip title={t('edit')} arrow>
                                          <IconButton
                                            component={Link}
                                            to={`/edit/${visit.id}`}
                                            color="info"
                                            size="small"
                                            onClick={preventClickDuringTransition}
                                            disabled={isLanguageChanging}
                                            sx={{
                                              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(3, 169, 244, 0.1)' : 'rgba(3, 169, 244, 0.05)',
                                              padding: '6px',
                                              borderRadius: '8px',
                                              transition: 'all 0.2s ease',
                                              '&:hover': {
                                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(3, 169, 244, 0.2)' : 'rgba(3, 169, 244, 0.1)',
                                                transform: 'translateY(-2px)',
                                                boxShadow: theme.palette.mode === 'dark' ? '0 4px 8px rgba(0, 0, 0, 0.4)' : '0 4px 8px rgba(3, 169, 244, 0.15)'
                                              }
                                            }}
                                          >
                                            <EditIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                      
                                      {/* Only show delete button for admin or if officer owns this visit */}
                                      {(isAdmin || (isOfficer && exactOfficerMatch(visit.officerName, officerName))) && (
                                        <Tooltip title={t('delete')} arrow>
                                          <IconButton
                                            color="error"
                                            size="small"
                                            onClick={(e) => {
                                              preventClickDuringTransition(e);
                                              if (!isLanguageChanging && window.confirm(t('confirmDelete'))) {
                                                handleDelete(visit.id);
                                              }
                                            }}
                                            disabled={isLanguageChanging}
                                            sx={{
                                              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.05)',
                                              padding: '6px',
                                              borderRadius: '8px',
                                              transition: 'all 0.2s ease',
                                              '&:hover': {
                                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.1)',
                                                transform: 'translateY(-2px)',
                                                boxShadow: theme.palette.mode === 'dark' ? '0 4px 8px rgba(0, 0, 0, 0.4)' : '0 4px 8px rgba(244, 67, 54, 0.15)'
                                              }
                                            }}
                                          >
                                            <DeleteIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </TableCell>
                                </motion.tr>
                              );
                            })
                          )}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      component="div"
                      count={filteredVisits.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      labelRowsPerPage={t('rowsPerPage')}
                      labelDisplayedRows={({ from, to, count }) => 
                        t('paginationDisplayedRows', { from, to, count })}
                      sx={{
                        '.MuiTablePagination-toolbar': {
                          display: 'flex',
                          flexWrap: 'wrap',
                          padding: '12px',
                          color: theme.palette.text.primary,
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          '@media (max-width: 600px)': {
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: '12px'
                          }
                        },
                        '.MuiTablePagination-selectRoot, .MuiTablePagination-input': {
                          fontWeight: 500,
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
                          borderRadius: '8px',
                          padding: '2px 6px',
                          margin: '0 8px',
                          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                          }
                        },
                        '.MuiTablePagination-displayedRows': {
                          fontWeight: 500,
                          padding: '0 16px',
                        },
                        '.MuiTablePagination-actions': {
                          display: 'flex',
                          gap: '4px'
                        },
                        '.MuiIconButton-root': {
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                          borderRadius: '8px',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                            transform: 'translateY(-2px)'
                          },
                          '&.Mui-disabled': {
                            opacity: 0.4
                          }
                        }
                      }}
                    />
                  </TableContainer>
                </motion.div>
              </>
            )}
          </>
        )}
      </motion.div>

      {/* Footer */}
      <footer className="footer" style={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderTop: `1px solid ${theme.palette.divider}`,
        marginTop: 'auto',
        padding: '1.5rem',
        textAlign: 'center'
      }}>
      </footer>
    </div>
  );
}

export default Dashboard;