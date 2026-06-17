import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { HolidayTemplate, HolidayTemplateItem } from "@/types/holidayTemplate";
import BaseModal from "@/components/common/BaseModal";
import { Button, Field, IconButton, Input, Select, Textarea } from "@/components/ui";

interface TemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    holidays: HolidayTemplateItem[];
  }) => void;
  template?: HolidayTemplate | null;
  isLoading?: boolean;
}

const MONTHS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

export const TemplateFormModal: React.FC<TemplateFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  template,
  isLoading = false,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [holidays, setHolidays] = useState<HolidayTemplateItem[]>([]);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || "");
      setHolidays(template.holidays);
    } else {
      setName("");
      setDescription("");
      setHolidays([]);
    }
  }, [template]);

  const handleAddHoliday = () => {
    setHolidays([...holidays, { month: 1, day: 1, name: "", description: "" }]);
  };

  const handleRemoveHoliday = (index: number) => {
    setHolidays(holidays.filter((_, i) => i !== index));
  };

  const handleHolidayChange = (
    index: number,
    field: keyof HolidayTemplateItem,
    value: string | number,
  ) => {
    const updated = [...holidays];
    updated[index] = { ...updated[index], [field]: value };
    setHolidays(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description: description || undefined,
      holidays: holidays.filter((h) => h.name.trim() !== ""),
    });
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={template ? "Editar Modelo" : "Novo Modelo"}
      maxWidth="3xl"
      preventOverflow
      showCloseButton={!isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto p-4 sm:p-6">
          <Field label="Nome do Modelo *">
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Feriados Nacionais Brasileiros"
              required
            />
          </Field>

          <Field label="Descrição">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional do modelo"
              rows={2}
            />
          </Field>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Feriados *
              </label>
              <Button
                type="button"
                size="sm"
                onClick={handleAddHoliday}
              >
                <Plus className="w-4 h-4" />
                Adicionar Feriado
              </Button>
            </div>

            {holidays.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-md">
                Nenhum feriado adicionado. Clique em &ldquo;Adicionar
                Feriado&rdquo; para começar.
              </div>
            ) : (
              <div className="space-y-3">
                {holidays.map((holiday, index) => (
                  <div
                    key={index}
                    className="flex gap-3 items-start p-4 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Mês
                        </label>
                        <Select
                          value={holiday.month}
                          onChange={(e) =>
                            handleHolidayChange(
                              index,
                              "month",
                              Number(e.target.value),
                            )
                          }
                          className="min-h-10 px-2 py-1.5 text-sm"
                        >
                          {MONTHS.map((month) => (
                            <option key={month.value} value={month.value}>
                              {month.label}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Dia
                        </label>
                        <Input
                          type="number"
                          min="1"
                          max="31"
                          value={holiday.day}
                          onChange={(e) =>
                            handleHolidayChange(
                              index,
                              "day",
                              Number(e.target.value),
                            )
                          }
                          className="min-h-10 px-2 py-1.5 text-sm"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Nome *
                        </label>
                        <Input
                          type="text"
                          value={holiday.name}
                          onChange={(e) =>
                            handleHolidayChange(index, "name", e.target.value)
                          }
                          className="min-h-10 px-2 py-1.5 text-sm"
                          placeholder="Ex: Natal"
                          required
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Descrição
                        </label>
                        <Input
                          type="text"
                          value={holiday.description || ""}
                          onChange={(e) =>
                            handleHolidayChange(
                              index,
                              "description",
                              e.target.value,
                            )
                          }
                          className="min-h-10 px-2 py-1.5 text-sm"
                          placeholder="Descrição opcional"
                        />
                      </div>
                    </div>

                    <IconButton
                      type="button"
                      tone="danger"
                      onClick={() => handleRemoveHoliday(index)}
                      className="mt-6"
                      title="Remover feriado"
                      aria-label="Remover feriado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </IconButton>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim() || holidays.length === 0}
              isLoading={isLoading}
              loadingText="Salvando..."
            >
              {template ? "Salvar Alterações" : "Criar Modelo"}
            </Button>
          </div>
        </form>
    </BaseModal>
  );
};
