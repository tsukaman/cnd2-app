import { render, screen } from '@testing-library/react';
import { MenuCard } from '../MenuCard';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ children, whileHover, whileTap, ...props }: any, ref: any) => 
        React.createElement('div', { ...props, ref }, children)
      ),
    },
  };
});

describe('MenuCard', () => {
  const defaultProps = {
    href: '/test',
    icon: '🎯',
    title: 'Test Card',
    description: 'Test description',
    delay: 0,
  };

  it('renders correctly with all props', () => {
    render(<MenuCard {...defaultProps} />);
    
    expect(screen.getByText('🎯')).toBeInTheDocument();
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('creates a link to the correct href', () => {
    render(<MenuCard {...defaultProps} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/test');
  });

  it('applies correct CSS classes', () => {
    const { container } = render(<MenuCard {...defaultProps} />);
    
    const card = container.querySelector('.card-dark');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('p-8', 'text-center', 'cursor-pointer');
  });

  it('renders title with gradient text', () => {
    render(<MenuCard {...defaultProps} />);
    
    const title = screen.getByText('Test Card');
    expect(title).toHaveClass('gradient-text');
  });
});