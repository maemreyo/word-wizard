# 🔧 REUSABLE PATTERNS & TEMPLATES

> **Các patterns, templates và best practices từ Word Wizard có thể áp dụng cho bất kỳ Chrome Extension nào**

---

## 🏗️ **CHROME EXTENSION ARCHITECTURE PATTERNS**

### **1. Background Script Pattern**
```typescript
// background.ts - Clean message routing pattern
import { handleWordLookup } from "./lib/background/word-lookup-handler"
import { handleImageGeneration } from "./lib/background/image-generation-handler"

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "LOOKUP_WORD":
      handleWordLookup(message.selectedText, sendResponse)
      return true // Keep message channel open for async response

    case "GENERATE_IMAGE":
      handleImageGeneration(message.definition, message.term, sendResponse)
      return true

    default:
      break
  }
})

// Pattern: Separate handlers for each message type
// Benefits: Clean code, easy testing, maintainable
```

### **2. Content Script Communication Pattern**
```typescript
// contents/word-lookup-overlay.tsx
const WordLookupOverlay = () => {
  useEffect(() => {
    // Listen for messages from background script
    const messageListener = (message: any) => {
      switch (message.type) {
        case "SHOW_LOOKUP_POPUP":
          setSelectedText(message.selectedText)
          setShowPopup(true)
          break
      }
    }

    // Listen for window messages (from other content scripts)
    const windowMessageListener = (event: MessageEvent) => {
      if (event.data.type === "WORD_WIZARD_LOOKUP") {
        setSelectedText(event.data.selectedText)
        setShowPopup(true)
      }
    }

    chrome.runtime.onMessage.addListener(messageListener)
    window.addEventListener("message", windowMessageListener)

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener)
      window.removeEventListener("message", windowMessageListener)
    }
  }, [])
}

// Pattern: Dual communication channels (chrome.runtime + window.postMessage)
// Benefits: Reliable communication between content scripts
```

### **3. Service Layer Pattern**
```typescript
// lib/ai-service.ts - Service with dependency injection
export class AIService {
  constructor(
    private proxyService: ProxyService,
    private cacheService: CacheService,
    private rateLimitService: RateLimitService
  ) {}

  async lookupWord(term: string): Promise<LookupResult> {
    // Check rate limits
    if (!await this.rateLimitService.canMakeRequest()) {
      return { success: false, error: "Rate limit exceeded" }
    }

    // Check cache first
    const cached = await this.cacheService.get(term)
    if (cached) {
      return { success: true, data: cached, source: "cache" }
    }

    // Make API request through proxy
    try {
      const result = await this.proxyService.request('/lookup', { term })
      await this.cacheService.set(term, result.data)
      return result
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

// Pattern: Dependency injection + layered services
// Benefits: Testable, modular, configurable
```

### **4. Storage Abstraction Pattern**
```typescript
// lib/storage.ts - Unified storage interface
import { Storage } from "@plasmohq/storage"

export class ConfigStorage {
  private storage = new Storage()

  async getConfig(): Promise<Config> {
    const config = await this.storage.get("config")
    return config || {}
  }

  async setConfig(config: Config): Promise<void> {
    await this.storage.set("config", config)
  }

  async updateConfig(updates: Partial<Config>): Promise<void> {
    const current = await this.getConfig()
    await this.setConfig({ ...current, ...updates })
  }
}

// Pattern: Abstraction over Chrome storage
// Benefits: Type safety, easy testing, consistent API
```

---

## 🎨 **UI/UX PATTERNS**

### **1. Popup Positioning Pattern**
```typescript
// Smart popup positioning to avoid viewport edges
const calculatePopupPosition = (
  selectionRect: DOMRect,
  popupWidth: number,
  popupHeight: number
) => {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY
  }

  let x = selectionRect.left + viewport.scrollX
  let y = selectionRect.bottom + viewport.scrollY + 10

  // Adjust if popup would go off-screen
  if (x + popupWidth > viewport.width + viewport.scrollX) {
    x = viewport.width + viewport.scrollX - popupWidth - 10
  }

  if (y + popupHeight > viewport.height + viewport.scrollY) {
    y = selectionRect.top + viewport.scrollY - popupHeight - 10
  }

  return { x, y }
}

// Pattern: Smart positioning with viewport awareness
// Benefits: Always visible, good UX
```

