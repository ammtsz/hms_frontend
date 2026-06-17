import React from "react";
import { Checkbox } from "./Checkbox";

interface SwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  labelPosition?: "left" | "right";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({
  id,
  checked,
  onChange,
  disabled = false,
  label,
  labelPosition = "right",
  size = "md",
  className = "",
}) => {
  const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

  // Size configurations
  const sizeConfig = {
    sm: {
      container: "w-8 h-4",
      toggle: "w-3 h-3 top-0.5 left-0.5",
      translate: "translate-x-4",
    },
    md: {
      container: "w-11 h-6",
      toggle: "w-5 h-5 top-0.5 left-0.5",
      translate: "translate-x-5",
    },
    lg: {
      container: "w-14 h-8",
      toggle: "w-7 h-7 top-0.5 left-0.5",
      translate: "translate-x-6",
    },
  };

  const config = sizeConfig[size];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(e.target.checked);
    }
  };

  const switchElement = (
    <div className="relative">
      <Checkbox
        id={switchId}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
      />
      <label
        htmlFor={switchId}
        className={`flex items-center cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <div
          className={`relative ${
            config.container
          } rounded-full transition-colors duration-200 ease-in-out ${
            checked ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          <div
            className={`absolute ${
              config.toggle
            } bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
              checked ? config.translate : "translate-x-0"
            }`}
          />
        </div>
      </label>
    </div>
  );

  const labelElement = label ? (
    <label
      htmlFor={switchId}
      className={`text-sm font-medium select-none cursor-pointer ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {label}
    </label>
  ) : null;

  if (!label) {
    return <div className={className}>{switchElement}</div>;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {labelPosition === "left" ? (
        <>
          {labelElement}
          {switchElement}
        </>
      ) : (
        <>
          {switchElement}
          {labelElement}
        </>
      )}
    </div>
  );
};

export default Switch;
