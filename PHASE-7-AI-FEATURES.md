# Phase 7: AI Features

## Objective

Integrate Claude API to provide natural language queries, intelligent data import assistance, and scenario analysis summaries.

## Prerequisites

- Phase 6 complete
- Import/export functional
- All views working
- Application stable and performant

## Context

AI assistance is the "cherry on top" for Roadmap Planner. It enables architects to ask questions in natural language, get help interpreting messy import data, and receive intelligent summaries of their scenarios. The AI features are optional—the app works fully without them—but they add significant value when available.

---

## Task List

### 1. Claude API Integration

- [ ] Create `src/lib/claude.ts`:

```typescript
interface ClaudeConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

async function sendMessage(
  messages: Message[],
  systemPrompt: string,
  config: ClaudeConfig
): Promise<string>;

function isConfigured(): boolean;
```

- [ ] Handle API errors gracefully:
  - Rate limiting
  - Network errors
  - Invalid API key
  - Token limits

### 2. API Key Management

- [ ] Create `src/features/settings/ApiKeySettings.tsx`:
  - Input field for API key
  - "Test Connection" button
  - Save key securely (encrypted in settings)
  - Clear key option

- [ ] Create `src/lib/secureStorage.ts`:
  - Store API key encrypted
  - Use Tauri's secure storage if available
  - Fallback to encrypted SQLite storage

- [ ] Add API key section to Settings page

### 3. Natural Language Query Interface

- [ ] Create `src/features/ai/QueryBar.tsx`:
  - Text input for natural language queries
  - Positioned at top of main canvas
  - Send button and keyboard shortcut (Ctrl+K)
  - History of recent queries

- [ ] Create `src/features/ai/QueryResults.tsx`:
  - Display area for query results
  - Shows interpreted query
  - Shows relevant data/visualisation
  - "Apply" action if query suggests changes

### 4. Query Understanding

- [ ] Create `src/lib/queryEngine.ts`:

```typescript
interface ParsedQuery {
  intent: 'filter' | 'search' | 'calculate' | 'explain' | 'suggest';
  entities: {
    type: 'initiative' | 'system' | 'resource' | 'capability' | 'constraint';
    name?: string;
    filters?: Record<string, any>;
  }[];
  timeRange?: { start: Date; end: Date };
  action?: string;
}

async function parseQuery(
  query: string,
  context: ApplicationContext
): Promise<ParsedQuery>;

async function executeQuery(
  parsed: ParsedQuery,
  data: ApplicationData
): Promise<QueryResult>;
```

- [ ] Example queries to support:
  - "Show me all SAP resources in Q3"
  - "What initiatives are blocked by the ERP migration?"
  - "When is the Windows 11 upgrade scheduled?"
  - "What's competing for infrastructure resources in April?"
  - "List all critical systems approaching end of support"
  - "How much are we spending on upgrades this year?"

### 5. Context-Aware Prompts

- [ ] Create system prompts for different query types:

```typescript
const QUERY_SYSTEM_PROMPT = `
You are a planning assistant for an enterprise architecture roadmap tool.
The user will ask questions about their systems, initiatives, resources, and plans.

Available data:
- Systems: ${systemsSummary}
- Capabilities: ${capabilitiesSummary}
- Initiatives: ${initiativesSummary}
- Resources: ${resourcesSummary}

Answer concisely and suggest follow-up actions when relevant.
`;
```

- [ ] Include relevant context in each query:
  - Current scenario
  - Active filters
  - Selected items
  - Visible time range

### 6. Smart Import Assistant

- [ ] Create `src/features/import/SmartImport.tsx`:
  - Upload file with unclear columns
  - AI analyses and suggests mappings
  - Shows confidence level for each mapping
  - Handles ambiguous data

- [ ] Create `src/lib/importAssistant.ts`:

```typescript
interface ColumnAnalysis {
  column: string;
  suggestedMapping: string;
  confidence: number;
  sampleValues: string[];
  reasoning: string;
}

async function analyseImportFile(
  headers: string[],
  sampleRows: any[],
  targetEntity: string
): Promise<ColumnAnalysis[]>;

async function cleanImportData(
  rawData: any[],
  mappings: ColumnAnalysis[],
  targetEntity: string
): Promise<any[]>;
```

- [ ] Handle common issues:
  - Date format variations
  - Number formatting (1,000 vs 1000)
  - Boolean representations (Y/N, Yes/No, 1/0)
  - Missing required fields (suggest defaults)

### 7. Scenario Summary Generation

- [ ] Create `src/features/scenarios/ScenarioSummary.tsx`:
  - "Generate Summary" button on scenario
  - AI-written narrative summary
  - Key highlights and risks
  - Comparison to baseline

- [ ] Create `src/lib/summaryGenerator.ts`:

