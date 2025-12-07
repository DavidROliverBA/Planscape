// QuickAddForm - Inline form for rapid entity creation

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from './Button';

export interface QuickAddField {
  name: string;
  type: 'text' | 'select' | 'date' | 'number';
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  defaultValue?: string | number;
  min?: number;
  max?: number;
  step?: number;
}

interface QuickAddFormProps {
  fields: QuickAddField[];
  onSubmit: (values: Record<string, string | number>) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  allowAddAnother?: boolean;
  isLoading?: boolean;
}

export function QuickAddForm({
  fields,
  onSubmit,
  onCancel,
  submitLabel = 'Create',
  allowAddAnother = true,
  isLoading = false,
}: QuickAddFormProps) {
  const [values, setValues] = useState<Record<string, string | number>>(() => {
    const initial: Record<string, string | number> = {};
    for (const field of fields) {
      if (field.defaultValue !== undefined) {
        initial[field.name] = field.defaultValue;
      } else {
        initial[field.name] = field.type === 'number' ? 0 : '';
      }
    }
    return initial;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [addAnother, setAddAnother] = useState(false);
  const firstInputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Focus first input on mount
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    for (const field of fields) {
      const value = values[field.name];
      if (field.required && (value === '' || value === undefined)) {
        newErrors[field.name] = `${field.label} is required`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fields, values]);

  const resetForm = useCallback(() => {
    const initial: Record<string, string | number> = {};
    for (const field of fields) {
      if (field.defaultValue !== undefined) {
        initial[field.name] = field.defaultValue;
      } else {
        initial[field.name] = field.type === 'number' ? 0 : '';
      }
    }
    setValues(initial);
    setErrors({});
    firstInputRef.current?.focus();
  }, [fields]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;

      try {
        await onSubmit(values);
        if (addAnother) {
          resetForm();
        } else {
          onCancel();
        }
      } catch (error) {
        console.error('QuickAdd submit error:', error);
      }
    },
    [values, validate, onSubmit, addAnother, resetForm, onCancel]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [onCancel]
  );

  const handleChange = useCallback(
    (fieldName: string, value: string | number) => {
      setValues((prev) => ({ ...prev, [fieldName]: value }));
      // Clear error when field is modified
      if (errors[fieldName]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[fieldName];
          return next;
        });
      }
    },
    [errors]
  );

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        {fields.map((field, index) => {
          const error = errors[field.name];
          const isFirstInput = index === 0;

          return (
            <div
              key={field.name}
              className={field.type === 'text' ? 'col-span-2' : ''}
            >
              <label
                htmlFor={`quick-${field.name}`}
                className="block text-xs font-medium text-gray-700 mb-1"
              >
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>

              {field.type === 'select' ? (
                <select
                  id={`quick-${field.name}`}
                  ref={isFirstInput ? (firstInputRef as React.RefObject<HTMLSelectElement>) : undefined}
                  value={values[field.name] as string}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className={`
                    w-full px-3 py-1.5 text-sm border rounded-md
                    focus:outline-none focus:ring-1 focus:ring-primary-500
                    ${error ? 'border-red-300' : 'border-gray-300'}
                  `}
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'date' ? (
                <input
                  id={`quick-${field.name}`}
                  ref={isFirstInput ? (firstInputRef as React.RefObject<HTMLInputElement>) : undefined}
                  type="date"
                  value={values[field.name] as string}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className={`
                    w-full px-3 py-1.5 text-sm border rounded-md
                    focus:outline-none focus:ring-1 focus:ring-primary-500
                    ${error ? 'border-red-300' : 'border-gray-300'}
                  `}
                />
              ) : field.type === 'number' ? (
                <input
                  id={`quick-${field.name}`}
                  ref={isFirstInput ? (firstInputRef as React.RefObject<HTMLInputElement>) : undefined}
                  type="number"
                  value={values[field.name]}
                  onChange={(e) => handleChange(field.name, Number(e.target.value))}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  placeholder={field.placeholder}
                  className={`
                    w-full px-3 py-1.5 text-sm border rounded-md
                    focus:outline-none focus:ring-1 focus:ring-primary-500
                    ${error ? 'border-red-300' : 'border-gray-300'}
                  `}
                />
              ) : (
                <input
                  id={`quick-${field.name}`}
                  ref={isFirstInput ? (firstInputRef as React.RefObject<HTMLInputElement>) : undefined}
                  type="text"
                  value={values[field.name] as string}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className={`
                    w-full px-3 py-1.5 text-sm border rounded-md
                    focus:outline-none focus:ring-1 focus:ring-primary-500
                    ${error ? 'border-red-300' : 'border-gray-300'}
                  `}
                />
              )}

              {error && (
                <p className="mt-1 text-xs text-red-600">{error}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2">
          {allowAddAnother && (
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={addAnother}
                onChange={(e) => setAddAnother(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              Add another
            </label>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={isLoading}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
