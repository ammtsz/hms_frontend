import React from "react";
import { Button } from "@/components/ui";

interface ShowMoreButtonProps {
  onClick: () => void;
  totalItems: number;
  visibleCount: number;
  itemLabel?: string;
  className?: string;
  disabled?: boolean;
}

export const ShowMoreButton: React.FC<ShowMoreButtonProps> = ({
  onClick,
  totalItems,
  visibleCount,
  itemLabel = "itens",
  className = "",
  disabled = false,
}) => {
  const remainingItems = totalItems - visibleCount;

  if (remainingItems <= 0) {
    return null;
  }

  return (
    <div className={`flex justify-center pt-4 ${className}`}>
      <Button
        variant="secondary"
        size="sm"
        onClick={onClick}
        disabled={disabled}
        className="rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
      >
        <span>📄</span>
        <span>
          Mostrar mais {Math.min(10, remainingItems)} {itemLabel}
        </span>
        <span className="text-xs text-blue-500 bg-blue-200 px-2 py-0.5 rounded-full">
          +{remainingItems}
        </span>
      </Button>
    </div>
  );
};

export default ShowMoreButton;
