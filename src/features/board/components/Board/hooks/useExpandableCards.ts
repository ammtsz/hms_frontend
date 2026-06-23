import { useState, useCallback } from 'react';
import { AppointmentProgression } from '@/types/types';

/**
 * useExpandableCards - Manages expansion state for treatment cards
 * 
 * Features:
 * - Track which card is expanded per column (scheduled/checkedIn/onGoing/completed)
 * - Only one card can be expanded per column at a time
 * - Toggle expansion on/off
 * - Auto-collapse when expanding a different card
 */
export const useExpandableCards = () => {
  // Track expanded card ID for each column/status
  const [expandedCards, setExpandedCards] = useState<{
    scheduled: number | null;
    checkedIn: number | null;
    onGoing: number | null;
    completed: number | null;
  }>({
    scheduled: null,
    checkedIn: null,
    onGoing: null,
    completed: null,
  });

  /**
   * Toggle expansion for a specific card in a column
   * If another card in the same column is expanded, it will be collapsed
   */
  const toggleExpansion = useCallback(
    (status: AppointmentProgression, patientId: number) => {
      setExpandedCards((prev) => {
        const currentExpanded = prev[status];
        
        // If clicking the same card, collapse it
        if (currentExpanded === patientId) {
          return {
            ...prev,
            [status]: null,
          };
        }
        
        // Otherwise, expand this card and collapse any other in the column
        return {
          ...prev,
          [status]: patientId,
        };
      });
    },
    []
  );

  /**
   * Check if a specific card is expanded
   */
  const isExpanded = useCallback(
    (status: AppointmentProgression, patientId: number): boolean => {
      return expandedCards[status] === patientId;
    },
    [expandedCards]
  );

  /**
   * Collapse all cards in all columns
   */
  const collapseAll = useCallback(() => {
    setExpandedCards({
      scheduled: null,
      checkedIn: null,
      onGoing: null,
      completed: null,
    });
  }, []);

  return {
    toggleExpansion,
    isExpanded,
    collapseAll,
  };
};
