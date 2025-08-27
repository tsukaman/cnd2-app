// ID generation utilities for consistent ID format

/**
 * Generate a unique ID with guaranteed minimum length
 * Format: lowercase alphanumeric, 8-20 characters
 */
export function generateId() {
  // Generate base ID from random and timestamp
  const randomPart = Math.random().toString(36).substring(2);
  const timestampPart = Date.now().toString(36);
  let id = randomPart + timestampPart;
  
  // Ensure minimum length of 8 characters
  while (id.length < 8) {
    id += Math.random().toString(36).substring(2);
  }
  
  // Truncate to max 20 characters
  if (id.length > 20) {
    id = id.substring(0, 20);
  }
  
  return id;
}

/**
 * Validate ID format
 * Must be lowercase alphanumeric, 8-20 characters
 */
export function validateId(id) {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // Check format: lowercase alphanumeric, 8-20 characters
  return /^[a-z0-9]{8,20}$/.test(id);
}

/**
 * ID validation regex pattern for reuse
 */
export const ID_PATTERN = /^[a-z0-9]{8,20}$/;