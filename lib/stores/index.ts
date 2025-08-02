// Store Layer - Zustand state management with separation of concerns
// Clean exports for all extension stores following export index pattern

// Core Extension Stores
export { 
  useExtensionStore,
  useConfig,
  usePreferences,
  useProcessing,
  useUI,
  useExtensionActions,
  useStorageSync
} from './extension-store'

export {
  useAIStore,
  // Add AI store selectors and actions when implemented
} from './ai-store'

export {
  usePaymentStore,
  // Add payment store selectors and actions when implemented  
} from './payment-store'

// Word Wizard Specialized Stores
export {
  useWordWizardStore,
  useWordWizardActions,
  useLookupState,
  useUserState,
  useLearningState,
  useIntegrationSettings,
  useBatchState
} from './word-wizard-store'

// Type exports for stores
export type {
  // Extension state types
  ExtensionState,
  UserPreferences,
  ProcessResult,
  
  // Word Wizard state types  
  WordWizardState,
  LearningStats,
  WordWizardSettings,
  QuotaStatus,
  
  // AI state types
  AIStore,
  
  // UI component types
  PopupProps,
  SidePanelProps,
  NotificationData
} from '../types'