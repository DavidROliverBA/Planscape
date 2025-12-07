import { useAppStore } from '@/stores/appStore';
import { render } from '@/test/test-utils';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MainCanvas } from './MainCanvas';

// Mock the database module to prevent actual database calls
vi.mock('@/lib/db', () => ({
  systems: {
    getAll: vi.fn(() => Promise.resolve([])),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  capabilities: {
    getAll: vi.fn(() => Promise.resolve([])),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  initiatives: {
    getAll: vi.fn(() => Promise.resolve([])),
    getByScenario: vi.fn(() => Promise.resolve([])),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  resourcePools: {
    getAll: vi.fn(() => Promise.resolve([])),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  resources: {
    getAll: vi.fn(() => Promise.resolve([])),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  scenarios: {
    getAll: vi.fn(() => Promise.resolve([])),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  financialPeriods: {
    getAll: vi.fn(() => Promise.resolve([])),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('MainCanvas', () => {
  beforeEach(() => {
    // Reset store state with baseline scenario
    useAppStore.setState({
      activeNavigation: 'systems',
      activeScenarioId: 'baseline',
      zoomLevel: 'Year',
      scenarios: [
        {
          id: 'baseline',
          name: 'Baseline',
          description: 'The current known state and committed plans',
          isBaseline: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });
  });

  describe('Header', () => {
    it('should show header for systems navigation', async () => {
      render(<MainCanvas />);

      await waitFor(() => {
        expect(screen.getByLabelText(/scenario/i)).toBeInTheDocument();
      });
    });

    it('should hide header for settings navigation', async () => {
      useAppStore.setState({ activeNavigation: 'settings' });
      render(<MainCanvas />);

      await waitFor(() => {
        expect(screen.queryByLabelText(/scenario/i)).not.toBeInTheDocument();
      });
    });

    it('should hide header for scenarios navigation', async () => {
      useAppStore.setState({ activeNavigation: 'scenarios' });
      render(<MainCanvas />);

      await waitFor(() => {
        expect(screen.queryByLabelText(/scenario/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Scenario Selector', () => {
    it('should render the scenario dropdown', async () => {
      render(<MainCanvas />);

      await waitFor(() => {
        const select = screen.getByLabelText(/scenario/i);
        expect(select).toBeInTheDocument();
      });
    });

    it('should display baseline scenario in dropdown', async () => {
      render(<MainCanvas />);

      await waitFor(() => {
        const select = screen.getByLabelText(/scenario/i);
        expect(select).toHaveValue('baseline');
      });
    });

    it('should show scenario description', async () => {
      render(<MainCanvas />);

      await waitFor(() => {
        expect(
          screen.getByText('The current known state and committed plans'),
        ).toBeInTheDocument();
      });
    });

    it('should change active scenario when selection changes', async () => {
      useAppStore.setState({
        scenarios: [
          {
            id: 'baseline',
            name: 'Baseline',
            description: 'Current plan',
            isBaseline: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'what-if-1',
            name: 'What If Scenario',
            description: 'Alternative timing',
            isBaseline: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      });

      render(<MainCanvas />);

      await waitFor(() => {
        const select = screen.getByLabelText(/scenario/i);
        fireEvent.change(select, { target: { value: 'what-if-1' } });
        expect(useAppStore.getState().activeScenarioId).toBe('what-if-1');
      });
    });
  });

  describe('Zoom Level Selector', () => {
    it('should not show zoom selector for non-timeline views', async () => {
      useAppStore.setState({ activeNavigation: 'systems' });
      render(<MainCanvas />);

      await waitFor(() => {
        expect(screen.queryByLabelText(/zoom/i)).not.toBeInTheDocument();
      });
    });

    it('should show zoom selector for initiatives view', async () => {
      useAppStore.setState({ activeNavigation: 'initiatives' });
      render(<MainCanvas />);

      await waitFor(() => {
        expect(screen.getByLabelText(/zoom/i)).toBeInTheDocument();
      });
    });

    it('should display all zoom level options', async () => {
      useAppStore.setState({ activeNavigation: 'initiatives' });
      render(<MainCanvas />);

      await waitFor(() => {
        expect(screen.getByLabelText(/zoom/i)).toBeInTheDocument();
      });

      // Check options are present
      expect(
        screen.getByRole('option', { name: 'Quarter' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Half Year' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Year' })).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: '3 Years' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: '5 Years' }),
      ).toBeInTheDocument();
    });

    it('should change zoom level when selection changes', async () => {
      useAppStore.setState({ activeNavigation: 'initiatives' });
      render(<MainCanvas />);

      await waitFor(() => {
        expect(screen.getByLabelText(/zoom/i)).toBeInTheDocument();
      });

      const select = screen.getByLabelText(/zoom/i);
      fireEvent.change(select, { target: { value: 'Quarter' } });

      expect(useAppStore.getState().zoomLevel).toBe('Quarter');
    });
  });

  describe('Content Rendering', () => {
    it('should render SystemsPage for systems navigation', async () => {
      useAppStore.setState({ activeNavigation: 'systems' });
      render(<MainCanvas />);

      await waitFor(() => {
        // Systems page has an "Add System" button
        expect(
          screen.getByRole('button', { name: /add system/i }),
        ).toBeInTheDocument();
      });
    });

    it('should render CapabilitiesPage for capabilities navigation', async () => {
      useAppStore.setState({ activeNavigation: 'capabilities' });
      render(<MainCanvas />);

      await waitFor(() => {
        // Capabilities page has "Add Capability" button
        expect(
          screen.getByRole('button', { name: /add capability/i }),
        ).toBeInTheDocument();
      });
    });

    it('should render InitiativesPage for initiatives navigation', async () => {
      useAppStore.setState({ activeNavigation: 'initiatives' });
      render(<MainCanvas />);

      await waitFor(() => {
        // Initiatives page has "Add Initiative" button
        expect(
          screen.getByRole('button', { name: /add initiative/i }),
        ).toBeInTheDocument();
      });
    });

    it('should render SettingsPage for settings navigation', async () => {
      useAppStore.setState({ activeNavigation: 'settings' });
      render(<MainCanvas />);

      await waitFor(() => {
        // Settings page has "Settings" heading
        expect(
          screen.getByRole('heading', { name: /settings/i }),
        ).toBeInTheDocument();
      });
    });
  });
});
