/**
 * Timeline configuration and zoom level settings
 */

export type ZoomLevel =
  | 'quarter'
  | 'half'
  | 'year'
  | '3year'
  | '5year'
  | '10year';

export interface TimelineConfig {
  zoomLevel: ZoomLevel;
  pixelsPerDay: number;
  headerHeight: number;
  rowHeight: number;
  swimlaneHeaderWidth: number;
  swimlaneGap: number;
  barPadding: number;
  barHeight: number;
  minBarWidth: number;
}

export const defaultConfig: TimelineConfig = {
  zoomLevel: 'year',
  pixelsPerDay: 1,
  headerHeight: 60,
  rowHeight: 48,
  swimlaneHeaderWidth: 200,
  swimlaneGap: 8,
  barPadding: 8,
  barHeight: 32,
  minBarWidth: 20,
};

export const zoomConfigs: Record<ZoomLevel, Partial<TimelineConfig>> = {
  quarter: {
    pixelsPerDay: 4,
  },
  half: {
    pixelsPerDay: 2,
  },
  year: {
    pixelsPerDay: 1,
  },
  '3year': {
    pixelsPerDay: 0.33,
  },
  '5year': {
    pixelsPerDay: 0.2,
  },
  '10year': {
    pixelsPerDay: 0.1,
  },
};

export const zoomLabels: Record<ZoomLevel, string> = {
  quarter: '3 months',
  half: '6 months',
  year: '1 year',
  '3year': '3 years',
  '5year': '5 years',
  '10year': '10 years',
};

/**
 * Get the complete config for a zoom level
 */
export function getTimelineConfig(zoomLevel: ZoomLevel): TimelineConfig {
  return {
    ...defaultConfig,
    ...zoomConfigs[zoomLevel],
    zoomLevel,
  };
}

/**
 * Initiative status colours (matches InitiativeStatus type)
 */
export const statusColours: Record<string, string> = {
  Proposed: '#94A3B8', // slate-400
  Planned: '#60A5FA', // blue-400
  InProgress: '#3B82F6', // blue-500
  Complete: '#22C55E', // green-500
  Cancelled: '#EF4444', // red-500
};

/**
 * Initiative type colours (matches InitiativeType enum)
 */
export const typeColours: Record<string, string> = {
  New: '#8B5CF6', // violet-500
  Upgrade: '#3B82F6', // blue-500
  Migration: '#F59E0B', // amber-500
  Decommission: '#EF4444', // red-500
  Replacement: '#06B6D4', // cyan-500
};

/**
 * Swimlane alternating background colours
 */
export const swimlaneColours = {
  even: '#FFFFFF',
  odd: '#F9FAFB', // gray-50
  hover: '#F3F4F6', // gray-100
};

/**
 * Timeline marker colours
 */
export const markerColours = {
  today: '#EF4444', // red-500
  milestone: '#F59E0B', // amber-500
  constraint: '#8B5CF6', // violet-500
};
