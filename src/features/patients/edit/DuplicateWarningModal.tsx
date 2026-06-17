import React from "react";
import Link from "next/link";
import BaseModal from "@/components/common/BaseModal";
import { User, Phone } from "lucide-react";
import { Button } from "@/components/ui";

interface DuplicatePatient {
  id: string;
  name: string;
  phone: string;
  priority: string;
  status: string;
}

interface DuplicateWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAnyway: () => void;
  duplicatePatients: DuplicatePatient[];
  isSaving: boolean;
}

const DuplicateWarningModal: React.FC<DuplicateWarningModalProps> = ({
  isOpen,
  onClose,
  onSaveAnyway,
  duplicatePatients,
  isSaving,
}) => {
  const getStatusText = (status: string) => {
    switch (status) {
      case "N":
        return "Paciente Novo";
      case "T":
        return "Em Tratamento";
      case "A":
        return "Alta do tratamento";
      case "F":
        return "Faltas Consecutivas";
      default:
        return status;
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Paciente com informações similares"
      maxWidth="lg"
    >
      <div className="p-6">
        {/* Warning Message */}
        <div className="text-start mb-6">
          <p className="text-md text-gray-800">
            Verifique se já existe um cadastro para este paciente antes de
            salvar.
          </p>
        </div>

        {/* Similar Patients List */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Pacientes Similares:
          </h3>
          <div className="space-y-3">
            {duplicatePatients.map((patient) => (
              <div
                key={patient.id}
                className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {patient.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        #{patient.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-3 h-3" />
                      <span>{patient.phone || "Sem telefone"}</span>
                    </div>
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {getStatusText(patient.status)}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/patients/${patient.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Ver Perfil →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isSaving}
          >
            Cancelar e Revisar
          </Button>
          <Button
            type="button"
            onClick={onSaveAnyway}
            isLoading={isSaving}
            loadingText="Salvando..."
            className="flex-1"
          >
            Salvar Mesmo Assim
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default DuplicateWarningModal;
