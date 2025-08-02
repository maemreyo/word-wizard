# 🎯 WORD WIZARD IMPLEMENTATION PLAN

> **Chi tiết triển khai business logic Word Wizard với Separation of Concerns**

---

## 📋 **OVERVIEW**

### **Mục tiêu**: Move toàn bộ business logic từ docs sang codebase production-ready
### **Principle**: Strict Separation of Concerns với Export Index Pattern
### **Architecture**: Service Layer → Store Layer → UI Layer → Background Handlers

---

## 🏗️ **ARCHITECTURE LAYERS**

```
┌─────────────────────────────────────────────┐
│                UI LAYER                     │
│  ├─ popup.tsx (Quick lookup)               │
│  ├─ sidepanel.tsx (IELTS features)         │ 
│  ├─ options.tsx (Settings & integrations)  │
│  └─ content.ts (Text selection)            │
└─────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────┐
│              STORE LAYER                    │
│  ├─ word-wizard-store.ts (Business state)  │
│  ├─ user-store.ts (User & quota)           │
│  └─ settings-store.ts (Config & prefs)     │
└─────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────┐
│             SERVICE LAYER                   │
│  ├─ word-wizard-orchestrator.ts (Core)     │
│  ├─ notion-service.ts (Integration)        │
│  ├─ anki-service.ts (Integration)          │
│  ├─ image-service.ts (AI Images)           │
│  ├─ analytics-service.ts (Tracking)        │
│  └─ quota-service.ts (Monetization)        │
└─────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────┐
│           BACKGROUND LAYER                  │
│  ├─ word-wizard-handler.ts (Message router)│
│  ├─ context-menu-handler.ts (Right-click)  │
│  └─ keyboard-handler.ts (Shortcuts)        │
└─────────────────────────────────────────────┘
```

---

## 📝 **IMPLEMENTATION PHASES**

### **PHASE 1: Foundation Services** (Week 1)
- [x] ✅ Word Wizard Types (`word-wizard-types.ts`)
- [x] ✅ Core Orchestrator (`word-wizard-orchestrator.ts`) 
- [ ] 🔄 Notion Integration Service
- [ ] 🔄 Anki Integration Service
- [ ] 🔄 Update Export Index Files

### **PHASE 2: Specialized Services** (Week 2)
- [ ] 📋 Image Generation Service
- [ ] 📋 Analytics & Tracking Service
- [ ] 📋 Quota & Monetization Service
- [ ] 📋 Cache Enhancement Service
- [ ] 📋 Proxy API Client Service

### **PHASE 3: Store Integration** (Week 3)
- [x] ✅ Word Wizard Store (`word-wizard-store.ts`)
- [ ] 📋 User & Quota Store
- [ ] 📋 Settings & Preferences Store
- [ ] 📋 Learning Analytics Store
- [ ] 📋 Store Index Export

### **PHASE 4: Background Handlers** (Week 4)
- [ ] 📋 Word Wizard Message Handler
- [ ] 📋 Context Menu Integration
- [ ] 📋 Keyboard Shortcuts
- [ ] 📋 Background Script Update

### **PHASE 5: UI Integration** (Week 5)
- [ ] 📋 Popup Component Updates
- [ ] 📋 Sidepanel IELTS Features
- [ ] 📋 Options Page Integrations
- [ ] 📋 Content Script Enhancements

### **PHASE 6: Testing & Optimization** (Week 6)
- [ ] 📋 Unit Tests for Services
- [ ] 📋 Integration Tests
- [ ] 📋 Performance Optimization
- [ ] 📋 Error Handling Enhancement

---

## 🔧 **DETAILED IMPLEMENTATION STEPS**

### **STEP 1: Complete Foundation Services**

#### **1.1 Notion Integration Service**
```typescript
// lib/services/notion-service.ts
export class NotionService extends ImprovedBaseService {
  async saveWordData(request: NotionSaveRequest): Promise<NotionSaveResult>
  async searchExistingWord(term: string, config: NotionConfig): Promise<string | null>
  async updateWordProgress(pageId: string, progress: LearningProgress): Promise<void>
  async createDatabase(config: Partial<NotionConfig>): Promise<string>
  async validateDatabase(databaseId: string): Promise<boolean>
}
```

