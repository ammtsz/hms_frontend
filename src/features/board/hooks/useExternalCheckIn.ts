import { useEffect, useRef, useState } from "react";
import type { Priority } from "@/types/types";

interface ExternalCheckIn {
  name: string;
  types: string[];
  isNew: boolean;
  priority?: Priority;
}

interface UseExternalCheckInProps {
  unscheduledCheckIn?: ExternalCheckIn | null;
  onCheckInProcessed?: () => void;
}

export const useExternalCheckIn = ({
  unscheduledCheckIn,
  onCheckInProcessed,
}: UseExternalCheckInProps = {}) => {
  // Track processed state
  const [checkInProcessed, setCheckInProcessed] = useState(false);
  const processedCheckInRef = useRef<string | null>(null);

  // Process the check-in only once per unique request
  useEffect(() => {
    if (!unscheduledCheckIn) {
      processedCheckInRef.current = null;
      setCheckInProcessed(false);
      return;
    }

    // Create a unique key for this check-in request
    // Use JSON.stringify to handle edge cases where types might not be an array
    const typesKey = Array.isArray(unscheduledCheckIn.types) 
      ? unscheduledCheckIn.types.join(',') 
      : String(unscheduledCheckIn.types);
    const checkInKey = `${unscheduledCheckIn.name}-${typesKey}-${unscheduledCheckIn.isNew}`;
    
    // Skip if we've already processed this exact check-in
    if (processedCheckInRef.current === checkInKey) {
      return;
    }

    // Mark as processed immediately to prevent duplicate processing
    processedCheckInRef.current = checkInKey;
    setCheckInProcessed(true);

    // Call the callback to indicate processing is complete
    // The parent component should handle the actual check-in logic
    if (onCheckInProcessed) {
      onCheckInProcessed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unscheduledCheckIn]); // onCheckInProcessed intentionally omitted - stable callback from parent

  return {
    checkInProcessed,
  };
};

export default useExternalCheckIn;
