"use client";

import React, { useState } from "react";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/common/Breadcrumb";
import { useAuthContext } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";
import { useHolidayManagement } from "./hooks/useHolidayManagement";
import HolidayActionsBar from "./components/HolidayActionsBar";
import HolidayList from "./components/HolidayList";
import HolidayDeleteConfirmModal from "./components/HolidayDeleteConfirmModal";
import HolidayFormModal from "./components/HolidayFormModal";
import { TemplateListSection } from "./components/TemplateListSection";
import { TemplateFormModal } from "./components/TemplateFormModal";
import { ApplyTemplateModal } from "./components/ApplyTemplateModal";
import { TemplateApplicationResultModal } from "./components/TemplateApplicationResultModal";
import LoadingFallback from "@/components/common/LoadingFallback";
import {
  useHolidayTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useApplyTemplate,
} from "@/api/query/hooks/useHolidayTemplateQueries";
import { HolidayTemplate } from "@/types/holidayTemplate";
import { FileText, Calendar } from "lucide-react";
import { AxiosError } from "axios";
import { Button } from "@/components/ui";

const HolidayManagementContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"holidays" | "templates">(
    "holidays",
  );
  const [showTemplateFormModal, setShowTemplateFormModal] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<HolidayTemplate | null>(null);
  const [applyingTemplate, setApplyingTemplate] =
    useState<HolidayTemplate | null>(null);
  const [applicationResult, setApplicationResult] = useState<{
    templateName: string;
    year: number;
    successCount: number;
    failureCount: number;
    errors: Array<{ date: string; name: string; error: string }>;
  } | null>(null);

  const {
    selectedYear,
    showCreateModal,
    editingHoliday,
    deletingHoliday,
    holidays,
    isLoading,
    error,
    isDeleting,
    years,
    setSelectedYear,
    setShowCreateModal,
    setEditingHoliday,
    setDeletingHoliday,
    handleDelete,
    handleEdit,
    confirmDelete,
  } = useHolidayManagement();

  // Template queries
  const { data: templatesData, isLoading: templatesLoading } =
    useHolidayTemplates();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const applyTemplate = useApplyTemplate();

  const templates = templatesData?.value || [];

  // Template handlers
  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setShowTemplateFormModal(true);
  };

  const handleEditTemplate = (template: HolidayTemplate) => {
    setEditingTemplate(template);
    setShowTemplateFormModal(true);
  };

  const handleTemplateSubmit = async (data: {
    name: string;
    description?: string;
    holidays: Array<{
      month: number;
      day: number;
      name: string;
      description?: string;
    }>;
  }) => {
    try {
      // Clean up data: remove empty strings for optional fields
      const cleanedData = {
        name: data.name,
        description: data.description?.trim() || undefined,
        holidays: data.holidays.map((h) => ({
          month: h.month,
          day: h.day,
          name: h.name,
          description: h.description?.trim() || undefined,
        })),
      };

      let result;
      if (editingTemplate) {
        result = await updateTemplate.mutateAsync({
          id: editingTemplate.id,
          data: cleanedData,
        });
        console.log("Template updated successfully:", result);
        alert("Template updated successfully!");
      } else {
        result = await createTemplate.mutateAsync(cleanedData);
        console.log("Template created successfully:", result);
        alert("Template created successfully!");
      }
      setShowTemplateFormModal(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error("Error saving template:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        console.error("Error details:", axiosError.response?.data);
        alert(
          `Error saving template: ${axiosError.response?.data?.message || "Unknown error"}`,
        );
      } else {
        alert("Error saving template. Please try again.");
      }
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      await deleteTemplate.mutateAsync(id);
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Error deleting template. Please try again.");
    }
  };

  const handleApplyTemplate = (template: HolidayTemplate) => {
    setApplyingTemplate(template);
  };

  const handleConfirmApplyTemplate = async (year: number) => {
    if (!applyingTemplate) return;

    try {
      const result = await applyTemplate.mutateAsync({
        id: applyingTemplate.id,
        data: { year },
      });

      setApplyingTemplate(null);

      if (result.value) {
        const { successCount, failureCount, errors } = result.value;

        // Show result modal instead of alert
        setApplicationResult({
          templateName: applyingTemplate.name,
          year,
          successCount,
          failureCount,
          errors,
        });
      }
    } catch (error) {
      console.error("Error applying template:", error);
      alert("Error applying template. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <LoadingFallback message="Loading holidays..." size="large" showSpinner />
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold">Error loading holidays</p>
          <p className="text-red-600 text-sm mt-2">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Agenda", href: "/agenda" },
          { label: "Holidays", isActive: true },
        ]}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-xl font-semibold text-gray-900 sm:text-2xl">
          Holiday Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage holidays and blocked dates in the calendar
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div
          className="-mx-3 flex gap-4 overflow-x-auto px-3 snap-x sm:mx-0 sm:gap-8 sm:px-0"
          role="tablist"
          aria-label="Holidays or templates"
        >
          <Button
            type="button"
            variant="ghost"
            role="tab"
            aria-selected={activeTab === "holidays"}
            onClick={() => setActiveTab("holidays")}
            className={`relative shrink-0 snap-start rounded-none px-2 pb-4 pt-0 text-sm min-h-[44px] ${
              activeTab === "holidays"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Holidays
            </div>
            {activeTab === "holidays" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            role="tab"
            aria-selected={activeTab === "templates"}
            onClick={() => setActiveTab("templates")}
            className={`relative shrink-0 snap-start rounded-none px-2 pb-4 pt-0 text-sm min-h-[44px] ${
              activeTab === "templates"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Templates
            </div>
            {activeTab === "templates" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "holidays" ? (
        <>
          {/* Actions Bar */}
          <HolidayActionsBar
            selectedYear={selectedYear}
            years={years}
            onYearChange={setSelectedYear}
            onCreateClick={() => setShowCreateModal(true)}
          />

          {/* Holidays List */}
          <HolidayList
            holidays={holidays}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreateClick={() => setShowCreateModal(true)}
          />
        </>
      ) : (
        <>
          {/* Template Actions */}
          <div className="mb-6 flex justify-stretch sm:justify-end">
            <Button
              type="button"
              onClick={handleCreateTemplate}
              className="w-full sm:w-auto"
            >
              <FileText className="w-4 h-4" />
              New Template
            </Button>
          </div>

          {/* Templates List */}
          <TemplateListSection
            templates={templates}
            onEdit={handleEditTemplate}
            onDelete={handleDeleteTemplate}
            onApply={handleApplyTemplate}
            isLoading={templatesLoading}
          />
        </>
      )}

      {/* Holiday Modals */}
      {showCreateModal && (
        <HolidayFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}

      {editingHoliday && (
        <HolidayFormModal
          holiday={editingHoliday}
          onClose={() => setEditingHoliday(null)}
          onSuccess={() => setEditingHoliday(null)}
        />
      )}

      <HolidayDeleteConfirmModal
        holiday={deletingHoliday}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingHoliday(null)}
      />

      {/* Template Modals */}
      {showTemplateFormModal && (
        <TemplateFormModal
          isOpen={showTemplateFormModal}
          onClose={() => {
            setShowTemplateFormModal(false);
            setEditingTemplate(null);
          }}
          onSubmit={handleTemplateSubmit}
          template={editingTemplate}
          isLoading={createTemplate.isPending || updateTemplate.isPending}
        />
      )}

      {applyingTemplate && (
        <ApplyTemplateModal
          isOpen={!!applyingTemplate}
          onClose={() => setApplyingTemplate(null)}
          onApply={handleConfirmApplyTemplate}
          template={applyingTemplate}
          isLoading={applyTemplate.isPending}
        />
      )}

      {applicationResult && (
        <TemplateApplicationResultModal
          isOpen={!!applicationResult}
          onClose={() => setApplicationResult(null)}
          templateName={applicationResult.templateName}
          year={applicationResult.year}
          successCount={applicationResult.successCount}
          failureCount={applicationResult.failureCount}
          errors={applicationResult.errors}
        />
      )}
    </div>
  );
};

const HolidayManagement: React.FC = () => {
  const { user, isLoading: authLoading } = useAuthContext();

  if (authLoading) {
    return <LoadingFallback message="Loading..." size="large" />;
  }

  if (!user || user.role !== UserRole.ADMIN) {
    notFound();
  }

  return <HolidayManagementContent />;
};

export default HolidayManagement;
