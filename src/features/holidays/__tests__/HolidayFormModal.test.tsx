import { render, screen, fireEvent, waitFor } from "@/utils/testUtils";
import HolidayFormModal from "../components/HolidayFormModal";
import {
  useCreateHoliday,
  useUpdateHoliday,
  useUpdateHolidayGroup,
  useCheckHolidayConflicts,
  useCreateHolidayPeriod,
} from "@/api/query/hooks/useHolidayQueries";
import { useDateHelpers } from "@/hooks/useDateHelpers";
import { isValidDateRange } from "@/utils/holidayGrouping";
import { getAppointmentTypeLabel } from "@/utils/apiTransformers";

jest.mock("@/api/query/hooks/useHolidayQueries");
jest.mock("@/hooks/useDateHelpers");
jest.mock("@/utils/holidayGrouping", () => ({
  isValidDateRange: jest.fn(),
}));

const mockIsValidDateRange = isValidDateRange as jest.MockedFunction<
  typeof isValidDateRange
>;

const mockHoliday = {
  id: 1,
  holidayDate: "2026-12-25",
  name: "Christmas",
  description: "National Holiday",
  blockedTreatmentTypes: ["assessment", "physiotherapy"],
  createdDate: "2026-01-01",
  updatedDate: "2026-01-01",
};

function clickHolidayPeriodMode() {
  const label = screen.getByText("Period").closest("label");
  if (!label) throw new Error('Expected "Period" option label');
  fireEvent.click(label);
}

