import { AppLayout } from '@/components/layout/AppLayout';
import { ToastProvider } from '@/components/ui';
import { useAppStore } from '@/stores/appStore';
import { useEffect } from 'react';

function App() {
  const { isLoading, initialise } = useAppStore();

  // Always call initialise on mount to ensure fresh data
  useEffect(() => {
    initialise();
  }, [initialise]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading Roadmap Planner...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <AppLayout />
    </ToastProvider>
  );
}

export default App;
