import React, {
  useCallback,
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Plus, TriangleAlert, Trash2 } from "lucide-react";
import {
  hasSlotsForTreatmentOnDate,
  useScheduleSettings,
} from "@/api/query/hooks/useScheduleSettingQueries";
import {
  useBodyLocations,
  useColors,
  useCreateBodyLocation,
} from "@/api/query/hooks/useSystemOptionsQueries";
import { TREATMENT_SLOTS_UNAVAILABLE_MESSAGE } from "@/utils/scheduleTreatmentSlots";
import type {
  PhysiotherapyLocationTreatment,
  TensLocationTreatment,
} from "@/features/attendance/components/Consultation/types";
import LocationChipInput from "./LocationChipInput";
import type { TreatmentResponseDto } from "@/api/types";
import {
  createNewTreatmentRow,
  enforceUniqueLocationsForRow,
  findInactiveOptionByValue,
  getAvailableLocationsForRow,
  getBlockedLocationsForRow,
} from "./TreatmentRecommendationTable.utils";
import {
  Button,
  IconButton,
  Input,
  Select,
  TableMobileLabel,
  stackedTableClasses,
} from "@/components/ui";

/** Session data for edit mode: one row per session. Used by parent to build initial treatments and initialEditSessionIds. */
export type EditModeSession = Pick<
  TreatmentResponseDto,
  | "id"
  | "bodyLocation"
  | "color"
  | "durationMinutes"
  | "plannedSessions"
  | "startDate"
>;

interface TreatmentRecommendationTableProps {
  treatmentType: "physiotherapy" | "tens";
  treatments: (PhysiotherapyLocationTreatment | TensLocationTreatment)[];
  onChange: (
    treatments: (PhysiotherapyLocationTreatment | TensLocationTreatment)[],
    editSessionIds?: (number | undefined)[],
  ) => void;
  disabled?: boolean;
  /** When adding a new row, use this quantity. If same-type rows exist, parent passes last row's quantity; if first row of this type, parent passes other type's last quantity or 1. */
  defaultQuantity?: number;
  /** When adding a new row, use this start date for the first row of this type (e.g. copied from other treatment type). */
  defaultStartDate?: string;
  /** When 'edit', quantity and start date are read-only; rows are tied to session ids for update/cancel. */
  mode?: "create" | "edit";
  /** In edit mode, session id per row (same length as treatments). New rows have undefined. */
  initialEditSessionIds?: number[];
}

export interface TreatmentRecommendationTableRef {
  addRow: () => void;
}

const TreatmentRecommendationTable = forwardRef<
  TreatmentRecommendationTableRef,
  TreatmentRecommendationTableProps
