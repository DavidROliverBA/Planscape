# UI Enhancements for Roadmap Planner

## Purpose

This document details UI improvements to be applied to the existing phase documents. These changes align the implementation with best practices for a "thinking tool" that prioritises direct manipulation, immediate feedback, and minimal friction.

Process these changes alongside the corresponding phase documents.

---

## Phase 0: Scaffolding Enhancements

### 1. Update Layout Components

The initial UI shell needs additional layout components beyond the basic Sidebar and MainCanvas.

**Add to Task 8 (Initial UI Shell):**

- [ ] Create `src/components/layout/NavigatorPanel.tsx`:
  - Collapsible panel on the left side (distinct from navigation sidebar)
  - Tree view of capabilities with expand/collapse
  - Tree view of resource pools
  - Filter/search input at top
  - Click item to filter main canvas
  - Drag handle to resize width
  - Remember collapsed state in local storage

- [ ] Create `src/components/layout/DetailPanel.tsx`:
  - Contextual panel that appears when an item is selected
  - Slides up from bottom or docks to right side (user preference)
  - Close button and keyboard shortcut (Escape)
  - Resizable height/width depending on dock position
  - Tabs for different detail sections
  - Remembers last dock position

- [ ] Create `src/components/layout/AppLayout.tsx`:
  - Master layout component combining all panels
  - Manages panel visibility and sizing
  - Responsive behaviour for smaller screens
  - Keyboard shortcuts for panel toggling (Cmd+1, Cmd+2, etc.)

**Update MainCanvas.tsx requirements:**

Replace the existing MainCanvas spec with:

- [ ] Create `src/components/layout/MainCanvas.tsx`:
  - Header bar containing:
    - Scenario selector dropdown (prominent, left side)
    - Visual badge when not on baseline (amber background)
    - "Return to Baseline" quick action button
    - View selector tabs: Timeline | Resources | Cost | Dependencies
    - Zoom level dropdown: Quarter, Half Year, Year, 3 Years, 5 Years, 10 Years
    - Coupling mode toggle (for Phase 3)
    - "Today" button to scroll timeline to current date
    - Export button (placeholder for Phase 6)
  - Main content area for active view
  - Renders appropriate view component based on selected tab

### 2. Update Zoom Levels

**Update timelineConfig references:**

Add 10-year zoom level throughout. Update any zoom level lists to include:

```typescript
export type ZoomLevel = 'quarter' | 'half' | 'year' | '3year' | '5year' | '10year';

export const zoomConfigs: Record<ZoomLevel, Partial<TimelineConfig>> = {
  quarter: { pixelsPerDay: 4 },
  half: { pixelsPerDay: 2 },
  year: { pixelsPerDay: 1 },
  '3year': { pixelsPerDay: 0.33 },
  '5year': { pixelsPerDay: 0.2 },
  '10year': { pixelsPerDay: 0.1 },
};
```

### 3. Update File Checklist

Add these files to the Phase 0 file checklist:

```
src/
├── components/
│   └── layout/
│       ├── Sidebar.tsx
│       ├── MainCanvas.tsx
│       ├── NavigatorPanel.tsx
│       ├── DetailPanel.tsx
│       └── AppLayout.tsx
```

### 4. Update Zustand Store

**Add to appStore.ts requirements:**

```typescript
// UI Panel State
interface PanelState {
  navigatorVisible: boolean;
  navigatorWidth: number;
  detailPanelVisible: boolean;
  detailPanelDockPosition: 'bottom' | 'right';
  detailPanelSize: number;
  activeView: 'timeline' | 'resources' | 'cost' | 'dependencies';
}

// Actions
toggleNavigator: () => void;
setNavigatorWidth: (width: number) => void;
toggleDetailPanel: () => void;
setDetailPanelDock: (position: 'bottom' | 'right') => void;
setActiveView: (view: PanelState['activeView']) => void;
```

---

## Phase 1: Data Model Enhancements

### 1. Add Tabbed Detail Panel Component

**Add new UI component:**

- [ ] Create `src/components/ui/TabbedPanel.tsx`:
  - Reusable tabbed container for detail views
  - Tab bar with icons and labels
  - Active tab indicator
  - Lazy loading of tab content
  - Keyboard navigation between tabs (arrow keys)
  - Props: tabs array, activeTab, onTabChange

```typescript
interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number; // e.g., dependency count
  content: React.ReactNode;
}

interface TabbedPanelProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}
```

### 2. Update Detail View Specifications

**Replace InitiativeDetail.tsx spec with:**

