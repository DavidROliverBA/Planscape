import {
  Button,
  CouplingModeSelector,
  DependencyLinesToggle,
} from '@/components/ui';
import { type ZoomLevel, zoomLabels } from './timelineConfig';

interface TimelineToolbarProps {
  zoomLevel: ZoomLevel;
  onZoomChange: (level: ZoomLevel) => void;
  onScrollToToday: () => void;
}

const zoomLevels: ZoomLevel[] = [
  'quarter',
  'half',
  'year',
  '3year',
  '5year',
  '10year',
];

export function TimelineToolbar({
  zoomLevel,
  onZoomChange,
  onScrollToToday,
}: TimelineToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>

        {/* Zoom level selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">View:</span>
          <select
            value={zoomLevel}
            onChange={(e) => onZoomChange(e.target.value as ZoomLevel)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {zoomLevels.map((level) => (
              <option key={level} value={level}>
                {zoomLabels[level]}
              </option>
            ))}
          </select>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200" />

        {/* Coupling mode */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Coupling:</span>
          <CouplingModeSelector />
        </div>

        {/* Dependency lines toggle */}
        <DependencyLinesToggle />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onScrollToToday}>
          Today
        </Button>
      </div>
    </div>
  );
}
