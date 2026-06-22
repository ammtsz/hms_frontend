"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useUpcomingHolidays } from "@/api/query/hooks/useHolidayQueries";
import { useDateHelpers } from "@/hooks/useDateHelpers";
import { useAuthContext } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";
import { Button, Card } from "@/components/ui";
import { UPCOMING_HOLIDAYS_LABELS } from "../utils/agendaFilterConstants";

const UpcomingHolidaysWidget: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuthContext();
  const { data: holidays } = useUpcomingHolidays(3);
  const { formatDisplayDate } = useDateHelpers();
  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <Card className="bg-gray-50">
      <div className="p-4">
        <div
          className={`flex items-center justify-between ${isExpanded ? "mb-3" : ""}`}
        >
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="min-h-0 flex-1 justify-start px-0 py-0 text-xl text-gray-900 hover:bg-transparent hover:text-gray-700"
            aria-expanded={isExpanded}
          >
            {UPCOMING_HOLIDAYS_LABELS.title}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 ml-auto" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-auto" />
            )}
          </Button>
          {isAdmin && (
            <Link
              href="/agenda/holidays"
              className="ml-4 inline-flex min-h-[40px] items-center justify-center whitespace-nowrap rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {UPCOMING_HOLIDAYS_LABELS.manageLink}
            </Link>
          )}
        </div>

        {isExpanded && (
          <div className="mt-3 space-y-2">
            {holidays && holidays.length > 0 ? (
              holidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="font-medium text-gray-900 min-w-[100px]">
                    {formatDisplayDate(holiday.holidayDate)}
                  </span>
                  <span className="text-gray-700">{holiday.name}</span>
                  {holiday.description && (
                    <span className="text-gray-600 text-xs">
                      ({holiday.description})
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">
                {UPCOMING_HOLIDAYS_LABELS.empty}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default UpcomingHolidaysWidget;
