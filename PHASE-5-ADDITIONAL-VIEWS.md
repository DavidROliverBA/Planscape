# Phase 5: Additional Views

## Objective

Implement the resource heatmap, cost profile, and dependency graph views—providing different lenses on the same underlying data.

## Prerequisites

- Phase 4 complete
- Scenarios fully functional
- Consequence engine calculating resource allocations
- Timeline view stable

## Context

Different questions require different visualisations. "When are resources over-allocated?" is best answered by a heatmap. "What's our investment profile?" needs a cost chart. "What depends on what?" needs a graph. These views share the same data but present it differently.

The principle "what you see is what you export" applies—each view should be exportable as-is.

---

## Task List

### 1. View Navigation

- [ ] Create `src/features/views/ViewSelector.tsx`:
  - Tab bar or segmented control
  - Options: Timeline, Resources, Cost, Dependencies
  - Current view highlighted
  - Keyboard shortcuts (1, 2, 3, 4)

- [ ] Update MainCanvas to render appropriate view
- [ ] Maintain view state in store (persists during session)

### 2. Resource Heatmap View

- [ ] Create `src/features/resources/ResourceHeatmap.tsx`:
  - Main container component
  - Manages data fetching and state
  - Renders heatmap grid

- [ ] Create `src/features/resources/HeatmapGrid.tsx`:
  - Y-axis: Resource pools
  - X-axis: Time periods (months or quarters)
  - Cells: Coloured by utilisation percentage
  - Colour scale: Green (0-70%), Amber (70-90%), Red (90%+)

- [ ] Create `src/features/resources/HeatmapCell.tsx`:
  - Individual cell component
  - Shows utilisation percentage
  - Tooltip with: demand, capacity, contributing initiatives
  - Click to see detailed breakdown

- [ ] Create `src/features/resources/HeatmapLegend.tsx`:
  - Colour scale legend
  - Explanation of thresholds

- [ ] Add interactivity:
  - Click cell to filter timeline to contributing initiatives
  - Hover row to highlight that pool across all periods
  - Hover column to highlight that period across all pools

### 3. Resource Heatmap Toolbar

- [ ] Create `src/features/resources/ResourceHeatmapToolbar.tsx`:
  - Period granularity selector (Month/Quarter)
  - Date range selector
  - Filter by pool
  - Threshold adjustment (what counts as "over")
  - Export button

### 4. Resource Detail Panel

- [ ] Create `src/features/resources/ResourceDetailPanel.tsx`:
  - Shows when cell is clicked
  - Lists all initiatives consuming this pool in this period
  - Shows each initiative's consumption
  - Links to initiatives

### 5. Cost Profile View

- [ ] Create `src/features/cost/CostProfile.tsx`:
  - Main container component
  - D3.js area/bar chart

- [ ] Create `src/features/cost/CostChart.tsx`:
  - X-axis: Time (financial periods or custom)
  - Y-axis: Cost (currency)
  - Stacked bars or area by initiative type
  - Or grouped by capability

- [ ] Implement chart types:
  - Bar chart (discrete periods)
  - Area chart (continuous time)
  - Stacked vs grouped toggle

- [ ] Create `src/features/cost/CostSummary.tsx`:
  - Total cost across visible period
  - Breakdown by type/capability
  - Comparison to budget if set

### 6. Cost Profile Interactivity

- [ ] Hover bar/area to see breakdown
- [ ] Click to filter timeline to those initiatives
- [ ] Brush to select time range
- [ ] Budget line overlay (from financial_periods)

### 7. Cost Profile Toolbar

- [ ] Create `src/features/cost/CostProfileToolbar.tsx`:
  - Period granularity (Quarter/Year)
  - Stack by: Type, Capability, or None
  - Chart type selector
  - Show/hide budget line
  - Export button

### 8. Dependency Graph View

- [ ] Create `src/features/dependencies/DependencyGraph.tsx`:
  - Main container component
  - Force-directed or hierarchical layout

- [ ] Create `src/features/dependencies/GraphCanvas.tsx`:
  - D3.js force simulation
  - Initiatives as nodes
  - Dependencies as directed edges
  - System dependencies also representable

- [ ] Node representation:
  - Circle or rounded rectangle
  - Size based on effort/cost
  - Colour based on status or type
  - Label with name (truncated)

- [ ] Edge representation:
  - Directed arrow
  - Colour: green if satisfied, red if violated
  - Thickness based on lag or criticality

### 9. Dependency Graph Interactions

- [ ] Drag nodes to reposition
- [ ] Zoom and pan
- [ ] Click node to select initiative
- [ ] Double-click to focus (centre and highlight connections)
- [ ] Hover to highlight connected nodes

### 10. Dependency Graph Toolbar

