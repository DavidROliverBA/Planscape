import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardSection,
  ConfirmModal,
  Input,
  LoadingInline,
  Modal,
  Select,
  useToast,
} from '../../components/ui';
import {
  capabilities as capabilitiesDb,
  constraints as constraintsDb,
  initiatives as initiativesDb,
  financialPeriods as periodsDb,
  resourcePools as poolsDb,
  systems as systemsDb,
} from '../../lib/db';
import {
  generateSampleCapabilities,
  generateSampleConstraints,
  generateSampleInitiatives,
  generateSampleResourcePools,
  generateSampleSystems,
} from '../../lib/sampleData';
import type { FinancialPeriod, FinancialPeriodType } from '../../lib/types';
import { useAppStore } from '../../stores/appStore';

const periodTypeOptions = [
  { value: 'Year', label: 'Year' },
  { value: 'Half', label: 'Half Year' },
  { value: 'Quarter', label: 'Quarter' },
  { value: 'Month', label: 'Month' },
];

export function SettingsPage() {
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<FinancialPeriod | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [periodToDelete, setPeriodToDelete] = useState<FinancialPeriod | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingSampleData, setIsLoadingSampleData] = useState(false);

  const { addToast } = useToast();
  const {
    initialise,
    capabilities,
    systems,
    initiatives,
    resourcePools,
    constraints,
    activeScenarioId,
  } = useAppStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleRefreshData = async () => {
    try {
      setIsRefreshing(true);
      setLastError(null);
      await initialise();
      addToast({ title: 'Data refreshed', type: 'success' });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      setLastError(errMsg);
      addToast({ title: 'Failed to refresh', message: errMsg, type: 'error' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTestDb = async () => {
    try {
      setTestResult('Testing...');
      const { initDb } = await import('../../lib/db');
      const db = await initDb();
      const result = await db.select<{ count: number }[]>(
        'SELECT COUNT(*) as count FROM initiatives',
      );
      setTestResult(`DB test OK: ${JSON.stringify(result)}`);
    } catch (error) {
      const errMsg =
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : String(error);
      setTestResult(`DB ERROR: ${errMsg}`);
    }
  };

  const loadPeriods = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await periodsDb.getAll();
      setPeriods(data);
    } catch (error) {
      console.error('Failed to load periods:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  const handleAdd = () => {
    setEditingPeriod(null);
    setIsFormOpen(true);
  };

  const handleEdit = (period: FinancialPeriod) => {
    setEditingPeriod(period);
    setIsFormOpen(true);
  };

  const handleSave = () => {
    setIsFormOpen(false);
    setEditingPeriod(null);
    loadPeriods();
  };

  const handleDeleteClick = (period: FinancialPeriod) => {
    setPeriodToDelete(period);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!periodToDelete) return;
    try {
      setIsDeleting(true);
      await periodsDb.delete(periodToDelete.id);
      loadPeriods();
    } catch (error) {
      console.error('Failed to delete period:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setPeriodToDelete(null);
    }
  };

  const handleLoadSampleData = async () => {
    try {
      setIsLoadingSampleData(true);

      // Ensure the app is initialised (creates baseline scenario if needed)
      await initialise();

      // Load sample capabilities
      const sampleCapabilities = generateSampleCapabilities();
      for (const cap of sampleCapabilities) {
        await capabilitiesDb.create(cap);
      }

      // Load sample systems
      const sampleSystems = generateSampleSystems();
      for (const sys of sampleSystems) {
        await systemsDb.create(sys);
      }

      // Get the current active scenario ID after initialisation
      const currentScenarioId = useAppStore.getState().activeScenarioId;

      // Load sample initiatives for the active scenario
      const sampleInitiatives = generateSampleInitiatives(currentScenarioId);
      for (const init of sampleInitiatives) {
        await initiativesDb.create(init);
      }

      // Load sample resource pools
      const samplePools = generateSampleResourcePools();
      for (const pool of samplePools) {
        await poolsDb.create(pool);
      }

      // Load sample constraints
      const sampleConstraints = generateSampleConstraints();
      for (const constraint of sampleConstraints) {
        await constraintsDb.create(constraint);
      }

      // Refresh the store to pick up all new data
      await initialise();

      addToast({
        title: 'Sample data loaded',
        message:
          'Capabilities, systems, initiatives, and more have been created',
        type: 'success',
      });
    } catch (error) {
      console.error('[SampleData] Failed to load sample data:', error);
      addToast({
        title: 'Failed to load sample data',
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
      });
    } finally {
      setIsLoadingSampleData(false);
    }
  };

  if (isLoading) {
    return <LoadingInline message="Loading settings..." />;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Sample Data Section */}
      <Card>
        <CardHeader
          title="Sample Data"
          subtitle="Load sample data to explore the application"
        />
        <CardSection>
          <p className="text-sm text-gray-600 mb-4">
            This will create sample capabilities, systems, initiatives, resource
            pools, and constraints. Use this to test the Timeline view and other
            features.
          </p>
          <Button
            onClick={handleLoadSampleData}
            isLoading={isLoadingSampleData}
            variant="secondary"
          >
            Load Sample Data
          </Button>
        </CardSection>
      </Card>

      {/* Debug Section */}
      <Card>
        <CardHeader
          title="Debug Info"
          subtitle="Current data loaded in the app"
          action={
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={handleTestDb}>
                Test DB
              </Button>
              <Button
                size="sm"
                onClick={handleRefreshData}
                isLoading={isRefreshing}
              >
                Refresh Data
              </Button>
            </div>
          }
        />
        <CardSection>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-medium text-gray-700">Active Scenario</div>
              <div className="text-gray-900 font-mono">{activeScenarioId}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-medium text-gray-700">Initiatives</div>
              <div className="text-gray-900 text-lg font-bold">
                {initiatives.length}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-medium text-gray-700">Capabilities</div>
              <div className="text-gray-900 text-lg font-bold">
                {capabilities.length}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-medium text-gray-700">Systems</div>
              <div className="text-gray-900 text-lg font-bold">
                {systems.length}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-medium text-gray-700">Resource Pools</div>
              <div className="text-gray-900 text-lg font-bold">
                {resourcePools.length}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-medium text-gray-700">Constraints</div>
              <div className="text-gray-900 text-lg font-bold">
                {constraints.length}
              </div>
            </div>
          </div>
          {initiatives.length > 0 && (
            <div className="mt-4 bg-gray-50 p-3 rounded">
              <div className="font-medium text-gray-700 mb-2">
                First Initiative:
              </div>
              <pre className="text-xs text-gray-600 overflow-x-auto">
                {JSON.stringify(initiatives[0], null, 2)}
              </pre>
            </div>
          )}
          {testResult && (
            <div
              className={`mt-4 p-3 rounded ${testResult.includes('ERROR') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}
            >
              <div className="font-medium mb-1">DB Test Result:</div>
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                {testResult}
              </pre>
            </div>
          )}
          {lastError && (
            <div className="mt-4 bg-red-50 p-3 rounded">
              <div className="font-medium text-red-800 mb-1">Last Error:</div>
              <pre className="text-xs text-red-600 overflow-x-auto whitespace-pre-wrap">
                {lastError}
              </pre>
            </div>
          )}
        </CardSection>
      </Card>

      {/* Financial Periods Section */}
      <Card>
        <CardHeader
          title="Financial Periods"
          subtitle="Define your fiscal calendar for budgeting"
          action={
            <Button size="sm" onClick={handleAdd}>
              Add Period
            </Button>
          }
        />
        <CardSection>
          {periods.length === 0 ? (
            <p className="text-sm text-gray-500">
              No financial periods defined. Add periods to enable budget
              tracking.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Start
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      End
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Budget
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {periods.map((period) => (
                    <tr key={period.id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {period.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {period.type}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(period.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(period.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {period.budgetAvailable
                          ? `$${period.budgetAvailable.toLocaleString()}`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(period)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(period)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardSection>
      </Card>

      {/* Form Modal */}
      <PeriodForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
        period={editingPeriod}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Financial Period"
        message={`Are you sure you want to delete "${periodToDelete?.name}"?`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

interface PeriodFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  period?: FinancialPeriod | null;
}

function PeriodForm({ isOpen, onClose, onSave, period }: PeriodFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<FinancialPeriodType>('Year');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetAvailable, setBudgetAvailable] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (period) {
      setName(period.name);
      setType(period.type);
      setStartDate(period.startDate.split('T')[0]);
      setEndDate(period.endDate.split('T')[0]);
      setBudgetAvailable(period.budgetAvailable?.toString() ?? '');
    } else {
      setName('');
      setType('Year');
      setStartDate('');
      setEndDate('');
      setBudgetAvailable('');
    }
  }, [period]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsLoading(true);
      const data = {
        name,
        type,
        startDate,
        endDate,
        budgetAvailable: budgetAvailable
          ? Number.parseFloat(budgetAvailable)
          : undefined,
      };
      if (period) {
        await periodsDb.update(period.id, data);
      } else {
        await periodsDb.create(data);
      }
      onSave();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={period ? 'Edit Financial Period' : 'Add Financial Period'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isLoading}>
            {period ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., FY2024 Q1"
          required
        />
        <Select
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value as FinancialPeriodType)}
          options={periodTypeOptions}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
        <Input
          label="Budget Available"
          type="number"
          value={budgetAvailable}
          onChange={(e) => setBudgetAvailable(e.target.value)}
          placeholder="0"
        />
      </form>
    </Modal>
  );
}