- [ ] Create `src/features/initiatives/InitiativeDetail.tsx`:
  - Uses TabbedPanel component
  - **Overview tab** (default):
    - Key attributes in scannable grid layout
    - Name, capability, system, owner in header
    - Start/End/Duration in first row
    - Budget/Effort/Status in second row
    - Description text below
    - Edit button opens InitiativeForm
    - Delete button with confirmation
  - **Dependencies tab**:
    - Mini dependency graph showing immediate connections
    - List of predecessors with relationship type
    - List of successors with relationship type
    - "Add Dependency" button
    - Quick-remove X button on each dependency
  - **Resources tab**:
    - List of resource pool allocations
    - Bar showing allocation per period
    - "Add Resource Requirement" button
    - Edit/remove on each allocation
  - **Constraints tab**:
    - List of linked constraints
    - Visual indicator for hard vs soft
    - Deadline dates displayed
    - "Link Constraint" button
  - **History tab** (placeholder for future):
    - Changelog within current scenario
    - Who changed what, when

**Replace SystemDetail.tsx spec with:**

- [ ] Create `src/features/systems/SystemDetail.tsx`:
  - Uses TabbedPanel component
  - **Overview tab**:
    - Name, owner, vendor in header
    - Lifecycle stage with coloured badge
    - Criticality with coloured badge
    - Technology stack as tag chips
    - Support dates with warning if approaching
    - Description text
    - Edit/Delete buttons
  - **Initiatives tab**:
    - List of initiatives affecting this system
    - Relationship type shown (Target, Affected, Replaced)
    - Click to navigate to initiative
    - "Link Initiative" button
  - **Dependencies tab**:
    - System integration dependencies
    - Upstream systems (this depends on)
    - Downstream systems (depend on this)
    - "Add Dependency" button
  - **Timeline tab**:
    - Mini timeline showing just this system's initiatives
    - Visual representation of planned changes

### 3. Add Quick-Add Form Pattern

**Add new component:**

- [ ] Create `src/components/ui/QuickAddForm.tsx`:
  - Inline form that expands in place (not modal)
  - Minimal fields for rapid entry
  - Appears below "Add" button when clicked
  - Auto-focus on first field
  - Enter to submit, Escape to cancel
  - "Create" and "Create & Add Another" buttons
  - Collapses after successful creation
  - Shows inline validation errors

```typescript
interface QuickAddField {
  name: string;
  type: 'text' | 'select' | 'date' | 'number';
  placeholder?: string;
  options?: { value: string; label: string }[]; // for select
  required?: boolean;
  defaultValue?: any;
}

interface QuickAddFormProps {
  fields: QuickAddField[];
  onSubmit: (values: Record<string, any>) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  allowAddAnother?: boolean;
}
```

**Add quick-add forms for each entity:**

- [ ] Create `src/features/initiatives/InitiativeQuickAdd.tsx`:
  - Fields: Name, Capability (dropdown), Start Quarter (dropdown), End Quarter (dropdown), Rough Cost (number)
  - Defaults: Current scenario, status = Proposed
  - Expands inline in InitiativesList

- [ ] Create `src/features/systems/SystemQuickAdd.tsx`:
  - Fields: Name, Capability (dropdown), Lifecycle Stage (dropdown), Criticality (dropdown)
  - Expands inline in SystemsList

- [ ] Create `src/features/capabilities/CapabilityQuickAdd.tsx`:
  - Fields: Name, Type (Business/Technical), Parent (dropdown, optional)
  - Expands inline in CapabilitiesList

- [ ] Create `src/features/resources/ResourcePoolQuickAdd.tsx`:
  - Fields: Name, Capacity per Period (number), Period Type (dropdown)
  - Expands inline in ResourcePoolsList

### 4. Add Sliding Panel Component

**Add new UI component:**

- [ ] Create `src/components/ui/Panel.tsx`:
  - Sliding/docking panel container
  - Props: position ('bottom' | 'right' | 'left'), size, onResize, onClose
  - Drag handle for resizing
  - Smooth open/close animation
  - Click outside to close (optional)
  - Header slot for title and actions

### 5. Update Feature List Components

**Update all list components to support quick-add:**

- [ ] Update `SystemsList.tsx`:
  - Add "Quick Add" button alongside existing "Add" button
  - Quick Add expands inline at top of list
  - Full "Add" button opens modal form for complete data entry

- [ ] Update `InitiativesList.tsx`:
  - Add "Quick Add" button
  - Quick Add for rapid initiative creation
  - Full form for detailed planning

- [ ] Update `CapabilitiesList.tsx`:
  - Add "Quick Add" button
  - Context-aware: if a capability is selected, default parent to that

- [ ] Update `ResourcePoolsList.tsx`:
  - Add "Quick Add" button

### 6. Update File Checklist

Add these files to Phase 1 file checklist:

```
src/
├── components/
│   └── ui/
│       ├── TabbedPanel.tsx
│       ├── QuickAddForm.tsx
│       └── Panel.tsx
├── features/
│   ├── initiatives/
│   │   └── InitiativeQuickAdd.tsx
│   ├── systems/
│   │   └── SystemQuickAdd.tsx
│   ├── capabilities/
│   │   └── CapabilityQuickAdd.tsx
│   └── resources/
│       └── ResourcePoolQuickAdd.tsx
```

