import { render, screen, fireEvent } from '@testing-library/react';
import HolidayActionsBar from "../components/HolidayActionsBar";

describe('HolidayActionsBar', () => {
  const mockYears = [2026, 2027, 2028, 2029, 2030];
  const mockOnYearChange = jest.fn();
  const mockOnCreateClick = jest.fn();

  const defaultProps = {
    selectedYear: 2026,
    years: mockYears,
    onYearChange: mockOnYearChange,
    onCreateClick: mockOnCreateClick,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders year selector with correct label', () => {
    render(<HolidayActionsBar {...defaultProps} />);

    expect(screen.getByLabelText('Year:')).toBeInTheDocument();
  });

  it('displays all years in dropdown', () => {
    render(<HolidayActionsBar {...defaultProps} />);

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(5);
    expect(options[0]).toHaveTextContent('2026');
    expect(options[4]).toHaveTextContent('2030');
  });

  it('shows selected year as current value', () => {
    render(<HolidayActionsBar {...defaultProps} selectedYear={2028} />);

    const select = screen.getByLabelText('Year:') as HTMLSelectElement;
    expect(select.value).toBe('2028');
  });

  it('calls onYearChange when selecting a different year', () => {
    render(<HolidayActionsBar {...defaultProps} />);

    const select = screen.getByLabelText('Year:');
    fireEvent.change(select, { target: { value: '2027' } });

    expect(mockOnYearChange).toHaveBeenCalledWith(2027);
    expect(mockOnYearChange).toHaveBeenCalledTimes(1);
  });

  it('renders create button', () => {
    render(<HolidayActionsBar {...defaultProps} />);

    const createButton = screen.getByRole('button', {
      name: /New Holiday/i,
    });
    expect(createButton).toBeInTheDocument();
  });

  it('calls onCreateClick when clicking create button', () => {
    render(<HolidayActionsBar {...defaultProps} />);

    const createButton = screen.getByRole('button', {
      name: /New Holiday/i,
    });
    fireEvent.click(createButton);

    expect(mockOnCreateClick).toHaveBeenCalledTimes(1);
  });

  it('has correct button styling', () => {
    render(<HolidayActionsBar {...defaultProps} />);

    const createButton = screen.getByRole('button', {
      name: /New Holiday/i,
    });

    expect(createButton).toHaveClass('bg-blue-800', 'text-white');
  });
});
