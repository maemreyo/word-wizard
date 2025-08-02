// Core Service Classes
export { BaseService } from './base-service'
export { ImprovedBaseService } from './improved-base-service'

// API and HTTP Services
export { ApiService } from './api-service'

// AI Services
export { AIService } from './ai-service'

// Word Wizard Services - Complete vocabulary learning business logic
export { WordWizardOrchestrator } from './word-wizard-orchestrator'
export { NotionService } from './notion-service'
export { AnkiService } from './anki-service'

// Caching and Rate Limiting
export { CacheService } from './cache-service'
export { RateLimitService } from './rate-limit-service'

// Payment and Licensing
export { PaymentService } from './payment-service'
export { LicenseValidator } from './license-validator'

// System Services
export { LoggerService, logger } from './logger-service'
export { ErrorService, errorService } from './error-service'
export { NotificationService, notificationService } from './notification-service'
export { UpdateService, updateService } from './update-service'

// Type exports for services
export type {
  // Core service types
  LogEntry,
  LoggerConfig,
  ErrorReport,
  ErrorServiceConfig,
  NotificationData,
  NotificationConfig,
  NotificationHistory,
  UpdateInfo,
  UpdateCheckResult,
  UpdateServiceConfig,
  UpdateHistory,
  
  // Word Wizard service types
  WordData,
  LookupRequest,
  LookupOptions,
  AnalysisResult,
  BatchRequest,
  BatchResult,
  NotionConfig,
  NotionSaveRequest,
  NotionSaveResult,
  AnkiConfig,
  AnkiSaveRequest,
  AnkiSaveResult,
  WordWizardError
} from '../types'