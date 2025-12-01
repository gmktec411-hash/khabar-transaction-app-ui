// Shared Avatar Utility Functions

// Fun avatar styles from DiceBear
const AVATAR_STYLES = [
  'adventurer',
  'avataaars',
  'big-smile',
  'bottts',
  'fun-emoji',
  'lorelei',
  'micah',
  'miniavs',
  'notionists',
  'open-peeps',
  'personas',
  'pixel-art'
];

/**
 * Get a consistent avatar style based on username
 * @param {string} username - The username to generate avatar for
 * @returns {string} Avatar style name
 */
export const getAvatarStyle = (username) => {
  if (!username) return 'avataaars';

  // Generate a consistent index based on username characters
  const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_STYLES[index % AVATAR_STYLES.length];
};

/**
 * Get avatar URL for a user
 * @param {string} username - The username to generate avatar for
 * @param {Object} options - Optional configuration
 * @param {string} options.backgroundColor - Custom background color (default: purple gradient colors)
 * @param {number} options.size - Size in pixels (default: auto)
 * @returns {string} Full avatar URL
 */
export const getAvatarUrl = (username, options = {}) => {
  if (!username) return '';

  const style = getAvatarStyle(username);
  const backgroundColor = options.backgroundColor || '667eea,764ba2';
  const sizeParam = options.size ? `&size=${options.size}` : '';

  return `https://api.dicebear.com/8.x/${style}/svg?seed=${encodeURIComponent(username)}&backgroundColor=${backgroundColor}${sizeParam}`;
};

/**
 * Get all available avatar style names
 * @returns {Array<string>} Array of avatar style names
 */
export const getAvatarStyles = () => {
  return [...AVATAR_STYLES];
};
