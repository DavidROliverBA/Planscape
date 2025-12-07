import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

// Custom render function that can wrap with providers if needed
interface WrapperProps {
  children: ReactNode;
}

function AllTheProviders({ children }: WrapperProps) {
  // Add providers here as needed (e.g., context providers)
  return <>{children}</>;
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };
