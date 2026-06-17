import React from "react";

export interface MobileDesktopDnDAlertProps {
  /** When false, nothing is rendered (e.g. day finalized or board disabled). */
  show?: boolean;
}

/**
 * Informational banner for viewports below `lg`. Drag-and-drop status moves
 * are desktop-only; mobile users can still view the board.
 */
export function MobileDesktopDnDAlert({
  show = true,
}: MobileDesktopDnDAlertProps) {
  if (!show) {
    return null;
  }

  return (
    <div
      className="mb-4 flex gap-2 rounded border border-blue-200 bg-blue-50 px-4 py-2 text-blue-900 lg:hidden"
      role="status"
    >
      <span className="shrink-0 text-lg" aria-hidden>
        💻
      </span>
      <p className="text-sm">
        <strong>Movimentação entre colunas:</strong> use um computador para
        arrastar cartões e alterar o status. Em telas menores só é possível
        visualizar o quadro.
      </p>
    </div>
  );
}
