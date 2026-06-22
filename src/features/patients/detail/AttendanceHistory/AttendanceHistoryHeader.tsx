import React from "react";
import { History } from "lucide-react";
import { DetailCardCollapsibleHeader } from "@/features/patients/detail/shared/DetailCardCollapsibleHeader";
import { Button } from "@/components/ui";

interface AttendanceHistoryHeaderProps {
  totalItems: number;
  isCollapsed: boolean;
  loading: boolean;
  onToggleCollapse: () => void;
  onRefresh: () => void;
}

/**
 * Header component for Attendance History Card
 * Displays title, count, refresh button, and collapse/expand toggle
 */
export const AttendanceHistoryHeader: React.FC<
  AttendanceHistoryHeaderProps
> = ({ totalItems, isCollapsed, loading, onToggleCollapse, onRefresh }) => {
  return (
    <DetailCardCollapsibleHeader
      isCollapsed={isCollapsed}
      onToggle={onToggleCollapse}
      title={
        <>
          <History className="h-5 w-5 shrink-0 text-gray-600" aria-hidden />
          Attendance History
          <span className="text-sm font-normal text-gray-600">
            ({totalItems})
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
            title="Refresh history"
          >
            Refresh
          </Button>
        ) : null
      }
    />
  );
};
