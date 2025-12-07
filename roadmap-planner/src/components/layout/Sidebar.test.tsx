import { useAppStore } from '@/stores/appStore';
import { render } from '@/test/test-utils';
import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  beforeEach(() => {
    // Reset store state
    useAppStore.setState({
      activeNavigation: 'systems',
    });
  });

  it('should render the application title', () => {
    render(<Sidebar />);

    expect(screen.getByText('Roadmap Planner')).toBeInTheDocument();
    expect(screen.getByText('Visual Planning Workbench')).toBeInTheDocument();
  });

  it('should render all navigation items', () => {
    render(<Sidebar />);

    expect(screen.getByText('Systems')).toBeInTheDocument();
    expect(screen.getByText('Capabilities')).toBeInTheDocument();
    expect(screen.getByText('Initiatives')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('Scenarios')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should highlight the active navigation item', () => {
    render(<Sidebar />);

    const systemsButton = screen.getByRole('button', { name: /systems/i });
    expect(systemsButton).toHaveClass('bg-primary-600');
  });

  it('should change active navigation when item is clicked', () => {
    render(<Sidebar />);

    const initiativesButton = screen.getByRole('button', {
      name: /initiatives/i,
    });
    fireEvent.click(initiativesButton);

    expect(useAppStore.getState().activeNavigation).toBe('initiatives');
  });

  it('should update styling when navigation changes', () => {
    const { rerender } = render(<Sidebar />);

    // Click on Capabilities
    const capabilitiesButton = screen.getByRole('button', {
      name: /capabilities/i,
    });
    fireEvent.click(capabilitiesButton);

    // Re-render to reflect state change
    rerender(<Sidebar />);

    // Capabilities should now be highlighted
    expect(capabilitiesButton).toHaveClass('bg-primary-600');

    // Systems should no longer be highlighted
    const systemsButton = screen.getByRole('button', { name: /systems/i });
    expect(systemsButton).not.toHaveClass('bg-primary-600');
  });

  it('should display version number', () => {
    render(<Sidebar />);

    expect(screen.getByText('v0.1.0')).toBeInTheDocument();
  });

  it('should render navigation icons', () => {
    render(<Sidebar />);

    // Icons are rendered as emoji spans with role="img"
    const icons = screen.getAllByRole('img', { hidden: true });
    expect(icons.length).toBeGreaterThan(0);
  });
});
