import React from "react";
import { BarChart3 } from "lucide-react";
import { DetailCardCollapsibleHeader } from "@/features/patients/detail/shared/DetailCardCollapsibleHeader";
import { Button } from "@/components/ui";

interface SessionBreakdownHeaderProps {
  completedCount: number;
  totalCount: number;
  isCollapsed: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export const SessionBreakdownHeader: React.FC<SessionBreakdownHeaderProps> = ({
  completedCount,
  totalCount,
  isCollapsed,
  onToggle,
  onRefresh,
  loading,
}) => {
  return (
    <DetailCardCollapsibleHeader
      isCollapsed={isCollapsed}
      onToggle={onToggle}
      title={
        <>
          <BarChart3 className="h-5 w-5 shrink-0 text-gray-600" aria-hidden />
          Treatment History
          <span className="text-sm font-normal text-gray-600">
            ({completedCount}/{totalCount})
          </span>
        </>
      }
      actions={
        !loading && !isCollapsed ? (
          <Button
            variant="ghost"
            size="xs"
            onClick={onRefresh}
            className="text-blue-600 hover:text-blue-800"
            title="Refresh treatment history"
          >
            Refresh
          </Button>
        ) : null
      }
    />
  );
};
