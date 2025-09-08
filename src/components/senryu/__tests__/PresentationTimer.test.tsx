import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { PresentationTimer } from '../PresentationTimer';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    circle: ({ children, ...props }: any) => <circle {...props}>{children}</circle>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  }
}));

describe('PresentationTimer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('displays initial time correctly', () => {
    render(
      <PresentationTimer
        duration={60}
        onComplete={jest.fn()}
        isActive={false}
      />
    );

    expect(screen.getByText('1:00')).toBeInTheDocument();
    expect(screen.getByText('プレゼンタイム')).toBeInTheDocument();
  });

  test('counts down when active', () => {
    const onComplete = jest.fn();
    render(
      <PresentationTimer
        duration={60}
        onComplete={onComplete}
        isActive={true}
      />
    );

    expect(screen.getByText('1:00')).toBeInTheDocument();

    // Advance timer by 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText('0:59')).toBeInTheDocument();

    // Advance timer by 9 more seconds
    act(() => {
      jest.advanceTimersByTime(9000);
    });

    expect(screen.getByText('0:50')).toBeInTheDocument();
  });

  test('calls onComplete when timer reaches 0', () => {
    const onComplete = jest.fn();
    render(
      <PresentationTimer
        duration={3}
        onComplete={onComplete}
        isActive={true}
      />
    );

    expect(onComplete).not.toHaveBeenCalled();

    // Advance timer to completion
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText('0:00')).toBeInTheDocument();
  });

  test('shows skip button when allowSkip is true', () => {
    render(
      <PresentationTimer
        duration={60}
        onComplete={jest.fn()}
        isActive={true}
        allowSkip={true}
      />
    );

    const skipButton = screen.getByRole('button', { name: /プレゼンを終了して採点へ/i });
    expect(skipButton).toBeInTheDocument();
  });

  test('does not show skip button when allowSkip is false', () => {
    render(
      <PresentationTimer
        duration={60}
        onComplete={jest.fn()}
        isActive={true}
        allowSkip={false}
      />
    );

    const skipButton = screen.queryByRole('button', { name: /プレゼンを終了して採点へ/i });
    expect(skipButton).not.toBeInTheDocument();
  });

  test('calls onComplete when skip button is clicked', async () => {
    const onComplete = jest.fn();
    const user = userEvent.setup({ delay: null });
    
    render(
      <PresentationTimer
        duration={60}
        onComplete={onComplete}
        isActive={true}
        allowSkip={true}
      />
    );

    const skipButton = screen.getByRole('button', { name: /プレゼンを終了して採点へ/i });
    await user.click(skipButton);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test('shows warning message when time is low', () => {
    render(
      <PresentationTimer
        duration={10}
        onComplete={jest.fn()}
        isActive={true}
      />
    );

    expect(screen.getByText('残りわずか！')).toBeInTheDocument();
    expect(screen.getByText('ラストスパート！')).toBeInTheDocument();
  });

  test('resets timer when isActive becomes false', () => {
    const { rerender } = render(
      <PresentationTimer
        duration={60}
        onComplete={jest.fn()}
        isActive={true}
      />
    );

    // Advance timer
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(screen.getByText('0:30')).toBeInTheDocument();

    // Deactivate timer
    rerender(
      <PresentationTimer
        duration={60}
        onComplete={jest.fn()}
        isActive={false}
      />
    );

    expect(screen.getByText('1:00')).toBeInTheDocument();
  });

  test('displays correct progress percentage', () => {
    render(
      <PresentationTimer
        duration={100}
        onComplete={jest.fn()}
        isActive={true}
      />
    );

    expect(screen.getByText('0%')).toBeInTheDocument();

    // Advance timer by 25 seconds
    act(() => {
      jest.advanceTimersByTime(25000);
    });

    expect(screen.getByText('25%')).toBeInTheDocument();

    // Advance timer by another 25 seconds
    act(() => {
      jest.advanceTimersByTime(25000);
    });

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  test('changes color based on remaining time', () => {
    const { container } = render(
      <PresentationTimer
        duration={60}
        onComplete={jest.fn()}
        isActive={true}
      />
    );

    // Initially green (more than 20 seconds)
    let timerText = container.querySelector('.text-6xl');
    expect(timerText).toHaveStyle({ color: '#10B981' });

    // Advance to 15 seconds (should be orange)
    act(() => {
      jest.advanceTimersByTime(45000);
    });

    timerText = container.querySelector('.text-6xl');
    expect(timerText).toHaveStyle({ color: '#F59E0B' });

    // Advance to 5 seconds (should be red)
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    timerText = container.querySelector('.text-6xl');
    expect(timerText).toHaveStyle({ color: '#EF4444' });
  });
});