// Word Wizard Store - Specialized state management for vocabulary learning
// Handles complex word lookup workflows with clean, reactive state

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Storage } from '@plasmohq/storage'
import { WordWizardOrchestrator } from '../services'
import type { WordData, LookupRequest } from '../types'

// Storage instance
const storage = new Storage()

// Word Wizard specific state interface
interface WordWizardState {
  // Current session
  selectedText: string
  currentLookup: WordData | null
  isLookingUp: boolean
  lookupError: string | null
  
  // User context
  userId: string | null
  userPlan: 'free' | 'pro' | 'premium' | 'enterprise'
  quotaRemaining: number
  quotaLimit: number
  
  // Learning features
  vocabularyHistory: WordData[]
  reviewQueue: WordData[]
  learningStats: {
    totalWords: number
    weeklyProgress: number
    currentStreak: number
    masteredWords: number
  }
  
  // Integration settings
  notionEnabled: boolean
  notionDatabaseId: string | null
  ankiEnabled: boolean
  ankiDeckName: string | null
  autoSaveEnabled: boolean
  
  // UI preferences
  lookupMode: 'popup' | 'sidepanel'
  showImageGeneration: boolean
  complexityLevel: 'simple' | 'intermediate' | 'advanced'
  
  // Batch processing (IELTS features)
  batchWords: string[]
  batchResults: Array<{word: string, synonyms: WordData}>
  isBatchProcessing: boolean
  batchError: string | null

  // Actions
  // Core lookup actions
  setSelectedText: (text: string) => void
  lookupWord: (request: Omit<LookupRequest, 'userId'>) => Promise<void>
  clearCurrentLookup: () => void
  
  // User management
  setUser: (userId: string, plan: string) => void
  updateQuota: (remaining: number, limit: number) => void
  
  // Learning features
  addToHistory: (wordData: WordData) => void
  addToReviewQueue: (wordData: WordData) => void
  markAsLearned: (term: string) => void
  updateLearningStats: () => void
  
  // Integration settings
  updateNotionSettings: (enabled: boolean, databaseId?: string) => void
  updateAnkiSettings: (enabled: boolean, deckName?: string) => void
  setAutoSave: (enabled: boolean) => void
  
  // UI preferences
  setLookupMode: (mode: 'popup' | 'sidepanel') => void
  setComplexityLevel: (level: 'simple' | 'intermediate' | 'advanced') => void
  toggleImageGeneration: () => void
  
  // Batch processing
  setBatchWords: (words: string[]) => void
  processBatch: () => Promise<void>
  clearBatch: () => void
  
  // Storage
  loadFromStorage: () => Promise<void>
  saveToStorage: () => Promise<void>
}

// Create Word Wizard orchestrator instance
let orchestrator: WordWizardOrchestrator | null = null

const getOrchestrator = (userId?: string): WordWizardOrchestrator => {
  if (!orchestrator || (userId && orchestrator['userId'] !== userId)) {
    orchestrator = new WordWizardOrchestrator({
      proxyApiUrl: process.env.NODE_ENV === 'production' 
        ? 'https://api.wordwizard.com' 
        : 'http://localhost:3001',
      userId
    })
  }
  return orchestrator
}

