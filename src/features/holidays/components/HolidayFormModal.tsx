"use client";

import React, { useState, useEffect } from "react";
import {
  useCreateHoliday,
  useUpdateHoliday,
  useUpdateHolidayGroup,
  useCheckHolidayConflicts,
  useCreateHolidayPeriod,
} from "@/api/query/hooks/useHolidayQueries";
import {
  Holiday,
  CreateHolidayRequest,
  CreateHolidayPeriodRequest,
} from "@/types/holiday";
import { useDateHelpers } from "@/hooks/useDateHelpers";
import { isValidDateRange } from "@/utils/holidayGrouping";
import BaseModal from "@/components/common/BaseModal";
import {
  Button,
  Checkbox,
  Field,
  Input,
  Radio,
  Textarea,
} from "@/components/ui";
import { HOLIDAY_TREATMENT_TYPE_OPTIONS } from "../utils/holidayDisplayUtils";

type TreatmentType = "assessment" | "physiotherapy" | "tens";

interface HolidayFormModalProps {
  holiday?: Holiday;
  onClose: () => void;
  onSuccess: () => void;
}

const HolidayFormModal: React.FC<HolidayFormModalProps> = ({
  holiday,
  onClose,
  onSuccess,
}) => {
  const isEditing = !!holiday;
  const { getTodayDate } = useDateHelpers();

  // Form mode: single date or period
  const [isRangeMode, setIsRangeMode] = useState(false);

  // Single holiday form data
  const [formData, setFormData] = useState<CreateHolidayRequest>({
    holidayDate: holiday?.holidayDate || getTodayDate(),
    name: holiday?.name || "",
    description: holiday?.description || "",
    blockedTreatmentTypes: holiday?.blockedTreatmentTypes || [
      "assessment",
      "physiotherapy",
      "tens",
    ],
  });

  // Period form data
  const [periodData, setPeriodData] = useState<CreateHolidayPeriodRequest>({
    startDate: getTodayDate(),
    endDate: getTodayDate(),
    name: "",
    description: "",
    blockedTreatmentTypes: ["assessment", "physiotherapy", "tens"],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [conflictError, setConflictError] = useState<string>("");

  const { mutate: createHoliday, isPending: isCreating } = useCreateHoliday();
  const { mutate: updateHoliday, isPending: isUpdating } = useUpdateHoliday();
  const { mutate: updateHolidayGroup, isPending: isUpdatingGroup } =
    useUpdateHolidayGroup();
  const { mutate: createHolidayPeriod, isPending: isCreatingPeriod } =
    useCreateHolidayPeriod();
  const { refetch: checkConflicts } = useCheckHolidayConflicts(
    formData.holidayDate,
  );

  const isPending =
    isCreating || isUpdating || isUpdatingGroup || isCreatingPeriod;

  // Disable range mode when editing existing holiday
  useEffect(() => {
    if (isEditing) {
      setIsRangeMode(false);
    }
  }, [isEditing]);

  // Reset conflict error when date changes
  useEffect(() => {
    setConflictError("");
  }, [formData.holidayDate, periodData.startDate, periodData.endDate]);

  // Treatment types handling
  const handleTreatmentTypeToggle = (treatmentType: TreatmentType) => {
    const currentTypes = isRangeMode
      ? periodData.blockedTreatmentTypes || []
      : formData.blockedTreatmentTypes || [];

    const newTypes = currentTypes.includes(treatmentType)
      ? currentTypes.filter((type) => type !== treatmentType)
      : [...currentTypes, treatmentType];

    const finalTypes = newTypes.length === 0 ? null : newTypes;

    if (isRangeMode) {
      setPeriodData((prev) => ({ ...prev, blockedTreatmentTypes: finalTypes }));
    } else {
      setFormData((prev) => ({ ...prev, blockedTreatmentTypes: finalTypes }));
    }
  };

  const validateSingleHoliday = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length > 255) {
      newErrors.name = "Name must not exceed 255 characters";
    }

    if (!formData.holidayDate) {
      newErrors.holidayDate = "Date is required";
    } else {
      const selectedDate = new Date(formData.holidayDate + "T00:00:00");
      const today = new Date(getTodayDate() + "T00:00:00");
      if (selectedDate < today && !isEditing) {
        newErrors.holidayDate = "Date must be today or in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePeriod = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!periodData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (periodData.name.length > 255) {
      newErrors.name = "Name must not exceed 255 characters";
    }

    if (!periodData.startDate) {
      newErrors.startDate = "Start date is required";
    } else {
      const startDate = new Date(periodData.startDate + "T00:00:00");
      const today = new Date(getTodayDate() + "T00:00:00");
      if (startDate < today) {
        newErrors.startDate = "Date must be today or in the future";
      }
    }

    if (!periodData.endDate) {
      newErrors.endDate = "End date is required";
    } else if (!isValidDateRange(periodData.startDate, periodData.endDate)) {
      newErrors.endDate =
        "End date must be greater than or equal to start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = isRangeMode ? validatePeriod() : validateSingleHoliday();
    if (!isValid) return;

    // Handle different submission types
    if (isEditing && holiday) {
      // Editing existing holiday
      const updateData = {
        name: formData.name,
        description: formData.description,
        blockedTreatmentTypes: formData.blockedTreatmentTypes,
      };

      // Check if this holiday belongs to a group (period)
      if (holiday.holidayGroupId) {
        // Update all holidays in the group
        updateHolidayGroup(
          {
            groupId: holiday.holidayGroupId,
            data: updateData,
          },
          {
            onSuccess: () => {
              onSuccess();
            },
            onError: (error) => {
              console.error("Error updating holiday group:", error);
              setConflictError(
                error instanceof Error
                  ? error.message
                  : "Error updating holiday period",
              );
            },
          },
        );
      } else {
        // Update single holiday
        updateHoliday(
          {
            id: holiday.id,
            data: updateData,
          },
          {
            onSuccess: () => {
              onSuccess();
            },
            onError: (error) => {
              console.error("Error updating holiday:", error);
              setConflictError(
                error instanceof Error
                  ? error.message
                  : "Error updating holiday",
              );
            },
          },
        );
      }
    } else if (isRangeMode) {
      // Creating new holiday period
      createHolidayPeriod(periodData, {
        onSuccess: () => {
          onSuccess();
        },
        onError: (error) => {
          console.error("Error creating holiday period:", error);
          setConflictError(
            error instanceof Error
              ? error.message
              : "Error creating holiday period",
          );
        },
      });
    } else {
      // Creating single holiday - check conflicts first
      if (!isEditing) {
        const { data: conflictData } = await checkConflicts();

        if (conflictData?.hasConflict) {
          setConflictError(
            `This date has ${conflictData.appointmentCount} appointment(s) scheduled. Cannot create holiday.`,
          );
          return;
        }
      }

      createHoliday(formData, {
        onSuccess: () => {
          onSuccess();
        },
        onError: (error) => {
          console.error("Error creating holiday:", error);
          setConflictError(
            error instanceof Error ? error.message : "Error creating holiday",
          );
        },
      });
    }
  };

  const handleSingleHolidayChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePeriodChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setPeriodData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const toggleRangeMode = () => {
    setIsRangeMode(!isRangeMode);
    setErrors({});
    setConflictError("");
  };

  return (
    <BaseModal
      isOpen
      onClose={onClose}
      title={isEditing ? "Edit Holiday" : "New Holiday"}
      subtitle={
        isEditing && holiday?.holidayGroupId
          ? "This holiday spans more than one day. Changes will be applied to all days in the period."
          : undefined
      }
      maxWidth="lg"
      preventOverflow
      showCloseButton={!isPending}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4 overflow-y-auto p-4 sm:p-6"
      >
        {/* Conflict Error */}
        {conflictError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{conflictError}</p>
          </div>
        )}

        {/* Holiday Type Selection - Only show when not editing */}
        {!isEditing && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Holiday Type
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <Radio
                  name="holidayType"
                  checked={!isRangeMode}
                  onChange={toggleRangeMode}
                />
                <span className="text-sm text-gray-700">Single Day</span>
              </label>
              <label className="flex items-center gap-2">
                <Radio
                  name="holidayType"
                  checked={isRangeMode}
                  onChange={toggleRangeMode}
                />
                <span className="text-sm text-gray-700">Period</span>
              </label>
            </div>
          </div>
        )}

        {/* Date Fields */}
        {!isRangeMode ? (
          // Single Date
          <Field
            label="Date *"
            htmlFor="holidayDate"
            error={errors.holidayDate}
            helpText={
              isEditing
                ? "The date cannot be changed after creation"
                : undefined
            }
          >
            <Input
              type="date"
              id="holidayDate"
              name="holidayDate"
              value={formData.holidayDate}
              onChange={handleSingleHolidayChange}
              disabled={isEditing || isPending}
              invalid={Boolean(errors.holidayDate)}
            />
          </Field>
        ) : (
          // Date Range
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Start Date *"
              htmlFor="startDate"
              error={errors.startDate}
            >
              <Input
                type="date"
                id="startDate"
                name="startDate"
                value={periodData.startDate}
                onChange={handlePeriodChange}
                disabled={isPending}
                invalid={Boolean(errors.startDate)}
              />
            </Field>
            <Field label="End Date *" htmlFor="endDate" error={errors.endDate}>
              <Input
                type="date"
                id="endDate"
                name="endDate"
                value={periodData.endDate}
                min={periodData.startDate} // Ensure end date is not before start date
                onChange={handlePeriodChange}
                disabled={isPending}
                invalid={Boolean(errors.endDate)}
              />
            </Field>
          </div>
        )}

        {/* Name Field */}
        <Field label="Name *" htmlFor="name" error={errors.name}>
          <Input
            type="text"
            id="name"
            name="name"
            value={isRangeMode ? periodData.name : formData.name}
            onChange={
              isRangeMode ? handlePeriodChange : handleSingleHolidayChange
            }
            disabled={isPending}
            maxLength={255}
            placeholder="e.g. Christmas, New Year, Carnival, etc."
            invalid={Boolean(errors.name)}
          />
        </Field>

        {/* Blocked Treatment Types Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Blocked Treatment Types
          </label>
          <div className="space-y-3">
            {HOLIDAY_TREATMENT_TYPE_OPTIONS.map((treatmentType) => {
              const isSelected = isRangeMode
                ? (periodData.blockedTreatmentTypes || []).includes(
                    treatmentType.value,
                  )
                : (formData.blockedTreatmentTypes || []).includes(
                    treatmentType.value,
                  );

              return (
                <label
                  key={treatmentType.value}
                  className="flex items-center space-x-3 cursor-pointer"
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={() =>
                      handleTreatmentTypeToggle(
                        treatmentType.value as TreatmentType,
                      )
                    }
                    disabled={isPending}
                  />
                  <span className="text-sm text-gray-700">
                    {treatmentType.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Description Field */}
        <Field label="Description" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            value={
              isRangeMode
                ? periodData.description || ""
                : formData.description || ""
            }
            onChange={
              isRangeMode ? handlePeriodChange : handleSingleHolidayChange
            }
            disabled={isPending}
            rows={3}
            placeholder="Additional holiday information (optional)"
          />
        </Field>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            isLoading={isPending}
            loadingText="Saving..."
          >
            {isEditing ? "Save Changes" : "Create Holiday"}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default HolidayFormModal;
