import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Group } from '@shopify/react-native-skia';
import type { WidgetProps } from '../core/types';

// ===== Form =====

interface FormContextType {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  setValue: (name: string, value: unknown) => void;
  setError: (name: string, error: string) => void;
  clearError: (name: string) => void;
  submit: () => boolean;
}

const FormContext = React.createContext<FormContextType>({
  values: {},
  errors: {},
  setValue: () => {},
  setError: () => {},
  clearError: () => {},
  submit: () => true,
});

export const useForm = () => React.useContext(FormContext);

export interface FormProps extends WidgetProps {
  children: React.ReactNode;
  initialValues?: Record<string, unknown>;
  onSubmit?: (values: Record<string, unknown>) => void;
  validate?: (values: Record<string, unknown>) => Record<string, string>;
}

/**
 * Form — form state management context with validation.
 * Tương đương Flutter Form + GlobalKey<FormState>.
 */
export const Form = React.memo(function Form({
  children,
  initialValues = {},
  onSubmit,
  validate,
}: FormProps) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setValue = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setError = useCallback((name: string, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const clearError = useCallback((name: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const submit = useCallback(() => {
    // Run validation if provided
    if (validate) {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return false;
      }
    }
    // Clear errors and call onSubmit
    setErrors({});
    onSubmit?.(values);
    return true;
  }, [values, validate, onSubmit]);

  const ctx = useMemo(
    () => ({
      values,
      errors,
      setValue,
      setError,
      clearError,
      submit,
    }),
    [values, errors, setValue, setError, clearError, submit]
  );

  return (
    <FormContext.Provider value={ctx}>
      <Group>{children}</Group>
    </FormContext.Provider>
  );
});