// Create the Word Wizard store
export const useWordWizardStore = create<WordWizardState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        selectedText: '',
        currentLookup: null,
        isLookingUp: false,
        lookupError: null,
        
        userId: null,
        userPlan: 'free',
        quotaRemaining: 100,
        quotaLimit: 100,
        
        vocabularyHistory: [],
        reviewQueue: [],
        learningStats: {
          totalWords: 0,
          weeklyProgress: 0,
          currentStreak: 0,
          masteredWords: 0
        },
        
        notionEnabled: false,
        notionDatabaseId: null,
        ankiEnabled: false,
        ankiDeckName: null,
        autoSaveEnabled: true,
        
        lookupMode: 'popup',
        showImageGeneration: false,
        complexityLevel: 'intermediate',
        
        batchWords: [],
        batchResults: [],
        isBatchProcessing: false,
        batchError: null,

        // Core lookup actions
        setSelectedText: (text) => set({ selectedText: text }),
        
        lookupWord: async (request) => {
          const state = get()
          set({ isLookingUp: true, lookupError: null, currentLookup: null })
          
          try {
            const orchestrator = getOrchestrator(state.userId || undefined)
            
            // Build complete request with user preferences and required defaults
            const fullRequest = {
              ...request,
              userId: state.userId || undefined,
              options: {
                includeImage: state.showImageGeneration,
                includeExamples: request.options?.includeExamples ?? true,
                includeWordFamily: request.options?.includeWordFamily ?? true,
                complexityLevel: state.complexityLevel,
                saveToNotion: state.notionEnabled && state.autoSaveEnabled,
                saveToAnki: state.ankiEnabled && state.autoSaveEnabled,
                generateSynonyms: request.options?.generateSynonyms ?? false,
                ...request.options
              }
            }
            
            const result = await orchestrator.lookupWord(fullRequest)
            
            set({ 
              currentLookup: result,
              isLookingUp: false 
            })
            
            // Add to history
            get().addToHistory(result)
            
            // Update learning stats
            get().updateLearningStats()
            
          } catch (error) {
            set({ 
              lookupError: error instanceof Error ? error.message : 'Lookup failed',
              isLookingUp: false 
            })
          }
        },

        clearCurrentLookup: () => set({ 
          currentLookup: null, 
          lookupError: null,
          selectedText: ''
        }),

        // User management
        setUser: (userId, plan) => set({ 
          userId, 
          userPlan: plan as any,
          // Reset orchestrator to use new user
        }),

        updateQuota: (remaining, limit) => set({ 
          quotaRemaining: remaining, 
          quotaLimit: limit 
        }),

        // Learning features
        addToHistory: (wordData) => set((state) => ({
          vocabularyHistory: [
            wordData,
            ...state.vocabularyHistory.filter(w => w.term !== wordData.term).slice(0, 99)
          ]
        })),

        addToReviewQueue: (wordData) => set((state) => ({
          reviewQueue: [
            wordData,
            ...state.reviewQueue.filter(w => w.term !== wordData.term).slice(0, 49)
          ]
        })),

        markAsLearned: (term) => set((state) => ({
          reviewQueue: state.reviewQueue.filter(w => w.term !== term),
          learningStats: {
            ...state.learningStats,
            masteredWords: state.learningStats.masteredWords + 1
          }
        })),

        updateLearningStats: () => set((state) => {
          const today = new Date().toDateString()
          const todayWords = state.vocabularyHistory.filter(
            w => new Date(w.timestamp).toDateString() === today
          ).length

          return {
            learningStats: {
              ...state.learningStats,
              totalWords: state.vocabularyHistory.length,
              weeklyProgress: todayWords
            }
          }
        }),

        // Integration settings
        updateNotionSettings: (enabled, databaseId) => set({ 
          notionEnabled: enabled,
          notionDatabaseId: databaseId || null
        }),

        updateAnkiSettings: (enabled, deckName) => set({ 
          ankiEnabled: enabled,
          ankiDeckName: deckName || null
        }),

        setAutoSave: (enabled) => set({ autoSaveEnabled: enabled }),

        // UI preferences
        setLookupMode: (mode) => set({ lookupMode: mode }),
        
        setComplexityLevel: (level) => set({ complexityLevel: level }),
        
        toggleImageGeneration: () => set((state) => ({ 
          showImageGeneration: !state.showImageGeneration 
        })),

        // Batch processing (IELTS features)
        setBatchWords: (words) => set({ 
          batchWords: words,
          batchError: null 
        }),

        processBatch: async () => {
          const state = get()
          if (state.batchWords.length === 0) return
          
          set({ isBatchProcessing: true, batchError: null, batchResults: [] })
          
          try {
            const orchestrator = getOrchestrator(state.userId || undefined)
            const results = await orchestrator.generateIELTSSynonyms(state.batchWords)
            
            set({ 
              batchResults: results,
              isBatchProcessing: false 
            })
            
            // Add all results to history
            results.forEach(result => {
              if (result.synonyms.source !== 'error') {
                get().addToHistory(result.synonyms)
              }
            })
            
          } catch (error) {
            set({ 
              batchError: error instanceof Error ? error.message : 'Batch processing failed',
              isBatchProcessing: false 
            })
          }
        },

        clearBatch: () => set({ 
          batchWords: [],
          batchResults: [],
          batchError: null 
        }),

        // Storage
        loadFromStorage: async () => {
          try {
            const [history, settings, stats] = await Promise.all([
              storage.get('word_wizard_history'),
              storage.get('word_wizard_settings'),
              storage.get('word_wizard_stats')
            ])

            const parsedHistory = Array.isArray(history) ? history : []
            const parsedSettings = typeof settings === 'object' ? settings : {}
            const parsedStats = typeof stats === 'object' ? stats : {}

            set((state) => ({
              vocabularyHistory: parsedHistory,
              learningStats: { ...state.learningStats, ...parsedStats },
              notionEnabled: (parsedSettings as any).notionEnabled || false,
              notionDatabaseId: (parsedSettings as any).notionDatabaseId || null,
              ankiEnabled: (parsedSettings as any).ankiEnabled || false,
              ankiDeckName: (parsedSettings as any).ankiDeckName || null,
              autoSaveEnabled: (parsedSettings as any).autoSaveEnabled !== false,
              lookupMode: (parsedSettings as any).lookupMode || 'popup',
              complexityLevel: (parsedSettings as any).complexityLevel || 'intermediate',
              showImageGeneration: (parsedSettings as any).showImageGeneration || false
            }))
          } catch (error) {
            console.error('Failed to load Word Wizard data:', error)
          }
        },

        saveToStorage: async () => {
          try {
            const state = get()
            
            await Promise.all([
              storage.set('word_wizard_history', state.vocabularyHistory.slice(0, 100)),
              storage.set('word_wizard_settings', {
                notionEnabled: state.notionEnabled,
                notionDatabaseId: state.notionDatabaseId,
                ankiEnabled: state.ankiEnabled,
                ankiDeckName: state.ankiDeckName,
                autoSaveEnabled: state.autoSaveEnabled,
                lookupMode: state.lookupMode,
                complexityLevel: state.complexityLevel,
                showImageGeneration: state.showImageGeneration
              }),
              storage.set('word_wizard_stats', state.learningStats)
            ])
          } catch (error) {
            console.error('Failed to save Word Wizard data:', error)
          }
        }
      }),
      {
        name: 'word-wizard-store',
        partialize: (state) => ({
          lookupMode: state.lookupMode,
          complexityLevel: state.complexityLevel,
          showImageGeneration: state.showImageGeneration,
          autoSaveEnabled: state.autoSaveEnabled
        })
      }
    ),
    {
      name: 'word-wizard-store'
    }
  )
)