#### **1.2 Anki Integration Service**
```typescript
// lib/services/anki-service.ts  
export class AnkiService extends ImprovedBaseService {
  async saveWordData(request: AnkiSaveRequest): Promise<AnkiSaveResult>
  async checkAnkiConnection(): Promise<boolean>
  async createDeck(deckName: string): Promise<void>
  async findDuplicateNotes(term: string, deckName: string): Promise<number[]>
  async updateNote(noteId: number, wordData: WordData): Promise<void>
}
```

#### **1.3 Image Generation Service**
```typescript
// lib/services/image-service.ts
export class ImageService extends ImprovedBaseService {
  async generateWordImage(term: string, context?: string): Promise<string>
  async uploadToCloud(imageData: Blob): Promise<string>
  async generateBatchImages(terms: string[]): Promise<Record<string, string>>
  async optimizeForLearning(term: string, complexity: WordDifficulty): Promise<string>
}
```

### **STEP 2: Service Layer Architecture**

#### **2.1 Service Dependencies**
```typescript
// Dependency Injection Pattern
class WordWizardOrchestrator {
  constructor(
    private notionService: NotionService,
    private ankiService: AnkiService,
    private imageService: ImageService,
    private analyticsService: AnalyticsService,
    private quotaService: QuotaService
  ) {}
}

// Factory Pattern
class WordWizardFactory {
  static createOrchestrator(config: WordWizardConfig): WordWizardOrchestrator {
    return new WordWizardOrchestrator(
      new NotionService(config.notion),
      new AnkiService(config.anki),
      new ImageService(config.image),
      new AnalyticsService(config.analytics),
      new QuotaService(config.quota)
    )
  }
}
```

#### **2.2 Error Handling Strategy**
```typescript
// Centralized Error Handling
export class WordWizardErrorHandler {
  static handleLookupError(error: unknown, context: string): WordWizardError
  static handleIntegrationError(error: unknown, service: string): WordWizardError
  static handleQuotaError(error: unknown, userId: string): WordWizardError
  static isRetryableError(error: WordWizardError): boolean
}
```

### **STEP 3: Store Integration Pattern**

#### **3.1 Store Composition**
```typescript
// Multiple specialized stores instead of one monolithic store
export const useWordWizardState = () => ({
  lookup: useLookupState(),
  user: useUserState(), 
  settings: useSettingsState(),
  learning: useLearningState()
})

// Cross-store actions with proper separation
export const useWordWizardActions = () => ({
  lookupWord: useWordWizardStore(state => state.lookupWord),
  updateQuota: useUserStore(state => state.updateQuota),
  saveSettings: useSettingsStore(state => state.saveSettings),
  trackProgress: useLearningStore(state => state.trackProgress)
})
```

#### **3.2 Store Persistence Strategy**
```typescript
// Selective persistence based on data type
const storeConfig = {
  name: 'word-wizard-store',
  partialize: (state) => ({
    // Persist user preferences only
    settings: state.settings,
    userPrefs: state.userPrefs,
    // Don't persist sensitive data
    // apiKeys: excluded
    // currentLookup: excluded (session only)
  })
}
```

### **STEP 4: Background Handler Integration**

#### **4.1 Message Router Pattern**
```typescript
// lib/background/word-wizard-handler.ts
export class WordWizardHandler {
  private orchestrator: WordWizardOrchestrator

  async handleMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
    switch (message.type) {
      case 'WORD_WIZARD_LOOKUP':
        return await this.handleLookup(message.data)
      case 'WORD_WIZARD_BATCH_PROCESS':
        return await this.handleBatchProcess(message.data)
      case 'WORD_WIZARD_SAVE_NOTION':
        return await this.handleNotionSave(message.data)
      // ... etc
    }
  }
}
```

#### **4.2 Context Menu Integration**
```typescript
// lib/background/context-menu-handler.ts
export class ContextMenuHandler {
  static setupContextMenus(): void {
    chrome.contextMenus.create({
      id: 'word-wizard-lookup',
      title: 'Lookup with Word Wizard',
      contexts: ['selection']
    })
  }

  static handleContextMenuClick(info: OnClickData, tab?: Tab): void {
    // Send message to WordWizardHandler
  }
}
```

### **STEP 5: UI Component Integration**

