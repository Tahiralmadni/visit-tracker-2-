// Worker service for offloading heavy operations
let worker = null;

// Initialize worker
const initWorker = () => {
  if (window.Worker && !worker) {
    worker = new Worker('/worker.js');
    console.log('Web worker initialized');
    return true;
  }
  return false;
};

// Cleanup worker
const terminateWorker = () => {
  if (worker) {
    worker.terminate();
    worker = null;
    console.log('Web worker terminated');
    return true;
  }
  return false;
};

// Filter visits in worker
export const filterVisitsInWorker = (visits, searchCategory, searchQuery, selectedMonths) => {
  return new Promise((resolve, reject) => {
    if (!initWorker()) {
      // Fallback to sync filtering if worker can't be initialized
      console.warn('Web worker not available, filtering synchronously');
      resolve(filterVisitsSync(visits, searchCategory, searchQuery, selectedMonths));
      return;
    }

    const messageHandler = (e) => {
      const { action, data } = e.data;
      if (action === 'filterResults') {
        worker.removeEventListener('message', messageHandler);
        resolve(data);
      } else if (action === 'error') {
        worker.removeEventListener('message', messageHandler);
        reject(data);
      }
    };

    worker.addEventListener('message', messageHandler);

    worker.postMessage({
      action: 'filter',
      data: {
        visits,
        searchCategory,
        searchQuery,
        selectedMonths
      }
    });

    // Timeout safety
    setTimeout(() => {
      worker.removeEventListener('message', messageHandler);
      console.warn('Web worker timeout, filtering synchronously');
      resolve(filterVisitsSync(visits, searchCategory, searchQuery, selectedMonths));
    }, 5000);
  });
};

// Sort visits in worker
export const sortVisitsInWorker = (visits, orderBy, order) => {
  return new Promise((resolve, reject) => {
    if (!initWorker()) {
      // Fallback to sync sorting if worker can't be initialized
      console.warn('Web worker not available, sorting synchronously');
      resolve(sortVisitsSync(visits, orderBy, order));
      return;
    }

    const messageHandler = (e) => {
      const { action, data } = e.data;
      if (action === 'sortResults') {
        worker.removeEventListener('message', messageHandler);
        resolve(data);
      } else if (action === 'error') {
        worker.removeEventListener('message', messageHandler);
        reject(data);
      }
    };

    worker.addEventListener('message', messageHandler);

    worker.postMessage({
      action: 'sort',
      data: {
        visitsToSort: visits,
        orderBy,
        order
      }
    });

    // Timeout safety
    setTimeout(() => {
      worker.removeEventListener('message', messageHandler);
      console.warn('Web worker timeout, sorting synchronously');
      resolve(sortVisitsSync(visits, orderBy, order));
    }, 3000);
  });
};

// Count questions in worker
export const countQuestionsInWorker = (visits, selectedMonth, officerName) => {
  return new Promise((resolve, reject) => {
    if (!initWorker()) {
      // Fallback to sync counting if worker can't be initialized
      console.warn('Web worker not available, counting synchronously');
      resolve(countQuestionsSync(visits, selectedMonth, officerName));
      return;
    }

    const messageHandler = (e) => {
      const { action, data } = e.data;
      if (action === 'questionCount') {
        worker.removeEventListener('message', messageHandler);
        resolve(data);
      } else if (action === 'error') {
        worker.removeEventListener('message', messageHandler);
        reject(data);
      }
    };

    worker.addEventListener('message', messageHandler);

    worker.postMessage({
      action: 'countQuestions',
      data: {
        visitsToCount: visits,
        selectedMonth,
        officerName
      }
    });

    // Timeout safety
    setTimeout(() => {
      worker.removeEventListener('message', messageHandler);
      console.warn('Web worker timeout, counting synchronously');
      resolve(countQuestionsSync(visits, selectedMonth, officerName));
    }, 2000);
  });
};

// Synchronous fallback functions
// Only used if web worker fails

// Normalize text for searching
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

// Fuzzy matching function
const fuzzyMatch = (text, search) => {
  if (!search) return true;
  if (!text) return false;

  const normalizedText = normalizeText(text);
  const normalizedSearch = normalizeText(search);
  const searchWords = normalizedSearch.split(' ').filter(word => word.length > 0);

  return searchWords.every(searchWord => {
    if (normalizedText.includes(searchWord)) return true;
    if (searchWord.length >= 2) {
      return normalizedText.split(' ').some(word => {
        if (word.length < 2) return false;
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

// Synchronous filter visits
const filterVisitsSync = (visits, searchCategory, searchQuery, selectedMonths) => {
  return visits.filter(visit => {
    // Month filtering
    if (selectedMonths && selectedMonths.length > 0 && !selectedMonths.includes('all')) {
      const visitMonth = visit.date ? visit.date.split('-')[1] : null;
      if (!visitMonth || !selectedMonths.includes(visitMonth)) {
        return false;
      }
    }

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
};

// Synchronous sort visits
const sortVisitsSync = (visits, orderBy, order) => {
  return [...visits].sort((a, b) => {
    if (!a[orderBy] || !b[orderBy]) return 0;
    
    const aValue = String(a[orderBy]).toLowerCase();
    const bValue = String(b[orderBy]).toLowerCase();
    
    if (order === 'asc') {
      return aValue.localeCompare(bValue);
    }
    return bValue.localeCompare(aValue);
  });
};

// Synchronous count questions
const countQuestionsSync = (visits, selectedMonth, officerName) => {
  const filteredVisits = selectedMonth ? visits.filter(v => {
    const visitMonth = v.date ? v.date.split('-')[1] : null;
    return visitMonth === selectedMonth;
  }) : visits;
  
  return filteredVisits.reduce((total, visit) => {
    const questionMatches = visit.userQuestion ? visit.userQuestion.match(/\(\d+\)/g) : null;
    const questionCount = questionMatches ? questionMatches.length : 0;
    return total + (questionCount > 0 ? questionCount : (visit.userQuestion ? 1 : 0));
  }, 0);
};

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', terminateWorker);
}

export default {
  filterVisitsInWorker,
  sortVisitsInWorker,
  countQuestionsInWorker,
  terminateWorker
}; 