// Optimized selectors for performance
export const useLookupState = () => useWordWizardStore((state) => ({
  selectedText: state.selectedText,
  currentLookup: state.currentLookup,
  isLookingUp: state.isLookingUp,
  error: state.lookupError
}))

export const useUserState = () => useWordWizardStore((state) => ({
  userId: state.userId,
  plan: state.userPlan,
  quotaRemaining: state.quotaRemaining,
  quotaLimit: state.quotaLimit,
  settings: {
    theme: 'light' as const, // Default theme
    notifications: true,
    language: 'en',
    defaultComplexity: state.complexityLevel
  }
}))

export const useLearningState = () => useWordWizardStore((state) => ({
  history: state.vocabularyHistory,
  reviewQueue: state.reviewQueue,
  stats: state.learningStats
}))

export const useIntegrationSettings = () => useWordWizardStore((state) => ({
  notion: {
    enabled: state.notionEnabled,
    databaseId: state.notionDatabaseId,
    token: state.notionDatabaseId // Use databaseId as token for now
  },
  anki: {
    enabled: state.ankiEnabled,
    deckName: state.ankiDeckName,
    port: 8765 // Default AnkiConnect port
  },
  autoSave: state.autoSaveEnabled,
  updateNotionSettings: state.updateNotionSettings,
  updateAnkiSettings: state.updateAnkiSettings,
  setAutoSave: state.setAutoSave
}))

export const useBatchState = () => useWordWizardStore((state) => ({
  words: state.batchWords,
  results: state.batchResults,
  isProcessing: state.isBatchProcessing,
  error: state.batchError
}))

// Action hooks for cleaner component usage
export const useWordWizardActions = () => useWordWizardStore((state) => ({
  setSelectedText: state.setSelectedText,
  lookupWord: state.lookupWord,
  clearCurrentLookup: state.clearCurrentLookup,
  setUser: state.setUser,
  updateQuota: state.updateQuota,
  addToHistory: state.addToHistory,
  addToReviewQueue: state.addToReviewQueue,
  markAsLearned: state.markAsLearned,
  updateNotionSettings: state.updateNotionSettings,
  updateAnkiSettings: state.updateAnkiSettings,
  setAutoSave: state.setAutoSave,
  setLookupMode: state.setLookupMode,
  setComplexityLevel: state.setComplexityLevel,
  toggleImageGeneration: state.toggleImageGeneration,
  setBatchWords: state.setBatchWords,
  processBatch: state.processBatch,
  clearBatch: state.clearBatch,
  loadFromStorage: state.loadFromStorage,
  saveToStorage: state.saveToStorage,
  
  // Additional methods needed by options page
  updateUserSettings: (settings: any) => {
    // Update user settings
    console.log('Updating user settings:', settings)
  },
  upgradeUser: (plan: string) => {
    // Handle user plan upgrade
    console.log('Upgrading user to plan:', plan)
  },
  downgradeUser: (plan: string) => {
    // Handle user plan downgrade  
    console.log('Downgrading user to plan:', plan)
  }
}))