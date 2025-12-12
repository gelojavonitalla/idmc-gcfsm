import { render, screen, act } from '@testing-library/react';
import CountdownTimer from './CountdownTimer';

/**
 * CountdownTimer Component Tests
 * Tests for countdown timer functionality, edge cases, and display states
 */

describe('CountdownTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-12-12T10:00:00+08:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('rendering', () => {
    it('renders nothing when no targetDate is provided', () => {
      const { container } = render(<CountdownTimer />);
      expect(container.firstChild).toBeNull();
    });

    it('renders countdown timer with valid future date', () => {
      render(
        <CountdownTimer
          targetDate="2026-03-28T09:00:00+08:00"
          timezone="Asia/Manila"
        />
      );

      expect(screen.getByRole('timer')).toBeInTheDocument();
      expect(screen.getByText('Days')).toBeInTheDocument();
      expect(screen.getByText('Hours')).toBeInTheDocument();
      expect(screen.getByText('Minutes')).toBeInTheDocument();
      expect(screen.getByText('Seconds')).toBeInTheDocument();
    });

    it('displays correct time units', () => {
      render(
        <CountdownTimer
          targetDate="2026-03-28T09:00:00+08:00"
          timezone="Asia/Manila"
        />
      );

      const timer = screen.getByRole('timer');
      expect(timer).toHaveAttribute(
        'aria-label',
        expect.stringContaining('days')
      );
    });
  });

  describe('countdown calculation', () => {
    it('calculates days correctly', () => {
      jest.setSystemTime(new Date('2026-03-26T09:00:00+08:00'));

      render(
        <CountdownTimer
          targetDate="2026-03-28T09:00:00+08:00"
          timezone="Asia/Manila"
        />
      );

      const timer = screen.getByRole('timer');
      expect(timer).toHaveAttribute(
        'aria-label',
        expect.stringContaining('2 days')
      );
    });

    it('updates every second', () => {
      render(
        <CountdownTimer
          targetDate="2026-03-28T09:00:00+08:00"
          timezone="Asia/Manila"
        />
      );

      const initialLabel = screen.getByRole('timer').getAttribute('aria-label');

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const updatedLabel = screen.getByRole('timer').getAttribute('aria-label');
      expect(updatedLabel).not.toBe(initialLabel);
    });

    it('pads single digit numbers with leading zero', () => {
      jest.setSystemTime(new Date('2026-03-28T08:59:55+08:00'));

      render(
        <CountdownTimer
          targetDate="2026-03-28T09:00:00+08:00"
          timezone="Asia/Manila"
        />
      );

      const allValues = screen.getAllByText(/^0\d$/);
      expect(allValues.length).toBeGreaterThan(0);
    });
  });

  describe('event status states', () => {
    it('shows "Event in Progress" when current time is between start and end', () => {
      jest.setSystemTime(new Date('2026-03-28T12:00:00+08:00'));

      render(
        <CountdownTimer
          targetDate="2026-03-28T09:00:00+08:00"
          endDate="2026-03-28T17:00:00+08:00"
          timezone="Asia/Manila"
        />
      );

      expect(screen.getByText('Event in Progress')).toBeInTheDocument();
    });

    it('shows "Event Concluded" when current time is after end date', () => {
      jest.setSystemTime(new Date('2026-03-28T18:00:00+08:00'));

      render(
        <CountdownTimer
          targetDate="2026-03-28T09:00:00+08:00"
          endDate="2026-03-28T17:00:00+08:00"
          timezone="Asia/Manila"
        />
      );

      expect(screen.getByText('Event Concluded')).toBeInTheDocument();
      expect(screen.getByText('Thank you for joining IDMC!')).toBeInTheDocument();
    });

    it('shows countdown when current time is before start date', () => {
      jest.setSystemTime(new Date('2026-03-27T09:00:00+08:00'));

      render(
        <CountdownTimer
          targetDate="2026-03-28T09:00:00+08:00"
          endDate="2026-03-28T17:00:00+08:00"
          timezone="Asia/Manila"
        />
      );

      expect(screen.getByRole('timer')).toBeInTheDocument();
      expect(screen.queryByText('Event in Progress')).not.toBeInTheDocument();
      expect(screen.queryByText('Event Concluded')).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles same day start and end dates', () => {
      jest.setSystemTime(new Date('2026-03-28T10:00:00+08:00'));

      render(
        <CountdownTimer
          targetDate="2026-03-28T09:00:00+08:00"
          endDate="2026-03-28T17:00:00+08:00"
          timezone="Asia/Manila"
        />
      );

      expect(screen.getByText('Event in Progress')).toBeInTheDocument();
    });

    it('treats event as concluded when only start date is provided and passed', () => {
      jest.setSystemTime(new Date('2026-03-28T10:00:00+08:00'));

      render(
        <CountdownTimer
          targetDate="2026-03-28T09:00:00+08:00"
          timezone="Asia/Manila"
        />
      );

      expect(screen.getByText('Event Concluded')).toBeInTheDocument();
    });

    it('cleans up interval on unmount', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const { unmount } = render(
        <CountdownTimer
          targetDate="2026-03-28T09:00:00+08:00"
          timezone="Asia/Manila"
        />
      );

      unmount();
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });

    it('transitions from counting to event started when time passes', () => {
      jest.setSystemTime(new Date('2026-03-28T08:59:59+08:00'));

      render(
        <CountdownTimer
          targetDate="2026-03-28T09:00:00+08:00"
          endDate="2026-03-28T17:00:00+08:00"
          timezone="Asia/Manila"
        />
      );

      expect(screen.getByRole('timer')).toBeInTheDocument();

      act(() => {
        jest.setSystemTime(new Date('2026-03-28T09:00:01+08:00'));
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByText('Event in Progress')).toBeInTheDocument();
    });
  });
});
