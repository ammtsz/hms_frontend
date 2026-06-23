import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionBreakdownCard } from "../index";
import { Patient } from "@/types/types";
import * as sessionsApi from "@/api/sessions";
import { SessionResponseDto } from "@/api/types";

// Mock the API functions
jest.mock("@/api/sessions", () => ({
  getSessionsByPatient: jest.fn(),
}));

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });
  const TestQueryProvider = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return TestQueryProvider;
};

// Helper to render with QueryClient wrapper
const renderWithQueryClient = (component: React.ReactElement) => {
  const TestWrapper = createWrapper();
  return render(<TestWrapper>{component}</TestWrapper>);
};

// Card starts collapsed; use this after load to see session content
const expandCard = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByTitle("Expand"));
};

const mockGetSessionsByPatient =
  sessionsApi.getSessionsByPatient as jest.MockedFunction<
    typeof sessionsApi.getSessionsByPatient
  >;

const mockPatient: Patient = {
  id: "1",
  name: "Test Patient",
  birthDate: "1990-01-01",
  startDate: "2026-01-01",
  status: "T",
  phone: "",
  priority: "2",
  mainConcern: "",
  dischargeDate: null,
  nextAppointmentDates: [],
  currentRecommendations: {
    date: "2026-02-01",
    food: "",
    water: "",
    ointment: "",
    notes: "",
    physiotherapy: false,
    tens: false,
    returnWeeks: 0,
  },
  previousAppointments: [],
  missingAppointmentsStreak: 0,
};

