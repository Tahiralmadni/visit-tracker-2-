import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider, db } from '../firebase';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTranslation } from 'react-i18next';
import { collection, doc, getDoc, setDoc, query, where, getDocs } from 'firebase/firestore';

// List of officers - must match the ones used in the system
const OFFICERS = ['Naeem', 'Abid', 'Sajid', 'Raza Muhammed', 'Masood'];
// Admin email
const ADMIN_EMAIL = 'tahiralmadni@gmail.com';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'admin' or 'officer'
  const [officerName, setOfficerName] = useState(''); // Only set for officer role
  const [loading, setLoading] = useState(true); // Set loading to true initially
  const { t } = useTranslation();

  // Function to get or create user role
  const getUserRole = async (user) => {
    try {
      // Check if user is admin
      if (user.email === ADMIN_EMAIL) {
        setUserRole('admin');
        return 'admin';
      }

      // Check if user role exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists() && userDoc.data().role) {
        const userData = userDoc.data();
        setUserRole(userData.role);
        
        // If user is an officer, set their officer name
        if (userData.role === 'officer' && userData.officerName) {
          setOfficerName(userData.officerName);
        }
        
        return userData.role;
      } else {
        // Check if email belongs to an officer
        const emailPrefix = user.email.split('@')[0].toLowerCase();
        
        // Create a mapping of email prefixes to officers for exact matching
        const officerMapping = {
          'naeem': 'Naeem',
          'abid': 'Abid',
          'sajid': 'Sajid',
          'raza.muhammed': 'Raza Muhammed',
          'razamuhammed': 'Raza Muhammed',
          'masood': 'Masood'
        };
        
        // Check for exact match in our mapping
        const matchingOfficerName = officerMapping[emailPrefix];
        
        if (matchingOfficerName) {
          console.log(`Found officer match: ${emailPrefix} => ${matchingOfficerName}`);
          
          // Create user profile with officer role
          await setDoc(userRef, {
            email: user.email,
            role: 'officer',
            officerName: matchingOfficerName,
            createdAt: new Date()
          });
          
          setUserRole('officer');
          setOfficerName(matchingOfficerName);
          console.log(`Set officer name to: ${matchingOfficerName}`);
          return 'officer';
        } else {
          console.log(`No officer match found for: ${emailPrefix}`);
          
          // Default to regular user with no special access
          await setDoc(userRef, {
            email: user.email,
            role: 'user',
            createdAt: new Date()
          });
          
          setUserRole('user');
          return 'user';
        }
      }
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  };

  async function signup(email, password) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Determine and set role for new user
      if (email === ADMIN_EMAIL) {
        const userRef = doc(db, "users", result.user.uid);
        await setDoc(userRef, {
          email: email,
          role: 'admin',
          createdAt: new Date()
        });
      } else {
        // Check if user might be an officer based on email
        const emailPrefix = email.split('@')[0].toLowerCase();
        
        // Create a mapping of email prefixes to officers for exact matching
        const officerMapping = {
          'naeem': 'Naeem',
          'abid': 'Abid',
          'sajid': 'Sajid',
          'raza.muhammed': 'Raza Muhammed',
          'razamuhammed': 'Raza Muhammed',
          'masood': 'Masood'
        };
        
        // Check for exact match in our mapping
        const matchingOfficerName = officerMapping[emailPrefix];
        
        const userRef = doc(db, "users", result.user.uid);
        if (matchingOfficerName) {
          await setDoc(userRef, {
            email: email,
            role: 'officer',
            officerName: matchingOfficerName,
            createdAt: new Date()
          });
        } else {
          await setDoc(userRef, {
            email: email,
            role: 'user',
            createdAt: new Date()
          });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async function login(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Get and set user role after login
      await getUserRole(result.user);
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async function loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Get and set user role after Google login
      await getUserRole(result.user);
      return result;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  async function loginWithFacebook() {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      // Get and set user role after Facebook login
      await getUserRole(result.user);
      return result;
    } catch (error) {
      console.error('Facebook login error:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      setUserRole(null);
      setOfficerName('');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
      
      if (user) {
        setCurrentUser(user);
        // Get and set user role on auth state change
        await getUserRole(user);
        setLoading(false);
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setOfficerName('');
        setLoading(false);
      }
    }, (error) => {
      console.error("Auth state change error:", error);
      setCurrentUser(null);
      setUserRole(null);
      setOfficerName('');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    userRole,
    officerName,
    loading,
    signup,
    login,
    loginWithGoogle,
    loginWithFacebook,
    logout,
    isAdmin: userRole === 'admin',
    isOfficer: userRole === 'officer'
  };

  if (loading) {
    return <LoadingSpinner fullscreen message={t('checkingAuth')} />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
