import { useState, useMemo } from 'react';

interface UsePaginationProps<T> {
  items: T[];
  initialPageSize?: number;
  incrementSize?: number;
}

interface UsePaginationReturn<T> {
  visibleItems: T[];
  hasMoreItems: boolean;
  showMore: () => void;
  reset: () => void;
  totalItems: number;
  visibleCount: number;
}

/**
 * Custom hook for implementing pagination with "Show More" functionality
 * @param items - Array of items to paginate
 * @param initialPageSize - Number of items to show initially (default: 3)
 * @param incrementSize - Number of additional items to show when "Show More" is clicked (default: 10)
 */
export function usePagination<T>({
  items,
  initialPageSize = 3,
  incrementSize = 10,
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPageSize, setCurrentPageSize] = useState(initialPageSize);

  const visibleItems = useMemo(() => {
    return items.slice(0, currentPageSize);
  }, [items, currentPageSize]);

  const hasMoreItems = items.length > currentPageSize;

  const showMore = () => {
    setCurrentPageSize((prev) => Math.min(prev + incrementSize, items.length));
  };

  const reset = () => {
    setCurrentPageSize(initialPageSize);
  };

  return {
    visibleItems,
    hasMoreItems,
    showMore,
    reset,
    totalItems: items.length,
    visibleCount: visibleItems.length,
  };
}