---

## Phase 2: Timeline View Enhancements

### 1. Update Zoom Level Configuration

Ensure 10-year zoom level is included in all relevant places.

**Update timelineConfig.ts:**

```typescript
export type ZoomLevel = 'quarter' | 'half' | 'year' | '3year' | '5year' | '10year';
```

### 2. Add Milestone Markers

**Enhance TimelineMilestones.tsx spec:**

- [ ] Create `src/features/timeline/TimelineMilestones.tsx`:
  - Render constraint deadlines as diamond markers
  - Render system support end dates as triangle markers
  - Colour coding:
    - Red: Hard constraint deadline
    - Amber: Soft constraint deadline
    - Purple: Vendor support end date
    - Grey: Extended support end date
  - Tooltip on hover showing constraint/system details
  - Click to select associated item
  - Vertical line extending to axis for emphasis

---

## Phase 3: Consequence Engine Enhancements

### 1. Add Inline Drag Consequence Popover

The existing `ConsequencePanel.tsx` is for detailed review after an action. Add a new component for **real-time feedback during drag operations**.

**Add new component:**

- [ ] Create `src/features/timeline/DragConsequencePopover.tsx`:
  - Floating popover that follows cursor during drag
  - Appears after 200ms of drag initiation
  - Shows condensed consequence summary:
    - Count of dependency violations
    - Count of constraint violations
    - Resource over-allocation summary
  - Colour-coded severity (red for hard violations, amber for soft)
  - Three action buttons at bottom:
    - "Continue Anyway" - completes the drag
    - "Snap to Valid" - moves to nearest valid position
    - "Cancel" - reverts to original position
  - Keyboard shortcuts: Enter (continue), V (snap), Escape (cancel)
  - Updates in real-time as drag position changes
  - Debounced calculations (100ms) for performance

```typescript
interface DragConsequencePopoverProps {
  visible: boolean;
  position: { x: number; y: number };
  consequences: ConsequenceReport;
  onContinue: () => void;
  onSnapToValid: () => void;
  onCancel: () => void;
}
```