describe("SessionBreakdownCard", () => {
  const mockSessions: SessionResponseDto[] = [
    {
      id: 1,
      treatmentId: 1,
      sessionNumber: 1,
      scheduledDate: "2026-02-10T00:00:00.000Z",
      startTime: "14:00:00",
      endTime: "14:15:00",
      status: "completed",
      notes: "Session completed successfully",
      createdDate: "2026-02-01",
      createdTime: "00:00:00",
      updatedDate: "2026-02-10",
      updatedTime: "14:15:00",
      treatmentType: "physiotherapy",
      bodyLocation: "Head",
      plannedSessions: 10,
      color: "Blue",
    },
    {
      id: 2,
      treatmentId: 1,
      sessionNumber: 2,
      scheduledDate: "2026-02-12T00:00:00.000Z",
      startTime: "15:00:00",
      status: "missed",
      missedReason: "Patient did not show up",
      createdDate: "2026-02-01",
      createdTime: "00:00:00",
      updatedDate: "2026-02-12",
      updatedTime: "00:00:00",
      treatmentType: "physiotherapy",
      bodyLocation: "Head",
      plannedSessions: 10,
      color: "Blue",
    },
    {
      id: 3,
      treatmentId: 2,
      sessionNumber: 3,
      scheduledDate: "2026-02-15T00:00:00.000Z",
      startTime: "14:30:00",
      status: "scheduled",
      createdDate: "2026-02-01",
      createdTime: "00:00:00",
      updatedDate: "2026-02-01",
      updatedTime: "00:00:00",
      treatmentType: "tens",
      bodyLocation: "Legs",
      plannedSessions: 5,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render collapsed card with zero counts when sessions array is empty", async () => {
    mockGetSessionsByPatient.mockResolvedValue({
      success: true,
      value: [],
    });

    renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

    await waitFor(() => {
      expect(screen.getByText("Treatment History")).toBeInTheDocument();
      expect(screen.getByText("(0/0)")).toBeInTheDocument();
    });
  });

  it("should display treatment group summary count", async () => {
    mockGetSessionsByPatient.mockResolvedValue({
      success: true,
      value: mockSessions,
    });

    renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

    await waitFor(() => {
      expect(screen.getByText(/Treatment History/)).toBeInTheDocument();
      // 0 completed treatments out of 2 total treatment groups (physiotherapy and tens)
      expect(screen.getByText(/\(0\/2\)/)).toBeInTheDocument();
    });
  });

  it("should show first 2 treatment groups when expanded", async () => {
    const manySessions = Array.from({ length: 5 }, (_, i) => ({
      ...mockSessions[0],
      id: i + 1,
      sessionNumber: i + 1,
    }));

    mockGetSessionsByPatient.mockResolvedValue({
      success: true,
      value: manySessions,
    });

    renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText(/Treatment History/)).toBeInTheDocument();
      // All sessions in one treatment group, all completed = 1/1
      expect(screen.getByText(/\(1\/1\)/)).toBeInTheDocument();
    });

    await expandCard();

    // Shows treatment group with all sessions
    expect(screen.getByText(/Physiotherapy/)).toBeInTheDocument();
    expect(screen.getByText(/Session 1\/10/)).toBeInTheDocument();
    expect(screen.getByText(/Session 5\/10/)).toBeInTheDocument();
  });

  it("should expand to show more treatment groups when show more is clicked", async () => {
    const user = userEvent.setup();
    // Create 3 different treatment groups
    const group1Sessions = Array.from({ length: 2 }, (_, i) => ({
      ...mockSessions[0],
      id: i + 1,
      sessionNumber: i + 1,
      treatmentId: 1,
    }));
    const group2Sessions = Array.from({ length: 2 }, (_, i) => ({
      ...mockSessions[2],
      id: i + 3,
      sessionNumber: i + 1,
      treatmentId: 2,
    }));
    const group3Sessions = [
      {
        ...mockSessions[0],
        id: 5,
        sessionNumber: 1,
        treatmentId: 3,
        color: "Green",
      },
    ];

    mockGetSessionsByPatient.mockResolvedValue({
      success: true,
      value: [...group1Sessions, ...group2Sessions, ...group3Sessions],
    });

    renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

    // Wait for component to load - initially shows 2 groups
    await waitFor(() => {
      expect(screen.getByText(/Treatment History/)).toBeInTheDocument();
    });

    await expandCard();

    // Should show first 2 treatment groups
    expect(screen.getByText(/BLUE/)).toBeInTheDocument();

    // Third group (Green) should not be visible yet
    expect(screen.queryByText(/GREEN/)).not.toBeInTheDocument();

    // Click "View more" button
    const showMoreButton = screen.getByRole("button", { name: /View more/i });
    await user.click(showMoreButton);

    // Should now show all treatment groups including the third one
    await waitFor(() => {
      expect(screen.getByText(/GREEN/)).toBeInTheDocument();
    });
  });

  it("should display completed session with green border", async () => {
    mockGetSessionsByPatient.mockResolvedValue({
      success: true,
      value: [mockSessions[0]],
    });

    const { container } = renderWithQueryClient(
      <SessionBreakdownCard patient={mockPatient} />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Treatment History/)).toBeInTheDocument();
    });
    await expandCard();

    await waitFor(() => {
      expect(screen.getByText(/Physiotherapy/)).toBeInTheDocument();
      expect(screen.getByText(/Session 1\/10/)).toBeInTheDocument();
      // Use getAllByText since "Completed" appears twice (status + completion time)
      expect(screen.getAllByText(/Completed/)[0]).toBeInTheDocument();
    });

    // Completed sessions have green left border
    const sessionBox = container.querySelector(".border-green-500");
    expect(sessionBox).toBeInTheDocument();
  });

  it("should display missed session with red border and reason", async () => {
    mockGetSessionsByPatient.mockResolvedValue({
      success: true,
      value: [mockSessions[1]],
    });

    const { container } = renderWithQueryClient(
      <SessionBreakdownCard patient={mockPatient} />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Treatment History/)).toBeInTheDocument();
    });
    await expandCard();

    await waitFor(() => {
      expect(screen.getByText(/Physiotherapy/)).toBeInTheDocument();
      expect(screen.getByText(/Session 2\/10/)).toBeInTheDocument();
      expect(screen.getByText(/Missed/)).toBeInTheDocument();
      expect(screen.getByText("Patient did not show up")).toBeInTheDocument();
    });

    // Missed sessions have red left border
    const sessionBox = container.querySelector(".border-red-500");
    expect(sessionBox).toBeInTheDocument();
  });

  it("should display scheduled session with gray border", async () => {
    mockGetSessionsByPatient.mockResolvedValue({
      success: true,
      value: [mockSessions[2]],
    });

    const { container } = renderWithQueryClient(
      <SessionBreakdownCard patient={mockPatient} />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Treatment History/)).toBeInTheDocument();
    });
    await expandCard();

    await waitFor(() => {
      expect(screen.getByText(/TENS/)).toBeInTheDocument();
      expect(screen.getByText(/Session 3\/5/)).toBeInTheDocument();
      expect(screen.getAllByText(/Scheduled/)[0]).toBeInTheDocument();
    });

    // Scheduled sessions have gray left border
    const sessionBox = container.querySelector(".border-gray-500");
    expect(sessionBox).toBeInTheDocument();
  });

  it("should display session date and time", async () => {
    mockGetSessionsByPatient.mockResolvedValue({
      success: true,
      value: [mockSessions[0]],
    });

    renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

    await waitFor(() => {
      expect(screen.getByText(/Treatment History/)).toBeInTheDocument();
    });
    await expandCard();

    await waitFor(() => {
      expect(screen.getByText(/02\/10/)).toBeInTheDocument();
    });
  });

  it("should display session notes when present", async () => {
    mockGetSessionsByPatient.mockResolvedValue({
      success: true,
      value: [mockSessions[0]],
    });

    renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

    await waitFor(() => {
      expect(screen.getByText(/Treatment History/)).toBeInTheDocument();
    });
    await expandCard();

    await waitFor(() => {
      expect(screen.getByText(/💬/)).toBeInTheDocument();
      expect(
        screen.getByText("Session completed successfully"),
      ).toBeInTheDocument();
    });
  });

  it("should display missed reason with alert icon", async () => {
    mockGetSessionsByPatient.mockResolvedValue({
      success: true,
      value: [mockSessions[1]],
    });

    const { container } = renderWithQueryClient(
      <SessionBreakdownCard patient={mockPatient} />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Treatment History/)).toBeInTheDocument();
    });
    await expandCard();

    await waitFor(() => {
      expect(screen.getByText(/Reason:/)).toBeInTheDocument();
      expect(screen.getByText("Patient did not show up")).toBeInTheDocument();
    });

    // Check for AlertTriangle icon (rendered as svg)
    const alertIcon = container.querySelector("svg");
    expect(alertIcon).toBeInTheDocument();
  });

  it("should display completion time for completed sessions", async () => {
    mockGetSessionsByPatient.mockResolvedValue({
      success: true,
      value: [mockSessions[0]],
    });

    renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

    await waitFor(() => {
      expect(screen.getByText(/Treatment History/)).toBeInTheDocument();
    });
    await expandCard();

    await waitFor(() => {
      expect(screen.getByText(/Completed at 14:15/)).toBeInTheDocument();
    });
  });

  it("should not display completion time for non-completed sessions", async () => {
    mockGetSessionsByPatient.mockResolvedValue({
      success: true,
      value: [mockSessions[2]],
    });

    renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

    await waitFor(() => {
      expect(screen.getByText(/Treatment History/)).toBeInTheDocument();
    });
    await expandCard();

    await waitFor(() => {
      expect(screen.getByText(/Session 3/)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Completed at/)).not.toBeInTheDocument();
  });

  it("should toggle between collapsed and expanded states", async () => {
    const user = userEvent.setup();
    mockGetSessionsByPatient.mockResolvedValue({
      success: true,
      value: mockSessions,
    });

    renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

    // Wait for component to load - card starts collapsed
    await waitFor(() => {
      expect(screen.getByText(/Treatment History/)).toBeInTheDocument();
      expect(screen.getByText(/\(0\/2\)/)).toBeInTheDocument();
    });

    // Expand to see sessions
    await user.click(screen.getByTitle("Expand"));
    await waitFor(() => {
      expect(screen.getByText(/Physiotherapy/)).toBeInTheDocument();
    });

    // Click header to collapse
    const collapseButton = screen.getByTitle("Collapse");
    await user.click(collapseButton);

    // Sessions should no longer be visible
    await waitFor(() => {
      expect(screen.queryByText(/Session 1/)).not.toBeInTheDocument();
    });

    // Click header again to expand
    const expandButton = screen.getByTitle("Expand");
    await user.click(expandButton);

    // Sessions should be visible again
    await waitFor(() => {
      expect(screen.getByText(/Physiotherapy/)).toBeInTheDocument();
    });
  });

  it("should handle sessions without start time", async () => {
    const sessionWithoutTime = {
      ...mockSessions[2],
      startTime: undefined,
    };

    mockGetSessionsByPatient.mockResolvedValue({
      success: true,
      value: [sessionWithoutTime],
    });

    renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

    await waitFor(() => {
      expect(screen.getByText(/Treatment History/)).toBeInTheDocument();
    });
    await expandCard();

    await waitFor(() => {
      expect(screen.getByText(/02\/15/)).toBeInTheDocument();
    });

    expect(screen.queryByText(/às/)).not.toBeInTheDocument();
  });

  it("should calculate completed treatment groups correctly", async () => {
    mockGetSessionsByPatient.mockResolvedValue({
      success: true,
      value: mockSessions,
    });

    renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

    // 0 completed treatment groups out of 2 (neither physiotherapy nor tens groups are fully completed)
    await waitFor(() => {
      expect(screen.getByText(/\(0\/2\)/)).toBeInTheDocument();
    });
  });

  it("should display treatment type and icon", async () => {
    mockGetSessionsByPatient.mockResolvedValue({
      success: true,
      value: [mockSessions[0]],
    });

    renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

    await waitFor(() => {
      expect(screen.getByText(/Treatment History/)).toBeInTheDocument();
    });
    await expandCard();

    await waitFor(() => {
      expect(screen.getByText(/✨/)).toBeInTheDocument(); // ✨ sparkles icon
      expect(screen.getByText(/Physiotherapy/)).toBeInTheDocument();
    });
  });

  it("should display body location in group header", async () => {
    mockGetSessionsByPatient.mockResolvedValue({
      success: true,
      value: [mockSessions[0]],
    });

    renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

    await waitFor(() => {
      expect(screen.getByText(/Treatment History/)).toBeInTheDocument();
    });
    await expandCard();

    await waitFor(() => {
      // Location is displayed in uppercase in the group header
      expect(screen.getByText(/HEAD/)).toBeInTheDocument();
    });
  });

  it("should display color in group header when present", async () => {
    mockGetSessionsByPatient.mockResolvedValue({
      success: true,
      value: [mockSessions[0]],
    });

    renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

    await waitFor(() => {
      expect(screen.getByText(/Treatment History/)).toBeInTheDocument();
    });
    await expandCard();

    await waitFor(() => {
      // Color is displayed in uppercase in the group header
      expect(screen.getByText(/BLUE/)).toBeInTheDocument();
    });
  });

  it("should display planned sessions in session number", async () => {
    mockGetSessionsByPatient.mockResolvedValue({
      success: true,
      value: [mockSessions[0]],
    });

    renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

    await waitFor(() => {
      expect(screen.getByText(/Treatment History/)).toBeInTheDocument();
    });
    await expandCard();

    await waitFor(() => {
      expect(screen.getByText(/Session 1\/10/)).toBeInTheDocument();
    });
  });

  it("should display tens treatment type correctly", async () => {
    mockGetSessionsByPatient.mockResolvedValue({
      success: true,
      value: [mockSessions[2]],
    });

    renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

    await waitFor(() => {
      expect(screen.getByText(/Treatment History/)).toBeInTheDocument();
    });
    await expandCard();

    await waitFor(() => {
      expect(screen.getByText(/🪄/)).toBeInTheDocument(); // 🪄 magic wand icon
      expect(screen.getByText(/TENS/)).toBeInTheDocument();
    });
  });

  it("should not display color when not present", async () => {
    mockGetSessionsByPatient.mockResolvedValue({
      success: true,
      value: [mockSessions[2]],
    });

    renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

    await waitFor(() => {
      expect(screen.getByText(/Treatment History/)).toBeInTheDocument();
    });
    await expandCard();

    await waitFor(() => {
      expect(screen.getByText(/Session 3/)).toBeInTheDocument();
    });

    // TENS session has no color, so uppercase text check won't find color badges
    expect(screen.queryByText(/GREEN/)).not.toBeInTheDocument();
    expect(screen.queryByText(/RED/)).not.toBeInTheDocument();
  });

  describe("Status Badges", () => {
    it("should display in-progress badge on group header when treatment has started but not completed", async () => {
      const ongoingSessions: SessionResponseDto[] = [
        { ...mockSessions[0], status: "completed" }, // One completed
        { ...mockSessions[1], status: "scheduled" }, // One scheduled
      ];

      mockGetSessionsByPatient.mockResolvedValue({
        success: true,
        value: ongoingSessions,
      });

      renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Treatment History/),
        ).toBeInTheDocument();
      });
      await expandCard();

      await waitFor(() => {
        expect(screen.getByText(/In Progress/)).toBeInTheDocument();
        expect(screen.getByText(/▶️/)).toBeInTheDocument(); // in-progress icon
      });
    });

    it("should display completed badge on group header when all sessions are completed", async () => {
      const completedSessions: SessionResponseDto[] = [
        { ...mockSessions[0], status: "completed" },
        {
          ...mockSessions[0],
          id: 2,
          sessionNumber: 2,
          status: "completed",
        },
      ];

      mockGetSessionsByPatient.mockResolvedValue({
        success: true,
        value: completedSessions,
      });

      renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Treatment History/),
        ).toBeInTheDocument();
      });
      await expandCard();

      await waitFor(() => {
        expect(screen.getAllByText(/Completed/)[0]).toBeInTheDocument();
        expect(screen.getByText(/✅/)).toBeInTheDocument(); // completed icon
      });
    });

    it("should display cancelled badge on group header when treatment has cancelled sessions", async () => {
      const cancelledSessions: SessionResponseDto[] = [
        { ...mockSessions[0], status: "cancelled" },
      ];

      mockGetSessionsByPatient.mockResolvedValue({
        success: true,
        value: cancelledSessions,
      });

      renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Treatment History/),
        ).toBeInTheDocument();
      });
      await expandCard();

      await waitFor(() => {
        expect(screen.getAllByText(/Cancelled/)[0]).toBeInTheDocument();
        expect(screen.getByText(/❌/)).toBeInTheDocument(); // cancelled icon
      });
    });

    it("should display different badges for each group based on their individual statuses", async () => {
      const user = userEvent.setup();
      const mixedSessions: SessionResponseDto[] = [
        // Completed treatment group
        {
          ...mockSessions[0],
          id: 1,
          treatmentId: 1,
          status: "completed",
        },
        {
          ...mockSessions[0],
          id: 2,
          treatmentId: 1,
          sessionNumber: 2,
          status: "completed",
        },
        // Ongoing treatment group
        {
          ...mockSessions[2],
          id: 3,
          treatmentId: 2,
          status: "completed",
        },
        {
          ...mockSessions[2],
          id: 4,
          treatmentId: 2,
          sessionNumber: 4,
          status: "scheduled",
        },
        // Cancelled treatment group
        {
          id: 5,
          treatmentId: 3,
          sessionNumber: 1,
          scheduledDate: "2026-02-18T00:00:00.000Z",
          startTime: "10:00:00",
          status: "cancelled",
          createdDate: "2026-02-01",
          createdTime: "00:00:00",
          updatedDate: "2026-02-18",
          updatedTime: "00:00:00",
          treatmentType: "physiotherapy",
          bodyLocation: "Arms",
          plannedSessions: 5,
          color: "Green",
        },
      ];

      mockGetSessionsByPatient.mockResolvedValue({
        success: true,
        value: mixedSessions,
      });

      renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Treatment History/),
        ).toBeInTheDocument();
      });
      await expandCard();

      // First two groups should show their badges
      await waitFor(() => {
        expect(screen.getByText(/In Progress/)).toBeInTheDocument();
        expect(screen.getAllByText(/Cancelled/)[0]).toBeInTheDocument();
      });

      // Click "View more" to show the completed group
      const showMoreButton = screen.getByRole("button", { name: /View more/i });
      await user.click(showMoreButton);

      // Now all three badge types should be visible
      await waitFor(() => {
        expect(screen.getAllByText(/Completed/)[0]).toBeInTheDocument();
        expect(screen.getByText(/In Progress/)).toBeInTheDocument();
        expect(screen.getAllByText(/Cancelled/)[0]).toBeInTheDocument();
      });
    });

    it("should display scheduled badge when all sessions in group are scheduled", async () => {
      const scheduledSessions: SessionResponseDto[] = [
        { ...mockSessions[2], status: "scheduled" },
      ];

      mockGetSessionsByPatient.mockResolvedValue({
        success: true,
        value: scheduledSessions,
      });

      renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Treatment History/),
        ).toBeInTheDocument();
      });
      await expandCard();

      await waitFor(() => {
        // Should show "Scheduled" badge for scheduled-only treatment
        expect(screen.getAllByText(/Scheduled/)[0]).toBeInTheDocument();
        expect(screen.getByText(/📅/)).toBeInTheDocument(); // scheduled icon
      });
    });

    it("should show in-progress badge when group has mix of completed, cancelled and scheduled", async () => {
      const ongoingWithCancelledSessions: SessionResponseDto[] = [
        { ...mockSessions[0], status: "completed" },
        { ...mockSessions[1], status: "cancelled" },
        {
          ...mockSessions[0],
          id: 3,
          sessionNumber: 3,
          status: "scheduled",
        },
      ];

      mockGetSessionsByPatient.mockResolvedValue({
        success: true,
        value: ongoingWithCancelledSessions,
      });

      renderWithQueryClient(<SessionBreakdownCard patient={mockPatient} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Treatment History/),
        ).toBeInTheDocument();
      });
      await expandCard();

      // Group has mixed statuses (not all cancelled) so badge is "In Progress"
      await waitFor(() => {
        expect(screen.getByText(/In Progress/)).toBeInTheDocument();
      });

      // Individual session shows "Cancelled" for the cancelled one
      expect(screen.getAllByText(/Cancelled/)[0]).toBeInTheDocument();
    });
  });
});