```typescript
interface ScenarioSummary {
  overview: string;
  keyChanges: string[];
  risks: string[];
  recommendations: string[];
  costImpact: string;
  resourceImpact: string;
}

async function generateScenarioSummary(
  scenario: Scenario,
  initiatives: Initiative[],
  diff: ScenarioDiff
): Promise<ScenarioSummary>;
```

### 8. Chat Interface

- [ ] Create `src/features/ai/AiChat.tsx`:
  - Slide-out panel or modal
  - Full conversation history
  - Context-aware responses
  - Code/data blocks in responses
  - Copy response button

- [ ] Create `src/features/ai/ChatMessage.tsx`:
  - User and assistant message styling
  - Timestamp
  - Action buttons (copy, apply)

- [ ] Implement conversation management:
  - Save conversations
  - Clear conversation
  - Export conversation

### 9. Inline Suggestions

- [ ] Create `src/features/ai/InlineSuggestion.tsx`:
  - Small tooltip-style suggestions
  - Appears contextually
  - E.g., "This initiative overlaps with 3 others—want me to find alternatives?"

- [ ] Trigger suggestions on:
  - Constraint violations
  - Resource over-allocation
  - Unusual patterns in data

### 10. AI Preferences

- [ ] Add to settings:
  - Enable/disable AI features
  - Model selection (when multiple available)
  - Response verbosity preference
  - Auto-suggestions on/off

### 11. Offline Graceful Degradation

- [ ] All features work without AI
- [ ] Clear messaging when AI unavailable
- [ ] No errors when API key not set
- [ ] Local fallbacks where possible

### 12. Rate Limiting and Cost Management

- [ ] Track API usage
- [ ] Show estimated cost per query
- [ ] Daily/monthly limits (configurable)
- [ ] Warning when approaching limits

### 13. Privacy Considerations

- [ ] Clear indication of what's sent to API
- [ ] Option to review before sending
- [ ] No automatic data transmission
- [ ] Local-only mode option

### 14. AI-Assisted Data Entry

- [ ] Create `src/features/ai/SmartForm.tsx`:
  - Paste unstructured text
  - AI extracts structured fields
  - User confirms before saving

- [ ] Example: Paste an email about a new initiative, AI populates form

### 15. Error Handling and Feedback

- [ ] Retry logic for failed requests
- [ ] Fallback responses when API fails
- [ ] User feedback on AI responses (helpful/not helpful)
- [ ] Improve prompts based on feedback patterns

---

## Acceptance Criteria

- [ ] API key can be securely saved and tested
- [ ] Natural language queries return relevant results
- [ ] Queries like "show SAP resources in Q3" filter the view
- [ ] Smart import suggests column mappings
- [ ] AI can generate scenario summaries
- [ ] Chat interface maintains conversation context
- [ ] Inline suggestions appear for violations
- [ ] All features work when AI is not configured
- [ ] Clear privacy controls
- [ ] Rate limiting prevents excessive API costs

---

## File Checklist

New files in this phase:

```
src/
├── lib/
│   ├── claude.ts
│   ├── secureStorage.ts
│   ├── queryEngine.ts
│   ├── importAssistant.ts
│   └── summaryGenerator.ts
├── features/
│   ├── ai/
│   │   ├── QueryBar.tsx
│   │   ├── QueryResults.tsx
│   │   ├── AiChat.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── InlineSuggestion.tsx
│   │   └── SmartForm.tsx
│   ├── import/
│   │   └── SmartImport.tsx
│   ├── scenarios/
│   │   └── ScenarioSummary.tsx
│   └── settings/
│       └── ApiKeySettings.tsx
```

---

## Technical Notes

### Claude API Call

```typescript
async function callClaude(
  messages: Message[],
  systemPrompt: string,
  apiKey: string
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    }),
  });
  
  const data = await response.json();
  return data.content[0].text;
}
```

### Query-to-Action Mapping

```typescript
const queryActions: Record<string, (params: any) => void> = {
  'filter': (params) => applyFilters(params.filters),
  'navigate': (params) => navigateToEntity(params.entityType, params.id),
  'calculate': (params) => showCalculation(params.metric, params.range),
  'suggest': (params) => showSuggestions(params.suggestions),
};
```

### Structured Output Parsing

Use Claude's ability to output JSON when needed:

```typescript
const STRUCTURED_PROMPT = `
Respond with a JSON object containing:
{
  "intent": "filter" | "search" | "calculate",
  "entities": [...],
  "action": "..."
}
`;
```

---

## Notes for Claude Code

- API calls should go through Tauri backend to protect API key
- Consider streaming responses for better UX on long generations
- Cache common queries locally
- Test with various query phrasings—users won't be precise
- Ensure AI doesn't hallucinate data—always verify against actual data
- Keep prompts concise to reduce token usage
- Consider local LLM support for offline scenarios (future enhancement)
