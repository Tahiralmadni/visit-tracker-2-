import React from 'react';
import { Card, Typography, Grid, Button, useTheme } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import LoadingSpinner from './components/LoadingSpinner';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';

// Utility functions for consistent formatting
const formatDate = (dateString, language) => {
  if (!dateString) return 'N/A';
  const date = dayjs(dateString);
  if (language === 'ur') {
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

const formatDuration = (duration, language, t) => {
  if (!duration) return 'N/A';
  const formattedNumber = language === 'ur' 
    ? duration.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d])
    : duration;
  return `${formattedNumber} ${t('minutesShort')}`;
};

const VisitDetails = ({ visit }) => {
  console.log("VisitDetails component received visit prop:", visit); // Add this log
  const navigate = useNavigate();
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ur';

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

  const containerStyle = {
    minHeight: 'calc(100vh - 64px)',
    padding: '80px 24px 24px',
    background: theme.palette.mode === 'dark' 
      ? 'linear-gradient(135deg, #1a1a1a 0%, #121212 100%)' 
      : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
  };

  const cardStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : theme.palette.background.paper,
    borderRadius: '16px',
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 4px 20px rgba(0, 0, 0, 0.5)' 
      : '0 8px 32px rgba(0, 0, 0, 0.08)',
    backdropFilter: 'blur(8px)',
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'}`,
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  const headerStyle = {
    padding: '24px',
    background: theme.palette.mode === 'dark' 
      ? 'linear-gradient(135deg, rgba(46, 125, 50, 0.15) 0%, rgba(27, 94, 32, 0.15) 100%)'
      : 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(27, 94, 32, 0.05) 100%)',
    borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
  };

  const contentStyle = {
    padding: '24px',
  };

  const gridItemStyle = {
    padding: '12px',
    borderRadius: '8px',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
    }
  };

  const labelStyle = {
    color: theme.palette.text.secondary,
    fontWeight: 500,
    marginBottom: '4px'
  };

  const valueStyle = {
    color: theme.palette.text.primary,
    fontWeight: 400,
    whiteSpace: 'pre-wrap'
  };

  return (
    <motion.div 
      style={containerStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card style={cardStyle}>
        <div style={headerStyle}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            {t('visitDetails')}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: theme.palette.text.secondary }}>
            {t('clientName')}: {visit?.name}
          </Typography>
        </div>

        <div style={contentStyle}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <div style={gridItemStyle}>
                <Typography variant="body2" sx={labelStyle}>{t('contactNumber')}</Typography>
                <Typography variant="body1" sx={valueStyle}>{visit?.phone || 'N/A'}</Typography>
              </div>
            </Grid>

            <Grid item xs={12} sm={8}>
              <div style={gridItemStyle}>
                <Typography variant="body2" sx={labelStyle}>{t('address')}</Typography>
                <Typography variant="body1" sx={valueStyle}>{visit?.address || 'N/A'}</Typography>
              </div>
            </Grid>

            <Grid item xs={12} sm={4}>
              <div style={gridItemStyle}>
                <Typography variant="body2" sx={labelStyle}>{t('dateOfVisit')}</Typography>
                <Typography variant="body1" sx={valueStyle}>
                  {formatDate(visit?.date, i18n.language)}
                </Typography>
              </div>
            </Grid>

            <Grid item xs={12} sm={4}>
              <div style={gridItemStyle}>
                <Typography variant="body2" sx={labelStyle}>{t('timeIn')}</Typography>
                <Typography variant="body1" sx={valueStyle}>{visit?.timeIn || 'N/A'}</Typography>
              </div>
            </Grid>

            <Grid item xs={12} sm={4}>
              <div style={gridItemStyle}>
                <Typography variant="body2" sx={labelStyle}>{t('timeOut')}</Typography>
                <Typography variant="body1" sx={valueStyle}>{visit?.timeOut || 'N/A'}</Typography>
              </div>
            </Grid>

            <Grid item xs={12}>
              <div style={gridItemStyle}>
                <Typography variant="body2" sx={labelStyle}>{t('question')}</Typography>
                <Typography variant="body1" sx={valueStyle}>{visit?.userQuestion || 'N/A'}</Typography>
              </div>
            </Grid>

            <Grid item xs={12} sm={4}>
              <div style={gridItemStyle}>
                <Typography variant="body2" sx={labelStyle}>{t('officerName')}</Typography>
                <Typography variant="body1" sx={valueStyle}>{visit?.officerName || 'N/A'}</Typography>
              </div>
            </Grid>

            <Grid item xs={12} sm={4}>
              <div style={gridItemStyle}>
                <Typography variant="body2" sx={labelStyle}>{t('officerResponseDate')}</Typography>
                <Typography variant="body1" sx={valueStyle}>
                  {formatDate(visit?.responseDate, i18n.language)}
                </Typography>
              </div>
            </Grid>

            <Grid item xs={12}>
              <div style={gridItemStyle}>
                <Typography variant="body2" sx={labelStyle}>{t('officerAnswer')}</Typography>
                <Typography variant="body1" sx={valueStyle}>{visit?.officerAnswer || 'N/A'}</Typography>
              </div>
            </Grid>
          </Grid>

          <div style={{ 
            marginTop: '24px',
            display: 'flex',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <Button
              variant="outlined" 
              color="primary" 
              onClick={() => navigate(-1)}
              sx={{
                borderRadius: '12px',
                padding: '8px 24px',
                textTransform: 'none',
                fontWeight: 500
              }}
            >
              {t('backToDashboard')}
            </Button>
            <Button
              variant="contained" 
              color="primary" 
              component={Link}
              to={`/edit/${visit.id}`}
              sx={{
                borderRadius: '12px',
                padding: '8px 24px',
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none'
                }
              }}
            >
              {t('edit')}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default VisitDetails;
