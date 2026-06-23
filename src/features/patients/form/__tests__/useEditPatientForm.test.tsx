import { renderHook, act, waitFor } from "@testing-library/react";
import { useEditPatientForm } from "../hooks/useEditPatientForm";

// Mock the patient queries hook
const mockMutateAsync = jest.fn();
const mockDeleteAsync = jest.fn();
const mockRefetchPatients = jest.fn().mockResolvedValue({ data: [] });

jest.mock("@/api/query/hooks/usePatientQueries", () => ({
  useUpdatePatient: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useDeletePatient: () => ({
    mutateAsync: mockDeleteAsync,
    isPending: false,
  }),
  usePatients: () => ({
    data: [],
    refetch: mockRefetchPatients,
  }),
}));

// Mock the transformer utilities
jest.mock("@/utils/apiTransformers", () => ({
  transformPriorityToApi: jest.fn((priority) => priority),
  transformStatusToApi: jest.fn((status) => status),
}));

// Mock form helpers
jest.mock("@/utils/formUtils", () => ({
  formatPhoneNumber: jest.fn((phone) => phone),
}));

describe("useEditPatientForm", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  // Helper to create proper form event mock
  const createMockFormEvent = () =>
    ({ preventDefault: jest.fn() }) as unknown as React.FormEvent;

  const defaultInitialData = {
    name: "Test Patient",
    phone: "(11) 99999-9999",
    birthDate: "1990-01-01",
    priority: "2",
    status: "D",
    mainConcern: "Test complaint",
    dischargeDate: null,
    nextAppointmentDates: [],
  };

  const defaultProps = {
    patientId: "123",
    initialData: defaultInitialData,
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("initializes with provided data", () => {
    const { result } = renderHook(() => useEditPatientForm(defaultProps));

    expect(result.current.patient).toEqual(defaultInitialData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("updates patient field data with text input", () => {
    const { result } = renderHook(() => useEditPatientForm(defaultProps));

    act(() => {
      const mockEvent = {
        target: { name: "name", value: "Updated Name", type: "text" },
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleChange(mockEvent);
    });

    expect(result.current.patient.name).toBe("Updated Name");
  });

  it("handles phone number changes", () => {
    const { result } = renderHook(() => useEditPatientForm(defaultProps));

    act(() => {
      const mockEvent = {
        target: { name: "phone", value: "11999999999", type: "text" },
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleChange(mockEvent);
    });

    expect(result.current.patient.phone).toBe("11999999999");
  });

  it("handles date field changes", () => {
    const { result } = renderHook(() => useEditPatientForm(defaultProps));

    act(() => {
      const mockEvent = {
        target: { name: "birthDate", value: "1995-05-15", type: "date" },
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleChange(mockEvent);
    });

    expect(result.current.patient.birthDate).toBe("1995-05-15");
  });

  it("resets form when initialData changes", () => {
    const newInitialData = { ...defaultInitialData, name: "New Patient Name" };
    const { result, rerender } = renderHook(
      (props) => useEditPatientForm(props),
      { initialProps: defaultProps },
    );

    // Change a field
    act(() => {
      const mockEvent = {
        target: { name: "name", value: "Modified Name", type: "text" },
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleChange(mockEvent);
    });

    expect(result.current.patient.name).toBe("Modified Name");

    // Update initialData prop
    rerender({
      ...defaultProps,
      initialData: newInitialData,
    });

    expect(result.current.patient.name).toBe("New Patient Name");
    expect(result.current.error).toBe(null);
  });

  it("exposes required functions and state", () => {
    const { result } = renderHook(() => useEditPatientForm(defaultProps));

    expect(typeof result.current.handleChange).toBe("function");
    expect(typeof result.current.handleAssessmentConsultationChange).toBe(
      "function",
    );
    expect(typeof result.current.handleSubmit).toBe("function");
    expect(typeof result.current.setError).toBe("function");
    expect(typeof result.current.confirmStatusChange).toBe("function");
    expect(typeof result.current.cancelStatusChange).toBe("function");
    expect(typeof result.current.patient).toBe("object");
    expect(typeof result.current.isLoading).toBe("boolean");
    expect(result.current.error).toBe(null);
    expect(result.current.pendingStatusChange).toBe(null);
  });

  it("handles setError function", () => {
    const { result } = renderHook(() => useEditPatientForm(defaultProps));

    act(() => {
      result.current.setError("Test error");
    });

    expect(result.current.error).toBe("Test error");

    act(() => {
      result.current.setError(null);
    });

    expect(result.current.error).toBe(null);
  });

  it("maintains form state integrity", () => {
    const { result } = renderHook(() => useEditPatientForm(defaultProps));

    // Verify initial state
    expect(result.current.patient.name).toBe("Test Patient");

    // Change one field
    act(() => {
      const mockEvent = {
        target: { name: "name", value: "New Name", type: "text" },
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleChange(mockEvent);
    });

    // Other fields should remain unchanged
    expect(result.current.patient.name).toBe("New Name");
    expect(result.current.patient.phone).toBe("(11) 99999-9999");
  });

  // Tests for uncovered functionality
  describe("Date handling and validation", () => {
    it("should clear date when empty string is provided", () => {
      const { result } = renderHook(() => useEditPatientForm(defaultProps));

      act(() => {
        const mockEvent = {
          target: { name: "birthDate", value: "", type: "date" },
        } as React.ChangeEvent<HTMLInputElement>;
        result.current.handleChange(mockEvent);
      });

      expect(result.current.patient.birthDate).toBeNull();
    });
  });

  describe("Assessment consultation change handling", () => {
    it("should handle discharge date changes", () => {
      const { result } = renderHook(() => useEditPatientForm(defaultProps));

      act(() => {
        const mockEvent = {
          target: { name: "dischargeDate", value: "2024-12-31" },
        } as React.ChangeEvent<HTMLInputElement>;
        result.current.handleAssessmentConsultationChange(mockEvent);
      });

      expect(result.current.patient.dischargeDate).toBe("2024-12-31");
    });

    it("should clear discharge date when empty", () => {
      const { result } = renderHook(() => useEditPatientForm(defaultProps));

      act(() => {
        const mockEvent = {
          target: { name: "dischargeDate", value: "" },
        } as React.ChangeEvent<HTMLInputElement>;
        result.current.handleAssessmentConsultationChange(mockEvent);
      });

      expect(result.current.patient.dischargeDate).toBeNull();
    });

    it("should handle next appointment date changes", () => {
      const { result } = renderHook(() => useEditPatientForm(defaultProps));

      act(() => {
        const mockEvent = {
          target: { name: "firstConsultationDate", value: "2024-02-15" },
        } as React.ChangeEvent<HTMLInputElement>;
        result.current.handleAssessmentConsultationChange(mockEvent);
      });

      expect(result.current.patient.nextAppointmentDates).toEqual([
        { date: "2024-02-15", type: "assessment" },
      ]);
    });

    it("should clear next appointment dates when empty", () => {
      const { result } = renderHook(() => useEditPatientForm(defaultProps));

      act(() => {
        const mockEvent = {
          target: { name: "firstConsultationDate", value: "" },
        } as React.ChangeEvent<HTMLInputElement>;
        result.current.handleAssessmentConsultationChange(mockEvent);
      });

      expect(result.current.patient.nextAppointmentDates).toEqual([]);
    });

    it("should handle invalid date strings in assessment consultation changes", () => {
      const { result } = renderHook(() => useEditPatientForm(defaultProps));

      act(() => {
        const mockEvent = {
          target: { name: "dischargeDate", value: "invalid-date" },
        } as React.ChangeEvent<HTMLInputElement>;
        result.current.handleAssessmentConsultationChange(mockEvent);
      });

      // Invalid date string should still be stored as string
      expect(result.current.patient.dischargeDate).toBe("invalid-date");
    });
  });

  describe("Form validation", () => {
    it("should validate required name field", async () => {
      const { result } = renderHook(() => useEditPatientForm(defaultProps));

      // Clear the name
      act(() => {
        const mockEvent = {
          target: { name: "name", value: "   ", type: "text" },
        } as React.ChangeEvent<HTMLInputElement>;
        result.current.handleChange(mockEvent);
      });

      await act(async () => {
        const mockEvent = createMockFormEvent();
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toBe("Name is required");
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it("should validate required birth date field", async () => {
      const initialDataNoBirthDate = {
        ...defaultInitialData,
        birthDate: null,
      };

      const { result } = renderHook(() =>
        useEditPatientForm({
          ...defaultProps,
          initialData: initialDataNoBirthDate,
        }),
      );

      await act(async () => {
        const mockEvent = createMockFormEvent();
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toBe("Birth date is required");
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it("should reject discharge date earlier than last completed appointment", async () => {
      const { result } = renderHook(() =>
        useEditPatientForm({
          ...defaultProps,
          minDischargeDate: "2025-02-15",
        }),
      );

      act(() => {
        const mockEvent = {
          target: { name: "dischargeDate", value: "2025-02-01", type: "date" },
        } as React.ChangeEvent<HTMLInputElement>;
        result.current.handleChange(mockEvent);
      });

      await act(async () => {
        const mockEvent = createMockFormEvent();
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toContain(
        "The discharge date cannot be earlier than the date of the last completed appointment",
      );
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it("should allow discharge date on or after last completed appointment when minDischargeDate set", async () => {
      mockMutateAsync.mockResolvedValue({ id: 123, name: "Updated Patient" });
      const { result } = renderHook(() =>
        useEditPatientForm({
          ...defaultProps,
          minDischargeDate: "2025-02-15",
        }),
      );

      act(() => {
        const mockEvent = {
          target: { name: "dischargeDate", value: "2025-02-15", type: "date" },
        } as React.ChangeEvent<HTMLInputElement>;
        result.current.handleChange(mockEvent);
      });

      await act(async () => {
        const mockEvent = createMockFormEvent();
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toBeNull();
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    it("should validate phone format when provided", async () => {
      const { result } = renderHook(() => useEditPatientForm(defaultProps));

      // Set invalid phone format
      act(() => {
        const mockEvent = {
          target: { name: "phone", value: "123456789", type: "text" },
        } as React.ChangeEvent<HTMLInputElement>;
        result.current.handleChange(mockEvent);
      });

      await act(async () => {
        const mockEvent = createMockFormEvent();
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toBe(
        "Phone must be in format (XX) XXXXX-XXXX",
      );
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it("should pass validation with valid phone format", async () => {
      mockMutateAsync.mockResolvedValue({ id: 123, name: "Updated Patient" });
      const { result } = renderHook(() => useEditPatientForm(defaultProps));

      // Set valid phone format
      act(() => {
        const mockEvent = {
          target: { name: "phone", value: "(11) 98765-4321", type: "text" },
        } as React.ChangeEvent<HTMLInputElement>;
        result.current.handleChange(mockEvent);
      });

      await act(async () => {
        const mockEvent = createMockFormEvent();
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toBeNull();
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    it("should allow empty phone number", async () => {
      mockMutateAsync.mockResolvedValue({ id: 123, name: "Updated Patient" });
      const { result } = renderHook(() => useEditPatientForm(defaultProps));

      // Clear phone
      act(() => {
        const mockEvent = {
          target: { name: "phone", value: "", type: "text" },
        } as React.ChangeEvent<HTMLInputElement>;
        result.current.handleChange(mockEvent);
      });

      await act(async () => {
        const mockEvent = createMockFormEvent();
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toBeNull();
      expect(mockMutateAsync).toHaveBeenCalled();
    });
  });

  describe("Status change confirmation (Discharged/Consecutive no-shows)", () => {
    it("should set pendingStatusChange when submitting with status D and openAppointmentsCount > 0", async () => {
      const propsWithOpenAppointments = {
        ...defaultProps,
        initialData: { ...defaultInitialData, status: "D" },
        openAppointmentsCount: 2,
      };
      const { result } = renderHook(() =>
        useEditPatientForm(propsWithOpenAppointments),
      );

      await act(async () => {
        const mockEvent = createMockFormEvent();
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.pendingStatusChange).toEqual({
        newStatus: "D",
        openCount: 2,
      });
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it("should set pendingStatusChange when submitting with status C and openAppointmentsCount > 0", async () => {
      const propsWithOpenAppointments = {
        ...defaultProps,
        initialData: { ...defaultInitialData, status: "C" },
        openAppointmentsCount: 1,
      };
      const { result } = renderHook(() =>
        useEditPatientForm(propsWithOpenAppointments),
      );

      await act(async () => {
        const mockEvent = createMockFormEvent();
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.pendingStatusChange).toEqual({
        newStatus: "C",
        openCount: 1,
      });
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it("should not set pendingStatusChange when openAppointmentsCount is 0", async () => {
      mockMutateAsync.mockResolvedValue({ id: 123, name: "Updated" });
      const propsNoOpenAppointments = {
        ...defaultProps,
        initialData: { ...defaultInitialData, status: "D" },
        openAppointmentsCount: 0,
      };
      const { result } = renderHook(() =>
        useEditPatientForm(propsNoOpenAppointments),
      );

      await act(async () => {
        const mockEvent = createMockFormEvent();
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.pendingStatusChange).toBe(null);
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    it("should clear pendingStatusChange and submit when confirmStatusChange is called", async () => {
      mockMutateAsync.mockResolvedValue({ id: 123, name: "Updated" });
      const propsWithOpenAppointments = {
        ...defaultProps,
        initialData: { ...defaultInitialData, status: "D" },
        openAppointmentsCount: 2,
      };
      const { result } = renderHook(() =>
        useEditPatientForm(propsWithOpenAppointments),
      );

      await act(async () => {
        await result.current.handleSubmit(createMockFormEvent());
      });
      expect(result.current.pendingStatusChange).not.toBe(null);

      act(() => {
        result.current.confirmStatusChange();
      });

      await waitFor(() => {
        expect(result.current.pendingStatusChange).toBe(null);
      });
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });

    it("should clear pendingStatusChange when cancelStatusChange is called", async () => {
      const propsWithOpenAppointments = {
        ...defaultProps,
        initialData: { ...defaultInitialData, status: "D" },
        openAppointmentsCount: 2,
      };
      const { result } = renderHook(() =>
        useEditPatientForm(propsWithOpenAppointments),
      );

      await act(async () => {
        await result.current.handleSubmit(createMockFormEvent());
      });
      expect(result.current.pendingStatusChange).not.toBe(null);

      act(() => {
        result.current.cancelStatusChange();
      });

      expect(result.current.pendingStatusChange).toBe(null);
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe("Form submission", () => {
    it("should handle successful form submission with all fields", async () => {
      const mockUpdatedPatient = { id: 123, name: "Updated Patient" };
      mockMutateAsync.mockResolvedValue(mockUpdatedPatient);
      const { result } = renderHook(() => useEditPatientForm(defaultProps));

      await act(async () => {
        const mockEvent = createMockFormEvent();
        await result.current.handleSubmit(mockEvent);
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        patientId: "123",
        data: expect.objectContaining({
          name: "Test Patient",
          phone: "(11) 99999-9999",
          birthDate: "1990-01-01",
          mainConcern: "Test complaint",
        }),
      });
      expect(mockOnSuccess).toHaveBeenCalledWith(mockUpdatedPatient);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should handle form submission without optional phone", async () => {
      const mockUpdatedPatient = { id: 123, name: "Updated Patient" };
      mockMutateAsync.mockResolvedValue(mockUpdatedPatient);

      const initialDataNoPhone = {
        ...defaultInitialData,
        phone: "",
      };

      const { result } = renderHook(() =>
        useEditPatientForm({
          ...defaultProps,
          initialData: initialDataNoPhone,
        }),
      );

      await act(async () => {
        const mockEvent = createMockFormEvent();
        await result.current.handleSubmit(mockEvent);
      });

      const callArgs = mockMutateAsync.mock.calls[0][0];
      expect(callArgs.data).not.toHaveProperty("phone");
    });

    it("should handle form submission with invalid birth date", async () => {
      const mockUpdatedPatient = { id: 123, name: "Updated Patient" };
      mockMutateAsync.mockResolvedValue(mockUpdatedPatient);

      const initialDataInvalidDate = {
        ...defaultInitialData,
        birthDate: "invalid",
      };

      const { result } = renderHook(() =>
        useEditPatientForm({
          ...defaultProps,
          initialData: initialDataInvalidDate,
        }),
      );

      await act(async () => {
        const mockEvent = createMockFormEvent();
        await result.current.handleSubmit(mockEvent);
      });

      const callArgs = mockMutateAsync.mock.calls[0][0];
      expect(callArgs.data).not.toHaveProperty("birth_date");
    });

    it("should handle API errors during submission", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockMutateAsync.mockRejectedValue(new Error("API Error"));

      const { result } = renderHook(() => useEditPatientForm(defaultProps));

      await act(async () => {
        const mockEvent = createMockFormEvent();
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toBe("Internal server error");
      expect(result.current.isLoading).toBe(false);
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("should handle form submission without onSuccess callback", async () => {
      const mockUpdatedPatient = { id: 123, name: "Updated Patient" };
      mockMutateAsync.mockResolvedValue(mockUpdatedPatient);

      const propsWithoutOnSuccess = {
        ...defaultProps,
        onSuccess: undefined,
      };

      const { result } = renderHook(() =>
        useEditPatientForm(propsWithoutOnSuccess),
      );

      await act(async () => {
        const mockEvent = createMockFormEvent();
        await result.current.handleSubmit(mockEvent);
      });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Delete patient", () => {
    it("should map delete error to appointment-history friendly message", async () => {
      const mockOnError = jest.fn();
      mockDeleteAsync.mockRejectedValue(
        new Error("Cannot delete patient 123: Has 1 active appointments"),
      );
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { result } = renderHook(() =>
        useEditPatientForm({
          ...defaultProps,
          onError: mockOnError,
        }),
      );

      await act(async () => {
        await expect(result.current.handleDelete()).rejects.toThrow();
      });

      expect(result.current.error).toBe(
        "It is not possible to delete this patient because he has ongoing or completed appointments. " +
          "Deletion is only allowed for patients without appointment history or with only canceled or missed appointments.",
      );
      expect(mockOnError).toHaveBeenCalledWith(
        "It is not possible to delete this patient because he has ongoing or completed appointments. " +
          "Deletion is only allowed for patients without appointment history or with only canceled or missed appointments.",
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
