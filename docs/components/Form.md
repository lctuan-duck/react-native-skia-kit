# Form & FormField Components

## Mục đích
- **Form**: Container quản lý validation state cho nhiều fields.
- **FormField**: Wrapper cho Input/Checkbox/etc, hiển thị label + error message.

## Flutter tương đương
- `Form`, `FormField`, `TextFormField`, `FormState.validate()`

## TypeScript Interface

```ts
interface FormProps {
  onSubmit?: (values: Record<string, any>) => void;
  onValidationChanged?: (isValid: boolean) => void;
  children: React.ReactNode;
}

interface FormFieldProps extends WidgetProps {
  name: string;            // REQUIRED — field key (unique trong Form)
  label?: string;
  required?: boolean;      // default: false
  validator?: (value: any) => string | null;  // trả về error message hoặc null
  children: React.ReactNode;  // Input, Checkbox, etc.
}

// Hook để truy cập Form controller
interface FormController {
  validate: () => boolean;           // validate tất cả fields
  reset: () => void;                 // reset form state
  getValue: (name: string) => any;
  setValue: (name: string, value: any) => void;
  getError: (name: string) => string | null;
  isValid: boolean;
  values: Record<string, any>;
  errors: Record<string, string | null>;
}

function useForm(): FormController;
function useFormField(name: string): {
  value: any;
  error: string | null;
  onChange: (value: any) => void;
};
```

## Core Implementation

```tsx
import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { Box, Text, Column } from 'react-native-skia-kit';
import { useTheme } from 'react-native-skia-kit/hooks';

// Form Context
const FormContext = createContext<FormController | null>(null);

export function useForm(): FormController {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error('useForm must be inside <Form>');
  return ctx;
}

// ===== Form =====

export const Form = React.memo(function Form({
  onSubmit, onValidationChanged, children,
}: FormProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const validatorsRef = useRef<Record<string, (v: any) => string | null>>({});

  const setValue = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    // Auto-validate on change
    const validator = validatorsRef.current[name];
    if (validator) {
      const error = validator(value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, []);

  const validate = useCallback(() => {
    const newErrors: Record<string, string | null> = {};
    let valid = true;
    for (const [name, validator] of Object.entries(validatorsRef.current)) {
      const error = validator(values[name]);
      newErrors[name] = error;
      if (error) valid = false;
    }
    setErrors(newErrors);
    onValidationChanged?.(valid);
    return valid;
  }, [values]);

  const controller: FormController = {
    validate,
    reset: () => { setValues({}); setErrors({}); },
    getValue: (name) => values[name],
    setValue,
    getError: (name) => errors[name] ?? null,
    isValid: Object.values(errors).every(e => e === null),
    values,
    errors,
  };

  return (
    <FormContext.Provider value={controller}>
      {children}
    </FormContext.Provider>
  );
});

// ===== FormField =====

export const FormField = React.memo(function FormField({
  name,
  label,
  required = false,
  validator,
  children,
}: FormFieldProps) {
  const form = useForm();
  const theme = useTheme();
  const error = form.getError(name);

  // Inject onChange + value vào child
  const enhancedChild = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    return React.cloneElement(child as React.ReactElement<any>, {
      value: form.getValue(name),
      onChangeText: (text: string) => form.setValue(name, text),
      onChange: (val: any) => form.setValue(name, val),
    });
  });

  return (
    <Column gap={4}>
      {/* Label */}
      {label && (
        <Row gap={2}>
          <Text text={label} fontSize={14} fontWeight="medium" color={theme.colors.textBody} />
          {required && <Text text="*" fontSize={14} color={theme.colors.error} />}
        </Row>
      )}

      {/* Child Input/Checkbox/etc */}
      {enhancedChild}

      {/* Error message */}
      {error && (
        <Text text={error} fontSize={12} color={theme.colors.error} />
      )}
    </Column>
  );
});
```

## Cách dùng

### Login form
```tsx
<Form onSubmit={(values) => login(values.email, values.password)}>
  <Column x={16} y={100} width={328} gap={16}>
    <FormField name="email" label="Email" required
      validator={(v) => !v ? 'Bắt buộc' : !v.includes('@') ? 'Email không hợp lệ' : null}
    >
      <Input placeholder="your@email.com" />
    </FormField>

    <FormField name="password" label="Mật khẩu" required
      validator={(v) => !v ? 'Bắt buộc' : v.length < 6 ? 'Tối thiểu 6 ký tự' : null}
    >
      <Input placeholder="••••••" secureTextEntry />
    </FormField>

    <SubmitButton />
  </Column>
</Form>

function SubmitButton() {
  const form = useForm();
  return (
    <Button text="Đăng nhập"
      onPress={() => form.validate() && form.values}
      disabled={!form.isValid}
    />
  );
}
```

### Settings form
```tsx
<Form onValidationChanged={(valid) => setSaveEnabled(valid)}>
  <Column x={16} y={56} width={328} gap={16}>
    <FormField name="name" label="Tên hiển thị" required
      validator={(v) => !v?.trim() ? 'Không được trống' : null}
    >
      <Input placeholder="Nhập tên" />
    </FormField>

    <FormField name="notifications" label="Thông báo">
      <Switch />
    </FormField>

    <FormField name="theme" label="Giao diện">
      <Segment items={['Light', 'Dark', 'System']} />
    </FormField>
  </Column>
</Form>
```

## Links
- Input: [Input.md](./Input.md), [Checkbox.md](./Checkbox.md), [Switch.md](./Switch.md)
- Base: [Column.md](./Column.md), [Text.md](./Text.md)
