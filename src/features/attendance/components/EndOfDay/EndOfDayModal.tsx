import React, { Suspense } from "react";
import { useEndOfDayModal } from "@/stores/modalStore";
import LoadingFallback from "@/components/common/LoadingFallback";

// Lazy load the actual EndOfDayModal component
const EndOfDayContainer = React.lazy(() => import("./EndOfDayContainer"));

/**
 * End of Day Modal - Combines store logic and lazy loading
 * Uses existing EndOfDayContainer component with Zustand store integration
 */
export const EndOfDayModal: React.FC = () => {
  const endOfDay = useEndOfDayModal();

  // Don't render if modal is not open
  if (!endOfDay.isOpen) {
    return null;
  }

  return (
    <Suspense
      fallback={
        <LoadingFallback message="Loading day finalization..." size="small" />
      }
    >
      <EndOfDayContainer />
    </Suspense>
  );
};

export default EndOfDayModal;
