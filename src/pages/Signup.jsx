import React, { useState } from 'react';
import { TextField, Button, Box, Typography, IconButton } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../components/LoadingSpinner';
import FacebookIcon from '@mui/icons-material/Facebook';
import GoogleIcon from '@mui/icons-material/Google';
import { motion, AnimatePresence } from 'framer-motion';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, loginWithGoogle, loginWithFacebook } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ur';

  const containerVariants = {
    initial: { opacity: 0, x: 100 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0,
      x: -100,
      transition: { duration: 0.4 }
    }
  };

  const formVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  const handleSocialLogin = async (provider) => {
    try {
      setError('');
      setLoading(true);
      if (provider === 'google') {
        await loginWithGoogle();
      } else if (provider === 'facebook') {
        await loginWithFacebook();
      }
      navigate('/');
    } catch (err) {
      console.error('Social login error:', err);
      setError(t('signupError'));
    } finally {
      setLoading(false);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await signup(email, password);
      navigate('/');
    } catch (err) {
      setError(t('signupError'));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSpinner fullscreen message={t('creatingAccount')} />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="signup"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={containerVariants}
        style={{ 
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Left Section - Welcome */}
        <motion.div
          variants={formVariants}
          initial="initial"
          animate="animate"
          className="split-section"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#40B5AD',
            color: 'white',
            padding: '2rem',
            position: 'relative'
          }}
        >
          <Box
            component="img"
            src={isRtl ? '/logo-ur.png' : '/download.png'}
            alt="Logo"
            sx={{
              width: 80,
              height: 'auto',
              mb: 4,
              filter: 'brightness(0) invert(1)'
            }}
          />
          <Typography 
            variant="h3" 
            component="h2" 
            sx={{ 
              mb: 3,
              fontWeight: 700,
              textAlign: 'center',
              fontSize: { xs: '2rem', md: '2.5rem' }
            }}
          >
            {t('createAccount')}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 4,
              textAlign: 'center',
              maxWidth: 400,
              fontSize: '1.1rem',
              opacity: 0.9
            }}
          >
            {t('signupWelcomeMessage')}
          </Typography>
          <Button
            component={Link}
            to="/login"
            variant="outlined"
            sx={{
              color: 'white',
              borderColor: 'white',
              borderRadius: '15px',
              p: '10px 30px',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 500,
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            {t('login')}
          </Button>
        </motion.div>

        {/* Right Section - Form */}
        <motion.div
          variants={formVariants}
          initial="initial"
          animate="animate"
          className="split-section"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backgroundColor: 'white',
            position: 'relative',
            zIndex: 1
          }}
        >
          <Box sx={{ maxWidth: 400, width: '100%' }}>
            <Typography variant="h4" component="h1" sx={{ 
              mb: 4, 
              color: '#40B5AD',
              fontWeight: 600,
              textAlign: 'center'
            }}>
              {t('signUp')}
            </Typography>

            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 2, 
              mb: 3 
            }}>
              {[
                { icon: <FacebookIcon sx={{ color: '#1877f2' }} />, provider: 'facebook' },
                { icon: <GoogleIcon sx={{ color: '#DB4437' }} />, provider: 'google' }
              ].map((item, index) => (
                <IconButton
                  key={index}
                  className="social-icon"
                  onClick={() => handleSocialLogin(item.provider)}
                  sx={{ 
                    width: 50,
                    height: 50,
                    border: '1px solid #e0e0e0',
                    borderRadius: '15px',
                    transition: 'all 0.3s ease',
                    '&:hover': { 
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      bgcolor: '#f8f8f8'
                    }
                  }}
                >
                  {item.icon}
                </IconButton>
              ))}
            </Box>

            <Typography 
              variant="body1" 
              sx={{ 
                textAlign: 'center', 
                mb: 3,
                color: '#666',
                position: 'relative',
                '&::before, &::after': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  width: '80px',
                  height: '1px',
                  bgcolor: '#e0e0e0'
                },
                '&::before': {
                  left: isRtl ? 'auto' : '20%',
                  right: isRtl ? '20%' : 'auto'
                },
                '&::after': {
                  right: isRtl ? 'auto' : '20%',
                  left: isRtl ? '20%' : 'auto'
                }
              }}
            >
              {t('orSignupWith')}
            </Typography>

            {error && (
              <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
                {error}
              </Typography>
            )}

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <TextField
                className="form-field"
                variant="outlined"
                required
                fullWidth
                id="name"
                label={t('name')}
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '15px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    },
                    '&.Mui-focused': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }
                  }
                }}
              />
              <TextField
                className="form-field"
                variant="outlined"
                required
                fullWidth
                id="email"
                label={t('email')}
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '15px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    },
                    '&.Mui-focused': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }
                  }
                }}
              />
              <TextField
                className="form-field"
                variant="outlined"
                required
                fullWidth
                name="password"
                label={t('password')}
                type="password"
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '15px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    },
                    '&.Mui-focused': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }
                  }
                }}
              />
              <Button
                className="form-field"
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  borderRadius: '15px',
                  p: 1.5,
                  bgcolor: '#40B5AD',
                  transition: 'all 0.3s ease',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 500,
                  '&:hover': {
                    bgcolor: '#369E97',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 8px rgba(64,181,173,0.3)'
                  }
                }}
              >
                {t('signUp')}
              </Button>
            </form>
          </Box>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}