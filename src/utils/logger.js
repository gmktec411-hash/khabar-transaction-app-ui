/* eslint-disable no-console */
// Minimal logger that keeps warnings in development, downgrades them in production
const isDev = process.env.NODE_ENV !== 'production';

export const warn = (...args) => {
  if (isDev) {
    console.warn(...args);
  } else {
    // In production, avoid noisy warnings; log as info instead so it's still available when needed
    console.info(...args);
  }
};

export const info = (...args) => console.info(...args);
export const error = (...args) => console.error(...args);

const logger = {
  warn,
  info,
  error,
};

export default logger;
