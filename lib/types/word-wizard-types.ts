// Word Wizard Domain Types - Specialized types for vocabulary learning business logic
// Comprehensive type definitions for Word Wizard features

// Core Word Data Structure
export interface WordData {
  // Basic word information
  term: string
  ipa: string                     // Pronunciation (International Phonetic Alphabet)
  definition: string              // AI-generated definition
  examples: string[]             // Context examples
  
  // Word relationships
  wordFamily: WordFamilyItem[]   // Related words (noun, verb, adjective forms)
  synonyms: string[]             // Synonyms
  antonyms: string[]             // Antonyms
  
  // Classification and metadata
  primaryTopic?: string          // Main topic/category
  secondaryTopics?: string[]     // Sub-topics
  domain?: 'academic' | 'business' | 'daily' | 'technical' | 'medical' | 'legal'
  complexityLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'  // Common European Framework
  frequencyScore?: number        // Usage frequency (0-100)
  
  // Learning metadata
  imageUrl?: string             // Generated image for visual learning
  audioUrl?: string             // Pronunciation audio
  mnemonicTip?: string          // Memory aid
  culturalNote?: string         // Cultural context
  
  // System metadata
  timestamp: number             // When analyzed
  source: 'word-wizard-ai' | 'dictionary-api' | 'user-input' | 'error'
  userId?: string              // User who looked up the word
  contextSentence?: string     // Original context where word was found
  lookupMethod?: 'context-menu' | 'keyboard-shortcut' | 'manual-input' | 'batch-processing'
}

// Word Family Structure
export interface WordFamilyItem {
  word: string
  type: 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'interjection'
  definition: string
  example?: string
}

// Word Lookup Request
export interface LookupRequest {
  term: string                   // Word/phrase to lookup
  context?: string               // Surrounding text for context
  userId?: string                // User making the request
  options?: LookupOptions
}

export interface LookupOptions {
  // Content options
  includeImage?: boolean         // Generate visual aid
  includeExamples?: boolean      // Include usage examples
  includeWordFamily?: boolean    // Include related words
  includePronunciation?: boolean // Include IPA and audio
  generateSynonyms?: boolean     // Generate comprehensive synonyms
  
  // Complexity and targeting
  complexityLevel?: 'simple' | 'intermediate' | 'advanced'
  targetLanguage?: string        // For translations
  learningContext?: 'ielts' | 'toefl' | 'academic' | 'business' | 'general'
  
  // Save and integration options
  saveToNotion?: boolean         // Auto-save to Notion
  saveToAnki?: boolean          // Auto-save to Anki
  addToReviewQueue?: boolean    // Add to spaced repetition
  
  // Advanced options
  cacheResult?: boolean         // Cache the result
  priority?: 'low' | 'normal' | 'high'  // Processing priority
}

// Analysis and Processing Results
export interface AnalysisResult {
  wordData: WordData
  confidence: number            // AI confidence score (0-1)
  processingTime: number        // Time taken in milliseconds
  tokensUsed: number           // AI tokens consumed
  provider: 'gemini' | 'openai' | 'claude' | 'proxy-api'
  model: string                // Specific model used
  cached: boolean              // Whether result was cached
}

// Batch Processing (IELTS Synonym Generation)
export interface BatchRequest {
  words: string[]              // List of words to process
  batchSize?: number           // Process in batches of this size
  userId?: string              // User making the request
  options?: BatchOptions
}

export interface BatchOptions {
  operation: 'synonym-generation' | 'bulk-lookup' | 'vocabulary-analysis'
  learningContext: 'ielts' | 'toefl' | 'academic' | 'business'
  includeImages?: boolean      // Generate images for all words
  saveToNotion?: boolean       // Auto-save all results
  priority?: 'normal' | 'high' // Processing priority
}

export interface BatchResult {
  totalWords: number
  processedWords: number
  failedWords: number
  results: Array<{
    word: string
    data: WordData | null
    error?: string
    processingTime: number
  }>
  summary: {
    averageProcessingTime: number
    totalTokensUsed: number
    successRate: number
  }
}

// External Integration Types