>(
  (
    {
      treatmentType,
      treatments,
      onChange,
      disabled = false,
      defaultQuantity = 1,
      defaultStartDate,
      mode = "create",
      initialEditSessionIds = [],
    },
    ref,
  ) => {
    const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
    const [creationError, setCreationError] = useState<{
      rowIndex: number;
      message: string;
    } | null>(null);
    const tableRef = useRef<HTMLDivElement>(null);
    const isEditMode = mode === "edit";
    const [editSessionIds, setEditSessionIds] = useState<
      (number | undefined)[]
    >(() => (isEditMode ? initialEditSessionIds : []));

    // In edit mode, initialize editSessionIds from parent when lengths match (e.g. modal just opened)
    useEffect(() => {
      if (
        isEditMode &&
        initialEditSessionIds.length > 0 &&
        initialEditSessionIds.length === treatments.length &&
        editSessionIds.length !== treatments.length
      ) {
        setEditSessionIds(initialEditSessionIds);
      }
    }, [
      isEditMode,
      initialEditSessionIds,
      treatments.length,
      editSessionIds.length,
    ]);

    // Keep editSessionIds length in sync with treatments when in edit mode (e.g. parent reset)
    useEffect(() => {
      if (!isEditMode) return;
      if (treatments.length !== editSessionIds.length) {
        setEditSessionIds((prev) => {
          if (treatments.length > prev.length) {
            return [
              ...prev,
              ...Array(treatments.length - prev.length).fill(undefined),
            ];
          }
          return prev.slice(0, treatments.length);
        });
      }
    }, [isEditMode, treatments.length, editSessionIds.length]);

    const { data: scheduleSettings } = useScheduleSettings();
    const { data: bodyLocations = [] } = useBodyLocations();
    const { data: allBodyLocations = [] } = useBodyLocations(true); // Include inactive
    const { data: colors = [] } = useColors();
    const createBodyLocationMutation = useCreateBodyLocation();

    // Close edit mode when clicking outside the table
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          tableRef.current &&
          !tableRef.current.contains(event.target as Node)
        ) {
          setEditingRowIndex(null);
          setCreationError(null);
        }
      };

      if (editingRowIndex !== null) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }
    }, [editingRowIndex]);

    const handleAddRow = useCallback(() => {
      const newTreatment = createNewTreatmentRow({
        treatmentType,
        treatments,
        defaultQuantity,
        isEditMode,
        scheduleSettings,
        defaultStartDate,
      });

      const newTreatments = [...treatments, newTreatment];
      if (isEditMode) {
        const newSessionIds = [...editSessionIds, undefined];
        setEditSessionIds(newSessionIds);
        onChange(newTreatments, newSessionIds);
      } else {
        onChange(newTreatments);
      }
      setEditingRowIndex(newTreatments.length - 1); // Start editing the new row
    }, [
      treatmentType,
      treatments,
      onChange,
      defaultQuantity,
      scheduleSettings,
      isEditMode,
      editSessionIds,
      defaultStartDate,
    ]);

    const handleRemoveRow = (index: number) => {
      if (isEditMode && editSessionIds[index] !== undefined) return;
      const updatedTreatments = treatments.filter((_, i) => i !== index);
      if (isEditMode) {
        const newSessionIds = editSessionIds.filter((_, i) => i !== index);
        setEditSessionIds(newSessionIds);
        onChange(updatedTreatments, newSessionIds);
      } else {
        onChange(updatedTreatments);
      }
      if (editingRowIndex === index) {
        setEditingRowIndex(null);
      }
      if (creationError?.rowIndex === index) {
        setCreationError(null);
      }
    };

    const handleFieldChange = (
      index: number,
      field: string,
      value: string | string[] | number,
    ) => {
      const updatedTreatments = [...treatments] as Array<
        PhysiotherapyLocationTreatment | TensLocationTreatment
      >;
      const nextRow = {
        ...updatedTreatments[index],
        [field]: value,
      } as PhysiotherapyLocationTreatment | TensLocationTreatment;
      updatedTreatments[index] = nextRow;

      const uniqueTreatments = enforceUniqueLocationsForRow({
        treatmentType,
        rowIndex: index,
        treatments: updatedTreatments,
      });

      if (isEditMode) {
        onChange(uniqueTreatments, editSessionIds);
      } else {
        onChange(uniqueTreatments);
      }

      // Clear error when user makes changes
      if (creationError?.rowIndex === index) {
        setCreationError(null);
      }
    };

    useImperativeHandle(ref, () => ({ addRow: handleAddRow }), [handleAddRow]);

    const isPhysiotherapy = treatmentType === "physiotherapy";

    // Get active locations and colors
    const activeLocations = bodyLocations
      .filter((loc) => loc.isActive)
      .map((loc) => loc.value);

    const activeColors = colors
      .filter((color) => color.isActive)
      .map((color) => color.value);

    return (
      <div className="space-y-4">
        {/* Table View */}
        {treatments.length > 0 && (
          <div
            ref={tableRef}
            className="rounded-md border border-gray-200 shadow-md md:overflow-x-auto"
          >
            <table
              className={`${stackedTableClasses.table} md:divide-y md:divide-gray-200 md:shadow-2xs`}
            >
              <thead className={`bg-gray-50 ${stackedTableClasses.header}`}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider max-w-3xs">
                    Body Locations
                  </th>
                  {isPhysiotherapy && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Color
                    </th>
                  )}
                  {isPhysiotherapy && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Duration
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`bg-white font-normal ${stackedTableClasses.body}`}
              >
                {treatments.map((treatment, index) => {
                  const hasSlotError =
                    scheduleSettings &&
                    !hasSlotsForTreatmentOnDate(
                      treatment.startDate,
                      scheduleSettings,
                    );
                  const isEditing = editingRowIndex === index;
                  const physiotherapyTreatment =
                    treatment as PhysiotherapyLocationTreatment;

                  const canRemoveRow =
                    !disabled &&
                    (!isEditMode || editSessionIds[index] === undefined);

                  const blockedLocationSet = getBlockedLocationsForRow({
                    treatmentType,
                    rowIndex: index,
                    treatments,
                  });

                  const availableLocationsForRow = getAvailableLocationsForRow({
                    activeLocations,
                    blockedLocations: blockedLocationSet,
                  });

                  return (
                    <tr
                      key={index}
                      className={`hover:bg-gray-50 ${stackedTableClasses.row}`}
                      onClick={() => !disabled && setEditingRowIndex(index)}
                    >
                      {/* Locations */}
                      <td className="block py-2 md:table-cell md:max-w-3xs md:py-3 md:pl-3 md:pr-1 md:align-bottom">
                        <TableMobileLabel>Body Locations</TableMobileLabel>
                        {isEditing ? (
                          <div className="space-y-1">
                            {creationError?.rowIndex === index && (
                              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                                {creationError.message}
                              </div>
                            )}
                            <LocationChipInput
                              selectedLocations={treatment.locations}
                              availableLocations={availableLocationsForRow}
                              onChange={(locations) =>
                                handleFieldChange(index, "locations", locations)
                              }
                              onCreateNew={async (value) => {
                                try {
                                  setCreationError(null);
                                  const newLocation =
                                    await createBodyLocationMutation.mutateAsync(
                                      value,
                                    );
                                  return newLocation.value;
                                } catch (error) {
                                  // Check if the location exists but is inactive
                                  const inactiveLocation =
                                    findInactiveOptionByValue(
                                      allBodyLocations,
                                      value,
                                    );

                                  if (inactiveLocation) {
                                    setCreationError({
                                      rowIndex: index,
                                      message: `The location "${inactiveLocation.value}" already exists, but is inactive. Activate it in the treatment settings to use it.`,
                                    });
                                  } else {
                                    setCreationError({
                                      rowIndex: index,
                                      message:
                                        error instanceof Error
                                          ? error.message
                                          : "Error creating body location",
                                    });
                                  }
                                  throw error;
                                }
                              }}
                              disabled={disabled}
                              isCreating={createBodyLocationMutation.isPending}
                              singleSelect={isEditMode}
                            />
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1 align-bottom">
                            {treatment.locations.length > 0 ? (
                              treatment.locations.map((location, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                                >
                                  {location}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400 italic">
                                No body locations selected
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Color (Physiotherapy only) */}
                      {isPhysiotherapy && (
                        <td className="block py-2 md:table-cell md:px-1 md:py-3 md:align-bottom">
                          <TableMobileLabel>Color</TableMobileLabel>
                          {isEditing ? (
                            <Select
                              value={physiotherapyTreatment.color || ""}
                              onChange={(e) =>
                                handleFieldChange(
                                  index,
                                  "color",
                                  e.target.value,
                                )
                              }
                              disabled={disabled}
                              className="min-h-8 px-2 py-1 text-sm"
                            >
                              <option value="">Select</option>
                              {activeColors.map((color) => (
                                <option key={color} value={color}>
                                  {color}
                                </option>
                              ))}
                            </Select>
                          ) : (
                            <span className="text-sm text-gray-900">
                              {physiotherapyTreatment.color || (
                                <span className="text-gray-400 italic">
                                  Not defined
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                      )}

                      {/* Duration (Physiotherapy only) */}
                      {isPhysiotherapy && (
                        <td className="block py-2 md:table-cell md:px-1 md:py-3 md:align-bottom">
                          <TableMobileLabel>Duration</TableMobileLabel>
                          {isEditing ? (
                            <Select
                              value={physiotherapyTreatment.duration || 1}
                              onChange={(e) =>
                                handleFieldChange(
                                  index,
                                  "duration",
                                  parseInt(e.target.value),
                                )
                              }
                              disabled={disabled}
                              className="min-h-8 px-2 py-1 text-sm"
                            >
                              <option value={1}>1 unit (7 min)</option>
                              <option value={2}>2 units (14 min)</option>
                              <option value={3}>3 units (21 min)</option>
                              <option value={4}>4 units (28 min)</option>
                              <option value={5}>5 units (35 min)</option>
                              <option value={6}>6 units (42 min)</option>
                              <option value={7}>7 units (49 min)</option>
                              <option value={8}>8 units (56 min)</option>
                              <option value={9}>9 units (63 min)</option>
                              <option value={10}>10 units (70 min)</option>
                            </Select>
                          ) : (
                            <span className="text-sm text-gray-900">
                              {physiotherapyTreatment.duration} unit
                              {physiotherapyTreatment.duration !== 1
                                ? "s"
                                : ""}{" "}
                              ({physiotherapyTreatment.duration * 7} min)
                            </span>
                          )}
                        </td>
                      )}

                      {/* Quantity (read-only in edit mode) */}
                      <td className="block py-2 md:table-cell md:px-1 md:py-3 md:align-bottom">
                        <TableMobileLabel>Quantity</TableMobileLabel>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={treatment.quantity || 1}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 1,
                              )
                            }
                            disabled={disabled || isEditMode}
                            title={
                              isEditMode
                                ? "Quantity cannot be edited after treatment creation"
                                : ""
                            }
                            min="1"
                            max="20"
                            className="min-h-8 w-20 px-2 py-1 text-sm"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">
                            {treatment.quantity}
                          </span>
                        )}
                      </td>

                      {/* Start Date (read-only in edit mode) */}
                      <td className="block py-2 md:table-cell md:px-1 md:py-3 md:align-bottom">
                        <TableMobileLabel>Start Date</TableMobileLabel>
                        {isEditing ? (
                          <div className="space-y-1">
                            {hasSlotError && (
                              <div className="text-xs text-red-600 px-2 py-1">
                                {TREATMENT_SLOTS_UNAVAILABLE_MESSAGE}
                              </div>
                            )}
                            <Input
                              type="date"
                              value={treatment.startDate}
                              onChange={(e) =>
                                handleFieldChange(
                                  index,
                                  "startDate",
                                  e.target.value,
                                )
                              }
                              disabled={disabled || isEditMode}
                              title={
                                isEditMode
                                  ? "Start date cannot be edited after treatment creation"
                                  : ""
                              }
                              invalid={hasSlotError}
                              className={
                                hasSlotError
                                  ? "min-h-8 px-2 py-1 text-sm bg-red-50"
                                  : "min-h-8 px-2 py-1 text-sm"
                              }
                            />
                          </div>
                        ) : (
                          <span
                            className={`flex items-center gap-1 text-sm ${
                              hasSlotError ? "text-red-600" : "text-gray-900"
                            }`}
                          >
                            {hasSlotError && (
                              <TriangleAlert
                                size={16}
                                className="text-red-600"
                              />
                            )}
                            {new Date(
                              treatment.startDate + "T00:00:00",
                            ).toLocaleDateString("en-US")}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="block border-t border-gray-100 py-2 pt-3 md:table-cell md:border-0 md:py-3 md:pl-1 md:pr-3 md:text-center md:align-bottom">
                        <TableMobileLabel>Actions</TableMobileLabel>
                        <div className="flex h-8 items-center justify-end md:justify-center">
                          <IconButton
                            type="button"
                            tone="danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveRow(index);
                            }}
                            disabled={!canRemoveRow}
                            title={
                              isEditMode && editSessionIds[index] !== undefined
                                ? "Remove the treatments previously created on the patient's page"
                                : "Remove treatment"
                            }
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isEditMode && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            fullWidth
            onClick={handleAddRow}
            disabled={disabled}
          >
            <Plus size={16} strokeWidth={2.5} />
            Add Treatment
          </Button>
        )}
      </div>
    );
  },
);

TreatmentRecommendationTable.displayName = "TreatmentRecommendationTable";

export default TreatmentRecommendationTable;
