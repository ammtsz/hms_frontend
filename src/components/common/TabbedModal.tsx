import React, { ReactNode } from "react";
import BaseModal from "@/components/common/BaseModal";
import { Button } from "@/components/ui";
import { cn } from "@/utils/cn";

export interface TabDefinition {
  id: string;
  label: string;
  icon?: string;
  isValid?: boolean;
  hasWarning?: boolean;
  disabled?: boolean;
  disabledTitle?: string;
}

interface TabbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  tabs: TabDefinition[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "5xl" | "6xl";
}

// Helper function to check if form can be submitted (no invalid tabs)
export const canSubmitForm = (tabs: TabDefinition[]): boolean => {
  return !tabs.some((tab) => !tab.isValid && !tab.hasWarning);
};

const TabbedModal: React.FC<TabbedModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  children,
  actions,
  maxWidth = "2xl",
}) => {
  const getTabStatusIcon = (tab: TabDefinition) => {
    if (tab.isValid) return "✅";
    if (tab.hasWarning) return "⚠️";
    return "❌"; // Invalid - will prevent form submission
  };

  const getTabStatusTooltip = (tab: TabDefinition) => {
    if (tab.isValid) return "All required fields have been filled.";
    if (tab.hasWarning) return "Warning! Form has unsaved changes.";
    return "Fill in all required fields.";
  };

  const getTabClassName = (tab: TabDefinition) => {
    const isActive = activeTab === tab.id;
    const isDisabled = tab.disabled;
    let baseClasses =
      "flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 focus:outline-none relative flex-1 min-w-0 border-b-2";

    if (isDisabled) {
      baseClasses +=
        " text-gray-400 border-transparent cursor-not-allowed opacity-60";
    } else if (isActive) {
      baseClasses +=
        " text-blue-600 border-blue-600 bg-blue-50/30 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50";
    } else {
      baseClasses +=
        " text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50";
    }

    return baseClasses;
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxWidth={maxWidth}
      preventOverflow
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 overflow-x-auto border-b border-gray-200 bg-white px-4 sm:px-6">
          <div className="flex w-max min-w-full sm:w-full">
            {tabs.map((tab) => (
              <Button
                variant="ghost"
                key={tab.id}
                onClick={() => !tab.disabled && onTabChange(tab.id)}
                className={cn(
                  getTabClassName(tab),
                  "shrink-0 snap-start sm:flex-1",
                )}
                disabled={tab.disabled}
                title={
                  tab.disabled
                    ? (tab.disabledTitle ?? "Unavailable")
                    : undefined
                }
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="relative shrink-0 cursor-help text-xs group"
                    title={getTabStatusTooltip(tab)}
                  >
                    {getTabStatusIcon(tab)}
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:block group-hover:opacity-100">
                      {tab.disabled
                        ? tab.disabledTitle
                        : getTabStatusTooltip(tab)}
                    </div>
                  </span>
                  <span className="truncate font-medium">{tab.label}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-6 sm:px-6">
          {children}
        </div>

        {actions ? (
          <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
            {actions}
          </div>
        ) : null}
      </div>
    </BaseModal>
  );
};

export default TabbedModal;