### **2. Loading States Pattern**
```typescript
// components/word-lookup/loading-state.tsx
const LoadingState = ({ message = "Analyzing..." }: { message?: string }) => (
  <div className="flex items-center justify-center p-6">
    <div className="flex items-center space-x-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  </div>
)

// Pattern: Consistent loading states with customizable messages
// Benefits: Better UX, consistent design
```

### **3. Error Boundary Pattern**
```typescript
// components/error-boundary.tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Extension error:', error, errorInfo)
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <h3 className="text-lg font-semibold text-red-600">Something went wrong</h3>
          <p className="text-sm text-gray-600 mt-2">
            Please try refreshing the page or contact support.
          </p>
        </div>
      )
    }

    return this.props.children
  }
}

// Pattern: Graceful error handling with user-friendly messages
// Benefits: Better UX, error tracking
```

---

## 🔐 **SECURITY PATTERNS**

### **1. API Key Encryption Pattern**
```typescript
// lib/security/encryption.ts
export class EncryptionService {
  private static readonly ALGORITHM = 'AES-GCM'
  private static readonly KEY_LENGTH = 256

  static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    )
  }

  static async encryptApiKey(apiKey: string, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encoded = new TextEncoder().encode(apiKey)
    
    const encrypted = await crypto.subtle.encrypt(
      { name: this.ALGORITHM, iv },
      key,
      encoded
    )

    return btoa(JSON.stringify({
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    }))
  }

  static async decryptApiKey(encryptedData: string, key: CryptoKey): Promise<string> {
    const { iv, data } = JSON.parse(atob(encryptedData))
    
    const decrypted = await crypto.subtle.decrypt(
      { name: this.ALGORITHM, iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data)
    )

    return new TextDecoder().decode(decrypted)
  }
}

// Pattern: Client-side encryption for sensitive data
// Benefits: Enhanced security, compliance
```

