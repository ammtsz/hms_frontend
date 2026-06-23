"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import TreatmentOptionRow from "./TreatmentOptionRow";
import {
  Button,
  Card,
  Input,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  stackedTableClasses,
} from "@/components/ui";
import {
  useBodyLocations,
  useColors,
  useCreateBodyLocation,
  useCreateColor,
  useCheckSimilarOptions,
} from "@/api/query/hooks/useSystemOptionsQueries";
import { SystemOptionType, SimilarOption } from "@/types/systemOptions";
import { useAuthContext } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";

const DEFAULT_MAX_VALUE_LENGTH = 50;

interface TreatmentOptionsListProps {
  type: SystemOptionType;
  /** Max length for the option value (matches backend `hms_system_options.value`). */
  maxValueLength?: number;
}

export default function TreatmentOptionsList({
  type,
  maxValueLength = DEFAULT_MAX_VALUE_LENGTH,
}: TreatmentOptionsListProps) {
  const { user } = useAuthContext();
  const isAdmin = user?.role === UserRole.ADMIN;
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [error, setError] = useState("");
  const [similarOptions, setSimilarOptions] = useState<SimilarOption[]>([]);
  const [showSimilarWarning, setShowSimilarWarning] = useState(false);

  const checkSimilarOptions = useCheckSimilarOptions();
  const isBodyLocation = type === SystemOptionType.BODY_LOCATION;

  // Call all hooks unconditionally (React rules) - include inactive for settings management
  const bodyLocationsQuery = useBodyLocations(true);
  const colorsQuery = useColors(true);
  const createBodyLocationMutation = useCreateBodyLocation();
  const createColorMutation = useCreateColor();

  // Select the correct hooks based on type
  const { data: options, isLoading } = isBodyLocation
    ? bodyLocationsQuery
    : colorsQuery;
  const createMutation = isBodyLocation
    ? createBodyLocationMutation
    : createColorMutation;

  const label = isBodyLocation ? "body location" : "color";
  const labelCapitalized = isBodyLocation ? "Body Location" : "Color";

  const handleAdd = async () => {
    const trimmed = newValue.trim();
    if (!trimmed) {
      setError(`Name of ${label} is required`);
      return;
    }

    if (trimmed.length > maxValueLength) {
      setError(`Name must not exceed ${maxValueLength} characters`);
      return;
    }

    const similarResult = await checkSimilarOptions(type, trimmed);

    if (
      similarResult.success &&
      similarResult.value &&
      similarResult.value.length > 0
    ) {
      setSimilarOptions(similarResult.value);
      setShowSimilarWarning(true);
      return;
    }

    await createOption();
  };

  const createOption = async () => {
    const trimmed = newValue.trim();
    if (!trimmed) {
      setError(`Name of ${label} is required`);
      return;
    }
    if (trimmed.length > maxValueLength) {
      setError(`Name must not exceed ${maxValueLength} characters`);
      return;
    }
    try {
      setError("");
      await createMutation.mutateAsync(trimmed);
      setNewValue("");
      setIsAdding(false);
      setSimilarOptions([]);
      setShowSimilarWarning(false);
    } catch (err) {
      if (
        (err as { response?: { status?: number } }).response?.status === 409
      ) {
        setError(`This ${label} already exists`);
      } else {
        setError(`Error creating ${label}. Please try again.`);
      }
    }
  };

  const handleCancelWarning = () => {
    setShowSimilarWarning(false);
    setSimilarOptions([]);
  };

  const handleConfirmCreate = async () => {
    await createOption();
  };

  const handleCancel = () => {
    setNewValue("");
    setIsAdding(false);
    setError("");
    setSimilarOptions([]);
    setShowSimilarWarning(false);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <TableContainer className="[&>div]:overflow-visible md:[&>div]:overflow-x-auto">
        <Table className={stackedTableClasses.table}>
          <TableHeader className={stackedTableClasses.header}>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden w-32 md:table-cell">Usage</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead align="center" className="w-24">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={stackedTableClasses.body}>
            {options && options.length > 0 ? (
              options.map((option) => (
                <TreatmentOptionRow
                  key={option.id}
                  option={option}
                  type={type}
                />
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  align="center"
                  className="py-8 text-gray-500"
                >
                  No {label} found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add New Form — admin only; collaborators create body locations from appointment forms */}
      {isAdding && isAdmin ? (
        <Card className="border-blue-300 bg-blue-50 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {labelCapitalized}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="text"
              value={newValue}
              onChange={(e) =>
                setNewValue(e.target.value.slice(0, maxValueLength))
              }
              placeholder={`Name of ${label}`}
              className="flex-1"
              maxLength={maxValueLength}
              autoFocus
            />
            <Button
              onClick={handleAdd}
              disabled={createMutation.isPending}
              isLoading={createMutation.isPending}
              loadingText="Saving..."
            >
              Save
            </Button>
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={createMutation.isPending}
              className="bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </Button>
          </div>

          {/* Similar Names Warning */}
          {showSimilarWarning && similarOptions.length > 0 && (
            <div className="mt-3 rounded-md bg-amber-50 p-4 border border-amber-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-amber-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-amber-800">
                    Similar {labelCapitalized}s Found
                  </h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p>
                      The following {label}s are very similar to &ldquo;
                      {newValue}&rdquo;:
                    </p>
                    <ul className="list-disc list-inside mt-1">
                      {similarOptions.map((option) => (
                        <li key={option.id}>
                          {option.value} ({(option.similarity * 100).toFixed(0)}
                          % similar)
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2">Do you want to create it anyway?</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700"
                      onClick={handleConfirmCreate}
                      disabled={createMutation.isPending}
                      isLoading={createMutation.isPending}
                      loadingText="Creating..."
                    >
                      Yes, Create
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelWarning}
                      className="border-amber-300 text-amber-800 hover:bg-amber-50"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="mt-1 text-xs text-gray-500">
            {newValue.length}/{maxValueLength} characters
          </p>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </Card>
      ) : (
        isAdmin && (
          <Button
            variant="outline"
            onClick={() => setIsAdding(true)}
            className="w-full border-2 border-dashed border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600"
          >
            <Plus className="w-5 h-5" />
            Add New {labelCapitalized}
          </Button>
        )
      )}
    </div>
  );
}
