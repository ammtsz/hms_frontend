"use client";

import React, { useCallback, useState } from "react";
import {
  User,
  StickyNote,
  Activity,
  ClipboardList,
  History,
  CalendarDays,
  PanelRightOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PATIENT_PAGE_SECTIONS } from "./patientPageSectionConfig";
import type { PatientPageSectionId } from "./patientPageSectionConfig";
import { cn } from "@/utils/cn";
import { useActivePatientSection } from "./hooks/useActivePatientSection";
import { usePatientPageScrollTarget } from "./PatientPageScrollTargetContext";
import { Button, IconButton } from "@/components/ui";
import type { ButtonAlign } from "@/components/ui";

const ICON_MAP: Record<
  (typeof PATIENT_PAGE_SECTIONS)[number]["iconName"],
  LucideIcon
> = {
  User,
  StickyNote,
  Activity,
  ClipboardList,
  History,
  CalendarDays,
};

/** Delay (ms) before scrolling so collapsible sections can expand first. */
export const SCROLL_AFTER_EXPAND_DELAY_MS = 150;

function scrollToSection(sectionId: PatientPageSectionId) {
  const el = document.getElementById(sectionId);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

type SectionIconName = (typeof PATIENT_PAGE_SECTIONS)[number]["iconName"];

interface SectionNavButtonProps {
  label: string;
  iconName: SectionIconName;
  isActive: boolean;
  align: ButtonAlign;
  labelVisible: boolean;
  onClick: () => void;
  className?: string;
  title?: string;
}

function SectionNavButton({
  label,
  iconName,
  isActive,
  align,
  labelVisible,
  onClick,
  className,
  title,
}: SectionNavButtonProps) {
  const Icon = ICON_MAP[iconName];
  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      size="sm"
      align={align}
      fullWidth
      onClick={onClick}
      className={cn("h-10 font-normal", className)}
      aria-current={isActive ? "true" : undefined}
      title={title}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      <span className={cn("truncate", labelVisible ? "min-w-0" : "sr-only")}>
        {label}
      </span>
    </Button>
  );
}

export function PatientPageSectionNav() {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpenSmall, setIsOpenSmall] = useState(false);
  const activeId = useActivePatientSection();
  const { setScrollTargetSectionId } = usePatientPageScrollTarget();

  const handleItemClick = useCallback(
    (id: PatientPageSectionId) => {
      setScrollTargetSectionId(id);
      setIsOpenSmall(false);
      setTimeout(() => scrollToSection(id), SCROLL_AFTER_EXPAND_DELAY_MS);
    },
    [setScrollTargetSectionId],
  );

  const isExpanded = isHovered;

  return (
    <>
      {/* Desktop: always visible bar (icons; expand on hover) */}
      <nav
        aria-label="Navegação por seções da página do paciente"
        className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={cn(
            "flex flex-col gap-1 rounded-l-lg border border-r-0 border-gray-200 bg-white py-2 shadow-md",
            "transition-[width] duration-200 ease-out",
            isExpanded ? "w-44 pl-2 pr-2" : "w-14 px-2",
          )}
        >
          {PATIENT_PAGE_SECTIONS.map(({ id, label, iconName }) => (
            <SectionNavButton
              key={id}
              label={label}
              iconName={iconName}
              isActive={activeId === id}
              align={isExpanded ? "start" : "center"}
              labelVisible={isExpanded}
              onClick={() => handleItemClick(id)}
              className="px-2"
              title={isExpanded ? undefined : label}
            />
          ))}
        </div>
      </nav>

      {/* Small/tablet: FAB + menu opening upward (FAB sits near bottom edge) */}
      <div className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] right-4 z-40 lg:hidden">
        {isOpenSmall ? (
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setIsOpenSmall(false)}
          />
        ) : null}
        {isOpenSmall ? (
          <div
            className="absolute bottom-full right-0 z-50 mb-2 flex max-h-[min(70dvh,22rem)] w-48 flex-col gap-0.5 overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white py-2 shadow-lg"
            role="dialog"
            aria-label="Seções da página"
            data-testid="patient-section-nav-mobile-menu"
          >
            {PATIENT_PAGE_SECTIONS.map(({ id, label, iconName }) => (
              <SectionNavButton
                key={id}
                label={label}
                iconName={iconName}
                isActive={activeId === id}
                align="start"
                labelVisible
                onClick={() => handleItemClick(id)}
                className="shrink-0 px-3 py-2.5"
              />
            ))}
          </div>
        ) : null}
        <IconButton
          onClick={() => setIsOpenSmall((prev) => !prev)}
          className="relative z-50 h-12 w-12 rounded-full border border-gray-200 bg-white shadow-md hover:bg-gray-50"
          aria-label={
            isOpenSmall ? "Fechar menu de seções" : "Abrir menu de seções"
          }
          aria-expanded={isOpenSmall}
        >
          <PanelRightOpen className="h-6 w-6 text-gray-600" aria-hidden />
        </IconButton>
      </div>
    </>
  );
}