### **2. CORS Bypass Pattern**
```typescript
// lib/proxy-service.ts - Proxy pattern to avoid CORS
export class ProxyService {
  constructor(private config: ProxyConfig) {}

  async request(endpoint: string, data: any): Promise<any> {
    const response = await fetch(`${this.config.proxyBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
        'X-Origin': 'chrome-extension'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Proxy request failed: ${response.statusText}`)
    }

    return await response.json()
  }
}

// Pattern: Proxy service to handle CORS and API aggregation
// Benefits: Bypasses CORS, centralizes API management, enables monetization
```

### **3. Rate Limiting Pattern**
```typescript
// lib/rate-limit-service.ts
export class RateLimitService {
  private requests: Map<string, number[]> = new Map()

  async canMakeRequest(
    key: string = 'default',
    limit: number = 10,
    windowMs: number = 60000
  ): Promise<boolean> {
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Get existing requests for this key
    const requests = this.requests.get(key) || []
    
    // Filter out old requests
    const recentRequests = requests.filter(time => time > windowStart)
    
    // Check if under limit
    if (recentRequests.length >= limit) {
      return false
    }

    // Add current request
    recentRequests.push(now)
    this.requests.set(key, recentRequests)
    
    return true
  }

  getRemainingRequests(key: string = 'default', limit: number = 10): number {
    const requests = this.requests.get(key) || []
    return Math.max(0, limit - requests.length)
  }
}

// Pattern: Client-side rate limiting
// Benefits: Prevents API abuse, better UX
```

---

## 📊 **DATA PATTERNS**

### **1. Cache Service Pattern**
```typescript
// lib/cache-service.ts
export class CacheService {
  private cache: Map<string, CachedItem> = new Map()
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000 // 24 hours

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return item.data as T
  }

  async set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now()
    })
  }

  async invalidate(pattern: string): Promise<void> {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  getStats(): CacheStats {
    const items = Array.from(this.cache.values())
    return {
      totalItems: items.length,
      hitRate: this.calculateHitRate(),
      memoryUsage: this.estimateMemoryUsage()
    }
  }
}

// Pattern: In-memory cache with TTL and pattern invalidation
// Benefits: Performance, reduced API calls, memory management
```

### **2. Data Transformation Pattern**
```typescript
// lib/transformers/word-data-transformer.ts
export class WordDataTransformer {
  static toNotionFormat(wordData: WordData): NotionPageData {
    return {
      term: wordData.term,
      ipa: wordData.ipa || '',
      definition: wordData.definition,
      aiExample: wordData.example,
      userExample: wordData.userExample || '',
      wordFamily: this.formatWordFamily(wordData.wordFamily),
      synonyms: wordData.synonyms.join(', '),
      antonyms: wordData.antonyms.join(', '),
      primaryTopic: wordData.primaryTopic,
      domain: wordData.domain,
      cefrLevel: wordData.cefrLevel
    }
  }

  static toAnkiFormat(wordData: WordData): AnkiCard {
    const clozeText = this.generateClozeText(wordData.example, wordData.term)
    
    return {
      deckName: 'Word Wizard',
      modelName: 'Cloze',
      fields: {
        Text: clozeText,
        Extra: this.formatExtraInfo(wordData)
      },
      tags: this.generateTags(wordData)
    }
  }

  private static formatWordFamily(wordFamily: WordFamilyItem[]): string {
    return wordFamily
      .map(item => `${item.word} (${item.type})`)
      .join(', ')
  }
}

// Pattern: Dedicated transformers for data format conversion
// Benefits: Clean separation, reusable, testable
```

### **3. Event Sourcing Pattern**
```typescript
// lib/events/event-store.ts
interface DomainEvent {
  id: string
  type: string
  aggregateId: string
  data: any
  timestamp: number
  version: number
}

export class EventStore {
  private events: DomainEvent[] = []

  async append(event: Omit<DomainEvent, 'id' | 'timestamp'>): Promise<void> {
    const domainEvent: DomainEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    }
    
    this.events.push(domainEvent)
    await this.persistEvent(domainEvent)
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    return this.events.filter(event => event.aggregateId === aggregateId)
  }

  async replay(aggregateId: string): Promise<any> {
    const events = await this.getEvents(aggregateId)
    return events.reduce((state, event) => {
      return this.applyEvent(state, event)
    }, {})
  }
}

// Pattern: Event sourcing for audit trails and state reconstruction
// Benefits: Complete history, debugging, analytics
```

---

## 🔄 **INTEGRATION PATTERNS**

### **1. External API Integration Pattern**
```typescript
// lib/integrations/base-integration.ts
abstract class BaseIntegration {
  protected abstract baseUrl: string
  protected abstract headers: Record<string, string>

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new IntegrationError(
        `Request failed: ${response.status} ${response.statusText}`,
        response.status
      )
    }

    return await response.json()
  }

  abstract testConnection(): Promise<boolean>
}

// lib/integrations/notion-integration.ts
export class NotionIntegration extends BaseIntegration {
  protected baseUrl = 'https://api.notion.com/v1'
  protected headers = {
    'Authorization': `Bearer ${this.apiKey}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  }

  constructor(private apiKey: string) {
    super()
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.request('/users/me')
      return true
    } catch {
      return false
    }
  }
}

// Pattern: Abstract base class for external integrations
// Benefits: Consistent error handling, reusable patterns
```

### **2. Webhook Handler Pattern**
```typescript
// lib/webhooks/webhook-handler.ts
export class WebhookHandler {
  private handlers: Map<string, WebhookProcessor> = new Map()

  register(event: string, processor: WebhookProcessor): void {
    this.handlers.set(event, processor)
  }

