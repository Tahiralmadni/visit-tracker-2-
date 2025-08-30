import { useState, useEffect } from 'react';
import './App.css';
import { Typography, Button } from '@mui/material';
import { db, visitsCollection, deleteVisitDoc, ensureVisitsCollection, firebasePersistenceInitialized } from './firebase';
import { collection, doc, getDoc, query, getDocs, orderBy, updateDoc, limit, startAfter } from "firebase/firestore";
import { Route, Routes, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { useTheme as useAppTheme } from './ThemeContext';
import LoadingSpinner from './components/LoadingSpinner';
import VisitDetails from './VisitDetails';
import NewEntry from './pages/NewEntry';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CreateUsers from './pages/CreateUsers';
import UserInfo from './pages/UserInfo';
import { notifyDataChange } from './events';
import Footer from './components/Footer';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import WelcomeAnimation from './components/WelcomeAnimation';
import dayjs from 'dayjs';

// Edit visit wrapper component
const EditVisitWrapper = () => {
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVisitDetails = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "visits", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setVisit({ id: docSnap.id, ...docSnap.data() });
        } else {
          setVisit(null);
        }
      } catch (error) {
        console.error("Error fetching visit details:", error);
        setVisit(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVisitDetails();
  }, [id]);

  const handleUpdate = async (updatedData) => {
    try {
      const docRef = doc(db, "visits", id);
      await updateDoc(docRef, updatedData);
      notifyDataChange();
      navigate('/');
    } catch (error) {
      console.error("Error updating visit:", error);
      throw error;
    }
  };

  if (loading) {
    return <LoadingSpinner fullscreen />;
  }

  if (!visit) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <Typography variant="h6" color="error">
          {t('visitNotFound')}
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
        >
          {t('back')}
        </Button>
      </div>
    );
  }

  return <NewEntry visit={visit} onUpdate={handleUpdate} isEditing />;
};