- [ ] Create `src/features/dependencies/DependencyGraphToolbar.tsx`:
  - Layout selector: Force, Hierarchical, Circular
  - Show: Initiatives, Systems, or Both
  - Filter by capability
  - Highlight critical path
  - Export button

### 11. Graph Layouts

- [ ] Implement force-directed layout:
  - D3 force simulation
  - Links as springs
  - Nodes repel
  - Good for exploring structure

- [ ] Implement hierarchical layout:
  - Dagre or similar
  - Dependencies flow left-to-right or top-to-bottom
  - Good for understanding sequence

- [ ] Implement circular layout:
  - Nodes around perimeter
  - Edges inside
  - Good for dense dependencies

### 12. Critical Path Highlighting

- [ ] Calculate critical path (longest dependency chain)
- [ ] Highlight critical path nodes and edges
- [ ] Show critical path length in days

### 13. View Synchronisation

- [ ] Selection syncs across views:
  - Select initiative in timeline → highlighted in graph
  - Select initiative in graph → scrolls to in timeline
  - Click heatmap cell → filters timeline

- [ ] Scenario syncs across views:
  - All views show same scenario
  - Switching scenario updates all views

### 14. View Export Preparation

- [ ] Each view should be exportable (implemented in Phase 6)
- [ ] Ensure SVG is clean and well-structured
- [ ] Include legend and labels in export area
- [ ] Support configurable resolution/size

### 15. View Performance

- [ ] Resource heatmap: Efficient with 50 pools × 36 months
- [ ] Cost chart: Smooth with 200 initiatives
- [ ] Dependency graph: Usable with 100 nodes, 200 edges
- [ ] Virtual rendering where applicable
- [ ] Debounce expensive recalculations

---

## Acceptance Criteria

- [ ] View selector allows switching between Timeline, Resources, Cost, Dependencies
- [ ] Resource heatmap shows pools vs time with utilisation colours
- [ ] Heatmap cells are interactive with tooltips and click-through
- [ ] Cost profile shows spending over time
- [ ] Cost chart supports multiple visualisation modes
- [ ] Dependency graph shows initiatives and their relationships
- [ ] Graph supports multiple layouts
- [ ] Critical path is identifiable
- [ ] Selection syncs across views
- [ ] All views reflect current scenario
- [ ] Performance is acceptable with realistic data volumes

---

## File Checklist

New files in this phase:

```
src/
├── features/
│   ├── views/
│   │   └── ViewSelector.tsx
│   ├── resources/
│   │   ├── ResourceHeatmap.tsx
│   │   ├── HeatmapGrid.tsx
│   │   ├── HeatmapCell.tsx
│   │   ├── HeatmapLegend.tsx
│   │   ├── ResourceHeatmapToolbar.tsx
│   │   └── ResourceDetailPanel.tsx
│   ├── cost/
│   │   ├── CostProfile.tsx
│   │   ├── CostChart.tsx
│   │   ├── CostSummary.tsx
│   │   └── CostProfileToolbar.tsx
│   └── dependencies/
│       ├── DependencyGraph.tsx
│       ├── GraphCanvas.tsx
│       └── DependencyGraphToolbar.tsx
```

---

## Technical Notes

### D3 Force Simulation

```typescript
const simulation = d3.forceSimulation(nodes)
  .force('link', d3.forceLink(links).id(d => d.id).distance(100))
  .force('charge', d3.forceManyBody().strength(-300))
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force('collision', d3.forceCollide().radius(30));

simulation.on('tick', () => {
  // Update node and link positions
});
```

### Hierarchical Layout with Dagre

```typescript
import * as dagre from 'dagre';

const g = new dagre.graphlib.Graph();
g.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 100 });
g.setDefaultEdgeLabel(() => ({}));

nodes.forEach(n => g.setNode(n.id, { width: 120, height: 40 }));
edges.forEach(e => g.setEdge(e.source, e.target));

dagre.layout(g);

// Get positioned nodes
g.nodes().forEach(id => {
  const node = g.node(id);
  // node.x, node.y now contain positions
});
```

### Colour Scale for Heatmap

```typescript
const colourScale = d3.scaleThreshold<number, string>()
  .domain([0.7, 0.9, 1.0])
  .range(['#22c55e', '#f59e0b', '#dc2626', '#7f1d1d']);

// Usage
const cellColour = colourScale(utilisation);
```

---

## Notes for Claude Code

- Consider lazy loading views for performance
- D3 force simulation can be CPU-intensive - stop when not visible
- Dagre needs to be installed: `pnpm add dagre @types/dagre`
- Test with realistic data volumes before considering done
- Ensure views are responsive to window resize
- Consider print/export styling (no interactive elements)
- Accessibility: ensure keyboard navigation in graph view
