import type { TextareaHTMLAttributes } from 'react';
import { forwardRef, useId } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    { label, error, hint, className = '', id: providedId, rows = 3, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    const hasError = Boolean(error);

    return (
      <div className={className}>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          className={`
            block w-full rounded-md shadow-sm
            text-sm
            px-3 py-2
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${
              hasError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }
            focus:outline-none focus:ring-1
            resize-y
          `}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${id}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${id}-hint`} className="mt-1 text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

TextArea.displayName = 'TextArea';