const VisitDetailsWrapper = () => {
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVisitDetails = async () => {
      setLoading(true);
      console.log(`Fetching visit details for ID: ${id}`); // Add logging
      try {
        const docRef = doc(db, "visits", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          console.log("Visit found:", docSnap.data()); // Add logging
          setVisit({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("Visit not found in Firestore for ID:", id); // Add logging
          setVisit(null);
        }
      } catch (error) {
        console.error("Error fetching visit details:", error); // Log the specific error
        setVisit(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVisitDetails();
  }, [id]);

  if (loading) {
    return <LoadingSpinner fullscreen />;
  }

  if (!visit) {
    console.log(`Rendering 'Visit not found' for ID: ${id}`); // Add logging
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <Typography variant="h6" color="error">
          {t('visitNotFound')}
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
        >
          {t('back')}
        </Button>
      </div>
    );
  }

  return <VisitDetails visit={visit} />;
};

function App() {
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState([]);
  const [error, setError] = useState(null);
  const { t, i18n } = useTranslation();
  const [lastFocusedElement, setLastFocusedElement] = useState(null);
  const theme = useTheme();
  const { darkMode } = useAppTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);
  const [showWelcome, setShowWelcome] = useState(() => {
    // Only show welcome on first visit
    const hasVisited = sessionStorage.getItem('hasVisited');
    return !hasVisited;
  });

  // Handle welcome animation completion
  const handleWelcomeComplete = () => {
    sessionStorage.setItem('hasVisited', 'true');
    setShowWelcome(false);
  };

  const fetchVisits = async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // Reduced from 500ms to 300ms
      const collectionExists = await ensureVisitsCollection();
      if (!collectionExists) {
        setVisits([]);
        setError(t('noVisitsFound') + '. ' + t('addNewVisit'));
        return;
      }

      // Optimize query with limit and appropriate indexing
      // Get current month to prioritize recent data
      const currentMonth = dayjs().format('MM');
      const currentYear = dayjs().format('YYYY');
      
      // First fetch current month data - users most likely need this first
      const currentMonthQuery = query(
        visitsCollection,
        orderBy("createdAt", "desc"),
        limit(100) // Reasonable initial limit
      );
      
      const querySnapshot = await getDocs(currentMonthQuery);
      
      const visitsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setVisits(visitsData);
      
      // Then fetch additional data if needed in background
      if (querySnapshot.docs.length === 100) {
        fetchAdditionalData(visitsData);
      }
    } catch (error) {
      console.error("Error fetching visits:", error);
      setError(t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  };
  
  // New function to fetch additional data in background
  const fetchAdditionalData = async (existingVisits) => {
    try {
      // Get the timestamp of the last visit we loaded
      const lastVisitTimestamp = existingVisits[existingVisits.length - 1]?.createdAt;
      
      if (!lastVisitTimestamp) return;
      
      const additionalQuery = query(
        visitsCollection,
        orderBy("createdAt", "desc"),
        startAfter(lastVisitTimestamp),
        limit(200)
      );
      
      const additionalSnapshot = await getDocs(additionalQuery);
      
      const additionalData = additionalSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (additionalData.length > 0) {
        // Merge with existing data
        setVisits(prev => [...prev, ...additionalData]);
      }
    } catch (error) {
      console.error("Error fetching additional visits:", error);
      // Don't show error to user as this is background loading
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await firebasePersistenceInitialized;
      fetchVisits();
    };
    initialize();
  }, []);

  const handleDelete = async (id) => {
    if (!id || typeof id !== 'string') {
      console.error('Invalid document ID for deletion');
      return;
    }

    if (!window.confirm(t('confirmDelete'))) {
      return;
    }

    try {
      setLoading(true);
      const deleted = await deleteVisitDoc(id);
      
      if (deleted) {
        setVisits(prevVisits => prevVisits.filter(visit => visit.id !== id));
      } else {
        throw new Error('Failed to delete document');
      }
      
    } catch (error) {
      console.error("Error deleting document:", error);
      setError(t('failedToDelete'));
      await fetchVisits();
    } finally {
      setLoading(false);
    }
  };

  // Add real-time update listener
  useEffect(() => {
    const handleVisitDataChanged = () => {
      fetchVisits();
    };

    window.addEventListener('visitDataChanged', handleVisitDataChanged);
    return () => {
      window.removeEventListener('visitDataChanged', handleVisitDataChanged);
    };
  }, []);

  // Add focus management
  const handleLanguageChange = () => {
    // Store the currently focused element
    setLastFocusedElement(document.activeElement);
  };

  const restoreFocus = () => {
    if (lastFocusedElement) {
      // Try to restore focus to the last focused element
      lastFocusedElement.focus();
      setLastFocusedElement(null);
    }
  };

  useEffect(() => {
    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  useEffect(() => {
    if (lastFocusedElement) {
      // Add a small delay to ensure the DOM has updated
      setTimeout(restoreFocus, 500);
    }
  }, [lastFocusedElement]);

  return (
    <div className={`App ${darkMode ? 'dark-mode' : 'light-mode'}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {showWelcome ? (
        <WelcomeAnimation onComplete={handleWelcomeComplete} />
      ) : (
        <AuthProvider>
          {location.state?.message && (
            <div className="message-container" style={{
              position: 'fixed',
              top: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: location.state.error ? '#f44336' : '#4caf50',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '4px',
              zIndex: 9999,
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              textAlign: 'center',
              maxWidth: '80%'
            }}>
              <Typography variant="body1">
                {location.state.message}
              </Typography>
              {location.state.error && (
                <Typography variant="body2" style={{ marginTop: '4px' }}>
                  {location.state.error}
                </Typography>
              )}
            </div>
          )}
          <Routes>
            <Route 
              path="/login" 
              element={<Login />} 
            />
            <Route 
              path="/signup" 
              element={<Signup />} 
            />
            <Route
              path="/create-users"
              element={<CreateUsers />}
            />
            <Route
              path="/user-info"
              element={<UserInfo />}
            />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard visits={visits} onDelete={handleDelete} loading={loading} error={error} />
                </PrivateRoute>
              }
            />
            <Route
              path="/new-entry"
              element={
                <PrivateRoute requiredRoles={['admin', 'officer']}>
                  <NewEntry refreshData={fetchVisits} />
                </PrivateRoute>
              }
            />
            <Route
              path="/edit/:id"
              element={
                <PrivateRoute requiredRoles={['admin', 'officer']}>
                  <EditVisitWrapper />
                </PrivateRoute>
              }
            />
            <Route
              path="/visit/:id"
              element={
                <PrivateRoute requiredRoles={['admin', 'officer']}>
                  <VisitDetailsWrapper />
                </PrivateRoute>
              }
            />
          </Routes>
          {!isAuthPage && !location.pathname.includes('/new-entry') && !location.pathname.includes('/edit/') && <Footer />}
        </AuthProvider>
      )}
    </div>
  );
}

export default App;
