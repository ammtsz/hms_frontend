/** Shared layout classes for patient detail collapsible cards. */
export function detailCardHeaderClass(isCollapsed: boolean): string {
  return `flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
    isCollapsed ? "" : "mb-4"
  }`;
}

/**
 * Full-width header hover/focus shell — negates CardBody padding (p-4 sm:p-6).
 * min-h-11 keeps hover/focus area at touch-target height even when the title is one line.
 */
export const DETAIL_CARD_HEADER_SHELL =
  "-mx-4 min-h-11 rounded-lg px-4 py-1 transition-colors hover:bg-gray-50 sm:-mx-6 sm:px-6";

export const DETAIL_CARD_HEADER_ACTIONS =
  "flex shrink-0 items-center gap-2 self-end sm:self-auto";

export const DETAIL_CARD_HEADER_TITLE =
  "flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-lg font-semibold text-gray-900";

/** Title + chevron toggle (hover/focus on DETAIL_CARD_HEADER_SHELL). */
export const DETAIL_CARD_TOGGLE_BUTTON =
  "flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 self-stretch text-left outline-none";
