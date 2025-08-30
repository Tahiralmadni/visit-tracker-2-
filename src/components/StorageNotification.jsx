import React, { useEffect, useState } from 'react';
import { Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { checkStorageStatus, getStorageMessage } from '../utils/storageLimit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BlockIcon from '@mui/icons-material/Block';

const StorageNotification = ({ onAction = null, showModal = false }) => {
  const { i18n } = useTranslation();
  const [status, setStatus] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  useEffect(() => {
    const currentStatus = checkStorageStatus();
    setStatus(currentStatus);

    // Show warning toast for warning period
    if (currentStatus.type === 'warning') {
      setShowWarning(true);
    }

    // Show block modal when requested and status is blocked
    if (showModal && currentStatus.type === 'blocked') {
      setShowBlockModal(true);
    }
  }, [showModal]);

  const handleCloseWarning = () => {
    setShowWarning(false);
  };

  const handleCloseModal = () => {
    setShowBlockModal(false);
    if (onAction) {
      onAction('close');
    }
  };

  const handleUpgrade = () => {
    // Placeholder for upgrade action
    // You can implement actual upgrade logic here
    if (onAction) {
      onAction('upgrade');
    }
    setShowBlockModal(false);
  };

  if (!status) return null;

  return (
    <>
      {/* Warning Snackbar for August 30-31 */}
      {status.type === 'warning' && (
        <Snackbar
          open={showWarning}
          autoHideDuration={10000}
          onClose={handleCloseWarning}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseWarning}
            severity="warning"
            icon={<WarningAmberIcon />}
            sx={{
              width: '100%',
              fontSize: '0.95rem',
              boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
              border: '1px solid rgba(255, 152, 0, 0.3)',
            }}
          >
            {getStorageMessage(i18n.language)}
          </Alert>
        </Snackbar>
      )}

      {/* Permanent Warning Banner for Warning Period */}
      {status.type === 'warning' && !showWarning && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: 'warning.main',
            color: 'warning.contrastText',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            zIndex: 1300,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          <WarningAmberIcon />
          <span>{getStorageMessage(i18n.language)}</span>
        </Box>
      )}

      {/* Block Modal for September 1 onwards */}
      <Dialog
        open={showBlockModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            backgroundColor: 'error.main',
            color: 'error.contrastText',
          }}
        >
          <BlockIcon />
          {i18n.language === 'ur' ? 'اسٹوریج کی حد ختم' : 'Storage Limit Reached'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 2,
            alignItems: 'center',
            textAlign: 'center',
            py: 2
          }}>
            <BlockIcon sx={{ fontSize: 64, color: 'error.main', opacity: 0.8 }} />
            <span style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
              {getStorageMessage(i18n.language)}
            </span>
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: 2, gap: 1 }}>
          <Button 
            onClick={handleCloseModal} 
            variant="outlined"
            color="inherit"
          >
            {i18n.language === 'ur' ? 'بند کریں' : 'Close'}
          </Button>
          <Button 
            onClick={handleUpgrade} 
            variant="contained"
            color="primary"
            sx={{ 
              background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
              boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
            }}
          >
            {i18n.language === 'ur' ? 'پریمیم میں اپ گریڈ کریں' : 'Upgrade to Premium'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default StorageNotification;
