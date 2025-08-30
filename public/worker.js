// Web worker for heavy operations
// This worker helps offload filtering and sorting from the main UI thread

// Normalize text for searching (copied from main code)
const normalizeText = (text) => {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ');
};

// Fuzzy matching function (copied from main code)
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

// Filter visits based on criteria
function filterVisits(visits, searchCategory, searchQuery, selectedMonths) {
  return visits.filter(visit => {
    // Month filtering
    if (selectedMonths && selectedMonths.length > 0 && !selectedMonths.includes('all')) {
      // Extract month from date - assuming date is in YYYY-MM-DD format
      const visitMonth = visit.date ? visit.date.split('-')[1] : null;
      if (!visitMonth || !selectedMonths.includes(visitMonth)) {
        return false;
      }
    }

    // Search filtering
    if (!searchQuery) return true;

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
}

// Sort visits based on criteria
function sortVisits(visits, orderBy, order) {
  return [...visits].sort((a, b) => {
    if (!a[orderBy] || !b[orderBy]) return 0;
    
    const aValue = String(a[orderBy]).toLowerCase();
    const bValue = String(b[orderBy]).toLowerCase();
    
    if (order === 'asc') {
      return aValue.localeCompare(bValue);
    }
    return bValue.localeCompare(aValue);
  });
}

// Count questions - simplified version of the main code
function countQuestions(visits, selectedMonth, officerName) {
  const filteredVisits = selectedMonth ? visits.filter(v => {
    const visitMonth = v.date ? v.date.split('-')[1] : null;
    return visitMonth === selectedMonth;
  }) : visits;
  
  // Count the questions based on (n) pattern in userQuestion
  return filteredVisits.reduce((total, visit) => {
    const questionMatches = visit.userQuestion ? visit.userQuestion.match(/\(\d+\)/g) : null;
    const questionCount = questionMatches ? questionMatches.length : 0;
    return total + (questionCount > 0 ? questionCount : (visit.userQuestion ? 1 : 0));
  }, 0);
}

// Listen for messages from the main thread
self.addEventListener('message', (e) => {
  const { action, data } = e.data;
  
  switch (action) {
    case 'filter':
      const { visits, searchCategory, searchQuery, selectedMonths } = data;
      const filteredResults = filterVisits(visits, searchCategory, searchQuery, selectedMonths);
      self.postMessage({ action: 'filterResults', data: filteredResults });
      break;
      
    case 'sort':
      const { visitsToSort, orderBy, order } = data;
      const sortedResults = sortVisits(visitsToSort, orderBy, order);
      self.postMessage({ action: 'sortResults', data: sortedResults });
      break;
      
    case 'countQuestions':
      const { visitsToCount, selectedMonth, officerName } = data;
      const questionCount = countQuestions(visitsToCount, selectedMonth, officerName);
      self.postMessage({ action: 'questionCount', data: questionCount });
      break;
      
    default:
      self.postMessage({ action: 'error', data: 'Unknown action' });
  }
}); 