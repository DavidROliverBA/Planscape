import type * as d3 from 'd3';
import { markerColours } from './timelineConfig';

interface TimelineTodayProps {
  dateScale: d3.ScaleTime<number, number>;
  height: number;
  headerHeight: number;
}

export function TimelineToday({
  dateScale,
  height,
  headerHeight,
}: TimelineTodayProps) {
  const today = new Date();
  const x = dateScale(today);

  // Check if today is within the visible range
  const [min, max] = dateScale.domain();
  if (today < min || today > max) {
    return null;
  }

  return (
    <g>
      {/* Today marker line */}
      <line
        x1={x}
        y1={headerHeight}
        x2={x}
        y2={height}
        stroke={markerColours.today}
        strokeWidth={2}
        strokeDasharray="4,4"
      />

      {/* Today label */}
      <rect
        x={x - 24}
        y={headerHeight - 16}
        width={48}
        height={14}
        rx={2}
        fill={markerColours.today}
      />
      <text
        x={x}
        y={headerHeight - 6}
        textAnchor="middle"
        className="text-[10px] font-medium fill-white"
      >
        Today
      </text>
    </g>
  );
}
