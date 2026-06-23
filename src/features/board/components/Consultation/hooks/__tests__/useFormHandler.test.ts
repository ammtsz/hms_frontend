import { renderHook, act } from '@testing-library/react';
import { useFormHandler, usePatientFormHandler } from '../useFormHandler';

// Helper to create mock form event
const createMockFormEvent = () => ({
  preventDefault: jest.fn()
}) as unknown as React.FormEvent;

describe('useFormHandler', () => {
  interface TestFormData {
    name: string;
    email: string;
    age: number;
  }

  const initialState: TestFormData = {
    name: '',
    email: '',
    age: 0,
  };

  it('should initialize with provided state', () => {
    const { result } = renderHook(() => useFormHandler({ initialState }));

    expect(result.current.formData).toEqual(initialState);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle input changes', () => {
    const { result } = renderHook(() => useFormHandler({ initialState }));

    act(() => {
      const event = {
        target: { name: 'name', value: 'John Doe', type: 'text' }
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleChange(event);
    });

    expect(result.current.formData.name).toBe('John Doe');
  });

  it('should handle checkbox changes', () => {
    interface CheckboxFormData {
      name: string;
      isActive: boolean;
    }
    
    const checkboxInitialState: CheckboxFormData = {
      name: '',
      isActive: false,
    };

    const { result } = renderHook(() => useFormHandler({ initialState: checkboxInitialState }));

    act(() => {
      const event = {
        target: { name: 'isActive', checked: true, type: 'checkbox' }
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleChange(event);
    });

    expect(result.current.formData.isActive).toBe(true);
  });

  it('should apply formatters when provided', () => {
    const formatters = {
      name: (value: unknown) => String(value).toUpperCase(),
    } as { [K in keyof TestFormData]?: (value: unknown) => unknown };

    const { result } = renderHook(() => 
      useFormHandler({ 
        initialState, 
        formatters 
      })
    );

    act(() => {
      const event = {
        target: { name: 'name', value: 'john doe', type: 'text' }
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleChange(event);
    });

    expect(result.current.formData.name).toBe('JOHN DOE');
  });

  it('should clear error when user starts typing', () => {
    const { result } = renderHook(() => useFormHandler({ initialState }));

    // Set an error first
    act(() => {
      result.current.setError('Test error');
    });
    expect(result.current.error).toBe('Test error');

    // Simulate user input
    act(() => {
      const event = {
        target: { name: 'name', value: 'John', type: 'text' }
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleChange(event);
    });

    expect(result.current.error).toBe(null);
  });

  it('should handle form submission successfully', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => 
      useFormHandler({ initialState, onSubmit: mockOnSubmit })
    );

    await act(async () => {
      const event = createMockFormEvent();
      await result.current.handleSubmit(event);
    });

    expect(mockOnSubmit).toHaveBeenCalledWith(initialState);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle form submission errors', async () => {
    const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'));
    const { result } = renderHook(() => 
      useFormHandler({ initialState, onSubmit: mockOnSubmit })
    );

    await act(async () => {
      const event = createMockFormEvent();
      await result.current.handleSubmit(event);
    });

    expect(result.current.error).toBe('Submission failed');
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle validation errors', async () => {
    const mockValidate = jest.fn().mockReturnValue('Validation error');
    const mockOnSubmit = jest.fn();
    
    const { result } = renderHook(() => 
      useFormHandler({ 
        initialState, 
        validate: mockValidate, 
        onSubmit: mockOnSubmit 
      })
    );

    await act(async () => {
      const event = createMockFormEvent();
      await result.current.handleSubmit(event);
    });

    expect(mockValidate).toHaveBeenCalledWith(initialState);
    expect(result.current.error).toBe('Validation error');
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should prevent submission when already loading', async () => {
    const mockOnSubmit = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    const { result } = renderHook(() => 
      useFormHandler({ initialState, onSubmit: mockOnSubmit })
    );

    const event = createMockFormEvent();

    // Start first submission
    act(() => {
      result.current.handleSubmit(event);
    });
    expect(result.current.isLoading).toBe(true);

    // Try second submission while loading
    await act(async () => {
      await result.current.handleSubmit(event);
    });

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  it('should handle non-Error exceptions', async () => {
    const mockOnSubmit = jest.fn().mockRejectedValue('String error');
    const { result } = renderHook(() => 
      useFormHandler({ initialState, onSubmit: mockOnSubmit })
    );

    await act(async () => {
      const event = createMockFormEvent();
      await result.current.handleSubmit(event);
    });

    expect(result.current.error).toBe('Unexpected error occurred');
  });

  it('should reset form to initial state', () => {
    const { result } = renderHook(() => useFormHandler({ initialState }));

    // Change form data
    act(() => {
      const event = {
        target: { name: 'name', value: 'Changed Name', type: 'text' }
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleChange(event);
    });

    act(() => {
      result.current.setError('Test error');
    });

    expect(result.current.formData.name).toBe('Changed Name');
    expect(result.current.error).toBe('Test error');

    // Reset form
    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData).toEqual(initialState);
    expect(result.current.error).toBe(null);
    expect(result.current.isLoading).toBe(false);
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useFormHandler({ initialState }));

    act(() => {
      result.current.setError('Test error');
    });
    expect(result.current.error).toBe('Test error');

    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBe(null);
  });

  it('should handle submission without onSubmit callback', async () => {
    const { result } = renderHook(() => useFormHandler({ initialState }));

    await act(async () => {
      const event = createMockFormEvent();
      await result.current.handleSubmit(event);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });
});

describe('usePatientFormHandler', () => {
  interface PatientFormData {
    name: string;
    phone: string;
    birthDate: string | null;
  }

  const initialState: PatientFormData = {
    name: '',
    phone: '',
    birthDate: null,
  };

  it('should initialize with patient form validation', () => {
    const { result } = renderHook(() => 
      usePatientFormHandler({ initialState })
    );

    expect(result.current.formData).toEqual(initialState);
  });

  it('should format phone numbers automatically', () => {
    const { result } = renderHook(() => 
      usePatientFormHandler({ initialState })
    );

    act(() => {
      const event = {
        target: { name: 'phone', value: '11999887766', type: 'text' }
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleChange(event);
    });

    expect(result.current.formData.phone).toBe('(11) 99988-7766');
  });

  it('should handle birth date formatting', () => {
    const { result } = renderHook(() => 
      usePatientFormHandler({ initialState })
    );

    act(() => {
      const event = {
        target: { name: 'birthDate', value: '2025-08-12', type: 'date' }
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleChange(event);
    });

    expect(result.current.formData.birthDate).toBe('2025-08-12');
  });

  it('should validate with optional fields by default', async () => {
    const mockOnSubmit = jest.fn();
    const { result } = renderHook(() => 
      usePatientFormHandler({ 
        initialState: { ...initialState, name: 'John Doe' }, 
        onSubmit: mockOnSubmit 
      })
    );

    await act(async () => {
      const event = createMockFormEvent();
      await result.current.handleSubmit(event);
    });

    expect(mockOnSubmit).toHaveBeenCalled();
    expect(result.current.error).toBe(null);
  });

  it('should validate required phone when specified', async () => {
    const mockOnSubmit = jest.fn();
    const { result } = renderHook(() => 
      usePatientFormHandler({ 
        initialState: { ...initialState, name: 'John Doe' }, 
        onSubmit: mockOnSubmit,
        requirePhone: true
      })
    );

    await act(async () => {
      const event = createMockFormEvent();
      await result.current.handleSubmit(event);
    });

    expect(result.current.error).toBe('Phone is required');
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate required birth date when specified', async () => {
    const mockOnSubmit = jest.fn();
    const { result } = renderHook(() => 
      usePatientFormHandler({ 
        initialState: { ...initialState, name: 'John Doe' }, 
        onSubmit: mockOnSubmit,
        requireBirthDate: true
      })
    );

    await act(async () => {
      const event = createMockFormEvent();
      await result.current.handleSubmit(event);
    });

    expect(result.current.error).toBe('Date of birth is required');
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should handle empty birth date input', () => {
    const { result } = renderHook(() => 
      usePatientFormHandler({ initialState })
    );

    act(() => {
      const event = {
        target: { name: 'birthDate', value: '', type: 'date' }
      } as React.ChangeEvent<HTMLInputElement>;
      result.current.handleChange(event);
    });

    expect(result.current.formData.birthDate).toBe('');
  });
});