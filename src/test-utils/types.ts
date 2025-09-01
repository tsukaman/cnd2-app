/**
 * Unified type definitions for test mocks
 */

// Mock Storage type for localStorage and sessionStorage
export type MockStorage = jest.Mocked<Storage>;

// Mock for menu card props
export interface MockMenuCardProps {
  title: string;
  href: string;
}

// Mock for Prairie Card component props
export interface MockPrairieCardInputProps {
  onProfileLoaded: (profile: any) => void;
  disabled?: boolean;
}

// Mock for share button props
export interface MockShareButtonProps {
  result: any;
}

// Mock for QR code modal props
export interface MockQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

// Common mock response types
export interface MockApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Export convenience function for creating mock storage
export function createMockStorage(): MockStorage {
  return {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
  };
}