import { useCallback, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  useSelectedDate,
  useAppointmentLoading,
  useSetSelectedDate,
  useSetAppointmentLoading,
} from '@/stores';
import { useDateHelpers } from '@/hooks/useDateHelpers';
import { isValidDateString } from '@/utils/timezoneDate';

const DATE_PARAM = 'date';
const BOARD_PATH = '/board';

export interface UseAppointmentDateStateReturn {
  selectedDate: string;
  loading: boolean;
  setSelectedDate: (date: string) => void;
  initializeSelectedDate: () => Promise<void>;
}

export function useBoardDateState(): UseAppointmentDateStateReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedDate = useSelectedDate();
  const loading = useAppointmentLoading();
  const setSelectedDate = useSetSelectedDate();
  const setLoading = useSetAppointmentLoading();

  const { getTodayDate } = useDateHelpers();
  const todayDate = getTodayDate();

  const hasCompletedInitialUrlSync = useRef(false);

  useEffect(() => {
    const urlDate = searchParams.get(DATE_PARAM);
    if (urlDate && isValidDateString(urlDate) && urlDate !== selectedDate) {
      setSelectedDate(urlDate);
    }
    // selectedDate intentionally omitted: only react to URL/searchParams changes here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setSelectedDate]);

  useEffect(() => {
    if (pathname !== BOARD_PATH) return;

    if (!hasCompletedInitialUrlSync.current) {
      const urlDate = searchParams.get(DATE_PARAM);
      if (urlDate && isValidDateString(urlDate) && urlDate !== selectedDate) {
        return;
      }
      hasCompletedInitialUrlSync.current = true;
    }

    const newUrl = `${BOARD_PATH}?${DATE_PARAM}=${selectedDate}`;
    const currentSearch = searchParams.toString();
    const currentPath = pathname + (currentSearch ? `?${currentSearch}` : '');
    if (newUrl !== currentPath) {
      router.replace(newUrl, { scroll: false });
    }
  }, [pathname, selectedDate, router, searchParams]);

  const initializeSelectedDate = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);

      if (todayDate) {
        setSelectedDate(todayDate);
      } else {
        const currentDate = getTodayDate();
        setSelectedDate(currentDate);
      }
    } catch (err) {
      console.error('Error initializing selected date:', err);
      const currentDate = getTodayDate();
      setSelectedDate(currentDate);
    } finally {
      setLoading(false);
    }
  }, [getTodayDate, todayDate, setSelectedDate, setLoading]);

  return {
    selectedDate,
    loading,
    setSelectedDate,
    initializeSelectedDate,
  };
}
