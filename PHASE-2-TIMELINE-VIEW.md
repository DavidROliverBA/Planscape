# Phase 2: Timeline View

## Objective

Create the first interactive visualisation—a timeline view showing initiatives across time, grouped by capability, with drag-and-drop manipulation.

## Prerequisites

- Phase 1 complete
- CRUD operations working for all entities
- Sample data can be created and persisted
- Active scenario can be switched

## Context

The timeline is the primary visualisation for Roadmap Planner. It allows architects to see when work is happening, how it's distributed across capabilities, and to manipulate timing by dragging. This is where the "bidirectional data-view binding" principle comes to life.

---

## Task List

### 1. Timeline Data Preparation

- [ ] Create `src/features/timeline/useTimelineData.ts`:
  - Custom hook that prepares data for the timeline
  - Takes active scenario ID as input
  - Returns initiatives grouped by capability
  - Calculates visible time range based on data
  - Memoises expensive calculations

- [ ] Create `src/lib/dateUtils.ts`:
  - `parseDate(dateString: string): Date`
  - `formatDate(date: Date, format: string): string`
  - `addDays(date: Date, days: number): Date`
  - `diffDays(start: Date, end: Date): number`
  - `getQuarterStart(date: Date): Date`
  - `getYearStart(date: Date): Date`
  - `dateRangeOverlaps(start1, end1, start2, end2): boolean`

### 2. Timeline Scale Configuration

- [ ] Create `src/features/timeline/timelineConfig.ts`:

```typescript
export type ZoomLevel = 'quarter' | 'half' | 'year' | '3year' | '5year' | '10year';

export interface TimelineConfig {
  zoomLevel: ZoomLevel;
  pixelsPerDay: number;
  headerHeight: number;
  rowHeight: number;
  swimlaneGap: number;
  barPadding: number;
}

export const zoomConfigs: Record<ZoomLevel, Partial<TimelineConfig>> = {
  quarter: { pixelsPerDay: 4 },
  half: { pixelsPerDay: 2 },
  year: { pixelsPerDay: 1 },
  '3year': { pixelsPerDay: 0.33 },
  '5year': { pixelsPerDay: 0.2 },
  '10year': { pixelsPerDay: 0.1 },
};
```

### 3. D3 Timeline Component

- [ ] Create `src/features/timeline/Timeline.tsx`:
  - Main container component
  - Manages SVG element
  - Handles zoom level state
  - Renders TimelineHeader, TimelineBody

- [ ] Create `src/features/timeline/TimelineHeader.tsx`:
  - D3-rendered time axis
  - Shows months/quarters/years depending on zoom
  - Sticky at top during scroll
  - Today marker

- [ ] Create `src/features/timeline/TimelineSwimlanes.tsx`:
  - Renders capability swimlanes
  - Alternating background colours
  - Capability labels on left (sticky)
  - Collapse/expand capability groups

- [ ] Create `src/features/timeline/TimelineBar.tsx`:
  - Individual initiative bar
  - Colour based on initiative type or status
  - Shows name (truncated if needed)
  - Tooltip on hover with full details

### 4. Drag and Drop

- [ ] Create `src/features/timeline/useDrag.ts`:
  - Custom hook for drag behaviour
  - Tracks drag start position
  - Calculates date offset from pixel movement
  - Snapping to grid (optional, configurable)
  - Returns isDragging, dragOffset

- [ ] Implement drag behaviour on TimelineBar:
  - Cursor changes on hover (move cursor)
  - Bar follows mouse during drag
  - Visual feedback (opacity change, shadow)
  - Preview of new position

- [ ] Implement resize handles:
  - Left handle to change start date
  - Right handle to change end date
  - Minimum duration enforcement

### 5. Bidirectional Updates

- [ ] Create `src/features/timeline/useTimelineMutations.ts`:
  - Hook that provides mutation functions
  - `moveInitiative(id: string, newStartDate: Date, newEndDate: Date)`
  - `resizeInitiative(id: string, newStartDate: Date, newEndDate: Date)`
  - Updates database via Tauri command
  - Updates Zustand store optimistically
  - Handles errors with rollback

- [ ] Connect drag completion to mutations:
  - On drag end, calculate new dates
  - Call mutation function
  - Show success/error toast

### 6. Visual Feedback

- [ ] Create `src/features/timeline/TimelineToday.tsx`:
  - Vertical line showing today's date
  - Always visible, distinctive colour

- [ ] Create `src/features/timeline/TimelineMilestones.tsx`:
  - Render constraint deadlines as markers
  - Diamond or triangle shape
  - Tooltip with constraint details

