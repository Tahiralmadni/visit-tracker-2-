import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography } from '@mui/material';

const WelcomeAnimation = ({ onComplete }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(45deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        zIndex: 9999,
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(64,181,173,0.1) 0%, rgba(64,181,173,0.05) 50%, transparent 100%)',
          animation: 'rotate 20s linear infinite',
        },
        '@keyframes rotate': {
          '0%': {
            transform: 'rotate(0deg)'
          },
          '100%': {
            transform: 'rotate(360deg)'
          }
        },
        '@keyframes float': {
          '0%, 100%': {
            transform: 'translateY(0px)'
          },
          '50%': {
            transform: 'translateY(-20px)'
          }
        }
      }}
    >
      {/* Animated background bubbles */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          '& > div': {
            position: 'absolute',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: 'rgba(64,181,173,0.15)',
            animation: 'float 4s infinite',
          },
          '& > div:nth-of-type(1)': { 
            top: '20%', 
            left: '20%', 
            width: '60px', 
            height: '60px',
            animationDelay: '0s' 
          },
          '& > div:nth-of-type(2)': { 
            top: '60%', 
            left: '80%', 
            width: '40px', 
            height: '40px',
            animationDelay: '1s' 
          },
          '& > div:nth-of-type(3)': { 
            top: '80%', 
            left: '30%', 
            width: '50px', 
            height: '50px',
            animationDelay: '2s' 
          },
          '& > div:nth-of-type(4)': { 
            top: '10%', 
            left: '70%', 
            width: '45px', 
            height: '45px',
            animationDelay: '3s' 
          }
        }}
      >
        <div />
        <div />
        <div />
        <div />
      </Box>

      {/* Main content */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.8,
          ease: [0.4, 0, 0.2, 1]
        }}
        onAnimationComplete={onComplete}
        style={{
          position: 'relative',
          zIndex: 1,
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '20px',
          padding: '3rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Box
            component="img"
            src="/download.png"
            alt="Logo"
            sx={{
              width: 150,
              height: 'auto',
              mb: 3,
              display: 'block',
              margin: '0 auto',
              filter: 'drop-shadow(0 4px 12px rgba(64,181,173,0.5))'
            }}
          />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Typography
            variant="h3"
            sx={{
              background: 'linear-gradient(45deg, #40B5AD, #4FD1C5)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              fontWeight: 'bold',
              textAlign: 'center',
              mt: 2,
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
            }}
          >
            Welcome To
          </Typography>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Typography
            variant="h2"
            sx={{
              color: 'white',
              fontWeight: 'bold',
              textAlign: 'center',
              mt: 1,
              fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
              textShadow: '0 4px 8px rgba(0,0,0,0.2)',
              letterSpacing: '0.5px',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -16,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(64,181,173,0.5), transparent)'
              }
            }}
          >
            Tahir Almadni's Website
          </Typography>
        </motion.div>
      </motion.div>
    </Box>
  );
};

export default WelcomeAnimation;