import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  DETAIL_CARD_HEADER_ACTIONS,
  DETAIL_CARD_HEADER_SHELL,
  DETAIL_CARD_HEADER_TITLE,
  DETAIL_CARD_TOGGLE_BUTTON,
  detailCardHeaderClass,
} from "@/features/patients/detail/shared/detailCardLayout";

export interface DetailCardCollapsibleHeaderProps {
  isCollapsed: boolean;
  onToggle: () => void;
  title: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Collapsible section header for patient detail cards.
 * The title row (including chevron) toggles expand/collapse; optional actions stay separate.
 */
export const DetailCardCollapsibleHeader: React.FC<
  DetailCardCollapsibleHeaderProps
> = ({ isCollapsed, onToggle, title, actions }) => {
  const toggleLabel = isCollapsed ? "Expandir" : "Recolher";

  return (
    <div
      className={`${detailCardHeaderClass(isCollapsed)} ${DETAIL_CARD_HEADER_SHELL}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!isCollapsed}
        title={toggleLabel}
        className={DETAIL_CARD_TOGGLE_BUTTON}
      >
        <h2 className={DETAIL_CARD_HEADER_TITLE}>
          {title}
          <span className="sr-only">, {toggleLabel}</span>
        </h2>
        <span className="shrink-0" aria-hidden>
          {isCollapsed ? (
            <ChevronDown size={20} className="text-gray-600" />
          ) : (
            <ChevronUp size={20} className="text-gray-600" />
          )}
        </span>
      </button>
      {actions ? (
        <div className={DETAIL_CARD_HEADER_ACTIONS}>{actions}</div>
      ) : null}
    </div>
  );
};
