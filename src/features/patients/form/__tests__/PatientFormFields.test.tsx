/**
 * PatientFormFields unit tests
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PatientFormFields from "../PatientFormFields";
import { useDateHelpers } from "@/hooks/useDateHelpers";
import { usePriorities } from "@/api/query/hooks/usePriorityOptionsQueries";

jest.mock("@/hooks/useDateHelpers");
jest.mock("@/api/query/hooks/usePriorityOptionsQueries", () => ({
  usePriorities: jest.fn(),
}));

const mockGetTodayDate = jest.fn(() => "2026-03-09");

const defaultPatient = {
  name: "Test Patient",
  phone: "(11) 99999-9999",
  birthDate: "1990-01-01",
  priority: "3",
  status: "T",
  mainConcern: "Test complaint",
};

const defaultProps = {
  patient: defaultPatient,
  handleChange: jest.fn(),
};

describe("PatientFormFields", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useDateHelpers as jest.Mock).mockReturnValue({
      getTodayDate: mockGetTodayDate,
      formatDate: jest.fn((d: string | null) => d ?? ""),
    });

    (usePriorities as jest.Mock).mockReturnValue({
      data: [
        {
          id: 1,
          type: "priority",
          value: "1",
          label: "Priority",
          isActive: true,
          sortOrder: 1,
          createdAt: "",
          updatedAt: "",
        },
        {
          id: 2,
          type: "priority",
          value: "2",
          label: "Standard",
          isActive: true,
          sortOrder: 2,
          createdAt: "",
          updatedAt: "",
        },
        {
          id: 3,
          type: "priority",
          value: "3",
          label: "Priority 3",
          isActive: true,
          sortOrder: 3,
          createdAt: "",
          updatedAt: "",
        },
      ],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  describe("Status select - isEdit", () => {
    it("disables status select when isEdit is false", () => {
      render(
        <PatientFormFields
          {...defaultProps}
          isEdit={false}
          statusConfig={{ currentStatus: "T", hasCompletedAttendances: false }}
        />,
      );

      const statusSelect = screen.getByLabelText("Status");
      expect(statusSelect).toBeDisabled();
    });

    it("enables status select when isEdit is true", () => {
      render(
        <PatientFormFields
          {...defaultProps}
          isEdit={true}
          statusConfig={{ currentStatus: "T", hasCompletedAttendances: false }}
        />,
      );

      const statusSelect = screen.getByLabelText("Status");
      expect(statusSelect).not.toBeDisabled();
    });
  });

  describe("Status options - statusConfig", () => {
    it("disables N when hasCompletedAttendances is true", () => {
      render(
        <PatientFormFields
          {...defaultProps}
          isEdit={true}
          statusConfig={{ currentStatus: "T", hasCompletedAttendances: true }}
        />,
      );

      const optionN = screen.getByRole("option", { name: "New patient" });
      expect(optionN).toBeDisabled();
    });

    it("disables N when currentStatus is not N", () => {
      render(
        <PatientFormFields
          {...defaultProps}
          isEdit={true}
          statusConfig={{ currentStatus: "T", hasCompletedAttendances: false }}
        />,
      );

      const optionN = screen.getByRole("option", { name: "New patient" });
      expect(optionN).toBeDisabled();
    });

    it("enables N when currentStatus is N and no completed attendances", () => {
      render(
        <PatientFormFields
          {...defaultProps}
          patient={{ ...defaultPatient, status: "N" }}
          isEdit={true}
          statusConfig={{ currentStatus: "N", hasCompletedAttendances: false }}
        />,
      );

      const optionN = screen.getByRole("option", { name: "New patient" });
      expect(optionN).not.toBeDisabled();
    });

    it("disables T when currentStatus is not T", () => {
      render(
        <PatientFormFields
          {...defaultProps}
          patient={{ ...defaultPatient, status: "D" }}
          isEdit={true}
          statusConfig={{ currentStatus: "D", hasCompletedAttendances: false }}
        />,
      );

      const optionT = screen.getByRole("option", { name: "In Treatment" });
      expect(optionT).toBeDisabled();
    });

    it("enables T when currentStatus is T", () => {
      render(
        <PatientFormFields
          {...defaultProps}
          isEdit={true}
          statusConfig={{ currentStatus: "T", hasCompletedAttendances: false }}
        />,
      );

      const optionT = screen.getByRole("option", { name: "In Treatment" });
      expect(optionT).not.toBeDisabled();
    });

    it("enables D when currentStatus is T", () => {
      render(
        <PatientFormFields
          {...defaultProps}
          isEdit={true}
          statusConfig={{ currentStatus: "T", hasCompletedAttendances: false }}
        />,
      );

      const optionA = screen.getByRole("option", {
        name: "Discharged",
      });
      expect(optionA).not.toBeDisabled();
    });

    it("enables D when currentStatus is D", () => {
      render(
        <PatientFormFields
          {...defaultProps}
          patient={{ ...defaultPatient, status: "D" }}
          isEdit={true}
          statusConfig={{ currentStatus: "D", hasCompletedAttendances: false }}
        />,
      );

      const optionA = screen.getByRole("option", {
        name: "Discharged",
      });
      expect(optionA).not.toBeDisabled();
    });

    it("disables D when currentStatus is neither T nor D", () => {
      render(
        <PatientFormFields
          {...defaultProps}
          patient={{ ...defaultPatient, status: "C" }}
          isEdit={true}
          statusConfig={{ currentStatus: "C", hasCompletedAttendances: false }}
        />,
      );

      const optionA = screen.getByRole("option", {
        name: "Discharged",
      });
      expect(optionA).toBeDisabled();
    });

    it("enables C when currentStatus is T", () => {
      render(
        <PatientFormFields
          {...defaultProps}
          isEdit={true}
          statusConfig={{ currentStatus: "T", hasCompletedAttendances: false }}
        />,
      );

      const optionF = screen.getByRole("option", {
        name: "Consecutive no-shows",
      });
      expect(optionF).not.toBeDisabled();
    });

    it("enables C when currentStatus is C", () => {
      render(
        <PatientFormFields
          {...defaultProps}
          patient={{ ...defaultPatient, status: "C" }}
          isEdit={true}
          statusConfig={{ currentStatus: "C", hasCompletedAttendances: false }}
        />,
      );

      const optionF = screen.getByRole("option", {
        name: "Consecutive no-shows",
      });
      expect(optionF).not.toBeDisabled();
    });

    it("disables C when currentStatus is neither T nor C", () => {
      render(
        <PatientFormFields
          {...defaultProps}
          patient={{ ...defaultPatient, status: "D" }}
          isEdit={true}
          statusConfig={{ currentStatus: "D", hasCompletedAttendances: false }}
        />,
      );

      const optionF = screen.getByRole("option", {
        name: "Consecutive no-shows",
      });
      expect(optionF).toBeDisabled();
    });

    it("enables all status options when statusConfig is undefined (create form)", () => {
      render(<PatientFormFields {...defaultProps} isEdit={false} />);

      const statusSelect = screen.getByLabelText("Status");
      expect(statusSelect).toBeDisabled();
    });
  });

  describe("handleStatusChange - auto-fill discharge date", () => {
    it("calls handleChange with dischargeDate when selecting D and no discharge date and showDischargeDate", () => {
      const handleChange = jest.fn();
      render(
        <PatientFormFields
          {...defaultProps}
          handleChange={handleChange}
          patient={{ ...defaultPatient, status: "T", dischargeDate: null }}
          isEdit={true}
          showDischargeDate={true}
        />,
      );

      const statusSelect = screen.getByLabelText("Status");
      fireEvent.change(statusSelect, {
        target: { name: "status", value: "D" },
      });

      expect(handleChange).toHaveBeenCalledTimes(2);
      expect(handleChange.mock.calls[0][0].target.name).toBe("status");
      const secondCall = handleChange.mock.calls[1][0];
      expect(secondCall.target.name).toBe("dischargeDate");
      expect(secondCall.target.value).toBe("2026-03-09");
      expect(secondCall.target.type).toBe("date");
    });

    it("does not auto-fill dischargeDate when already set", () => {
      const handleChange = jest.fn();
      render(
        <PatientFormFields
          {...defaultProps}
          handleChange={handleChange}
          patient={{
            ...defaultPatient,
            status: "T",
            dischargeDate: "2025-12-31",
          }}
          isEdit={true}
          showDischargeDate={true}
        />,
      );

      const statusSelect = screen.getByLabelText("Status");
      fireEvent.change(statusSelect, {
        target: { name: "status", value: "D" },
      });

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange.mock.calls[0][0].target.name).toBe("status");
    });

    it("does not auto-fill dischargeDate when showDischargeDate is false", () => {
      const handleChange = jest.fn();
      render(
        <PatientFormFields
          {...defaultProps}
          handleChange={handleChange}
          patient={{ ...defaultPatient, status: "T", dischargeDate: null }}
          isEdit={true}
          showDischargeDate={false}
        />,
      );

      const statusSelect = screen.getByLabelText("Status");
      fireEvent.change(statusSelect, { target: { value: "D" } });

      expect(handleChange).toHaveBeenCalledTimes(1);
    });
  });
});
