import { useEffect, useState } from "react";
import type { PatientPageSectionId } from "../patientPageSectionConfig";
import { PATIENT_PAGE_SECTIONS } from "../patientPageSectionConfig";

const SECTION_IDS = PATIENT_PAGE_SECTIONS.map((s) => s.id);

/**
 * Returns the id of the section currently most visible in the viewport.
 * Uses Intersection Observer with threshold and rootMargin to pick the "active" section.
 */
export function useActivePatientSection(): PatientPageSectionId | null {
  const [activeId, setActiveId] = useState<PatientPageSectionId | null>(null);

  useEffect(() => {
    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el != null,
    );

    if (elements.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;

        // Prefer the entry with highest intersection ratio, then the one that appears first in the list
        const byRatio = [...visible].sort(
          (a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0),
        );
        const top = byRatio[0];
        if (top?.target.id && SECTION_IDS.includes(top.target.id as PatientPageSectionId)) {
          setActiveId(top.target.id as PatientPageSectionId);
        }
      },
      {
        root: null,
        rootMargin: "-20% 0px -60% 0px", // consider "active" when section is in upper portion of viewport
        threshold: [0, 0.1, 0.5, 1],
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return activeId;
}
