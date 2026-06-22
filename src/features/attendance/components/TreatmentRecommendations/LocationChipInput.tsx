import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button, IconButton, Input } from "@/components/ui";

interface LocationChipInputProps {
  selectedLocations: string[];
  availableLocations: string[];
  onChange: (locations: string[]) => void;
  onCreateNew: (value: string) => Promise<string>;
  disabled?: boolean;
  isCreating?: boolean;
  /** When true, selecting a location replaces the current selection (max 1). */
  singleSelect?: boolean;
}

function LocationChipInput({
  selectedLocations,
  availableLocations,
  onChange,
  onCreateNew,
  disabled = false,
  isCreating = false,
  singleSelect = false,
}: LocationChipInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizeString = (str: string) => str.toLowerCase().trim();

  // Calculate dropdown position when opening
  useEffect(() => {
    if (showDropdown && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [showDropdown]);

  // Filter available locations based on input
  const filteredLocations = availableLocations.filter(
    (loc) =>
      normalizeString(loc).includes(normalizeString(inputValue)) &&
      !selectedLocations.some(
        (sel) => normalizeString(sel) === normalizeString(loc),
      ),
  );

  // Check if input matches existing location exactly
  const exactMatch = availableLocations.find(
    (loc) => normalizeString(loc) === normalizeString(inputValue),
  );

  // Check if we should show "Create new" option
  const showCreateOption =
    inputValue.trim() &&
    !exactMatch &&
    !selectedLocations.some(
      (sel) => normalizeString(sel) === normalizeString(inputValue),
    );

  const allOptions = [...filteredLocations];
  if (showCreateOption) {
    allOptions.push(`__CREATE__${inputValue.trim()}`);
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddLocation = (location: string) => {
    if (
      !selectedLocations.some(
        (sel) => normalizeString(sel) === normalizeString(location),
      )
    ) {
      onChange(singleSelect ? [location] : [...selectedLocations, location]);
    }
    setInputValue("");
    setShowDropdown(false);
    setHighlightedIndex(0);
    // In single-select mode, keep options closed after selection.
    if (!singleSelect) {
      inputRef.current?.focus();
    }
  };

  const handleRemoveLocation = (locationToRemove: string) => {
    onChange(selectedLocations.filter((loc) => loc !== locationToRemove));
  };

  const hasSingleSelection = singleSelect && selectedLocations.length === 1;

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (allOptions.length > 0) {
        const selected = allOptions[highlightedIndex];
        if (selected.startsWith("__CREATE__")) {
          const newValue = selected.replace("__CREATE__", "");
          try {
            const createdLocation = await onCreateNew(newValue);
            handleAddLocation(createdLocation);
          } catch (error) {
            console.error("Failed to create location:", error);
          }
        } else {
          handleAddLocation(selected);
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < allOptions.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    } else if (
      e.key === "Backspace" &&
      !inputValue &&
      selectedLocations.length > 0
    ) {
      handleRemoveLocation(selectedLocations[selectedLocations.length - 1]);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex flex-col gap-2 min-h-[32px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
        {!hasSingleSelection && (
          <div className="flex flex-wrap gap-1">
            {selectedLocations.map((location) => (
              <span
                key={location}
                className="inline-flex h-5 w-fit max-w-full items-center gap-0.5 rounded-full bg-gray-300 pl-1.5 pr-0.5 text-xs font-medium leading-none text-gray-800"
              >
                {location}
                <button
                  type="button"
                  onClick={() => handleRemoveLocation(location)}
                  disabled={disabled}
                  className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded p-0 text-gray-600 hover:bg-gray-400/60 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Remove ${location}`}
                >
                  <X size={10} aria-hidden />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={hasSingleSelection ? selectedLocations[0] : inputValue}
            onChange={(e) => {
              if (hasSingleSelection) {
                onChange([]);
              }
              setInputValue(e.target.value);
              setShowDropdown(true);
              setHighlightedIndex(0);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isCreating}
            placeholder={"Search or create..."}
            className={`min-h-8 min-w-[120px] border-0 bg-transparent px-0 py-0 text-sm shadow-none focus:border-transparent focus:ring-0 ${
              hasSingleSelection ? "pr-7" : ""
            }`}
          />
          {hasSingleSelection && (
            <IconButton
              type="button"
              onClick={() => {
                if (disabled || isCreating) return;
                handleRemoveLocation(selectedLocations[0]);
                setInputValue("");
                setShowDropdown(true);
                setHighlightedIndex(0);
                inputRef.current?.focus();
              }}
              disabled={disabled || isCreating}
              tone="danger"
              className="absolute right-1 top-1/2 min-h-6 min-w-6 -translate-y-1/2 p-0"
              aria-label="Reset"
              title="Reset"
            >
              <X size={14} className="mr-2 text-red-500" />
            </IconButton>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && allOptions.length > 0 && (
        <div
          ref={dropdownRef}
          className="fixed bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-auto"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 9999,
          }}
        >
          {filteredLocations.map((location, index) => (
            <Button
              variant="ghost"
              size="sm"
              key={location}
              onClick={() => handleAddLocation(location)}
              className={`block min-h-0 w-full justify-start rounded-none px-3 py-2 text-left font-normal ${
                index === highlightedIndex
                  ? "bg-blue-100 text-blue-900"
                  : "hover:bg-gray-50"
              }`}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {location}
            </Button>
          ))}
          {showCreateOption && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  const createdLocation = await onCreateNew(inputValue.trim());
                  handleAddLocation(createdLocation);
                } catch (error) {
                  console.error("Failed to create location:", error);
                }
              }}
              className={`block min-h-0 w-full justify-start rounded-none border-t border-gray-200 px-3 py-2 text-left ${
                highlightedIndex === filteredLocations.length
                  ? "bg-green-100 text-green-900"
                  : "bg-green-50 text-green-700 hover:bg-green-100"
              }`}
              onMouseEnter={() => setHighlightedIndex(filteredLocations.length)}
            >
              {isCreating ? (
                <span>Creating...</span>
              ) : (
                <span>✨ Create &ldquo;{inputValue.trim()}&rdquo; and add</span>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default LocationChipInput;
