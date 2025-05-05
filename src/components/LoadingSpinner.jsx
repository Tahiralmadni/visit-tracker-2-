import React from 'react';
import { CircularProgress, Box, Typography, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ message = 'Loading...', fullscreen = false }) => {
  const theme = useTheme();

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    padding: '2rem',
    width: '100%',
    height: fullscreen ? '100vh' : '100%',
    minHeight: fullscreen ? '100vh' : '200px',
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(0, 0, 0, 0.4)' 
      : 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(8px)',
    position: fullscreen ? 'fixed' : 'relative',
    top: fullscreen ? 0 : 'auto',
    left: fullscreen ? 0 : 'auto',
    zIndex: fullscreen ? 9999 : 1,
  };

  return (
    <Box sx={containerStyle}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <CircularProgress 
          size={48}
          thickness={4}
          sx={{
            color: theme.palette.primary.main,
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }}
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Typography 
          variant="h6"
          sx={{ 
            color: theme.palette.text.primary,
            fontWeight: 500,
            textAlign: 'center',
            fontSize: '1.125rem'
          }}
        >
          {message}
        </Typography>
      </motion.div>
    </Box>
  );
};

export default LoadingSpinner;