  async process(payload: WebhookPayload): Promise<WebhookResponse> {
    const processor = this.handlers.get(payload.event)
    
    if (!processor) {
      return { success: false, error: `No handler for event: ${payload.event}` }
    }

    try {
      await processor.validate(payload)
      const result = await processor.process(payload)
      await processor.acknowledge(payload)
      
      return { success: true, data: result }
    } catch (error) {
      await processor.handleError(payload, error)
      return { success: false, error: error.message }
    }
  }
}

// Pattern: Event-driven webhook processing
// Benefits: Scalable, maintainable, error handling
```

---

## 🧪 **TESTING PATTERNS**

### **1. Service Testing Pattern**
```typescript
// tests/services/ai-service.test.ts
describe('AIService', () => {
  let aiService: AIService
  let mockProxyService: jest.Mocked<ProxyService>
  let mockCacheService: jest.Mocked<CacheService>

  beforeEach(() => {
    mockProxyService = {
      request: jest.fn()
    } as any

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn()
    } as any

    aiService = new AIService(mockProxyService, mockCacheService)
  })

  it('should return cached result when available', async () => {
    const cachedData = { term: 'test', definition: 'cached' }
    mockCacheService.get.mockResolvedValue(cachedData)

    const result = await aiService.lookupWord('test')

    expect(result.success).toBe(true)
    expect(result.source).toBe('cache')
    expect(mockProxyService.request).not.toHaveBeenCalled()
  })

  it('should fallback to API when cache miss', async () => {
    mockCacheService.get.mockResolvedValue(null)
    mockProxyService.request.mockResolvedValue({
      success: true,
      data: { term: 'test', definition: 'from API' }
    })

    const result = await aiService.lookupWord('test')

    expect(result.success).toBe(true)
    expect(mockProxyService.request).toHaveBeenCalledWith('/lookup', { term: 'test' })
    expect(mockCacheService.set).toHaveBeenCalled()
  })
})

// Pattern: Dependency injection enables easy mocking
// Benefits: Isolated testing, fast execution
```

### **2. Chrome Extension Testing Pattern**
```typescript
// tests/extension/background.test.ts
import { chrome } from 'jest-chrome'

describe('Background Script', () => {
  beforeEach(() => {
    // Reset chrome API mocks
    jest.clearAllMocks()
  })

  it('should handle LOOKUP_WORD message', async () => {
    const mockSendResponse = jest.fn()
    const message = { type: 'LOOKUP_WORD', selectedText: 'test' }

    // Simulate message listener
    const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0]
    const result = messageListener(message, {}, mockSendResponse)

    expect(result).toBe(true) // Should return true for async
    expect(mockSendResponse).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    )
  })
})

// Pattern: Mock Chrome APIs for testing
// Benefits: Test extension logic without browser
```

---

## 📦 **DEPLOYMENT PATTERNS**

### **1. Environment Configuration Pattern**
```typescript
// lib/config/environment.ts
export class Environment {
  static get isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development'
  }

  static get isProduction(): boolean {
    return process.env.NODE_ENV === 'production'
  }

  static get apiBaseUrl(): string {
    return this.isDevelopment 
      ? 'http://localhost:3000/api'
      : 'https://api.wordwizard.com'
  }

  static get features(): FeatureFlags {
    return {
      imageGeneration: this.getFeatureFlag('IMAGE_GENERATION', true),
      advancedAnalytics: this.getFeatureFlag('ADVANCED_ANALYTICS', false),
      betaFeatures: this.getFeatureFlag('BETA_FEATURES', this.isDevelopment)
    }
  }

  private static getFeatureFlag(name: string, defaultValue: boolean): boolean {
    const value = process.env[`FEATURE_${name}`]
    return value ? value === 'true' : defaultValue
  }
}

