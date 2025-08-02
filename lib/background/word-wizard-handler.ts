// Word Wizard Background Handler - Business logic for Word Wizard operations
// Clean architecture: Business logic layer handling Word Wizard specific operations

import { WordWizardOrchestrator } from '../services/word-wizard-orchestrator'
import { NotionService } from '../services/notion-service'
import { AnkiService } from '../services/anki-service'
import type { LookupRequest, BatchRequest, WordData } from '../types'

// Initialize services
const orchestrator = new WordWizardOrchestrator({
  proxyApiUrl: process.env.PROXY_API_URL || 'https://api.wordwizard.app',
  userId: 'background-service'
})
const notionService = new NotionService()
const ankiService = new AnkiService()

export async function handleWordWizardMessage(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: any) => void
) {
  try {
    console.log('Word Wizard handler processing:', message.type)

    switch (message.type) {
      case 'WORD_WIZARD_LOOKUP':
        await handleWordLookup(message.data, sendResponse)
        break

      case 'WORD_WIZARD_BATCH_PROCESS':
        await handleBatchProcess(message.data, sendResponse)
        break

      case 'WORD_WIZARD_SAVE_TO_NOTION':
        await handleSaveToNotion(message.data, sendResponse)
        break

      case 'WORD_WIZARD_SAVE_TO_ANKI':
        await handleSaveToAnki(message.data, sendResponse)
        break

      case 'WORD_WIZARD_GET_HISTORY':
        await handleGetHistory(message.data, sendResponse)
        break

      case 'WORD_WIZARD_UPDATE_SETTINGS':
        await handleUpdateSettings(message.data, sendResponse)
        break

      case 'TEST_NOTION_CONNECTION':
        await handleTestNotionConnection(message.config, sendResponse)
        break

      case 'TEST_ANKI_CONNECTION':
        await handleTestAnkiConnection(message.config, sendResponse)
        break

      default:
        sendResponse({
          success: false,
          error: `Unknown Word Wizard message type: ${message.type}`
        })
    }
  } catch (error) {
    console.error('Word Wizard handler error:', error)
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
}

async function handleWordLookup(request: LookupRequest, sendResponse: (response: any) => void) {
  try {
    console.log('Processing word lookup:', request.term)
    
    // Transform LookupRequest to WordWizardLookupRequest format
    const transformedRequest = {
      term: request.term,
      context: request.context,
      userId: request.userId,
      options: {
        includeImage: request.options?.includeImage ?? false,
        includeExamples: request.options?.includeExamples ?? true,
        includeWordFamily: request.options?.includeWordFamily ?? true,
        complexityLevel: request.options?.complexityLevel ?? 'intermediate',
        saveToNotion: request.options?.saveToNotion ?? false,
        saveToAnki: request.options?.saveToAnki ?? false,
        generateSynonyms: request.options?.generateSynonyms ?? false
      }
    }
    
    const result = await orchestrator.lookupWord(transformedRequest)
    
    // Store in history
    await storeInHistory(result, 'lookup')
    
    sendResponse({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Word lookup error:', error)
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to lookup word'
    })
  }
}

async function handleBatchProcess(request: BatchRequest, sendResponse: (response: any) => void) {
  try {
    console.log('Processing batch request:', request.words.length, 'words')
    
    const results = await orchestrator.generateIELTSSynonyms(request.words)
    
    // Store all results in history
    for (const result of results) {
      if (result.synonyms.source !== 'error') {
        await storeInHistory(result.synonyms, 'batch')
      }
    }
    
    sendResponse({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Batch process error:', error)
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process batch'
    })
  }
}

async function handleSaveToNotion(data: { wordData: WordData, config: any }, sendResponse: (response: any) => void) {
  try {
    console.log('Saving to Notion:', data.wordData.term)
    
    const result = await notionService.saveWordData({
      wordData: data.wordData,
      config: data.config
    })
    
    sendResponse({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Notion save error:', error)
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save to Notion'
    })
  }
}

async function handleSaveToAnki(data: { wordData: WordData, config: any }, sendResponse: (response: any) => void) {
  try {
    console.log('Saving to Anki:', data.wordData.term)
    
    const result = await ankiService.saveWordData({
      wordData: data.wordData,
      config: data.config
    })
    
    sendResponse({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Anki save error:', error)
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save to Anki'
    })
  }
}

async function handleGetHistory(filters: any, sendResponse: (response: any) => void) {
  try {
    const history = await getVocabularyHistory(filters)
    
    sendResponse({
      success: true,
      data: history
    })
  } catch (error) {
    console.error('Get history error:', error)
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get history'
    })
  }
}

