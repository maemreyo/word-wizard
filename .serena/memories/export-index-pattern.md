# Export Index Pattern - Separation of Concerns

## Core Pattern
**ALWAYS use index.ts files as the single export point for each module**

### Directory Structure Pattern
```
lib/
├── services/
│   ├── index.ts          # Export all services
│   ├── base-service.ts
│   ├── ai-service.ts
│   └── word-wizard-service.ts
├── stores/
│   ├── index.ts          # Export all stores  
│   ├── extension-store.ts
│   └── word-wizard-store.ts
├── types/
│   ├── index.ts          # Export all types
│   ├── core-types.ts
│   └── word-wizard-types.ts
└── utils/
    ├── index.ts          # Export all utilities
    ├── validation.ts
    └── constants.ts
```

## Index File Rules

### 1. Services Index Pattern
```typescript
// lib/services/index.ts
// Core Service Classes
export { BaseService } from './base-service'
export { ImprovedBaseService } from './improved-base-service'

// API and HTTP Services  
export { ApiService } from './api-service'

// AI Services
export { AIService } from './ai-service'

// Word Wizard Services
export { WordWizardOrchestrator } from './word-wizard-orchestrator'
export { NotionService } from './notion-service'
export { AnkiService } from './anki-service'

// Type exports for services
export type {
  WordData,
  LookupRequest,
  NotionConfig,
  AnkiConfig
} from '../types'
```

### 2. Stores Index Pattern  
```typescript
// lib/stores/index.ts
// Extension Stores
export { useExtensionStore, useExtensionActions } from './extension-store'
export { useAIStore, useAIActions } from './ai-store'  
export { usePaymentStore, usePaymentActions } from './payment-store'

// Word Wizard Stores
export { 
  useWordWizardStore, 
  useWordWizardActions,
  useLookupState,
  useUserState,
  useLearningState 
} from './word-wizard-store'

// Type exports for stores
export type {
  ExtensionState,
  AIState,
  WordWizardState
} from '../types'
```

### 3. Types Index Pattern
```typescript
// lib/types/index.ts  
// Core types first
export type { FeatureData, ProcessResult } from './core-types'

// Domain-specific types grouped
export type { 
  WordData,
  LookupRequest,
  AnalysisOptions,
  NotionConfig,
  AnkiConfig
} from './word-wizard-types'

// AI types
export type { ChatMessage, AIResponse } from './ai-types'
```

## Import Rules

### ✅ CORRECT - Always import from index
```typescript
// From any component or service
import { WordWizardOrchestrator, NotionService } from '~/lib/services'
import { useWordWizardStore, useLookupState } from '~/lib/stores'  
import type { WordData, LookupRequest } from '~/lib/types'
```

### ❌ FORBIDDEN - Direct imports
```typescript
// NEVER DO THIS
import { WordWizardOrchestrator } from '~/lib/services/word-wizard-orchestrator'
import { useWordWizardStore } from '~/lib/stores/word-wizard-store'
```

## Benefits of This Pattern

1. **Single Source of Truth**: Each domain has one export point
2. **Refactoring Safety**: Move files without breaking imports
3. **API Control**: Control what's exposed publicly
4. **Tree Shaking**: Bundler can optimize unused exports
5. **Documentation**: Index files serve as API documentation
6. **Circular Dependency Prevention**: Cleaner dependency graph

## File Organization Rules

### Services Layer
- One service per business domain
- Services extend `ImprovedBaseService`
- Export both service class and types
- Group related services in same index section

### Stores Layer  
- One store per business domain
- Export store, actions, and optimized selectors
- Use descriptive selector names (useLookupState vs useWordWizardStore)
- Group related stores in same index section

### Types Layer
- Group types by domain/feature
- Export interfaces and type unions
- Keep related types in same file
- Use consistent naming (Config, State, Request, Response)

## Enforcement

**EVERY new file MUST be added to appropriate index.ts immediately**
**ALL imports MUST use index.ts, never direct file imports**
**Code reviews MUST check for proper export pattern usage**