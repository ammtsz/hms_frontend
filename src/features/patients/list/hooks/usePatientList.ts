import { useState, useEffect, useRef } from "react";
import { PatientBasic } from "@/types/types";
import { usePatients } from "@/api/query/hooks/usePatientQueries";
import { usePriorities } from "@/api/query/hooks/usePriorityOptionsQueries";

export function usePatientList() {
  const {
    data: patients = [],
    isLoading: loading,
    error: queryError,
    refetch: refreshPatients
  } = usePatients();

  const { data: prioritiesData } = usePriorities();
  const [hasNoPatients, setHasNoPatients] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<keyof PatientBasic | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20);
  const loaderRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    if (patients.length > 0) {
      setHasNoPatients(false);
    }
  }, [patients]);

  // Convert React Query error to string for compatibility
  const error = queryError ? (queryError as Error).message : null;

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSort = (key: keyof PatientBasic) => {
    if (sortBy === key) {
      setSortAsc((asc) => !asc);
    } else {
      setSortBy(key);
      setSortAsc(true);
    }
  };

  const sorted = [...filtered].sort((a, b) => {
    if (!sortBy) return 0;
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    if (aValue === bValue) return 0;
    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortAsc ? aValue - bValue : bValue - aValue;
    }
    const localeOpts = { numeric: true };
    return sortAsc
      ? String(aValue).localeCompare(String(bValue), undefined, localeOpts)
      : String(bValue).localeCompare(String(aValue), undefined, localeOpts);
  });

  const paginated = sorted.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(20); // Reset on search
  }, [search]);

  useEffect(() => {
    const handleScroll = () => {
      if (!loaderRef.current) return;
      const rect = loaderRef.current.getBoundingClientRect();
      if (rect.top < window.innerHeight && visibleCount < sorted.length) {
        setVisibleCount((prev) => Math.min(prev + 20, sorted.length));
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [visibleCount, sorted.length]);

  // Legend maps
  const statusLegend: Record<string, string> = {
    N: "Novo Paciente",
    T: "Em Tratamento",
    A: "Alta do tratamento",
    F: "Faltas Consecutivas",
  };

  const priorityLegend: Record<string, string> = Object.fromEntries(
    (prioritiesData ?? [])
      .filter((p) => p.isActive)
      .map((p) => [p.value, p.label || p.value]),
  );

  return {
    patients,
    search,
    setSearch,
    sortBy,
    setSortBy,
    sortAsc,
    setSortAsc,
    visibleCount,
    setVisibleCount,
    loaderRef,
    filtered,
    hasNoPatients,
    handleSort,
    sorted,
    paginated,
    statusLegend,
    priorityLegend,
    loading,
    error,
    refreshPatients,
  };
}
