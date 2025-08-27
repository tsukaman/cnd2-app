// Mock for nanoid to fix Jest ESM import issues
module.exports = {
  nanoid: () => {
    // Generate a simple random ID for testing
    return Math.random().toString(36).substr(2, 10);
  },
};