import React, { useState } from 'react';
import { Container, Typography, Button, Paper, TextField, List, ListItem, ListItemText, CircularProgress, Alert } from '@mui/material';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

// List of officers from the system
const OFFICERS = ['Naeem', 'Abid', 'Sajid', 'Raza Muhammed', 'Masood'];

// Default domain for officer emails
const DEFAULT_DOMAIN = 'darulifta.com';

const CreateUsers = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' });
  const [password, setPassword] = useState('Password123!');
  const [domain, setDomain] = useState(DEFAULT_DOMAIN);
  const [results, setResults] = useState([]);
  
  const handleCreateUsers = async () => {
    if (!password || password.length < 8) {
      setMessage({
        text: 'Password must be at least 8 characters long',
        type: 'error'
      });
      return;
    }
    
    setLoading(true);
    setMessage({ text: 'Creating officer accounts...', type: 'info' });
    setResults([]);
    
    const newResults = [];
    
    // Special email mapping for officers to ensure consistency
    const officerEmails = {
      'Naeem': 'naeem',
      'Abid': 'abid',
      'Sajid': 'sajid',
      'Raza Muhammed': 'raza.muhammed',
      'Masood': 'masood'
    };
    
    for (const officer of OFFICERS) {
      try {
        // Create email from officer name using the mapping
        const emailPrefix = officerEmails[officer] || officer.toLowerCase().replace(/\s+/g, '.');
        const officerEmail = `${emailPrefix}@${domain}`;
        
        console.log(`Creating officer account: ${officer} with email: ${officerEmail}`);
        
        // Create the user in Firebase Auth
        const result = await createUserWithEmailAndPassword(auth, officerEmail, password);
        
        // Create user profile in Firestore
        await setDoc(doc(db, "users", result.user.uid), {
          email: officerEmail,
          role: 'officer',
          officerName: officer,
          createdAt: new Date()
        });
        
        newResults.push({
          name: officer,
          email: officerEmail,
          status: 'SUCCESS',
          message: 'Account created successfully'
        });
      } catch (error) {
        let errorMessage = error.message;
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Email already in use. Account might already exist.';
        }
        
        newResults.push({
          name: officer,
          email: `${officer.toLowerCase().replace(/\s+/g, '.')}@${domain}`,
          status: 'ERROR',
          message: errorMessage
        });
      }
    }
    
    setResults(newResults);
    setMessage({
      text: 'User creation process completed. Check results below.',
      type: 'success'
    });
    setLoading(false);
  };
  
  // Create admin user
  const handleCreateAdmin = async () => {
    if (!password || password.length < 8) {
      setMessage({
        text: 'Password must be at least 8 characters long',
        type: 'error'
      });
      return;
    }
    
    setLoading(true);
    setMessage({ text: 'Creating admin account...', type: 'info' });
    
    try {
      // Admin email is hardcoded as per the system
      const adminEmail = 'tahiralmadni@gmail.com';
      
      // Create the user in Firebase Auth
      const result = await createUserWithEmailAndPassword(auth, adminEmail, password);
      
      // Create user profile in Firestore
      await setDoc(doc(db, "users", result.user.uid), {
        email: adminEmail,
        role: 'admin',
        createdAt: new Date()
      });
      
      setMessage({
        text: `Admin account created successfully with email: ${adminEmail}`,
        type: 'success'
      });
    } catch (error) {
      let errorMessage = error.message;
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Admin email already in use. Account might already exist.';
      }
      
      setMessage({
        text: `Error creating admin account: ${errorMessage}`,
        type: 'error'
      });
    }
    
    setLoading(false);
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create User Accounts
        </Typography>
        
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
        
        <TextField
          fullWidth
          label="Password for all accounts"
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          helperText="Must be at least 8 characters"
        />
        
        <TextField
          fullWidth
          label="Email domain"
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          margin="normal"
          helperText={`Officer emails will be: officername@${domain}`}
        />
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateAdmin}
          disabled={loading}
          sx={{ mt: 2, mr: 2 }}
        >
          Create Admin Account
        </Button>
        
        <Button
          variant="contained"
          color="secondary"
          onClick={handleCreateUsers}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          Create All Officer Accounts
        </Button>
        
        {loading && (
          <CircularProgress sx={{ display: 'block', mx: 'auto', my: 3 }} />
        )}
        
        {results.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
              Results
            </Typography>
            <List>
              {results.map((result, index) => (
                <ListItem 
                  key={index}
                  sx={{ 
                    bgcolor: result.status === 'SUCCESS' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                    mb: 1,
                    borderRadius: 1
                  }}
                >
                  <ListItemText
                    primary={`${result.name} (${result.email})`}
                    secondary={`${result.status}: ${result.message}`}
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default CreateUsers; 