// Notion Integration
export interface NotionConfig {
  apiKey: string
  databaseId: string
  titleProperty?: string        // Property name for word term
  definitionProperty?: string   // Property name for definition
  examplesProperty?: string     // Property name for examples
  topicProperty?: string        // Property name for topic classification
  statusProperty?: string       // Property name for learning status
  customFields?: Record<string, string>  // Custom field mappings
}

export interface NotionSaveRequest {
  wordData: WordData
  config: NotionConfig
  userId?: string
}

export interface NotionSaveResult {
  success: boolean
  pageId?: string              // Notion page ID if successful
  pageUrl?: string             // URL to the created page
  error?: string               // Error message if failed
  duplicateDetected?: boolean  // Whether word already exists
}

// Anki Integration
export interface AnkiConfig {
  deckName: string
  modelName?: string           // Card template name
  frontFormat?: string         // Front side template
  backFormat?: string          // Back side template
  tags?: string[]             // Default tags to add
  duplicateScope?: 'deck' | 'all'  // Duplicate detection scope
}

export interface AnkiSaveRequest {
  wordData: WordData
  config: AnkiConfig
  userId?: string
}

export interface AnkiSaveResult {
  success: boolean
  noteId?: number             // Anki note ID if successful
  error?: string              // Error message if failed
  duplicateDetected?: boolean // Whether card already exists
}

// User Learning Analytics
export interface LearningStats {
  totalWords: number          // Total words in vocabulary
  weeklyProgress: number      // Words learned this week
  currentStreak: number       // Consecutive days of learning
  masteredWords: number       // Words marked as mastered
  reviewsDue: number          // Words due for review
  averageAccuracy: number     // Review accuracy percentage
  timeSpentLearning: number   // Total time in minutes
  favoriteTopics: string[]    // Most frequently studied topics
}

export interface LearningProgress {
  term: string
  status: 'new' | 'learning' | 'review' | 'mastered'
  correctAnswers: number
  totalAttempts: number
  lastReviewed: number        // Timestamp
  nextReview: number          // Timestamp
  difficultyLevel: number     // 0-10 scale
  memoryStrength: number      // 0-1 scale
}

// User Preferences and Settings
export interface WordWizardSettings {
  // Display preferences
  lookupMode: 'popup' | 'sidepanel'
  theme: 'light' | 'dark' | 'auto'
  fontSize: 'small' | 'medium' | 'large'
  
  // Learning preferences
  defaultComplexityLevel: 'simple' | 'intermediate' | 'advanced'
  learningContext: 'ielts' | 'toefl' | 'academic' | 'business' | 'general'
  enableImageGeneration: boolean
  enablePronunciation: boolean
  
  // Integration settings
  notion: NotionConfig | null
  anki: AnkiConfig | null
  autoSaveEnabled: boolean
  
  // AI preferences
  preferredProvider: 'proxy-api' | 'custom'
  customProviders: CustomAIProvider[]
  
  // Keyboard shortcuts
  shortcuts: {
    lookupWord?: string        // Default: Alt+W
    openSidepanel?: string     // Default: Alt+S
    saveToNotion?: string      // Default: Alt+N
    saveToAnki?: string        // Default: Alt+A
  }
  
  // Privacy and data
  enableAnalytics: boolean
  shareUsageData: boolean
  dataRetentionDays: number
}

// Custom AI Provider Configuration
export interface CustomAIProvider {
  id: string
  name: string
  apiUrl: string
  apiKey: string
  model: string
  type: 'openai-compatible' | 'gemini-compatible' | 'claude-compatible'
  enabled: boolean
  priority: number             // Lower number = higher priority
  rateLimits: {
    requestsPerMinute: number
    requestsPerHour: number
    requestsPerDay: number
  }
}

// Monetization and Quota Types
export interface UserPlan {
  type: 'free' | 'pro' | 'premium' | 'enterprise'
  name: string
  price: number               // Monthly price in USD
  features: PlanFeatures
  limits: PlanLimits
}

