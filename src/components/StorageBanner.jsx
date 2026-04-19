import React, { useState } from 'react';
import { Box, Button, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BlockIcon from '@mui/icons-material/Block';
import { getStorageStatus, getStorageMessage } from '../utils/storageStatus';

/**
 * StorageBanner Component
 * Modern themed banner with green/white color scheme
 */
const StorageBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const status = getStorageStatus();
  const { text, type } = getStorageMessage();

  // Only show banner if there's a warning or error and it hasn't been closed
  if (status === 'active' || !isVisible) {
    return null;
  }

  const isWarning = type === 'warning';
  const bgColor = isWarning 
    ? 'linear-gradient(135deg,rgb(255, 81, 0) 0%,rgb(255, 81, 0) 100%)' 
    : 'linear-gradient(135deg,rgb(226, 95, 35) 0%,rgb(226, 95, 35) 100%)';

  return (
    <Box
      sx={{
        position: 'fixed',
        top: '64px', // Position below navbar
        left: 0,
        right: 0,
        zIndex: 1200,
        background: bgColor,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        animation: 'slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        '@keyframes slideDown': {
          from: {
            transform: 'translateY(-100%)',
            opacity: 0,
          },
          to: {
            transform: 'translateY(0)',
            opacity: 1,
          },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {/* Icon */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {isWarning ? (
              <WarningAmberIcon sx={{ color: 'white', fontSize: 24 }} />
            ) : (
              <BlockIcon sx={{ color: 'white', fontSize: 24 }} />
            )}
          </Box>
          
          {/* Message */}
          <Typography
            sx={{
              color: 'white',
              fontSize: '0.95rem',
              fontWeight: 500,
              letterSpacing: '0.01em',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            }}
          >
            {text}
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {status === 'expired' && (
            <Button
              variant="contained"
              size="medium"
              sx={{
                backgroundColor: 'white',
                color: isWarning ? '#40B5AD' : '#FF6B6B',
                borderRadius: '8px',
                px: 3,
                py: 1,
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'white',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                },
              }}
              onClick={() => {
                window.open('https://your-upgrade-url.com', '_blank');
              }}
            >
              Upgrade to Premium
            </Button>
          )}
          
          {/* Close Button */}
          <IconButton
            onClick={() => setIsVisible(false)}
            sx={{
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              width: 36,
              height: 36,
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                transform: 'rotate(90deg)',
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default StorageBanner;