**Popover content structure:**

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ This change would:                                  │
│                                                         │
│  🔴 2 dependency violations                             │
│     • MES Training must follow implementation           │
│     • Data Migration blocked                            │
│                                                         │
│  🟠 1 constraint violation                              │
│     • Overlaps budget freeze (soft)                     │
│                                                         │
│  📊 Resource impact                                     │
│     • SAP Team: 145% in Q1 2025                        │
│                                                         │
│  [Continue]  [Snap to Valid]  [Cancel]                 │
└─────────────────────────────────────────────────────────┘
```

### 2. Update useDrag Hook

**Enhance useDrag.ts to integrate popover:**

- [ ] Update `src/features/timeline/useDrag.ts`:
  - Track drag duration to trigger popover visibility
  - Calculate consequences during drag (debounced)
  - Expose consequence state for popover
  - Handle popover action callbacks
  - Support snap-to-valid position calculation

```typescript
interface UseDragReturn {
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  dragDuration: number;
  currentPosition: { startDate: Date; endDate: Date };
  consequences: ConsequenceReport | null;
  showPopover: boolean;
  popoverPosition: { x: number; y: number };
  handleContinue: () => void;
  handleSnapToValid: () => void;
  handleCancel: () => void;
}
```

### 3. Clarify Consequence Panel Purpose

**Update ConsequencePanel.tsx description:**

The `ConsequencePanel.tsx` serves a different purpose from `DragConsequencePopover.tsx`:

- [ ] Create `src/features/timeline/ConsequencePanel.tsx`:
  - **Purpose**: Detailed consequence review AFTER an action is completed
  - Docked panel (bottom or right) or floating window
  - Shows comprehensive consequence report:
    - Full list of dependency violations with links
    - Full list of constraint violations with links
    - Resource allocation chart for affected periods
    - Cascading changes that would be required
  - "Fix All" button to auto-resolve (in Locked mode)
  - "Dismiss" to acknowledge and proceed
  - Persists until manually dismissed
  - Can be pinned open during exploration session

### 4. Update File Checklist

Add to Phase 3 file checklist:

```
src/
├── features/
│   └── timeline/
│       ├── DragConsequencePopover.tsx  # NEW
│       ├── ConsequencePanel.tsx
│       └── ... (existing files)
```

---

## Phase 4: Scenarios Enhancements

### 1. Enhance Comparison Summary

**Update ComparisonSummary.tsx spec:**

- [ ] Create `src/features/scenarios/ComparisonSummary.tsx`:
  - Side-by-side metrics comparison:
    ```
    ┌─────────────────────┬─────────────────────┐
    │ Baseline            │ Scenario A          │
    ├─────────────────────┼─────────────────────┤
    │ Total Cost: £4.2M   │ Total Cost: £4.0M   │
    │                     │ ↓ £200K (5%)        │
    ├─────────────────────┼─────────────────────┤
    │ Peak Resources: 145%│ Peak Resources: 110%│
    │                     │ ↓ 35%               │
    ├─────────────────────┼─────────────────────┤
    │ Constraints: 2      │ Constraints: 0      │
    │                     │ ✓ All resolved      │
    ├─────────────────────┼─────────────────────┤
    │ End Date: Jun 2025  │ End Date: Dec 2025  │
    │                     │ ↑ 6 months          │
    └─────────────────────┴─────────────────────┘
    ```
  - Difference indicators with arrows and colours
  - Green for improvements, red for regressions, grey for neutral
  - **"Promote to Baseline" button** (prominent, requires confirmation)
  - "Export Comparison" button
  - "Close Comparison" button

### 2. Add Synchronised Scrolling Indicator

**Update ComparisonTimeline.tsx spec:**

- [ ] Create `src/features/scenarios/ComparisonTimeline.tsx`:
  - Dual timeline view (split screen)
  - **Synchronised scrolling** enabled by default
  - Visual sync indicator: 🔗 icon between panels
  - Click sync icon to toggle independent scrolling
  - When synced, scroll position and zoom level match
  - Vertical dotted line connecting same dates across panels
  - Initiatives that differ highlighted with coloured border:
    - Blue border: Changed dates
    - Green border: Added in scenario
    - Red border: Removed in scenario
    - Grey: Unchanged

### 3. Add Scenario Context Badge

**Add new component for scenario awareness:**

- [ ] Create `src/components/ui/ScenarioBadge.tsx`:
  - Small badge showing current scenario context
  - Displayed in form headers and detail panels
  - Baseline: Green badge "📍 Baseline"
  - Other scenarios: Amber badge "⚡ {Scenario Name}"
  - Clicking badge returns to scenario selector

---

## General UI Principles to Apply Throughout

### Keyboard Shortcuts

Implement consistent keyboard shortcuts across all phases:

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette / search |
| `Cmd/Ctrl + N` | New initiative (quick add) |
| `Cmd/Ctrl + 1` | Switch to Timeline view |
| `Cmd/Ctrl + 2` | Switch to Resources view |
| `Cmd/Ctrl + 3` | Switch to Cost view |
| `Cmd/Ctrl + 4` | Switch to Dependencies view |
| `Cmd/Ctrl + B` | Toggle navigator panel |
| `Escape` | Close detail panel / cancel operation |
| `Delete/Backspace` | Delete selected item (with confirmation) |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |

### Loading States

All async operations should show appropriate loading states:

- Skeleton loaders for initial data fetch
- Inline spinners for button actions
- Progress bars for bulk operations (import/export)
- Optimistic updates where safe (with rollback on error)

### Empty States

Every list and view should have a meaningful empty state:

- Friendly illustration or icon
- Clear explanation of what would appear here
- Primary action button to create first item
- Secondary link to import data (where applicable)

### Error Handling

Consistent error display patterns:

- Toast notifications for transient errors
- Inline error messages for form validation
- Full-screen error state for critical failures
- Retry buttons where appropriate
- Error boundaries to prevent cascade failures

---

## Implementation Order

When implementing these enhancements, follow this order within each phase:

1. **Layout components first** (AppLayout, NavigatorPanel, DetailPanel)
2. **Shared UI components** (TabbedPanel, QuickAddForm, Panel)
3. **Feature components** (updated detail views, quick-add forms)
4. **Integration** (wire everything together)
5. **Polish** (keyboard shortcuts, loading states, empty states)

---

## Acceptance Criteria Additions

### Phase 0 Additional Criteria

- [ ] Navigator panel is visible and collapsible
- [ ] Detail panel appears when an item is selected
- [ ] View selector tabs work and highlight active view
- [ ] Panel sizes persist across sessions
- [ ] 10-year zoom level is available

### Phase 1 Additional Criteria

- [ ] Detail panels use tabbed interface
- [ ] Quick-add forms work for all entity types
- [ ] Quick-add allows "Create & Add Another" workflow
- [ ] Tab navigation works with keyboard

### Phase 3 Additional Criteria

- [ ] Drag consequence popover appears during drag operations
- [ ] Popover updates in real-time as drag position changes
- [ ] "Snap to Valid" finds nearest valid position
- [ ] Popover action buttons work correctly

### Phase 4 Additional Criteria

- [ ] Comparison summary shows clear difference indicators
- [ ] "Promote to Baseline" button is accessible from comparison view
- [ ] Synchronised scrolling works in comparison timeline
- [ ] Scenario badge appears in forms and detail panels