export interface PlanFeatures {
  aiLookups: boolean
  imageGeneration: boolean
  batchProcessing: boolean
  prioritySupport: boolean
  customProviders: boolean
  analytics: boolean
  apiAccess: boolean
  whiteLabel: boolean
}

export interface PlanLimits {
  monthlyLookups: number      // -1 for unlimited
  batchSize: number           // Maximum words per batch
  customProviders: number     // Number of custom AI providers
  storageGB: number          // Storage quota in GB
  apiCallsPerDay: number     // API calls if enabled
}

export interface QuotaStatus {
  plan: UserPlan
  currentUsage: {
    lookups: number           // Used this month
    images: number            // Generated this month
    storage: number           // Used storage in bytes
    apiCalls: number          // API calls made today
  }
  resetDate: number          // Next reset timestamp
  overage: {
    allowed: boolean         // Whether overage is permitted
    rate: number            // Cost per overage unit
    currentOverage: number  // Current overage amount
  }
}

// API and Communication Types
export interface WordWizardApiRequest {
  action: 'lookup' | 'batch-process' | 'generate-image' | 'save-to-notion' | 'save-to-anki'
  userId?: string
  data: any
  options?: Record<string, any>
}

export interface WordWizardApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  quotaRemaining?: number
  timestamp: number
  cached?: boolean
  processingTime?: number
}

// Error Types
export interface WordWizardError extends Error {
  code: 'QUOTA_EXCEEDED' | 'INVALID_API_KEY' | 'RATE_LIMITED' | 'AI_ERROR' | 'NETWORK_ERROR' | 'VALIDATION_ERROR'
  context?: {
    term?: string
    userId?: string
    provider?: string
    operation?: string
  }
  retryable: boolean
  retryAfter?: number        // Seconds to wait before retry
}

// Cache Types
export interface WordCacheEntry {
  term: string
  data: WordData
  timestamp: number
  ttl: number                // Time to live in milliseconds
  accessCount: number
  lastAccessed: number
  userId?: string
}

export interface CacheStats {
  totalEntries: number
  hitRate: number            // Percentage
  averageResponseTime: number // Milliseconds
  storageUsed: number        // Bytes
  lastCleanup: number        // Timestamp
}

// Review and Learning System
export interface ReviewSession {
  id: string
  userId: string
  startTime: number
  endTime?: number
  words: ReviewItem[]
  totalCorrect: number
  totalAttempted: number
  sessionType: 'daily-review' | 'weak-words' | 'topic-focused' | 'random'
}

export interface ReviewItem {
  term: string
  wordData: WordData
  questionType: 'definition' | 'synonym' | 'example' | 'pronunciation'
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  responseTime: number       // Milliseconds
  hints?: string[]          // Hints provided
}

// Export commonly used type unions and utilities
export type LookupMethod = 'context-menu' | 'keyboard-shortcut' | 'manual-input' | 'batch-processing'
export type LearningContext = 'ielts' | 'toefl' | 'academic' | 'business' | 'general'
export type WordDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type WordDomain = 'academic' | 'business' | 'daily' | 'technical' | 'medical' | 'legal'
export type UserPlanType = 'free' | 'pro' | 'premium' | 'enterprise'
export type ProcessingPriority = 'low' | 'normal' | 'high'

// Utility types for better type safety
export type RequiredLookupRequest = Required<Pick<LookupRequest, 'term'>> & LookupRequest
export type WordDataWithoutSystem = Omit<WordData, 'timestamp' | 'source' | 'userId'>
export type PartialWordData = Partial<WordData> & Pick<WordData, 'term'>

// API endpoint types for type-safe API calls
export interface WordWizardEndpoints {
  lookup: {
    request: LookupRequest
    response: AnalysisResult
  }
  batchProcess: {
    request: BatchRequest
    response: BatchResult
  }
  saveToNotion: {
    request: NotionSaveRequest
    response: NotionSaveResult
  }
  saveToAnki: {
    request: AnkiSaveRequest
    response: AnkiSaveResult
  }
  getUserStats: {
    request: { userId: string }
    response: LearningStats
  }
  checkQuota: {
    request: { userId: string }
    response: QuotaStatus
  }
}