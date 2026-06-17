import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../usePagination';

describe('usePagination', () => {
  const mockItems = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));

  describe('Basic Functionality', () => {
    test('should initialize with default page size', () => {
      const { result } = renderHook(() => 
        usePagination({ items: mockItems })
      );

      expect(result.current.visibleItems).toHaveLength(3); // Default initialPageSize
      expect(result.current.totalItems).toBe(25);
      expect(result.current.visibleCount).toBe(3);
      expect(result.current.hasMoreItems).toBe(true);
    });

    test('should initialize with custom page size', () => {
      const { result } = renderHook(() => 
        usePagination({ items: mockItems, initialPageSize: 5 })
      );

      expect(result.current.visibleItems).toHaveLength(5);
      expect(result.current.visibleCount).toBe(5);
      expect(result.current.hasMoreItems).toBe(true);
    });

    test('should handle empty items array', () => {
      const { result } = renderHook(() => 
        usePagination({ items: [] })
      );

      expect(result.current.visibleItems).toHaveLength(0);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.visibleCount).toBe(0);
      expect(result.current.hasMoreItems).toBe(false);
    });

    test('should handle items array smaller than initial page size', () => {
      const smallItems = [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }];
      
      const { result } = renderHook(() => 
        usePagination({ items: smallItems, initialPageSize: 5 })
      );

      expect(result.current.visibleItems).toHaveLength(2);
      expect(result.current.hasMoreItems).toBe(false);
    });
  });

  describe('Show More Functionality', () => {
    test('should show more items when showMore is called', () => {
      const { result } = renderHook(() => 
        usePagination({ items: mockItems, initialPageSize: 3, incrementSize: 5 })
      );

      expect(result.current.visibleItems).toHaveLength(3);

      act(() => {
        result.current.showMore();
      });

      expect(result.current.visibleItems).toHaveLength(8); // 3 + 5
      expect(result.current.visibleCount).toBe(8);
    });

    test('should use default increment size when not provided', () => {
      const { result } = renderHook(() => 
        usePagination({ items: mockItems, initialPageSize: 3 })
      );

      expect(result.current.visibleItems).toHaveLength(3);

      act(() => {
        result.current.showMore();
      });

      expect(result.current.visibleItems).toHaveLength(13); // 3 + 10 (default incrementSize)
    });

    test('should not exceed total items count', () => {
      const smallItems = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));
      
      const { result } = renderHook(() => 
        usePagination({ items: smallItems, initialPageSize: 3, incrementSize: 10 })
      );

      expect(result.current.visibleItems).toHaveLength(3);

      act(() => {
        result.current.showMore();
      });

      expect(result.current.visibleItems).toHaveLength(8); // Should not exceed total items
      expect(result.current.hasMoreItems).toBe(false);
    });

    test('should update hasMoreItems correctly', () => {
      const { result } = renderHook(() => 
        usePagination({ items: mockItems, initialPageSize: 20, incrementSize: 5 })
      );

      expect(result.current.visibleItems).toHaveLength(20);
      expect(result.current.hasMoreItems).toBe(true);

      act(() => {
        result.current.showMore();
      });

      expect(result.current.visibleItems).toHaveLength(25);
      expect(result.current.hasMoreItems).toBe(false);
    });

    test('should handle multiple showMore calls', () => {
      const { result } = renderHook(() => 
        usePagination({ items: mockItems, initialPageSize: 3, incrementSize: 5 })
      );

      expect(result.current.visibleItems).toHaveLength(3);

      act(() => {
        result.current.showMore();
      });

      expect(result.current.visibleItems).toHaveLength(8);

      act(() => {
        result.current.showMore();
      });

      expect(result.current.visibleItems).toHaveLength(13);

      act(() => {
        result.current.showMore();
      });

      expect(result.current.visibleItems).toHaveLength(18);
    });
  });

  describe('Reset Functionality', () => {
    test('should reset to initial page size', () => {
      const { result } = renderHook(() => 
        usePagination({ items: mockItems, initialPageSize: 5, incrementSize: 10 })
      );

      // Show more items first
      act(() => {
        result.current.showMore();
      });

      expect(result.current.visibleItems).toHaveLength(15);

      // Reset to initial size
      act(() => {
        result.current.reset();
      });

      expect(result.current.visibleItems).toHaveLength(5);
      expect(result.current.hasMoreItems).toBe(true);
    });

    test('should reset after multiple showMore calls', () => {
      const { result } = renderHook(() => 
        usePagination({ items: mockItems, initialPageSize: 2, incrementSize: 3 })
      );

      // Multiple showMore calls
      act(() => {
        result.current.showMore();
        result.current.showMore();
        result.current.showMore();
      });

      expect(result.current.visibleItems).toHaveLength(11); // 2 + 3 + 3 + 3

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.visibleItems).toHaveLength(2);
      expect(result.current.visibleCount).toBe(2);
    });
  });

  describe('Items Update Scenarios', () => {
    test('should handle items array changes', () => {
      let items = mockItems.slice(0, 10);
      
      const { result, rerender } = renderHook(
        ({ items }) => usePagination({ items, initialPageSize: 5 }),
        { initialProps: { items } }
      );

      expect(result.current.visibleItems).toHaveLength(5);
      expect(result.current.totalItems).toBe(10);

      // Update items array
      items = mockItems.slice(0, 15);
      rerender({ items });

      expect(result.current.totalItems).toBe(15);
      expect(result.current.visibleItems).toHaveLength(5); // Page size should remain the same
    });

    test('should update visible items when current page exceeds new items length', () => {
      let items = mockItems;
      
      const { result, rerender } = renderHook(
        ({ items }) => usePagination({ items, initialPageSize: 5 }),
        { initialProps: { items } }
      );

      // Show more items
      act(() => {
        result.current.showMore();
        result.current.showMore();
      });

      expect(result.current.visibleItems).toHaveLength(25); // All items

      // Reduce items array
      items = mockItems.slice(0, 10);
      rerender({ items });

      expect(result.current.visibleItems).toHaveLength(10);
      expect(result.current.totalItems).toBe(10);
      expect(result.current.hasMoreItems).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero initial page size', () => {
      const { result } = renderHook(() => 
        usePagination({ items: mockItems, initialPageSize: 0 })
      );

      expect(result.current.visibleItems).toHaveLength(0);
      expect(result.current.hasMoreItems).toBe(true);

      act(() => {
        result.current.showMore();
      });

      expect(result.current.visibleItems).toHaveLength(10); // 0 + 10 (default increment)
    });

    test('should handle zero increment size', () => {
      const { result } = renderHook(() => 
        usePagination({ items: mockItems, initialPageSize: 5, incrementSize: 0 })
      );

      expect(result.current.visibleItems).toHaveLength(5);

      act(() => {
        result.current.showMore();
      });

      expect(result.current.visibleItems).toHaveLength(5); // Should remain the same
    });

    test('should return correct visible items content', () => {
      const { result } = renderHook(() => 
        usePagination({ items: mockItems, initialPageSize: 3 })
      );

      expect(result.current.visibleItems).toEqual([
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ]);

      act(() => {
        result.current.showMore();
      });

      expect(result.current.visibleItems).toHaveLength(13);
      expect(result.current.visibleItems[0]).toEqual({ id: 1, name: 'Item 1' });
      expect(result.current.visibleItems[12]).toEqual({ id: 13, name: 'Item 13' });
    });

    test('should work with different item types', () => {
      const stringItems = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
      
      const { result } = renderHook(() => 
        usePagination({ items: stringItems, initialPageSize: 2 })
      );

      expect(result.current.visibleItems).toEqual(['apple', 'banana']);
      expect(result.current.totalItems).toBe(5);
      expect(result.current.hasMoreItems).toBe(true);

      act(() => {
        result.current.showMore();
      });

      expect(result.current.visibleItems).toEqual(['apple', 'banana', 'cherry', 'date', 'elderberry']);
      expect(result.current.hasMoreItems).toBe(false);
    });
  });

  describe('Function Exports', () => {
    test('should expose all required functions and properties', () => {
      const { result } = renderHook(() => 
        usePagination({ items: mockItems })
      );

      expect(result.current).toHaveProperty('visibleItems');
      expect(result.current).toHaveProperty('hasMoreItems');
      expect(result.current).toHaveProperty('showMore');
      expect(result.current).toHaveProperty('reset');
      expect(result.current).toHaveProperty('totalItems');
      expect(result.current).toHaveProperty('visibleCount');

      expect(typeof result.current.showMore).toBe('function');
      expect(typeof result.current.reset).toBe('function');
      expect(typeof result.current.hasMoreItems).toBe('boolean');
      expect(typeof result.current.totalItems).toBe('number');
      expect(typeof result.current.visibleCount).toBe('number');
      expect(Array.isArray(result.current.visibleItems)).toBe(true);
    });
  });
});