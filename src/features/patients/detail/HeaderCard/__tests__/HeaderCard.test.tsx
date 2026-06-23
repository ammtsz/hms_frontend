import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HeaderCard } from "..";
import { Patient, Priority } from "@/types/types";
import { ClinicTimezoneProvider } from "@/contexts/ClinicTimezoneContext";
import { usePriorities } from "@/api/query/hooks/usePriorityOptionsQueries";

jest.mock("@/api/query/hooks/usePriorityOptionsQueries", () => ({
  usePriorities: jest.fn(),
}));

const mockUsePriorities = usePriorities as jest.MockedFunction<
  typeof usePriorities
>;

const mockPriorities = [
  { value: "1", label: "Priority", isActive: true },
  { value: "2", label: "Standard", isActive: true },
  { value: "3", label: "Priority 3", isActive: true },
] as unknown as Array<{ value: string; label: string; isActive: boolean }>;

// Mock Next.js Link component
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

const mockPatient: Patient = {
  id: "1",
  name: "John Smith",
  phone: "(11) 99999-9999",
  birthDate: "1980-05-15",
  mainConcern: "Frequent headaches",
  status: "D",
  priority: "2",
  startDate: "2024-01-15",
  dischargeDate: null,
  timezone: "America/Sao_Paulo",
  nextAttendanceDates: [
    {
      date: "2024-12-28",
      type: "assessment",
    },
  ],
  currentRecommendations: {
    date: "2024-12-20",
    food: "Light meals",
    water: "2L/day",
    ointment: "Apply 2x daily",
    physiotherapy: true,
    tens: false,
    returnWeeks: 2,
  },
  previousAttendances: [],
  missingAppointmentsStreak: 0,
};

// Helper function to render with QueryClient
const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ClinicTimezoneProvider>{component}</ClinicTimezoneProvider>
    </QueryClientProvider>,
  );
};

describe("HeaderCard", () => {
  beforeEach(() => {
    mockUsePriorities.mockReturnValue({
      data: mockPriorities,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof usePriorities>);
  });

  it("renders patient basic information correctly", () => {
    renderWithQueryClient(<HeaderCard patient={mockPatient} />);

    expect(
      screen.getByRole("heading", { name: "John Smith" }),
    ).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "(11) 99999-9999" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Discharged")).toBeInTheDocument();
    expect(screen.getByText("Frequent headaches")).toBeInTheDocument();
    expect(screen.getByText("Main complaint")).toBeInTheDocument();
  });

  it("displays priority badge with P-code prefix and styling", () => {
    renderWithQueryClient(<HeaderCard patient={mockPatient} />);

    const priorityBadge = screen.getByText("P2 • Standard");
    expect(priorityBadge).toBeInTheDocument();
    expect(priorityBadge).toHaveClass(
      "bg-yellow-50",
      "text-yellow-700",
      "border-yellow-500",
    );
  });

  it("calculates and displays age correctly", () => {
    renderWithQueryClient(<HeaderCard patient={mockPatient} />);

    const today = new Date();
    const birthDate = new Date(1980, 4, 15);
    let expectedAge = today.getFullYear() - birthDate.getFullYear();
    const hasHadBirthdayThisYear =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() >= birthDate.getDate());
    if (!hasHadBirthdayThisYear) {
      expectedAge -= 1;
    }
    expect(screen.getByText(`${expectedAge} years`)).toBeInTheDocument();
  });

  it("renders weeks in treatment on metadata line when provided", () => {
    renderWithQueryClient(
      <HeaderCard patient={mockPatient} weeksInTreatment={12} />,
    );

    expect(screen.getByText("12 weeks in treatment")).toBeInTheDocument();
  });

  it("renders quick action buttons with correct links", () => {
    renderWithQueryClient(<HeaderCard patient={mockPatient} />);

    const editLink = screen.getByRole("link", { name: /Edit/i });
    expect(editLink).toHaveAttribute("href", "/patients/1/edit");
  });

  it("displays priority colors correctly for different priority levels", () => {
    const emergencyPatient: Patient = { ...mockPatient, priority: "1" };
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ClinicTimezoneProvider>
          <HeaderCard patient={emergencyPatient} />
        </ClinicTimezoneProvider>
      </QueryClientProvider>,
    );
    expect(screen.getByText("P1 • Priority")).toHaveClass(
      "bg-red-50",
      "text-red-700",
      "border-red-500",
    );

    const normalPatient: Patient = { ...mockPatient, priority: "3" };
    rerender(
      <QueryClientProvider client={queryClient}>
        <ClinicTimezoneProvider>
          <HeaderCard patient={normalPatient} />
        </ClinicTimezoneProvider>
      </QueryClientProvider>,
    );
    expect(screen.getByText("P3 • Priority 3")).toHaveClass(
      "bg-blue-50",
      "text-blue-700",
      "border-blue-500",
    );
  });

  it("shows active streak alert for patients in treatment", () => {
    renderWithQueryClient(
      <HeaderCard
        patient={{
          ...mockPatient,
          status: "T",
          missingAppointmentsStreak: 2,
        }}
      />,
    );

    expect(
      screen.getByRole("status", {
        name: "2 consecutive unjustified absences",
      }),
    ).toBeInTheDocument();
  });

  it("does not show streak alert when streak is zero", () => {
    renderWithQueryClient(
      <HeaderCard
        patient={{ ...mockPatient, status: "T", missingAppointmentsStreak: 0 }}
      />,
    );

    expect(
      screen.queryByText(/consecutive unjustified absences/i),
    ).not.toBeInTheDocument();
  });

  it("shows historical streak in muted style for status C", () => {
    renderWithQueryClient(
      <HeaderCard
        patient={{
          ...mockPatient,
          status: "C",
          missingAppointmentsStreak: 3,
        }}
      />,
    );

    const historicalStreak = screen.getByText(
      "3 consecutive unjustified absences (previous treatment)",
    );
    expect(historicalStreak).toHaveClass("text-gray-400");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("hides streak for discharged patients even when streak is set", () => {
    renderWithQueryClient(
      <HeaderCard
        patient={{
          ...mockPatient,
          status: "D",
          missingAppointmentsStreak: 2,
        }}
      />,
    );

    expect(
      screen.queryByText(/consecutive unjustified absences/i),
    ).not.toBeInTheDocument();
  });

  it("handles unknown priority gracefully", () => {
    const unknownPriorityPatient = {
      ...mockPatient,
      priority: "4" as unknown as Priority,
    };
    renderWithQueryClient(<HeaderCard patient={unknownPriorityPatient} />);

    expect(screen.getByText("P4 • 4")).toBeInTheDocument();
  });
});
