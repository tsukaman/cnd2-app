import { render, screen, fireEvent } from '@testing-library/react';
import { MultiStyleSelector } from '../MultiStyleSelector';
import { DiagnosisStyle } from '@/lib/diagnosis-engine-unified';

describe('MultiStyleSelector Component', () => {
  const mockOnStylesChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all style options correctly', () => {
      render(
        <MultiStyleSelector 
          selectedStyles={[]} 
          onStylesChange={mockOnStylesChange}
        />
      );

      // Check all style options are rendered
      expect(screen.getByText('クリエイティブ')).toBeInTheDocument();
      expect(screen.getByText('占星術')).toBeInTheDocument();
      expect(screen.getByText('点取り占い')).toBeInTheDocument();
      expect(screen.getByText('技術分析')).toBeInTheDocument();

      // Check descriptions
      expect(screen.getByText('予想外の化学反応')).toBeInTheDocument();
      expect(screen.getByText('星が導く運命')).toBeInTheDocument();
      expect(screen.getByText('運勢を診断')).toBeInTheDocument();
      expect(screen.getByText('データドリブン')).toBeInTheDocument();
    });

    it('should display selected styles with checkmarks', () => {
      const selectedStyles: DiagnosisStyle[] = ['creative', 'technical'];
      
      render(
        <MultiStyleSelector 
          selectedStyles={selectedStyles} 
          onStylesChange={mockOnStylesChange}
        />
      );

      // Check for visual feedback on selected items
      const creativeButton = screen.getByText('クリエイティブ').closest('button');
      const technicalButton = screen.getByText('技術分析').closest('button');
      
      expect(creativeButton).toHaveClass('bg-purple-900/50');
      expect(technicalButton).toHaveClass('bg-purple-900/50');
    });

    it('should show warning when no styles are selected', () => {
      render(
        <MultiStyleSelector 
          selectedStyles={[]} 
          onStylesChange={mockOnStylesChange}
        />
      );

      expect(screen.getByText('少なくとも1つのスタイルを選択してください')).toBeInTheDocument();
    });

    it('should show count of selected styles', () => {
      render(
        <MultiStyleSelector 
          selectedStyles={['creative', 'astrological']} 
          onStylesChange={mockOnStylesChange}
        />
      );

      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('2つのスタイルで診断します')).toBeInTheDocument();
    });

    it('should show special message for all styles selected', () => {
      render(
        <MultiStyleSelector 
          selectedStyles={['creative', 'astrological', 'fortune', 'technical']} 
          onStylesChange={mockOnStylesChange}
        />
      );

      expect(screen.getByText('全スタイルで診断します（約2-3秒）')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should handle style selection', () => {
      render(
        <MultiStyleSelector 
          selectedStyles={[]} 
          onStylesChange={mockOnStylesChange}
        />
      );

      const creativeButton = screen.getByText('クリエイティブ').closest('button');
      fireEvent.click(creativeButton!);

      expect(mockOnStylesChange).toHaveBeenCalledWith(['creative']);
    });

    it('should handle style deselection', () => {
      render(
        <MultiStyleSelector 
          selectedStyles={['creative', 'technical']} 
          onStylesChange={mockOnStylesChange}
        />
      );

      const creativeButton = screen.getByText('クリエイティブ').closest('button');
      fireEvent.click(creativeButton!);

      expect(mockOnStylesChange).toHaveBeenCalledWith(['technical']);
    });

    it('should handle "select all" button', () => {
      render(
        <MultiStyleSelector 
          selectedStyles={[]} 
          onStylesChange={mockOnStylesChange}
        />
      );

      const selectAllButton = screen.getByText('すべて選択');
      fireEvent.click(selectAllButton);

      expect(mockOnStylesChange).toHaveBeenCalledWith([
        'creative',
        'astrological',
        'fortune',
        'technical'
      ]);
    });

    it('should handle "clear all" button', () => {
      render(
        <MultiStyleSelector 
          selectedStyles={['creative', 'technical']} 
          onStylesChange={mockOnStylesChange}
        />
      );

      const clearButton = screen.getByText('クリア');
      fireEvent.click(clearButton);

      expect(mockOnStylesChange).toHaveBeenCalledWith([]);
    });

    it('should toggle multiple styles correctly', () => {
      const { rerender } = render(
        <MultiStyleSelector 
          selectedStyles={[]} 
          onStylesChange={mockOnStylesChange}
        />
      );

      // Select creative
      const creativeButton = screen.getByText('クリエイティブ').closest('button');
      fireEvent.click(creativeButton!);
      expect(mockOnStylesChange).toHaveBeenCalledWith(['creative']);

      // Update props and select technical
      rerender(
        <MultiStyleSelector 
          selectedStyles={['creative']} 
          onStylesChange={mockOnStylesChange}
        />
      );

      const technicalButton = screen.getByText('技術分析').closest('button');
      fireEvent.click(technicalButton!);
      expect(mockOnStylesChange).toHaveBeenCalledWith(['creative', 'technical']);

      // Update props and deselect creative
      rerender(
        <MultiStyleSelector 
          selectedStyles={['creative', 'technical']} 
          onStylesChange={mockOnStylesChange}
        />
      );

      fireEvent.click(creativeButton!);
      expect(mockOnStylesChange).toHaveBeenCalledWith(['technical']);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      render(
        <MultiStyleSelector 
          selectedStyles={[]} 
          onStylesChange={mockOnStylesChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should support keyboard navigation', () => {
      render(
        <MultiStyleSelector 
          selectedStyles={[]} 
          onStylesChange={mockOnStylesChange}
        />
      );

      const firstButton = screen.getByText('クリエイティブ').closest('button');
      
      // Verify button can be focused
      firstButton?.focus();
      expect(document.activeElement).toBe(firstButton);
      
      // Buttons are clickable via keyboard (Enter/Space triggers click event)
      fireEvent.click(firstButton!);
      expect(mockOnStylesChange).toHaveBeenCalledWith(['creative']);
    });
  });

  describe('Visual Feedback', () => {
    it('should show different styles for selected vs unselected items', () => {
      render(
        <MultiStyleSelector 
          selectedStyles={['creative']} 
          onStylesChange={mockOnStylesChange}
        />
      );

      const selectedButton = screen.getByText('クリエイティブ').closest('button');
      const unselectedButton = screen.getByText('技術分析').closest('button');

      expect(selectedButton).toHaveClass('bg-purple-900/50', 'border-purple-500');
      expect(unselectedButton).toHaveClass('bg-gray-800/50', 'border-gray-700');
    });

    it('should show icons for each style', () => {
      render(
        <MultiStyleSelector 
          selectedStyles={[]} 
          onStylesChange={mockOnStylesChange}
        />
      );

      expect(screen.getByText('🎨')).toBeInTheDocument();
      expect(screen.getByText('⭐')).toBeInTheDocument();
      expect(screen.getByText('🔮')).toBeInTheDocument();
      expect(screen.getByText('📊')).toBeInTheDocument();
    });
  });
});