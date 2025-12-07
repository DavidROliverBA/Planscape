import type { NavigationItem } from '@/lib/types';
import { useAppStore } from '@/stores/appStore';

interface NavItem {
  id: NavigationItem;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: 'timeline', label: 'Timeline', icon: '📅' },
  { id: 'systems', label: 'Systems', icon: '💻' },
  { id: 'capabilities', label: 'Capabilities', icon: '🎯' },
  { id: 'initiatives', label: 'Initiatives', icon: '📋' },
  { id: 'resources', label: 'Resources', icon: '👥' },
  { id: 'scenarios', label: 'Scenarios', icon: '🔀' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  const { activeNavigation, setActiveNavigation } = useAppStore();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-full">
      {/* Application title */}
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">Roadmap Planner</h1>
        <p className="text-xs text-gray-400 mt-1">Visual Planning Workbench</p>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setActiveNavigation(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-md
                  text-left text-sm font-medium transition-colors
                  ${
                    activeNavigation === item.id
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <span className="text-lg" role="img" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500">v0.1.0</p>
      </div>
    </aside>
  );
}
