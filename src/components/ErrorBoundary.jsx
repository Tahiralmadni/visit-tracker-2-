import React from 'react';
import { Typography, Button, Paper } from '@mui/material';
import { withTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      isLanguageError: false
    };
    this.previousFocus = null;
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true,
      isLanguageError: error.message?.includes('i18n') || error.message?.includes('translation')
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.previousFocus) {
      this.previousFocus.focus();
    }
  }

  handleKeyDown = (event) => {
    if (this.state.hasError && event.key === 'Tab') {
      event.preventDefault();
      const reloadButton = document.querySelector('#reload-button');
      if (reloadButton) {
        reloadButton.focus();
      }
    }
  };

  handleReload = () => {
    if (this.state.isLanguageError) {
      localStorage.setItem('language', 'en');
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
    window.location.reload();
  };

  render() {
    const { t, i18n } = this.props;
    const isRtl = i18n.language === 'ur';
    
    if (this.state.hasError) {
      return (
        <div 
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: '#f5f5f5',
            direction: isRtl ? 'rtl' : 'ltr'
          }}
          role="alert"
        >
          <Paper
            elevation={3}
            style={{
              padding: '2rem',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              borderRadius: '12px',
              background: '#ffffff',
              color: 'rgba(0, 0, 0, 0.87)'
            }}
          >
            <Typography 
              variant="h5" 
              color="error" 
              gutterBottom
              style={{ fontWeight: 500 }}
            >
              {t(this.state.isLanguageError ? 'languageSwitchError' : 'unexpectedError')}
            </Typography>
            <Typography 
              variant="body1" 
              style={{ 
                marginBottom: '1.5rem',
                color: 'rgba(0, 0, 0, 0.6)'
              }}
            >
              {t(this.state.isLanguageError ? 'languageSwitchErrorMessage' : 'unexpectedErrorMessage')}
            </Typography>
            <Button 
              id="reload-button"
              variant="contained" 
              color="primary"
              onClick={this.handleReload}
              style={{
                borderRadius: '8px',
                padding: '8px 24px',
                textTransform: 'none'
              }}
              autoFocus
            >
              {t('reloadPage')}
            </Button>
          </Paper>
        </div>
      );
    }

    return this.props.children;
  }
}

// Only wrap with translation HOC
export default withTranslation()(ErrorBoundary);