#### **5.1 Component Architecture**
```typescript
// components/word-wizard/lookup-popup.tsx
export function LookupPopup({ selectedText }: LookupPopupProps) {
  const { lookupWord, clearLookup } = useWordWizardActions()
  const { currentLookup, isLookingUp, error } = useLookupState()
  
  // Clean separation: UI logic only, business logic in stores
}

// components/word-wizard/ielts-synonyms.tsx  
export function IELTSSynonyms() {
  const { processBatch } = useWordWizardActions()
  const { batchResults, isProcessing } = useBatchState()
  
  // IELTS-specific UI, business logic in WordWizardOrchestrator
}
```

#### **5.2 Settings Integration**
```typescript
// components/word-wizard/settings-panel.tsx
export function SettingsPanel() {
  const settings = useWordWizardSettings()
  const { updateSettings } = useSettingsActions()
  
  // Form handling with proper validation
  const handleNotionConfig = (config: NotionConfig) => {
    updateSettings({ notion: config })
  }
}
```

---

## 📊 **EXPORT INDEX STRUCTURE**

### **Services Index** (`lib/services/index.ts`)
```typescript
// Core Services
export { ImprovedBaseService } from './improved-base-service'

// Word Wizard Services  
export { WordWizardOrchestrator } from './word-wizard-orchestrator'
export { NotionService } from './notion-service'
export { AnkiService } from './anki-service'
export { ImageService } from './image-service'
export { AnalyticsService } from './analytics-service'
export { QuotaService } from './quota-service'

// Service Factories
export { WordWizardFactory } from './word-wizard-factory'

// Type exports
export type {
  WordData,
  LookupRequest,
  NotionConfig,
  AnkiConfig
} from '../types'
```

### **Stores Index** (`lib/stores/index.ts`)
```typescript
// Word Wizard Stores
export { 
  useWordWizardStore,
  useWordWizardActions,
  useLookupState,
  useBatchState
} from './word-wizard-store'

export {
  useUserStore,
  useUserActions,
  useQuotaState
} from './user-store'

export {
  useSettingsStore,
  useSettingsActions,
  useWordWizardSettings
} from './settings-store'

// Type exports
export type {
  WordWizardState,
  UserState,
  SettingsState
} from '../types'
```

### **Types Index** (`lib/types/index.ts`)
```typescript
// Existing types...
export * from './existing-types'

// Word Wizard types
export type {
  WordData,
  LookupRequest,
  LookupOptions,
  BatchRequest,
  NotionConfig,
  AnkiConfig,
  WordWizardSettings,
  LearningStats,
  QuotaStatus,
  WordWizardError
} from './word-wizard-types'
```

---

## ✅ **QUALITY ASSURANCE**

### **1. Code Standards**
- [ ] All services extend `ImprovedBaseService`
- [ ] All imports use index files only
- [ ] Zod validation for all inputs
- [ ] Proper error handling with typed errors
- [ ] No Chrome APIs in service layer

### **2. Testing Strategy**
- [ ] Unit tests for each service
- [ ] Integration tests for stores
- [ ] E2E tests for critical flows
- [ ] Performance tests for batch processing

### **3. Performance Requirements**
- [ ] Word lookup < 2 seconds
- [ ] Batch processing < 30 seconds for 25 words
- [ ] Cache hit rate > 80%
- [ ] Memory usage < 50MB

### **4. Security Requirements**
- [ ] API keys encrypted in storage
- [ ] Input validation and sanitization
- [ ] Rate limiting implementation
- [ ] No sensitive data in logs

---

## 🚀 **DEPLOYMENT CHECKLIST**

### **Pre-deployment**
- [ ] All services implemented and tested
- [ ] Stores integrated and working
- [ ] Background handlers functional
- [ ] UI components connected
- [ ] Error handling comprehensive
- [ ] Performance benchmarks met

### **Deployment**
- [ ] Update manifest.json permissions
- [ ] Build and package extension
- [ ] Test in Chrome dev mode
- [ ] Deploy to staging environment
- [ ] User acceptance testing
- [ ] Production deployment

### **Post-deployment**
- [ ] Monitor error rates
- [ ] Track performance metrics
- [ ] Collect user feedback
- [ ] Plan next iteration

---

**🎯 Success Criteria**: Clean architecture, separation of concerns, maintainable code, và business logic hoàn chỉnh cho Word Wizard monetization model!