describe("HolidayFormModal", () => {
  const mockGetTodayDate = jest.fn(() => "2026-01-28");
  const mockCreateHoliday = jest.fn();
  const mockUpdateHoliday = jest.fn();
  const mockUpdateHolidayGroup = jest.fn();
  const mockCreateHolidayPeriod = jest.fn();
  const mockCheckConflicts = jest.fn();
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetTodayDate.mockReset();
    mockGetTodayDate.mockImplementation(() => "2026-01-28");

    mockIsValidDateRange.mockReset();
    mockIsValidDateRange.mockImplementation(
      (start, end) => new Date(end) >= new Date(start),
    );

    (useDateHelpers as jest.Mock).mockReturnValue({
      getTodayDate: mockGetTodayDate,
      formatDateForInput: (date: string) => date,
    });

    (useCreateHoliday as jest.Mock).mockReturnValue({
      mutate: mockCreateHoliday,
      isPending: false,
    });

    (useUpdateHoliday as jest.Mock).mockReturnValue({
      mutate: mockUpdateHoliday,
      isPending: false,
    });

    (useUpdateHolidayGroup as jest.Mock).mockReturnValue({
      mutate: mockUpdateHolidayGroup,
      isPending: false,
    });

    (useCreateHolidayPeriod as jest.Mock).mockReturnValue({
      mutate: mockCreateHolidayPeriod,
      isPending: false,
    });

    (useCheckHolidayConflicts as jest.Mock).mockReturnValue({
      refetch: mockCheckConflicts,
    });

    mockCheckConflicts.mockResolvedValue({
      data: { hasConflict: false, appointmentCount: 0 },
    });
  });

  it("renders create mode when no holiday provided", () => {
    render(
      <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    expect(screen.getByText("New Holiday")).toBeInTheDocument();
    expect(screen.getByText("Create Holiday")).toBeInTheDocument();
  });

  it("renders edit mode when holiday provided", () => {
    render(
      <HolidayFormModal
        holiday={mockHoliday}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    expect(screen.getByText("Edit Holiday")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Christmas")).toBeInTheDocument();
    expect(screen.getByText("Save Changes")).toBeInTheDocument();
  });

  it("pre-fills form with holiday data in edit mode", () => {
    render(
      <HolidayFormModal
        holiday={mockHoliday}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    expect(screen.getByDisplayValue("Christmas")).toBeInTheDocument();
    expect(screen.getByDisplayValue("National Holiday")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-12-25")).toBeInTheDocument();
  });

  it("disables date field in edit mode", () => {
    render(
      <HolidayFormModal
        holiday={mockHoliday}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    const dateInput = screen.getByLabelText("Date *");
    expect(dateInput).toBeDisabled();
  });

  it("enables date field in create mode", () => {
    render(
      <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const dateInput = screen.getByLabelText("Date *");
    expect(dateInput).not.toBeDisabled();
  });

  it("uses today's date as default in create mode", () => {
    render(
      <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const dateInput = screen.getByLabelText("Date *");
    expect(dateInput).toHaveValue("2026-01-28");
  });

  it("shows validation error when name is empty", async () => {
    render(
      <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const submitButton = screen.getByText("Create Holiday");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Name is required|Name is required/),
      ).toBeInTheDocument();
    });

    expect(mockCreateHoliday).not.toHaveBeenCalled();
  });

  it("shows validation error when date is empty", async () => {
    render(
      <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const nameInput = screen.getByLabelText("Name *");
    const dateInput = screen.getByLabelText("Date *");

    fireEvent.change(nameInput, { target: { value: "Test Holiday" } });
    fireEvent.change(dateInput, { target: { value: "" } });

    const submitButton = screen.getByText("Create Holiday");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Date is required")).toBeInTheDocument();
    });

    expect(mockCreateHoliday).not.toHaveBeenCalled();
  });

  it("checks for conflicts when submitting in create mode", async () => {
    mockCheckConflicts.mockResolvedValue({ data: { hasConflict: false } });

    render(
      <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const nameInput = screen.getByLabelText("Name *");
    fireEvent.change(nameInput, { target: { value: "New Holiday" } });

    const submitButton = screen.getByText("Create Holiday");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCheckConflicts).toHaveBeenCalled();
    });
  });

  it("shows conflict error when conflicts exist", async () => {
    mockCheckConflicts.mockResolvedValue({
      data: { hasConflict: true, appointmentCount: 3 },
    });

    render(
      <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const nameInput = screen.getByLabelText("Name *");
    fireEvent.change(nameInput, { target: { value: "New Holiday" } });

    const submitButton = screen.getByText("Create Holiday");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/This date has 3 appointment\(s\) scheduled/),
      ).toBeInTheDocument();
    });

    expect(mockCreateHoliday).not.toHaveBeenCalled();
  });

  it("calls createHoliday with form data when valid and no conflicts", async () => {
    mockCheckConflicts.mockResolvedValue({ data: { hasConflict: false } });

    render(
      <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const nameInput = screen.getByLabelText("Name *");
    const dateInput = screen.getByLabelText("Date *");
    const descriptionInput = screen.getByLabelText("Description");

    fireEvent.change(nameInput, { target: { value: "New Holiday" } });
    fireEvent.change(dateInput, { target: { value: "2026-12-25" } });
    fireEvent.change(descriptionInput, {
      target: { value: "Test Description" },
    });

    const submitButton = screen.getByText("Create Holiday");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateHoliday).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Holiday",
          holidayDate: "2026-12-25",
          description: "Test Description",
          blockedTreatmentTypes: ["assessment", "physiotherapy", "tens"],
        }),
        expect.any(Object),
      );
    });
  });

  it("calls updateHoliday with id and updated data in edit mode", async () => {
    render(
      <HolidayFormModal
        holiday={mockHoliday}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    const nameInput = screen.getByDisplayValue("Christmas");
    fireEvent.change(nameInput, { target: { value: "Updated Name" } });

    const submitButton = screen.getByText("Save Changes");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateHoliday).toHaveBeenCalledWith(
        {
          id: 1,
          data: {
            name: "Updated Name",
            description: "National Holiday",
            blockedTreatmentTypes: ["assessment", "physiotherapy"],
          },
        },
        expect.any(Object),
      );
    });
  });

  it("updates blocked treatment types in edit mode", async () => {
    render(
      <HolidayFormModal
        holiday={mockHoliday}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    // Uncheck assessment consultation checkbox
    const assessmentCheckbox = screen.getByLabelText(getAppointmentTypeLabel("assessment"));
    fireEvent.click(assessmentCheckbox);

    // Check "TENS"
    const tensCheckbox = screen.getByLabelText("TENS");
    fireEvent.click(tensCheckbox);

    const submitButton = screen.getByText("Save Changes");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateHoliday).toHaveBeenCalledWith(
        {
          id: 1,
          data: {
            name: "Christmas",
            description: "National Holiday",
            blockedTreatmentTypes: ["physiotherapy", "tens"],
          },
        },
        expect.any(Object),
      );
    });
  });

  it("does not check conflicts in edit mode", async () => {
    render(
      <HolidayFormModal
        holiday={mockHoliday}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    const nameInput = screen.getByDisplayValue("Christmas");
    fireEvent.change(nameInput, { target: { value: "Updated Name" } });

    const submitButton = screen.getByText("Save Changes");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateHoliday).toHaveBeenCalled();
    });

    expect(mockCheckConflicts).not.toHaveBeenCalled();
  });

  it("calls onClose when clicking close button", () => {
    render(
      <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const closeButton = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking cancel button", () => {
    render(
      <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockCreateHoliday).not.toHaveBeenCalled();
  });

  it("disables buttons when creating", () => {
    (useCreateHoliday as jest.Mock).mockReturnValue({
      mutate: mockCreateHoliday,
      isPending: true,
    });

    render(
      <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const cancelButton = screen.getByText("Cancel");
    const submitButton = screen.getByText("Saving...");

    expect(cancelButton).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it("disables buttons when updating", () => {
    (useUpdateHoliday as jest.Mock).mockReturnValue({
      mutate: mockUpdateHoliday,
      isPending: true,
    });

    render(
      <HolidayFormModal
        holiday={mockHoliday}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    const cancelButton = screen.getByText("Cancel");
    const submitButton = screen.getByText("Saving...");

    expect(cancelButton).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('shows "Saving..." text when isPending is true', () => {
    (useCreateHoliday as jest.Mock).mockReturnValue({
      mutate: mockCreateHoliday,
      isPending: true,
    });

    render(
      <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    expect(screen.getByText("Saving...")).toBeInTheDocument();
    expect(screen.queryByText("Create Holiday")).not.toBeInTheDocument();
  });

  it("clears form errors when input changes", async () => {
    render(
      <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const submitButton = screen.getByText("Create Holiday");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText("Name *");
    fireEvent.change(nameInput, { target: { value: "Test" } });

    await waitFor(() => {
      expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
    });
  });

  it("validates name length", async () => {
    render(
      <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const nameInput = screen.getByLabelText("Name *");
    fireEvent.change(nameInput, { target: { value: "a".repeat(256) } });

    const submitButton = screen.getByText("Create Holiday");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Name must not exceed 255 characters"),
      ).toBeInTheDocument();
    });

    expect(mockCreateHoliday).not.toHaveBeenCalled();
  });

  it("prevents past dates in create mode", async () => {
    mockGetTodayDate.mockReturnValue("2026-12-26");

    render(
      <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const nameInput = screen.getByLabelText("Name *");
    const dateInput = screen.getByLabelText("Date *");

    fireEvent.change(nameInput, { target: { value: "Test" } });
    fireEvent.change(dateInput, { target: { value: "2026-12-25" } });

    const submitButton = screen.getByText("Create Holiday");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Date must be today or in the future"),
      ).toBeInTheDocument();
    });

    expect(mockCreateHoliday).not.toHaveBeenCalled();
  });

  it("calls onSuccess after successful creation", async () => {
    mockCheckConflicts.mockResolvedValue({ data: { hasConflict: false } });
    mockCreateHoliday.mockImplementation((data, options) => {
      options.onSuccess();
    });

    render(
      <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const nameInput = screen.getByLabelText("Name *");
    fireEvent.change(nameInput, { target: { value: "New Holiday" } });

    const submitButton = screen.getByText("Create Holiday");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("calls onSuccess after successful update", async () => {
    mockUpdateHoliday.mockImplementation((data, options) => {
      options.onSuccess();
    });

    render(
      <HolidayFormModal
        holiday={mockHoliday}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    const nameInput = screen.getByDisplayValue("Christmas");
    fireEvent.change(nameInput, { target: { value: "Updated" } });

    const submitButton = screen.getByText("Save Changes");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  describe("Holiday Period Mode", () => {
    it("should show period type selection when creating new holiday", () => {
      render(
        <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      expect(screen.getByText("Holiday Type")).toBeInTheDocument();
      expect(screen.getByText("Single Day")).toBeInTheDocument();
      expect(screen.getByText("Period")).toBeInTheDocument();
    });

    it("should not show period type selection when editing", () => {
      render(
        <HolidayFormModal
          holiday={mockHoliday}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      expect(screen.queryByText("Holiday Type")).not.toBeInTheDocument();
      expect(screen.queryByText("Period")).not.toBeInTheDocument();
    });

    it("should switch to period inputs when period mode selected", () => {
      render(
        <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      // Initially in single date mode
      expect(screen.getByLabelText("Date *")).toBeInTheDocument();
      expect(screen.queryByLabelText("Start Date *")).not.toBeInTheDocument();

      // Switch to period mode
      clickHolidayPeriodMode();

      // Should now show period inputs
      expect(screen.queryByLabelText("Date *")).not.toBeInTheDocument();
      expect(screen.getByLabelText("Start Date *")).toBeInTheDocument();
      expect(screen.getByLabelText("End Date *")).toBeInTheDocument();
    });

    it("should validate period date range", async () => {
      render(
        <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      clickHolidayPeriodMode();

      // Fill form with invalid range (end before start)
      fireEvent.change(screen.getByLabelText("Name *"), {
        target: { value: "Test Period" },
      });
      fireEvent.change(screen.getByLabelText("Start Date *"), {
        target: { value: "2026-02-03" },
      });
      fireEvent.change(screen.getByLabelText("End Date *"), {
        target: { value: "2026-02-01" },
      });

      // End date is below min={startDate}; clicking submit is blocked by HTML5
      // validation before React onSubmit. Programmatic submit still runs handlers.
      const form = screen.getByText("Create Holiday").closest("form");
      expect(form).toBeTruthy();
      fireEvent.submit(form as HTMLFormElement);

      await waitFor(() => {
        expect(
          screen.getByText(
            "End date must be greater than or equal to start date",
          ),
        ).toBeInTheDocument();
      });

      expect(mockCreateHolidayPeriod).not.toHaveBeenCalled();
    });

    it("should call createHolidayPeriod with correct data", async () => {
      mockCreateHolidayPeriod.mockImplementation((data, { onSuccess }) => {
        onSuccess();
      });

      render(
        <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      clickHolidayPeriodMode();

      // Fill form with future dates
      fireEvent.change(screen.getByLabelText("Name *"), {
        target: { value: "Christmas Period" },
      });
      fireEvent.change(screen.getByLabelText("Start Date *"), {
        target: { value: "2026-02-24" },
      });
      fireEvent.change(screen.getByLabelText("End Date *"), {
        target: { value: "2026-02-26" },
      });
      fireEvent.change(screen.getByLabelText("Description"), {
        target: { value: "Christmas celebration period" },
      });

      // Submit form
      const submitButton = screen.getByText("Create Holiday");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateHolidayPeriod).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: "2026-02-24",
            endDate: "2026-02-26",
            name: "Christmas Period",
            description: "Christmas celebration period",
            blockedTreatmentTypes: ["assessment", "physiotherapy", "tens"],
          }),
          expect.any(Object),
        );
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it("should require all period fields", async () => {
      render(
        <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      // Switch to period mode
      clickHolidayPeriodMode();

      // Submit without filling required fields
      const submitButton = screen.getByText("Create Holiday");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Name is required")).toBeInTheDocument();
      });

      expect(mockCreateHolidayPeriod).not.toHaveBeenCalled();
    });
  });

  describe("Blocked Treatment Types", () => {
    it("should display treatment types checkbox list", () => {
      render(
        <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      expect(
        screen.getByText("Blocked Treatment Types"),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(getAppointmentTypeLabel("assessment")),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Physiotherapy")).toBeInTheDocument();
      expect(screen.getByLabelText("TENS")).toBeInTheDocument();
    });

    it("should toggle treatment type checkboxes", () => {
      render(
        <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      const assessmentCheckbox = screen.getByLabelText(
        getAppointmentTypeLabel("assessment"),
      ) as HTMLInputElement;
      expect(assessmentCheckbox).toBeChecked();

      fireEvent.click(assessmentCheckbox);
      expect(assessmentCheckbox).not.toBeChecked();
    });

    it("should populate treatment types from existing holiday", () => {
      render(
        <HolidayFormModal
          holiday={mockHoliday}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      expect(screen.getByLabelText(getAppointmentTypeLabel("assessment"))).toBeChecked();
      expect(screen.getByLabelText("Physiotherapy")).toBeChecked();
      expect(screen.getByLabelText("TENS")).not.toBeChecked();
    });

    it("should include treatment types in form submission", async () => {
      render(
        <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      const nameInput = screen.getByLabelText("Name *");
      fireEvent.change(nameInput, { target: { value: "Test Holiday" } });

      fireEvent.click(screen.getByLabelText("Physiotherapy"));
      fireEvent.click(screen.getByLabelText("TENS"));

      const submitButton = screen.getByText("Create Holiday");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateHoliday).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Test Holiday",
            blockedTreatmentTypes: ["assessment"],
          }),
          expect.any(Object),
        );
      });
    });

    it("should include treatment types in period form submission", async () => {
      mockIsValidDateRange.mockReturnValue(true);

      render(
        <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      clickHolidayPeriodMode();

      const nameInput = screen.getByLabelText("Name *");
      fireEvent.change(nameInput, { target: { value: "Test Period" } });

      fireEvent.change(screen.getByLabelText("Start Date *"), {
        target: { value: "2026-02-01" },
      });
      fireEvent.change(screen.getByLabelText("End Date *"), {
        target: { value: "2026-02-03" },
      });

      fireEvent.click(screen.getByLabelText(getAppointmentTypeLabel("assessment")));
      fireEvent.click(screen.getByLabelText("TENS"));

      fireEvent.click(screen.getByText("Create Holiday"));

      await waitFor(() => {
        expect(mockCreateHolidayPeriod).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Test Period",
            startDate: "2026-02-01",
            endDate: "2026-02-03",
            blockedTreatmentTypes: ["physiotherapy"],
          }),
          expect.any(Object),
        );
      });
    });

    it("uses separate defaults for period mode treatment types", () => {
      render(
        <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      fireEvent.click(screen.getByLabelText(getAppointmentTypeLabel("assessment")));

      clickHolidayPeriodMode();

      expect(screen.getByLabelText(getAppointmentTypeLabel("assessment"))).toBeChecked();
      expect(screen.getByLabelText("Physiotherapy")).toBeChecked();
      expect(screen.getByLabelText("TENS")).toBeChecked();
    });

    it("preserves single-mode checkbox state when switching holiday type back", () => {
      render(
        <HolidayFormModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
      );

      fireEvent.click(screen.getByLabelText(getAppointmentTypeLabel("assessment")));
      expect(
        screen.getByLabelText(getAppointmentTypeLabel("assessment")),
      ).not.toBeChecked();

      clickHolidayPeriodMode();
      const typeRadios = screen
        .getAllByRole("radio")
        .filter((el) => (el as HTMLInputElement).name === "holidayType");
      fireEvent.click(typeRadios[0]);

      expect(
        screen.getByLabelText(getAppointmentTypeLabel("assessment")),
      ).not.toBeChecked();
    });
  });

  describe("Holiday Group Updates", () => {
    const mockHolidayWithGroup = {
      ...mockHoliday,
      holidayGroupId: "group-123-uuid",
    };

    it("shows period update notice when editing holiday with group ID", () => {
      render(
        <HolidayFormModal
          holiday={mockHolidayWithGroup}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      expect(
        screen.getByText(
          "This holiday spans more than one day. Changes will be applied to all days in the period.",
        ),
      ).toBeInTheDocument();
    });

    it("does not show period update notice for single holidays", () => {
      render(
        <HolidayFormModal
          holiday={mockHoliday}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      expect(
        screen.queryByText(
          "This holiday spans more than one day. Changes will be applied to all days in the period.",
        ),
      ).not.toBeInTheDocument();
    });

    it("calls updateHolidayGroup when updating holiday with group ID", async () => {
      render(
        <HolidayFormModal
          holiday={mockHolidayWithGroup}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const nameInput = screen.getByLabelText(/^Name \*$/i);
      fireEvent.change(nameInput, {
        target: { value: "Updated Holiday Name" },
      });

      const submitButton = screen.getByText("Save Changes");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateHolidayGroup).toHaveBeenCalledWith(
          {
            groupId: "group-123-uuid",
            data: {
              name: "Updated Holiday Name",
              description: "National Holiday",
              blockedTreatmentTypes: ["assessment", "physiotherapy"],
            },
          },
          expect.objectContaining({
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
          }),
        );
      });
    });

    it("calls updateHoliday when updating single holiday without group ID", async () => {
      render(
        <HolidayFormModal
          holiday={mockHoliday}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const nameInput = screen.getByLabelText(/^Name \*$/i);
      fireEvent.change(nameInput, {
        target: { value: "Updated Single Holiday" },
      });

      const submitButton = screen.getByText("Save Changes");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateHoliday).toHaveBeenCalledWith(
          {
            id: 1,
            data: {
              name: "Updated Single Holiday",
              description: "National Holiday",
              blockedTreatmentTypes: ["assessment", "physiotherapy"],
            },
          },
          expect.objectContaining({
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
          }),
        );
      });

      expect(mockUpdateHolidayGroup).not.toHaveBeenCalled();
    });

    it("handles group update success correctly", async () => {
      render(
        <HolidayFormModal
          holiday={mockHolidayWithGroup}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const nameInput = screen.getByLabelText(/^Name \*$/i);
      fireEvent.change(nameInput, {
        target: { value: "Updated Holiday Name" },
      });

      const submitButton = screen.getByText("Save Changes");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateHolidayGroup).toHaveBeenCalled();
      });

      // Simulate successful update
      const successCallback = mockUpdateHolidayGroup.mock.calls[0][1].onSuccess;
      successCallback();

      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it("handles group update error correctly", async () => {
      render(
        <HolidayFormModal
          holiday={mockHolidayWithGroup}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />,
      );

      const nameInput = screen.getByLabelText(/^Name \*$/i);
      fireEvent.change(nameInput, {
        target: { value: "Updated Holiday Name" },
      });

      const submitButton = screen.getByText("Save Changes");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateHolidayGroup).toHaveBeenCalled();
      });

      // Simulate error
      const errorCallback = mockUpdateHolidayGroup.mock.calls[0][1].onError;
      errorCallback(new Error("Group update failed"));

      await waitFor(() => {
        expect(screen.getByText("Group update failed")).toBeInTheDocument();
      });
    });
  });
});
