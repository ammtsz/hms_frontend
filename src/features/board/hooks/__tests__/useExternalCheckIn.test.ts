import { renderHook } from '@testing-library/react';
import { useExternalCheckIn } from '../useExternalCheckIn';
import type { Priority } from '@/types/types';

type UnscheduledCheckIn = {
  name: string;
  types: string[];
  isNew: boolean;
  priority?: Priority;
} | null | undefined;

describe('useExternalCheckIn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial state and basic functionality', () => {
    it('should initialize with checkInProcessed as false', () => {
      const { result } = renderHook(() => useExternalCheckIn());

      expect(result.current.checkInProcessed).toBe(false);
    });

    it('should return correct interface', () => {
      const { result } = renderHook(() => useExternalCheckIn());

      expect(result.current).toHaveProperty('checkInProcessed');
      expect(typeof result.current.checkInProcessed).toBe('boolean');
    });

    it('should handle no props gracefully', () => {
      const { result } = renderHook(() => useExternalCheckIn());

      expect(result.current.checkInProcessed).toBe(false);
    });

    it('should handle empty props object', () => {
      const { result } = renderHook(() => useExternalCheckIn({}));

      expect(result.current.checkInProcessed).toBe(false);
    });
  });

  describe('External check-in processing', () => {
    it('should call onCheckInProcessed when unscheduledCheckIn is provided', () => {
      const mockOnCheckInProcessed = jest.fn();
      const unscheduledCheckIn = {
        name: 'New Patient',
        types: ['assessment'],
        isNew: true,
        priority: '2' as Priority
      };

      const { result } = renderHook(() => 
        useExternalCheckIn({
          unscheduledCheckIn,
          onCheckInProcessed: mockOnCheckInProcessed
        })
      );

      expect(result.current.checkInProcessed).toBe(true);
      expect(mockOnCheckInProcessed).toHaveBeenCalledTimes(1);
    });

    it('should call onCheckInProcessed for multiple type check-in', () => {
      const mockOnCheckInProcessed = jest.fn();
      const unscheduledCheckIn = {
        name: 'Multi-Treatment Patient',
        types: ['assessment', 'physiotherapy'],
        isNew: false,
        priority: '1' as Priority
      };

      renderHook(() => 
        useExternalCheckIn({
          unscheduledCheckIn,
          onCheckInProcessed: mockOnCheckInProcessed
        })
      );

      expect(mockOnCheckInProcessed).toHaveBeenCalledTimes(1);
    });

    it('should handle check-in without priority gracefully', () => {
      const mockOnCheckInProcessed = jest.fn();
      const unscheduledCheckIn = {
        name: 'Default Priority Patient',
        types: ['tens'],
        isNew: true
        // No priority specified
      };

      renderHook(() => 
        useExternalCheckIn({ 
          unscheduledCheckIn,
          onCheckInProcessed: mockOnCheckInProcessed 
        })
      );

      expect(mockOnCheckInProcessed).toHaveBeenCalledTimes(1);
    });

    it('should not call callback when no unscheduledCheckIn provided', () => {
      const mockOnCheckInProcessed = jest.fn();

      renderHook(() => 
        useExternalCheckIn({ 
          onCheckInProcessed: mockOnCheckInProcessed 
        })
      );

      expect(mockOnCheckInProcessed).not.toHaveBeenCalled();
    });
  });

  describe('State management and callbacks', () => {
    it('should reset checkInProcessed when unscheduledCheckIn changes to null', () => {
      const mockOnCheckInProcessed = jest.fn();
      const initialCheckIn: NonNullable<UnscheduledCheckIn> = {
        name: 'Patient 1',
        types: ['assessment'],
        isNew: true,
        priority: '2' as Priority
      };

      const { result, rerender } = renderHook<
        { checkInProcessed: boolean },
        { unscheduledCheckIn?: UnscheduledCheckIn }
      >(
        ({ unscheduledCheckIn }) => useExternalCheckIn({
          unscheduledCheckIn,
          onCheckInProcessed: mockOnCheckInProcessed
        }),
        { initialProps: { unscheduledCheckIn: initialCheckIn } }
      );

      expect(result.current.checkInProcessed).toBe(true);
      expect(mockOnCheckInProcessed).toHaveBeenCalledTimes(1);

      // Change to undefined
      rerender({ unscheduledCheckIn: undefined });

      expect(result.current.checkInProcessed).toBe(false);
      // Should not call onCheckInProcessed again for null
      expect(mockOnCheckInProcessed).toHaveBeenCalledTimes(1);
    });

    it('should not call callback when unscheduledCheckIn is undefined', () => {
      const mockOnCheckInProcessed = jest.fn();
      
      renderHook(() => 
        useExternalCheckIn({
          unscheduledCheckIn: undefined,
          onCheckInProcessed: mockOnCheckInProcessed
        })
      );

      expect(mockOnCheckInProcessed).not.toHaveBeenCalled();
    });

    it('should work when onCheckInProcessed callback is not provided', () => {
      const unscheduledCheckIn = {
        name: 'No Callback Patient',
        types: ['assessment'],
        isNew: true
      };

      const { result } = renderHook(() => 
        useExternalCheckIn({ unscheduledCheckIn })
      );

      expect(result.current.checkInProcessed).toBe(true);
      // No error should be thrown when callback is not provided
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null unscheduledCheckIn gracefully', () => {
      const mockOnCheckInProcessed = jest.fn();
      
      const { result } = renderHook(() => 
        useExternalCheckIn({
          unscheduledCheckIn: null,
          onCheckInProcessed: mockOnCheckInProcessed
        })
      );

      expect(result.current.checkInProcessed).toBe(false);
      expect(mockOnCheckInProcessed).not.toHaveBeenCalled();
    });

    it('should handle undefined unscheduledCheckIn gracefully', () => {
      const mockOnCheckInProcessed = jest.fn();
      
      const { result } = renderHook(() => 
        useExternalCheckIn({
          unscheduledCheckIn: undefined,
          onCheckInProcessed: mockOnCheckInProcessed
        })
      );

      expect(result.current.checkInProcessed).toBe(false);
      expect(mockOnCheckInProcessed).not.toHaveBeenCalled();
    });

    it('should call callback even with empty types array', () => {
      const mockOnCheckInProcessed = jest.fn();
      const unscheduledCheckIn = {
        name: 'Empty Types Patient',
        types: [], // Empty array
        isNew: true
      };

      const { result } = renderHook(() => 
        useExternalCheckIn({
          unscheduledCheckIn,
          onCheckInProcessed: mockOnCheckInProcessed
        })
      );

      expect(result.current.checkInProcessed).toBe(true);
      expect(mockOnCheckInProcessed).toHaveBeenCalledTimes(1);
    });

    it('should call callback even with non-array types', () => {
      const mockOnCheckInProcessed = jest.fn();
      const unscheduledCheckIn = {
        name: 'Invalid Types Patient',
        types: 'assessment' as unknown as string[], // Not an array
        isNew: true
      };

      const { result } = renderHook(() => 
        useExternalCheckIn({
          unscheduledCheckIn,
          onCheckInProcessed: mockOnCheckInProcessed
        })
      );

      expect(result.current.checkInProcessed).toBe(true);
      expect(mockOnCheckInProcessed).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid attendance type gracefully', () => {
      const mockOnCheckInProcessed = jest.fn();
      const unscheduledCheckIn = {
        name: 'Invalid Type Patient',
        types: ['invalidType'],
        isNew: true
      };

      const { result } = renderHook(() => 
        useExternalCheckIn({
          unscheduledCheckIn,
          onCheckInProcessed: mockOnCheckInProcessed
        })
      );

      expect(result.current.checkInProcessed).toBe(true);
      expect(mockOnCheckInProcessed).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle rapid successive check-ins', () => {
      const mockOnCheckInProcessed = jest.fn();
      
      const checkIn1 = {
        name: 'Rapid Patient 1',
        types: ['assessment'],
        isNew: true
      };

      const checkIn2 = {
        name: 'Rapid Patient 2',
        types: ['physiotherapy'],
        isNew: true
      };

      const { result, rerender } = renderHook(
        ({ unscheduledCheckIn }) => useExternalCheckIn({
          unscheduledCheckIn,
          onCheckInProcessed: mockOnCheckInProcessed
        }),
        { initialProps: { unscheduledCheckIn: checkIn1 } }
      );

      expect(result.current.checkInProcessed).toBe(true);
      expect(mockOnCheckInProcessed).toHaveBeenCalledTimes(1);

      // Rapidly change to second check-in
      rerender({ unscheduledCheckIn: checkIn2 });

      expect(result.current.checkInProcessed).toBe(true);
      // Should be called twice, once for each check-in
      expect(mockOnCheckInProcessed).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple types in single check-in', () => {
      const mockOnCheckInProcessed = jest.fn();
      const unscheduledCheckIn = {
        name: 'Complex Patient',
        types: ['assessment', 'physiotherapy', 'tens'],
        isNew: false,
        priority: '1' as Priority
      };

      renderHook(() => 
        useExternalCheckIn({ 
          unscheduledCheckIn,
          onCheckInProcessed: mockOnCheckInProcessed
        })
      );

      expect(mockOnCheckInProcessed).toHaveBeenCalledTimes(1);
    });

    it('should prevent duplicate processing of same check-in', () => {
      const mockOnCheckInProcessed = jest.fn();
      const unscheduledCheckIn = {
        name: 'Duplicate Prevention Patient',
        types: ['assessment'],
        isNew: true
      };

      const { rerender } = renderHook<
        { checkInProcessed: boolean },
        { unscheduledCheckIn?: UnscheduledCheckIn }
      >(
        ({ unscheduledCheckIn }) => useExternalCheckIn({
          unscheduledCheckIn,
          onCheckInProcessed: mockOnCheckInProcessed
        }),
        { initialProps: { unscheduledCheckIn } }
      );

      // First render should process
      expect(mockOnCheckInProcessed).toHaveBeenCalledTimes(1);

      // Rerender with same check-in - should not process again
      rerender({ unscheduledCheckIn });

      // Should still be 1, not 2
      expect(mockOnCheckInProcessed).toHaveBeenCalledTimes(1);
    });
  });
});
