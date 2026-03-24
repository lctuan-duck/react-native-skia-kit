# Form / FormField

Form management. Tương đương Flutter `Form` / `FormField`.

## Interface

```ts
interface FormProps {
  children: React.ReactNode;
  onSubmit?: (values: Record<string, string>) => void;
  formRef?: React.RefObject<FormRef>;
}

interface FormRef {
  validate: () => boolean;
  getValues: () => Record<string, string>;
  reset: () => void;
}

interface FormFieldProps {
  name: string;
  label?: string;
  required?: boolean;
  validator?: (value: string) => string | null;
  children: React.ReactNode;
}
```

## Cách dùng

```tsx
const formRef = useRef<FormRef>(null);

<Form formRef={formRef} onSubmit={(values) => save(values)}>
  <FormField name="email" label="Email" required>
    <Input placeholder="Enter email" variant="outline" />
  </FormField>
  <FormField name="password" label="Password" validator={(v) => v.length < 6 ? 'Min 6 chars' : null}>
    <Input placeholder="Password" secureTextEntry />
  </FormField>
  <Button text="Submit" onPress={() => formRef.current?.validate()} />
</Form>
```
