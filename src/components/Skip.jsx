import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * SkipLink component for accessibility
 * Provides skip navigation for keyboard users and screen readers
 */
const Skip = ({ href = '#main-content', children = 'Skip to main content' }) => {
  return (
    <Box
      component="a"
      href={href}
      sx={{
        position: 'absolute',
        top: '-40px',
        left: '6px',
        background: '#1976d2',
        color: 'white',
        padding: '8px 12px',
        textDecoration: 'none',
        borderRadius: '4px',
        zIndex: 1000,
        transition: 'all 0.3s ease',
        fontSize: '14px',
        fontWeight: 500,
        '&:focus': {
          top: '6px',
          outline: '2px solid #fff',
          outlineOffset: '2px',
        },
        '&:hover': {
          background: '#1565c0',
        }
      }}
      aria-label={children}
    >
      <Typography variant="body2" component="span">
        {children}
      </Typography>
    </Box>
  );
};

export default Skip;