// Pattern: Centralized environment configuration
// Benefits: Easy feature toggling, environment-specific settings
```

### **2. Build Pipeline Pattern**
```yaml
# .github/workflows/deploy.yml
name: Deploy Extension

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm test
      - run: pnpm lint
      - run: pnpm typecheck

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm build
      
      - name: Package Extension
        run: pnpm package
      
      - name: Upload to Chrome Web Store
        if: startsWith(github.ref, 'refs/tags/')
        uses: chrome-extension-upload-action@v1
        with:
          app-id: ${{ secrets.CHROME_APP_ID }}
          client-id: ${{ secrets.CHROME_CLIENT_ID }}
          client-secret: ${{ secrets.CHROME_CLIENT_SECRET }}
          refresh-token: ${{ secrets.CHROME_REFRESH_TOKEN }}
          file-path: build/chrome-mv3-prod.zip

# Pattern: Automated testing and deployment
# Benefits: Quality assurance, consistent releases
```

---

## 💰 **MONETIZATION PATTERNS**

### **1. API Proxy Monetization Pattern**
```typescript
// api/proxy/lookup.ts (Vercel API Route)
import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, trackUsage, checkQuota } from '@/lib/billing'

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 })
    }

    // Validate API key and get user info
    const user = await validateApiKey(apiKey)
    if (!user) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // Check quota
    const canMakeRequest = await checkQuota(user.id)
    if (!canMakeRequest) {
      return NextResponse.json({
        error: 'Quota exceeded',
        quota: user.quota,
        upgradeUrl: 'https://dashboard.wordwizard.com/upgrade'
      }, { status: 429 })
    }

    // Process request
    const { term } = await request.json()
    const result = await processLookup(term)

    // Track usage
    await trackUsage(user.id, 'lookup', 1)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Pattern: Monetized API proxy with usage tracking
// Benefits: Revenue generation, usage control, analytics
```

### **2. Freemium Model Pattern**
```typescript
// lib/billing/quota-service.ts
export class QuotaService {
  async checkQuota(userId: string): Promise<QuotaStatus> {
    const user = await this.getUserPlan(userId)
    const usage = await this.getCurrentUsage(userId)

    const limits = this.getPlanLimits(user.plan)
    const remaining = limits.monthly - usage.monthly

    return {
      plan: user.plan,
      used: usage.monthly,
      limit: limits.monthly,
      remaining: Math.max(0, remaining),
      resetDate: this.getResetDate(),
      canMakeRequest: remaining > 0,
      upgradeUrl: remaining <= 0 ? this.getUpgradeUrl(user.plan) : undefined
    }
  }

  private getPlanLimits(plan: string): PlanLimits {
    const limits = {
      free: { monthly: 100, daily: 10 },
      pro: { monthly: 1000, daily: 100 },
      premium: { monthly: -1, daily: -1 } // Unlimited
    }
    return limits[plan] || limits.free
  }
}

// Pattern: Tiered quota system with upgrade prompts
// Benefits: Clear value proposition, conversion optimization
```

---

## 🔍 **MONITORING PATTERNS**

### **1. Error Tracking Pattern**
```typescript
// lib/monitoring/error-tracker.ts
export class ErrorTracker {
  static init() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError(event.error, {
        type: 'javascript',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        type: 'unhandled_promise'
      })
    })
  }

  static captureError(error: Error, context: ErrorContext = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      extensionVersion: chrome.runtime.getManifest().version,
      ...context
    }

    // Send to error tracking service
    this.sendToService(errorData)
  }

  private static async sendToService(errorData: ErrorData) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      })
    } catch {
      // Fail silently to avoid error loops
    }
  }
}

// Pattern: Comprehensive error tracking
// Benefits: Better debugging, user experience insights
```

### **2. Performance Monitoring Pattern**
```typescript
// lib/monitoring/performance-tracker.ts
export class PerformanceTracker {
  static trackApiCall(endpoint: string, startTime: number, success: boolean) {
    const duration = Date.now() - startTime
    
    this.recordMetric('api_call', {
      endpoint,
      duration,
      success,
      timestamp: Date.now()
    })
  }

  static trackUserAction(action: string, metadata: any = {}) {
    this.recordMetric('user_action', {
      action,
      metadata,
      timestamp: Date.now()
    })
  }

