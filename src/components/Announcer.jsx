import React from 'react';

/**
 * Announcer component for screen reader accessibility
 * Provides ARIA live region for dynamic content announcements
 */
const Announcer = ({ message }) => {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'absolute',
        left: '-10000px',
        width: '1px',
        height: '1px',
        overflow: 'hidden'
      }}
    >
      {message}
    </div>
  );
};

export default Announcer;
