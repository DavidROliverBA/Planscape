import { formatDate } from '@/lib/dateUtils';
import { statusColours } from './timelineConfig';
import type { TimelineInitiative } from './useTimelineData';

interface TimelineTooltipProps {
  initiative: TimelineInitiative;
  x: number;
  y: number;
}

export function TimelineTooltip({ initiative, x, y }: TimelineTooltipProps) {
  const statusColor = statusColours[initiative.status] ?? '#94A3B8';
  const duration = Math.ceil(
    (initiative.endDateObj.getTime() - initiative.startDateObj.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <foreignObject
      x={x}
      y={y - 100}
      width={280}
      height={120}
      style={{ overflow: 'visible' }}
    >
      <div
        className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-sm"
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex items-start gap-2 mb-2">
          <div
            className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
            style={{ backgroundColor: statusColor }}
          />
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 truncate">
              {initiative.name}
            </div>
            <div className="text-xs text-gray-500 capitalize">
              {initiative.type} • {initiative.status}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div>
            <span className="text-gray-500">Start:</span>{' '}
            <span className="text-gray-700">
              {formatDate(initiative.startDateObj, 'medium')}
            </span>
          </div>
          <div>
            <span className="text-gray-500">End:</span>{' '}
            <span className="text-gray-700">
              {formatDate(initiative.endDateObj, 'medium')}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Duration:</span>{' '}
            <span className="text-gray-700">{duration} days</span>
          </div>
          {initiative.priority && (
            <div>
              <span className="text-gray-500">Priority:</span>{' '}
              <span className="text-gray-700">{initiative.priority}</span>
            </div>
          )}
        </div>

        {initiative.description && (
          <div className="mt-2 text-xs text-gray-600 line-clamp-2">
            {initiative.description}
          </div>
        )}
      </div>
    </foreignObject>
  );
}