  static trackPageLoad(page: string) {
    const loadTime = performance.now()
    
    this.recordMetric('page_load', {
      page,
      loadTime,
      timestamp: Date.now()
    })
  }

  private static recordMetric(type: string, data: any) {
    // Store locally and batch send
    const metrics = this.getStoredMetrics()
    metrics.push({ type, data })
    
    if (metrics.length >= 10) {
      this.flushMetrics(metrics)
    } else {
      this.storeMetrics(metrics)
    }
  }
}

// Pattern: Performance monitoring with batching
// Benefits: Performance insights, optimization opportunities
```

---

## 📚 **DOCUMENTATION PATTERNS**

### **1. API Documentation Pattern**
```typescript
/**
 * Word Lookup Service
 * 
 * Provides AI-powered word analysis with fallback mechanisms.
 * 
 * @example
 * ```typescript
 * const aiService = new AIService(config)
 * const result = await aiService.lookupWord('serendipity')
 * 
 * if (result.success) {
 *   console.log(result.data.definition)
 * }
 * ```
 */
export class AIService {
  /**
   * Looks up a word or phrase using AI analysis
   * 
   * @param term - The word or phrase to analyze
   * @returns Promise resolving to lookup result with AI analysis
   * 
   * @throws {RateLimitError} When rate limit is exceeded
   * @throws {QuotaExceededError} When user quota is exceeded
   * 
   * @example
   * ```typescript
   * const result = await aiService.lookupWord('ephemeral')
   * // Returns: { success: true, data: WordData, source: 'gemini' }
   * ```
   */
  async lookupWord(term: string): Promise<LookupResult> {
    // Implementation...
  }
}

// Pattern: Comprehensive JSDoc documentation
// Benefits: Better developer experience, auto-generated docs
```

### **2. Architecture Decision Records (ADR) Pattern**
```markdown
# ADR-001: Use Proxy Service for AI API Calls

## Status
Accepted

## Context
Chrome extensions cannot directly call external APIs due to CORS restrictions.
We need a way to access AI services (Gemini, OpenAI, Claude) from the extension.

## Decision
Implement a proxy service hosted on Vercel that:
1. Handles CORS issues
2. Provides API key management
3. Enables usage tracking and monetization
4. Offers fallback mechanisms

## Consequences
### Positive
- Solves CORS issues
- Enables monetization through usage tracking
- Provides centralized API management
- Allows for rate limiting and quota management

### Negative
- Adds network latency
- Creates dependency on external service
- Requires additional infrastructure

## Implementation
- Proxy service: Vercel API routes
- Authentication: API keys
- Monitoring: Usage tracking and error logging
```

---

## 🎯 **SUMMARY: KEY REUSABLE PATTERNS**

### **Essential Chrome Extension Patterns**
1. **Message Routing**: Clean background script with separate handlers
2. **Content Script Communication**: Dual-channel communication pattern
3. **Service Layer**: Dependency injection for testability
4. **Storage Abstraction**: Type-safe storage interface
5. **Error Boundaries**: Graceful error handling

### **Business Patterns**
1. **Monetized Proxy**: API proxy with usage tracking
2. **Freemium Model**: Tiered quota system
3. **Feature Flags**: Environment-based feature toggling
4. **Analytics**: User behavior and performance tracking

### **Technical Patterns**
1. **CORS Bypass**: Proxy service pattern
2. **Rate Limiting**: Client-side request throttling
3. **Caching**: In-memory cache with TTL
4. **Data Transformation**: Dedicated transformer classes
5. **Integration**: Abstract base class for external APIs

### **Quality Patterns**
1. **Testing**: Mocked dependencies and Chrome APIs
2. **Monitoring**: Error tracking and performance metrics
3. **Documentation**: JSDoc and ADR patterns
4. **Deployment**: Automated CI/CD pipeline

---

**🚀 Ready to Build Your Next Chrome Extension!**

These patterns provide a solid foundation for building professional, scalable, and monetizable Chrome extensions. Each pattern has been battle-tested in Word Wizard and can be adapted for various use cases.