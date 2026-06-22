"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface HolidayIndicatorProps {
  holidayName: string;
  description?: string;
}

/**
 * HolidayIndicator - Visual badge showing that a date is a holiday
 * Displays a sparkles icon with the holiday name on hover
 */
const HolidayIndicator: React.FC<HolidayIndicatorProps> = ({
  holidayName,
  description,
}) => {
  return (
    <div className="group relative inline-flex items-center">
      {/* Holiday Badge */}
      <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 border border-amber-300 rounded-full text-xs font-medium text-amber-800">
        <Sparkles className="w-3 h-3" />
        <span>Holiday</span>
      </div>

      {/* Tooltip */}
      <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-50 w-max max-w-xs">
        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
          <div className="font-semibold">{holidayName}</div>
          {description && (
            <div className="text-gray-300 mt-1">{description}</div>
          )}
          {/* Tooltip arrow */}
          <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </div>
      </div>
    </div>
  );
};

export default HolidayIndicator;
