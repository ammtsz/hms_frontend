import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { isValidDateString } from '@/utils/timezoneDate';

const DEFAULT_DEBOUNCE_MS = 350;

export interface UseCommittedDateInputOptions {
  /** Committed value from parent state */
  value: string;
  /** Called only when the user confirms a complete valid date */
  onCommit: (date: string) => void;
  /** Debounce for native picker commits (Chromium month navigation) */
  debounceMs?: number;
}

export interface UseCommittedDateInputReturn {
  draftValue: string;
  inputRef: RefObject<HTMLInputElement | null>;
  /** Bypass draft/blur logic — for chevrons, "Hoje", etc. */
  commitImmediately: (date: string) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  handleBlur: () => void;
  handleMouseDown: () => void;
  handleDraftChange: (nextValue: string) => void;
}

/**
 * Controlled date input that commits only on user confirmation.
 *
 * - Typing: draft updates per keystroke; commit on blur or Enter when valid.
 * - Native picker: commit on native `change` (day selected), debounced for Chromium.
 * - Partial/invalid values never reach onCommit.
 */
export function useCommittedDateInput({
  value,
  onCommit,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: UseCommittedDateInputOptions): UseCommittedDateInputReturn {
  const [draftValue, setDraftValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const isKeyboardEditRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCommitRef = useRef(onCommit);
  const committedValueRef = useRef(value);

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    setDraftValue(value);
    committedValueRef.current = value;
  }, [value]);

  const clearDebounce = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const tryCommit = useCallback((date: string) => {
    if (!isValidDateString(date)) return;
    if (date === committedValueRef.current) return;
    committedValueRef.current = date;
    onCommitRef.current(date);
  }, []);

  const schedulePickerCommit = useCallback(
    (date: string) => {
      clearDebounce();
      debounceTimerRef.current = setTimeout(() => {
        if (!isKeyboardEditRef.current) {
          tryCommit(date);
        }
      }, debounceMs);
    },
    [clearDebounce, debounceMs, tryCommit],
  );

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const handleNativeChange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      setDraftValue(target.value);
      if (isKeyboardEditRef.current) return;
      schedulePickerCommit(target.value);
    };

    input.addEventListener('change', handleNativeChange);

    return () => {
      input.removeEventListener('change', handleNativeChange);
      clearDebounce();
    };
  }, [clearDebounce, schedulePickerCommit]);

  const handleDraftChange = useCallback((nextValue: string) => {
    setDraftValue(nextValue);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Tab' || event.key === 'Escape') return;

      isKeyboardEditRef.current = true;
      clearDebounce();

      if (event.key === 'Enter') {
        event.preventDefault();
        tryCommit(event.currentTarget.value);
        event.currentTarget.blur();
      }
    },
    [clearDebounce, tryCommit],
  );

  const handleBlur = useCallback(() => {
    const input = inputRef.current;
    if (isKeyboardEditRef.current && input) {
      const current = input.value;
      if (isValidDateString(current)) {
        tryCommit(current);
      } else {
        setDraftValue(committedValueRef.current);
      }
    }
    isKeyboardEditRef.current = false;
  }, [tryCommit]);

  const handleMouseDown = useCallback(() => {
    isKeyboardEditRef.current = false;
  }, []);

  const commitImmediately = useCallback(
    (date: string) => {
      clearDebounce();
      isKeyboardEditRef.current = false;
      if (!isValidDateString(date)) return;
      setDraftValue(date);
      tryCommit(date);
    },
    [clearDebounce, tryCommit],
  );

  return {
    draftValue,
    inputRef,
    commitImmediately,
    handleKeyDown,
    handleBlur,
    handleMouseDown,
    handleDraftChange,
  };
}
