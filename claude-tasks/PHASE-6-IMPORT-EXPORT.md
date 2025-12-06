# Phase 6: Import/Export

## Objective

Implement data import from external sources (CSV, Excel) and visual export capabilities (PNG, SVG, PDF) so architects can bring in existing data and share their findings.

## Prerequisites

- Phase 5 complete
- All views functional and stable
- Data model well-established
- Views render cleanly and completely

## Context

The tool needs to integrate with the real world. Architects often have data in spreadsheets that needs to be imported. They need to produce visuals for presentations and documents. The principle "what you see is what you export" means we export exactly what's visible.

---

## Task List

### 1. File System Access

- [ ] Add Tauri file system plugin:
  ```bash
  pnpm add @tauri-apps/plugin-dialog @tauri-apps/plugin-fs
  ```

- [ ] Configure plugins in `tauri.conf.json`

- [ ] Create `src/lib/fileSystem.ts`:
  - `openFile(filters)` - open file dialog
  - `saveFile(data, defaultName, filters)` - save file dialog
  - `readFile(path)` - read file contents
  - `writeFile(path, data)` - write file contents

### 2. CSV Import

- [ ] Create `src/features/import/CsvImporter.tsx`:
  - File upload/selection
  - Preview of first few rows
  - Column mapping interface
  - Import button

- [ ] Create `src/features/import/ColumnMapper.tsx`:
  - Shows CSV columns on left
  - Entity fields on right
  - Drag to map or dropdown select
  - Auto-detect common column names

- [ ] Create `src/lib/csvParser.ts`:
  - Parse CSV with headers
  - Handle different delimiters
  - Handle quoted fields
  - Return typed rows

- [ ] Implement import for each entity type:
  - Systems import
  - Capabilities import
  - Initiatives import
  - Resources import
  - Resource pools import

### 3. Excel Import

- [ ] Install xlsx library:
  ```bash
  pnpm add xlsx
  ```

- [ ] Create `src/features/import/ExcelImporter.tsx`:
  - File selection
  - Sheet selector (if multiple sheets)
  - Preview data
  - Column mapping
  - Import button

- [ ] Create `src/lib/excelParser.ts`:
  - Parse .xlsx and .xls files
  - Handle multiple sheets
  - Handle dates and numbers correctly
  - Return typed data

### 4. Import Wizard

- [ ] Create `src/features/import/ImportWizard.tsx`:
  - Step 1: Select file type and file
  - Step 2: Preview and map columns
  - Step 3: Validation and error display
  - Step 4: Confirm and import
  - Step 5: Summary of imported items

- [ ] Create `src/features/import/ImportValidation.tsx`:
  - Show validation errors per row
  - Skip/fix options
  - Required fields check
  - Duplicate detection

- [ ] Add import option to sidebar or menu

### 5. Import Templates

- [ ] Create downloadable template files:
  - systems_template.csv
  - initiatives_template.csv
  - resources_template.csv
  - Full Excel template with multiple sheets

- [ ] Create `src/features/import/ImportTemplates.tsx`:
  - Download template buttons
  - Instructions for each template

### 6. Export View as Image

- [ ] Create `src/lib/viewExport.ts`:
  - `exportToPng(svgElement, filename, scale)` - rasterise SVG
  - `exportToSvg(svgElement, filename)` - clean SVG export

- [ ] Implement PNG export:
  - Convert SVG to canvas
  - Scale for quality (2x by default)
  - Download as PNG

- [ ] Implement SVG export:
  - Clone SVG element
  - Inline styles (computed → explicit)
  - Embed fonts if possible
  - Remove interactive elements
  - Download as SVG

### 7. Export Button Integration

- [ ] Add export button to each view toolbar:
  - TimelineToolbar
  - ResourceHeatmapToolbar
  - CostProfileToolbar
  - DependencyGraphToolbar

- [ ] Create `src/components/ui/ExportMenu.tsx`:
  - Dropdown with format options
  - PNG, SVG, PDF options
  - Size/resolution options

### 8. PDF Export

- [ ] Install PDF library:
  ```bash
  pnpm add jspdf svg2pdf.js
  ```

- [ ] Create `src/lib/pdfExport.ts`:
  - `exportToPdf(svgElement, filename, options)`:
    - Page size (A4, Letter, etc.)
    - Orientation (portrait/landscape)
    - Include header/footer
    - Add title and date

- [ ] Implement multi-page PDF for long timelines:
  - Split timeline across pages
  - Add page numbers
  - Maintain legend on each page

### 9. Data Export

- [ ] Create `src/features/export/DataExporter.tsx`:
  - Export all data as JSON
  - Export all data as Excel (multi-sheet)
  - Export specific entities as CSV

