import { useState, useCallback } from "react";
import { formatPhoneNumber, validatePatientForm } from "@/utils/formUtils";

interface UseFormHandlerOptions<T> {
  initialState: T;
  onSubmit?: (data: T) => Promise<void> | void;
  validate?: (data: T) => string | null;
  formatters?: {
    [K in keyof T]?: (value: unknown) => unknown;
  };
}

interface UseFormHandlerReturn<T> {
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  resetForm: () => void;
  clearError: () => void;
}

/**
 * Generic form handler hook with common patterns
 */
export function useFormHandler<T>({
  initialState,
  onSubmit,
  validate,
  formatters = {},
}: UseFormHandlerOptions<T>): UseFormHandlerReturn<T> {
  const [formData, setFormData] = useState<T>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

      setFormData(prev => {
        const newValue = type === "checkbox" ? checked : value;
        
        // Apply formatter if available
        const formatter = formatters[name as keyof T];
        const processedValue = formatter ? formatter(newValue) : newValue;

        return {
          ...prev,
          [name]: processedValue,
        };
      });

      // Clear error when user starts typing
      if (error) {
        setError(null);
      }
    },
    [formatters, error]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (isLoading) return;

      // Validate if validator provided
      if (validate) {
        const validationError = validate(formData);
        if (validationError) {
          setError(validationError);
          return;
        }
      }

      if (!onSubmit) return;

      setIsLoading(true);
      setError(null);

      try {
        await onSubmit(formData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro inesperado";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [formData, isLoading, validate, onSubmit]
  );

  const resetForm = useCallback(() => {
    setFormData(initialState);
    setError(null);
    setIsLoading(false);
  }, [initialState]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    formData,
    setFormData,
    handleChange,
    handleSubmit,
    isLoading,
    error,
    setError,
    resetForm,
    clearError,
  };
}

/**
 * Specialized hook for patient forms
 */
export function usePatientFormHandler<T extends { name: string; phone: string; birthDate: string | null }>({
  initialState,
  onSubmit,
  requirePhone = false,
  requireBirthDate = false,
}: {
  initialState: T;
  onSubmit?: (data: T) => Promise<void> | void;
  requirePhone?: boolean;
  requireBirthDate?: boolean;
}) {
  return useFormHandler({
    initialState,
    onSubmit,
    validate: (data) => validatePatientForm(data, requirePhone, requireBirthDate),
    formatters: {
      phone: formatPhoneNumber as (value: unknown) => unknown,
      // birthDate remains as string - no conversion needed
    } as { [K in keyof T]?: (value: unknown) => unknown },
  });
}