async function handleUpdateSettings(settings: any, sendResponse: (response: any) => void) {
  try {
    // Update settings in storage
    await chrome.storage.local.set({
      'word-wizard-user-settings': settings.userSettings,
      'word-wizard-integration-settings': settings.integrationSettings,
      'word-wizard-ai-settings': settings.aiSettings
    })
    
    sendResponse({
      success: true,
      data: { message: 'Settings updated successfully' }
    })
  } catch (error) {
    console.error('Update settings error:', error)
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update settings'
    })
  }
}

async function handleTestNotionConnection(config: any, sendResponse: (response: any) => void) {
  try {
    console.log('Testing Notion connection')
    
    // Test the connection with provided config
    const testService = new NotionService()
    // NotionService doesn't have testConnection method, so we'll validate the config instead
    await testService.validateDatabase(config.databaseId)
    
    sendResponse({
      success: true,
      data: { message: 'Notion connection successful' }
    })
  } catch (error) {
    console.error('Notion connection test error:', error)
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to Notion'
    })
  }
}

async function handleTestAnkiConnection(config: any, sendResponse: (response: any) => void) {
  try {
    console.log('Testing Anki connection')
    
    // Test the connection with provided config
    const testService = new AnkiService()
    const isConnected = await testService.checkAnkiConnection()
    if (!isConnected) {
      throw new Error('Cannot connect to Anki')
    }
    
    sendResponse({
      success: true,
      data: { message: 'Anki connection successful' }
    })
  } catch (error) {
    console.error('Anki connection test error:', error)
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to Anki'
    })
  }
}

// Helper function to store words in history
async function storeInHistory(wordData: WordData, source: 'lookup' | 'batch' | 'context-menu') {
  try {
    const historyKey = 'word-wizard-vocabulary-history'
    const result = await chrome.storage.local.get([historyKey])
    const history = result[historyKey] || []
    
    // Check if word already exists
    const existingIndex = history.findIndex((item: any) => item.term === wordData.term)
    
    const historyItem = {
      id: existingIndex >= 0 ? history[existingIndex].id : `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      term: wordData.term,
      definition: wordData.definition,
      timestamp: new Date(),
      lastViewed: new Date(),
      lookupCount: existingIndex >= 0 ? history[existingIndex].lookupCount + 1 : 1,
      mastered: existingIndex >= 0 ? history[existingIndex].mastered : false,
      difficulty: wordData.cefrLevel ? mapCefrToDifficulty(wordData.cefrLevel) : 'medium' as 'easy' | 'medium' | 'hard',
      source,
      wordData // Store full word data for reference
    }
    
    if (existingIndex >= 0) {
      // Update existing item
      history[existingIndex] = historyItem
    } else {
      // Add new item to beginning
      history.unshift(historyItem)
    }
    
    // Keep only last 1000 items to prevent storage bloat
    const trimmedHistory = history.slice(0, 1000)
    
    await chrome.storage.local.set({
      [historyKey]: trimmedHistory
    })
    
    console.log('Word stored in history:', wordData.term)
  } catch (error) {
    console.error('Failed to store in history:', error)
    // Don't throw - history storage failure shouldn't break main functionality
  }
}

// Helper function to get vocabulary history with filters
async function getVocabularyHistory(filters: any = {}) {
  const historyKey = 'word-wizard-vocabulary-history'
  const result = await chrome.storage.local.get([historyKey])
  let history = result[historyKey] || []
  
  // Apply filters if provided
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase()
    history = history.filter((item: any) => 
      item.term.toLowerCase().includes(searchTerm) ||
      item.definition.toLowerCase().includes(searchTerm)
    )
  }
  
  if (filters.difficulty) {
    history = history.filter((item: any) => item.difficulty === filters.difficulty)
  }
  
  if (filters.mastered !== undefined) {
    history = history.filter((item: any) => item.mastered === filters.mastered)
  }
  
  // Sort by specified criteria
  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'alphabetical':
        history.sort((a: any, b: any) => a.term.localeCompare(b.term))
        break
      case 'frequency':
        history.sort((a: any, b: any) => b.lookupCount - a.lookupCount)
        break
      case 'recent':
      default:
        history.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    }
  }
  
  return history
}

// Helper function to map CEFR levels to difficulty
function mapCefrToDifficulty(cefrLevel: string): 'easy' | 'medium' | 'hard' {
  switch (cefrLevel.toUpperCase()) {
    case 'A1':
    case 'A2':
      return 'easy'
    case 'B1':
    case 'B2':
      return 'medium'
    case 'C1':
    case 'C2':
    default:
      return 'hard'
  }
}