- [ ] Implement hover states:
  - Bar highlights on hover
  - Related bars highlight (same system, dependencies)
  - Swimlane highlight

- [ ] Implement selection:
  - Click to select initiative
  - Selected bar has distinct border
  - Selection syncs with detail panel

### 7. Pan and Zoom

- [ ] Implement horizontal scrolling:
  - Scroll wheel for horizontal pan
  - Click and drag on background to pan
  - Scroll bar at bottom

- [ ] Implement zoom controls:
  - Zoom level dropdown in header
  - Ctrl+scroll to zoom (optional)
  - Zoom centres on cursor position

- [ ] Implement vertical scrolling:
  - For many capabilities
  - Virtual scrolling if performance needed

### 8. Timeline Toolbar

- [ ] Create `src/features/timeline/TimelineToolbar.tsx`:
  - Zoom level selector
  - "Today" button to scroll to today
  - View options (show/hide completed, filter by type)
  - Export button (placeholder for Phase 6)

### 9. Integration with Main Canvas

- [ ] Update MainCanvas to render Timeline when on timeline view
- [ ] Connect scenario selector to timeline data
- [ ] Connect system/initiative selection to detail panel

### 10. Empty and Loading States

- [ ] Show loading skeleton while data loads
- [ ] Show empty state when no initiatives
- [ ] Show message when all initiatives filtered out

### 11. Performance Optimisation

- [ ] Implement virtual rendering for many initiatives
- [ ] Debounce drag updates during continuous drag
- [ ] Memoise D3 scales and calculations
- [ ] Use requestAnimationFrame for smooth drag

### 12. Accessibility

- [ ] Keyboard navigation between bars
- [ ] Arrow keys to move selected initiative
- [ ] Focus indicators
- [ ] Screen reader labels

---

## Acceptance Criteria

- [ ] Timeline renders initiatives as horizontal bars
- [ ] Initiatives are grouped into capability swimlanes
- [ ] Time axis shows appropriate granularity for zoom level
- [ ] Can change zoom level and timeline adjusts
- [ ] Can scroll horizontally through time
- [ ] Can drag initiative bars to change dates
- [ ] Can resize initiative bars from edges
- [ ] Dragging/resizing updates the database
- [ ] Changes persist after page refresh
- [ ] Today marker is visible
- [ ] Clicking an initiative selects it
- [ ] Hover shows tooltip with details
- [ ] Timeline is responsive to window size
- [ ] Performance is smooth with 50+ initiatives

---

## Technical Notes

### D3 Integration with React

Use refs and useEffect for D3 rendering:

```typescript
const svgRef = useRef<SVGSVGElement>(null);

useEffect(() => {
  if (!svgRef.current) return;
  
  const svg = d3.select(svgRef.current);
  
  // D3 rendering code here
  
  return () => {
    // Cleanup
    svg.selectAll('*').remove();
  };
}, [data, config]);
```

### Date-to-Pixel Conversion

```typescript
const dateScale = d3.scaleTime()
  .domain([startDate, endDate])
  .range([0, width]);

const dateToX = (date: Date) => dateScale(date);
const xToDate = (x: number) => dateScale.invert(x);
```

### Drag Implementation

```typescript
const drag = d3.drag<SVGRectElement, Initiative>()
  .on('start', (event, d) => {
    // Store initial position
  })
  .on('drag', (event, d) => {
    // Update position during drag
  })
  .on('end', (event, d) => {
    // Calculate new dates and save
  });

bars.call(drag);
```

---

## File Checklist

New files in this phase:

```
src/
├── lib/
│   └── dateUtils.ts
├── features/
│   └── timeline/
│       ├── Timeline.tsx
│       ├── TimelineHeader.tsx
│       ├── TimelineSwimlanes.tsx
│       ├── TimelineBar.tsx
│       ├── TimelineToday.tsx
│       ├── TimelineMilestones.tsx
│       ├── TimelineToolbar.tsx
│       ├── timelineConfig.ts
│       ├── useTimelineData.ts
│       ├── useTimelineMutations.ts
│       └── useDrag.ts
```

---

## Notes for Claude Code

- D3 v7 uses ES modules - import like `import * as d3 from 'd3'`
- Be careful with D3 + React - let D3 handle rendering within the SVG, React handles the container
- Use `pointer-events` CSS to control what's interactive
- Consider using `d3-drag` and `d3-zoom` for interactions
- Test with varying amounts of data (5, 50, 500 initiatives)
- Mobile/touch support is nice-to-have, not required for Phase 2
