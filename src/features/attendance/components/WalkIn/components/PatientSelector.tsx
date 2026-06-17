import React from "react";
import { Search } from "lucide-react";
import Switch from "@/components/ui/Switch";
import { Field, Input } from "@/components/ui";

interface Patient {
  id: string;
  name: string;
}

interface PatientSelectorProps {
  isNewPatient: boolean;
  name: string;
  showDropdown: boolean;
  filteredPatients: Patient[];
  isSubmitting: boolean;
  onNewPatientToggle: (checked: boolean) => void;
  onNameChange: (value: string) => void;
  onPatientSelect: (name: string) => void;
  onFocus: () => void;
  setShowDropdown: (show: boolean) => void;
}

export const PatientSelector: React.FC<PatientSelectorProps> = ({
  isNewPatient,
  name,
  showDropdown,
  filteredPatients,
  isSubmitting,
  onNewPatientToggle,
  onNameChange,
  onPatientSelect,
  onFocus,
}) => {
  return (
    <>
      <Field label="Nome do Paciente">
      <Switch
        id="new-patient-switch"
        checked={isNewPatient}
        onChange={onNewPatientToggle}
        disabled={isSubmitting}
        label="Novo paciente"
        labelPosition="right"
        size="sm"
        className="mb-2"
      />

      <div className="relative mb-4">
        {isNewPatient ? (
          <Input
            name="name"
            className="pr-10"
            placeholder="Nome do novo paciente..."
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            required
            disabled={isSubmitting}
          />
        ) : (
          <>
            <Input
              name="name"
              className="pr-10"
              placeholder="Buscar paciente pelo nome..."
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              onFocus={onFocus}
              required
              disabled={isSubmitting}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            {showDropdown && name && filteredPatients.length > 0 && (
              <ul className="absolute z-10 bg-white border border-gray-200 w-full max-h-40 overflow-y-auto rounded shadow">
                {filteredPatients.map((p) => (
                  <li
                    key={p.id}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => onPatientSelect(p.name)}
                  >
                    {p.name}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
      </Field>
    </>
  );
};
