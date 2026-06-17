/**
 * EditTreatmentModal component tests
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import EditTreatmentModal, {
  IS_ADD_TREATMENT_ROW_IN_EDIT_MODAL_ENABLED,
} from "../EditTreatmentModal";

const mockUpdateTreatment = jest.fn();
const mockCreateTreatment = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockRefetchQueries = jest.fn();

jest.mock("@/api/treatments", () => ({
  updateTreatment: (...args: unknown[]) => mockUpdateTreatment(...args),
  createTreatment: (...args: unknown[]) => mockCreateTreatment(...args),
}));

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
      refetchQueries: mockRefetchQueries,
    }),
  };
});

jest.mock("@/components/common/BaseModal", () => {
  return function MockBaseModal({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
  }) {
    if (!isOpen) return null;
    return (
      <div data-testid="base-modal">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
        <div>{children}</div>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    );
  };
});

jest.mock(
  "@/features/attendance/components/TreatmentRecommendations/TreatmentRecommendationTable",
  () => {
    const MockForm = React.forwardRef<
      { addRow: () => void },
      {
        treatmentType: string;
        treatments: unknown[];
        onChange: (
          treatments: unknown[],
          editSessionIds?: (number | undefined)[],
        ) => void;
        mode?: string;
        initialEditSessionIds?: number[];
      }
    >(function MockTreatmentRecommendationTable(props, ref) {
      React.useImperativeHandle(ref, () => ({
        addRow: () => {
          const t = props.treatments as Array<{
            locations: string[];
            color?: string;
            duration?: number;
          }>;
          const newRow =
            props.treatmentType === "physiotherapy"
              ? {
                  locations: [],
                  color: "",
                  duration: 1,
                  quantity: 1,
                  startDate: "2025-01-01",
                }
              : { locations: [], quantity: 1, startDate: "2025-01-01" };
          props.onChange(
            [...t, newRow],
            [...(props.initialEditSessionIds ?? []), undefined],
          );
        },
      }));
      return (
        <div data-testid="treatment-location-form">
          {props.treatments.map((row, i) => (
            <div key={i} data-testid={`row-${i}`}>
              {(row as { locations: string[] }).locations.join(",")}
            </div>
          ))}
        </div>
      );
    });
    MockForm.displayName = "MockTreatmentRecommendationTable";
    return MockForm;
  },
);

const defaultSessions = [
  {
    id: 1,
    consultationId: 10,
    attendanceId: 20,
    patientId: 1,
    treatmentType: "physiotherapy" as const,
    bodyLocation: "Cabeça",
    startDate: "2025-01-01",
    plannedSessions: 10,
    completedSessions: 0,
    status: "active",
    durationMinutes: 30,
    color: "azul",
    notes: undefined,
    createdDate: "2025-01-01",
    createdTime: "10:00:00",
    updatedDate: "2025-01-01",
    updatedTime: "10:00:00",
  },
];

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("EditTreatmentModal", () => {
  const onClose = jest.fn();
  const onSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateTreatment.mockResolvedValue({ success: true, value: {} });
    mockCreateTreatment.mockResolvedValue({
      success: true,
      value: { id: 2 },
    });
  });

  it("renders with physiotherapy title and subtitle", () => {
    render(
      <EditTreatmentModal
        isOpen={true}
        onClose={onClose}
        treatmentType="physiotherapy"
        treatmentPlans={defaultSessions}
        patientId={1}
        patientName="Maria"
      />,
      { wrapper: TestWrapper },
    );
    expect(screen.getByText("Editar Fisioterapia")).toBeInTheDocument();
    expect(screen.getByText(/Maria/)).toBeInTheDocument();
    expect(
      screen.getByText(/local do corpo.*cor e o tempo/),
    ).toBeInTheDocument();
  });

  it("renders with tens title and subtitle", () => {
    render(
      <EditTreatmentModal
        isOpen={true}
        onClose={onClose}
        treatmentType="tens"
        treatmentPlans={[
          {
            ...defaultSessions[0],
            id: 2,
            treatmentType: "tens",
            durationMinutes: undefined,
            color: undefined,
          },
        ]}
        patientId={1}
        patientName="João"
      />,
      { wrapper: TestWrapper },
    );
    expect(screen.getByText("Editar TENS")).toBeInTheDocument();
    expect(screen.getByText(/João/)).toBeInTheDocument();
  });

  it("shows validation error when submitting with empty locations", async () => {
    render(
      <EditTreatmentModal
        isOpen={true}
        onClose={onClose}
        treatmentType="physiotherapy"
        treatmentPlans={[{ ...defaultSessions[0], bodyLocation: "" }]}
        patientId={1}
        patientName="Maria"
      />,
      { wrapper: TestWrapper },
    );
    const saveButton = screen.getByRole("button", {
      name: /Salvar alterações/i,
    });
    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(
        screen.getByText(/Preencha o local do corpo em todas as linhas/i),
      ).toBeInTheDocument();
    });
    expect(mockUpdateTreatment).not.toHaveBeenCalled();
  });

  it("calls updateTreatment and onSuccess then onClose on successful submit", async () => {
    render(
      <EditTreatmentModal
        isOpen={true}
        onClose={onClose}
        treatmentType="physiotherapy"
        treatmentPlans={defaultSessions}
        patientId={1}
        patientName="Maria"
        onSuccess={onSuccess}
      />,
      { wrapper: TestWrapper },
    );
    const saveButton = screen.getByRole("button", {
      name: /Salvar alterações/i,
    });
    fireEvent.click(saveButton);
    await waitFor(() => {
      expect(mockUpdateTreatment).toHaveBeenCalledWith(
        "1",
        expect.objectContaining({
          bodyLocation: "Cabeça",
          color: "azul",
          durationMinutes: 30,
        }),
      );
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["treatments"],
    });
    expect(mockRefetchQueries).toHaveBeenCalledWith({
      queryKey: ["treatmentsByAttendance"],
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("shows submit error when update fails", async () => {
    mockUpdateTreatment.mockResolvedValueOnce({
      success: false,
      error: "Network error",
    });
    render(
      <EditTreatmentModal
        isOpen={true}
        onClose={onClose}
        treatmentType="physiotherapy"
        treatmentPlans={defaultSessions}
        patientId={1}
        patientName="Maria"
      />,
      { wrapper: TestWrapper },
    );
    fireEvent.click(screen.getByRole("button", { name: /Salvar alterações/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/Network error|Erro ao atualizar/i),
      ).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not render when isOpen is false", () => {
    render(
      <EditTreatmentModal
        isOpen={false}
        onClose={onClose}
        treatmentType="physiotherapy"
        treatmentPlans={defaultSessions}
        patientId={1}
        patientName="Maria"
      />,
      { wrapper: TestWrapper },
    );
    expect(screen.queryByText("Editar Fisioterapia")).not.toBeInTheDocument();
  });

  describe("add treatment row feature flag", () => {
    it("keeps flag off and hides modal add-row control", () => {
      expect(IS_ADD_TREATMENT_ROW_IN_EDIT_MODAL_ENABLED).toBe(false);
      render(
        <EditTreatmentModal
          isOpen={true}
          onClose={onClose}
          treatmentType="physiotherapy"
          treatmentPlans={defaultSessions}
          patientId={1}
          patientName="Maria"
        />,
        { wrapper: TestWrapper },
      );
      expect(
        screen.queryByTestId("edit-treatment-modal-add-row"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Adicionar novo tratamento/i }),
      ).not.toBeInTheDocument();
    });
  });
});
