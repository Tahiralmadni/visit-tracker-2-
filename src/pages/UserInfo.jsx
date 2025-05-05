import React from 'react';
import { Container, Typography, Paper, Button, Box, Divider } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserInfo = () => {
  const { currentUser, userRole, officerName, isAdmin, isOfficer } = useAuth();
  const navigate = useNavigate();
  
  if (!currentUser) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>Not logged in</Typography>
        <Button variant="contained" onClick={() => navigate('/login')}>
          Go to Login
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>User Information</Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">Email:</Typography>
          <Typography variant="body1">{currentUser.email}</Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">User ID:</Typography>
          <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>{currentUser.uid}</Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">Role:</Typography>
          <Typography variant="body1" color={
            isAdmin ? 'primary.main' : isOfficer ? 'success.main' : 'text.secondary'
          }>
            {userRole || 'No role assigned'}
          </Typography>
        </Box>
        
        {isOfficer && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">Officer Name:</Typography>
            <Typography variant="body1">{officerName || 'No officer name assigned'}</Typography>
          </Box>
        )}
        
        <Box sx={{ mt: 4 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            Go to Dashboard
          </Button>
          
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={() => navigate('/create-users')}
          >
            Manage Users
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default UserInfo; 