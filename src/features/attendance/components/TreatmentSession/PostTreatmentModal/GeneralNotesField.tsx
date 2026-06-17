import React from "react";
import { Field, Textarea } from "@/components/ui";

interface GeneralNotesFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export const GeneralNotesField: React.FC<GeneralNotesFieldProps> = ({
  value,
  onChange,
}) => (
  <div className="mt-4">
    <Field label="Observações (opcional)" htmlFor="post-treatment-notes">
      <Textarea
        id="post-treatment-notes"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 1000))}
        placeholder="Observações da sessão"
        rows={2}
      />
    </Field>
    <div className="text-xs text-gray-500 text-right">{value.length}/1000</div>
  </div>
);