- [ ] Create `src/lib/dataExport.ts`:
  - `exportToJson(data, filename)`
  - `exportToCsv(data, filename)`
  - `exportToExcel(sheets, filename)`

- [ ] Include scenario information in exports

### 10. Scenario Export

- [ ] Create `src/features/scenarios/ScenarioExport.tsx`:
  - Export specific scenario's initiatives
  - Export scenario comparison as report
  - Include summary statistics

### 11. Database Backup

- [ ] Create `src/features/settings/DatabaseBackup.tsx`:
  - "Backup Database" button
  - Copies SQLite file to chosen location
  - "Restore Database" option
  - Confirmation before restore

### 12. Print Support

- [ ] Create `src/styles/print.css`:
  - Print-specific styles
  - Hide interactive elements
  - Adjust colours for printing
  - Page break hints

- [ ] Add "Print View" option:
  - Opens print dialog
  - Respects current view settings

### 13. Export Styling

- [ ] Ensure exported visuals look professional:
  - Include legend
  - Include title (scenario name, view type)
  - Include date generated
  - White background (configurable)
  - High-contrast colours

- [ ] Create export preview before saving

### 14. Batch Export

- [ ] Create `src/features/export/BatchExport.tsx`:
  - Export all views at once
  - Export all scenarios
  - Zip file with all assets

### 15. Import/Export Error Handling

- [ ] Clear error messages for failed imports
- [ ] Recovery options (partial import)
- [ ] Log of import/export operations

---

## Acceptance Criteria

- [ ] Can import systems from CSV file
- [ ] Can import initiatives from CSV file
- [ ] Can import from Excel file with multiple sheets
- [ ] Import wizard guides through column mapping
- [ ] Validation errors shown clearly before import
- [ ] Templates available for download
- [ ] Can export timeline view as PNG
- [ ] Can export timeline view as SVG
- [ ] Can export any view as PDF
- [ ] Can export all data as JSON
- [ ] Can export data as Excel
- [ ] Database can be backed up and restored
- [ ] Exported visuals are high quality and professional
- [ ] Print view produces clean output

---

## File Checklist

New files in this phase:

```
src/
├── lib/
│   ├── fileSystem.ts
│   ├── csvParser.ts
│   ├── excelParser.ts
│   ├── viewExport.ts
│   ├── pdfExport.ts
│   └── dataExport.ts
├── features/
│   ├── import/
│   │   ├── CsvImporter.tsx
│   │   ├── ExcelImporter.tsx
│   │   ├── ImportWizard.tsx
│   │   ├── ColumnMapper.tsx
│   │   ├── ImportValidation.tsx
│   │   └── ImportTemplates.tsx
│   ├── export/
│   │   ├── DataExporter.tsx
│   │   └── BatchExport.tsx
│   ├── scenarios/
│   │   └── ScenarioExport.tsx
│   └── settings/
│       └── DatabaseBackup.tsx
├── components/
│   └── ui/
│       └── ExportMenu.tsx
├── styles/
│   └── print.css
└── assets/
    └── templates/
        ├── systems_template.csv
        ├── initiatives_template.csv
        └── roadmap_template.xlsx
```

---

## Technical Notes

### SVG to Canvas (PNG Export)

```typescript
async function svgToPng(svgElement: SVGSVGElement, scale: number = 2): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  
  const img = new Image();
  img.src = svgUrl;
  
  await new Promise(resolve => img.onload = resolve);
  
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0);
  
  URL.revokeObjectURL(svgUrl);
  
  return new Promise(resolve => canvas.toBlob(resolve!, 'image/png'));
}
```

### Inline Styles for SVG Export

```typescript
function inlineStyles(svg: SVGSVGElement): SVGSVGElement {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  
  const elements = clone.querySelectorAll('*');
  elements.forEach(el => {
    const computed = window.getComputedStyle(el);
    const style = Array.from(computed)
      .map(prop => `${prop}:${computed.getPropertyValue(prop)}`)
      .join(';');
    (el as SVGElement).setAttribute('style', style);
  });
  
  return clone;
}
```

### Excel Export with XLSX

```typescript
import * as XLSX from 'xlsx';

function exportToExcel(sheets: { name: string; data: any[] }[], filename: string) {
  const wb = XLSX.utils.book_new();
  
  sheets.forEach(sheet => {
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });
  
  XLSX.writeFile(wb, filename);
}
```

---

## Notes for Claude Code

- XLSX library is large - consider lazy loading
- Tauri file dialogs use native OS dialogs
- SVG export needs careful handling of fonts - embed or use web-safe
- PDF generation can be memory-intensive for large views
- Test import with messy real-world data (extra columns, missing data, wrong types)
- Consider progress indicators for large imports
- Database backup should close connections first
