// Anki Integration Service - Clean AnkiConnect integration for Word Wizard
// Handles vocabulary card creation and management in Anki using AnkiConnect API

import { z } from 'zod'
import { ImprovedBaseService } from './improved-base-service'
import type {
  AnkiConfig,
  AnkiSaveRequest,
  AnkiSaveResult,
  WordData
} from '../types'

// AnkiConnect API types
interface AnkiConnectRequest {
  action: string
  version: number
  params?: any
}

interface AnkiConnectResponse {
  result: any
  error: string | null
}

interface AnkiNote {
  deckName: string
  modelName: string
  fields: Record<string, string>
  tags: string[]
  options?: {
    allowDuplicate?: boolean
    duplicateScope?: string
  }
}

// Validation schemas
const ankiConfigSchema = z.object({
  deckName: z.string().min(1),
  modelName: z.string().default('Basic'),
  frontFormat: z.string().optional(),
  backFormat: z.string().optional(),
  tags: z.array(z.string()).default(['word-wizard']),
  duplicateScope: z.enum(['deck', 'all']).default('deck')
})

const ankiSaveRequestSchema = z.object({
  wordData: z.object({
    term: z.string().min(1),
    definition: z.string(),
    examples: z.array(z.string()),
    ipa: z.string().optional(),
    synonyms: z.array(z.string()),
    wordFamily: z.array(z.any()),
    primaryTopic: z.string().optional(),
    cefrLevel: z.string().optional()
  }),
  config: ankiConfigSchema,
  userId: z.string().optional()
})

export class AnkiService extends ImprovedBaseService {
  private readonly ANKI_CONNECT_VERSION = 6
  private readonly DEFAULT_PORT = 8765
  
  constructor(port: number = 8765) {
    super()
    // AnkiConnect typically runs on localhost:8765
    this.baseUrl = `http://127.0.0.1:${port}`
  }

  /**
   * Save Word Wizard vocabulary data as Anki card
   */
  async saveWordData(request: AnkiSaveRequest): Promise<AnkiSaveResult> {
    try {
      // Validate request
      const validated = ankiSaveRequestSchema.parse(request)
      const { wordData, config } = validated

      // Check AnkiConnect connection first
      const isConnected = await this.checkAnkiConnection()
      if (!isConnected) {
        return {
          success: false,
          error: 'AnkiConnect is not running. Please start Anki and ensure AnkiConnect addon is installed.',
          duplicateDetected: false
        }
      }

      // Ensure deck exists
      await this.ensureDeckExists(config.deckName)

      // Check for duplicates
      const existingNotes = await this.findDuplicateNotes(wordData.term, config)
      
      if (existingNotes.length > 0) {
        // Update existing note
        const noteId = existingNotes[0]
        await this.updateNote(noteId, wordData, config)
        return {
          success: true,
          noteId,
          duplicateDetected: true
        }
      } else {
        // Create new note
        const noteId = await this.createNote(wordData, config)
        return {
          success: true,
          noteId,
          duplicateDetected: false
        }
      }

    } catch (error) {
      return {
        success: false,
        error: this.handleAnkiError(error),
        duplicateDetected: false
      }
    }
  }

  /**
   * Check if AnkiConnect is running and accessible
   */
  async checkAnkiConnection(): Promise<boolean> {
    try {
      const response = await this.ankiConnectRequest('version', {})
      return response.result === this.ANKI_CONNECT_VERSION && response.error === null
    } catch (error) {
      return false
    }
  }

  /**
   * Create a new deck if it doesn't exist
   */
  async createDeck(deckName: string): Promise<void> {
    try {
      await this.ankiConnectRequest('createDeck', {
        deck: deckName
      })
    } catch (error) {
      throw new Error(`Failed to create Anki deck: ${error.message}`)
    }
  }

  /**
   * Find duplicate notes for a term
   */
  async findDuplicateNotes(term: string, config: AnkiConfig): Promise<number[]> {
    try {
      // Search for notes with the same term in the front field
      const scope = config.duplicateScope === 'deck' ? `deck:"${config.deckName}" ` : ''
      const query = `${scope}front:"${term}"`
      
      const response = await this.ankiConnectRequest('findNotes', {
        query
      })

      return response.result || []

    } catch (error) {
      console.warn('Failed to search for duplicate notes:', error)
      return []
    }
  }

  /**
   * Update existing note with new data
   */
  async updateNote(noteId: number, wordData: WordData, config: AnkiConfig): Promise<void> {
    try {
      const fields = this.buildCardFields(wordData, config)
      
      await this.ankiConnectRequest('updateNoteFields', {
        note: {
          id: noteId,
          fields
        }
      })

      // Update tags if needed
      const tags = this.buildCardTags(wordData, config)
      await this.ankiConnectRequest('addTags', {
        notes: [noteId],
        tags: tags.join(' ')
      })

    } catch (error) {
      throw new Error(`Failed to update Anki note: ${error.message}`)
    }
  }

  /**
   * Get available decks
   */
  async getDecks(): Promise<string[]> {
    try {
      const response = await this.ankiConnectRequest('deckNames', {})
      return response.result || []
    } catch (error) {
      throw new Error(`Failed to get Anki decks: ${error.message}`)
    }
  }

  /**
   * Get available note types (models)
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await this.ankiConnectRequest('modelNames', {})
      return response.result || []
    } catch (error) {
      throw new Error(`Failed to get Anki models: ${error.message}`)
    }
  }

  /**
   * Get fields for a specific model
   */
  async getModelFields(modelName: string): Promise<string[]> {
    try {
      const response = await this.ankiConnectRequest('modelFieldNames', {
        modelName
      })
      return response.result || []
    } catch (error) {
      throw new Error(`Failed to get model fields: ${error.message}`)
    }
  }

  /**
   * Validate Anki configuration
   */
  async validateConfig(config: AnkiConfig): Promise<{ valid: boolean, errors: string[] }> {
    const errors: string[] = []

    try {
      // Check connection
      if (!await this.checkAnkiConnection()) {
        errors.push('AnkiConnect is not running or not accessible')
        return { valid: false, errors }
      }

      // Check if deck exists
      const decks = await this.getDecks()
      if (!decks.includes(config.deckName)) {
        errors.push(`Deck "${config.deckName}" does not exist`)
      }

      // Check if model exists
      const models = await this.getModels()
      if (!models.includes(config.modelName)) {
        errors.push(`Note type "${config.modelName}" does not exist`)
      }

      return { valid: errors.length === 0, errors }

    } catch (error) {
      errors.push(`Validation failed: ${error.message}`)
      return { valid: false, errors }
    }
  }

  // Private helper methods

  private async ensureDeckExists(deckName: string): Promise<void> {
    const decks = await this.getDecks()
    if (!decks.includes(deckName)) {
      await this.createDeck(deckName)
    }
  }

  private async createNote(wordData: WordData, config: AnkiConfig): Promise<number> {
    const note: AnkiNote = {
      deckName: config.deckName,
      modelName: config.modelName,
      fields: this.buildCardFields(wordData, config),
      tags: this.buildCardTags(wordData, config),
      options: {
        allowDuplicate: false,
        duplicateScope: config.duplicateScope
      }
    }

    const response = await this.ankiConnectRequest('addNote', {
      note
    })

    if (response.error) {
      throw new Error(response.error)
    }

    return response.result
  }

  private buildCardFields(wordData: WordData, config: AnkiConfig): Record<string, string> {
    // Default field mapping for Basic note type
    const fields: Record<string, string> = {
      'Front': wordData.term,
      'Back': this.buildBackContent(wordData, config)
    }

    // Handle custom field mappings based on model type
    if (config.modelName === 'Cloze') {
      fields['Text'] = this.buildClozeContent(wordData)
    } else if (config.modelName === 'Basic (and reversed card)') {
      fields['Front'] = wordData.term
      fields['Back'] = this.buildBackContent(wordData, config)
    } else if (config.modelName === 'Basic (optional reversed card)') {
      fields['Front'] = wordData.term
      fields['Back'] = this.buildBackContent(wordData, config)
      fields['Add Reverse'] = 'y' // Enable reverse card
    }

    // Add pronunciation if available
    if (wordData.ipa) {
      fields['Pronunciation'] = wordData.ipa
    }

    return fields
  }

  private buildBackContent(wordData: WordData, config: AnkiConfig): string {
    if (config.backFormat) {
      return this.applyTemplate(config.backFormat, wordData)
    }

    // Default back content format
    let content = `<div class="definition"><strong>Definition:</strong><br>${wordData.definition}</div>`

    if (wordData.examples && wordData.examples.length > 0) {
      content += `<div class="examples"><strong>Examples:</strong><br>`
      content += wordData.examples.map(ex => `• ${ex}`).join('<br>')
      content += `</div>`
    }

    if (wordData.synonyms && wordData.synonyms.length > 0) {
      content += `<div class="synonyms"><strong>Synonyms:</strong> ${wordData.synonyms.slice(0, 5).join(', ')}</div>`
    }

    if (wordData.wordFamily && wordData.wordFamily.length > 0) {
      content += `<div class="word-family"><strong>Word Family:</strong><br>`
      content += wordData.wordFamily.map(item => `• <em>${item.type}</em>: ${item.word} - ${item.definition}`).join('<br>')
      content += `</div>`
    }

    if (wordData.primaryTopic) {
      content += `<div class="topic"><strong>Topic:</strong> ${wordData.primaryTopic}</div>`
    }

    if (wordData.cefrLevel) {
      content += `<div class="level"><strong>CEFR Level:</strong> ${wordData.cefrLevel}</div>`
    }

    return content
  }

  private buildClozeContent(wordData: WordData): string {
    // Create cloze deletion format
    if (wordData.examples && wordData.examples.length > 0) {
      const example = wordData.examples[0]
      const clozedExample = example.replace(
        new RegExp(`\\b${wordData.term}\\b`, 'gi'),
        `{{c1::${wordData.term}}}`
      )
      
      return `${clozedExample}<br><br><strong>Definition:</strong> ${wordData.definition}`
    }
    
    return `The word {{c1::${wordData.term}}} means: ${wordData.definition}`
  }

  private buildCardTags(wordData: WordData, config: AnkiConfig): string[] {
    const tags = [...(config.tags || ['word-wizard'])]

    // Add topic as tag
    if (wordData.primaryTopic) {
      tags.push(wordData.primaryTopic.toLowerCase().replace(/\s+/g, '-'))
    }

    // Add domain as tag
    if (wordData.domain) {
      tags.push(wordData.domain)
    }

    // Add CEFR level as tag
    if (wordData.cefrLevel) {
      tags.push(wordData.cefrLevel.toLowerCase())
    }

    // Clean and deduplicate tags
    return [...new Set(tags.map(tag => tag.replace(/[^a-zA-Z0-9\-_]/g, '')))]
  }

  private applyTemplate(template: string, wordData: WordData): string {
    return template
      .replace(/\{\{term\}\}/g, wordData.term)
      .replace(/\{\{definition\}\}/g, wordData.definition)
      .replace(/\{\{ipa\}\}/g, wordData.ipa || '')
      .replace(/\{\{examples\}\}/g, wordData.examples?.join('<br>') || '')
      .replace(/\{\{synonyms\}\}/g, wordData.synonyms?.join(', ') || '')
      .replace(/\{\{topic\}\}/g, wordData.primaryTopic || '')
      .replace(/\{\{level\}\}/g, wordData.cefrLevel || '')
  }

  private async ankiConnectRequest(action: string, params: any = {}): Promise<AnkiConnectResponse> {
    const request: AnkiConnectRequest = {
      action,
      version: this.ANKI_CONNECT_VERSION,
      params
    }

    try {
      const response = await this.post<AnkiConnectResponse>('/', request, {
        timeout: 10000 // 10 second timeout
      })

      return response

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('AnkiConnect is not running. Please start Anki with AnkiConnect addon.')
      }
      throw error
    }
  }

  private handleAnkiError(error: any): string {
    if (error.message?.includes('ECONNREFUSED')) {
      return 'AnkiConnect is not running. Please start Anki and ensure AnkiConnect addon is installed.'
    }
    
    if (error.message?.includes('deck was not found')) {
      return 'Anki deck not found. Please check your deck name or create the deck first.'
    }
    
    if (error.message?.includes('model was not found')) {
      return 'Anki note type not found. Please check your note type configuration.'
    }
    
    if (error.message?.includes('permission')) {
      return 'Permission denied. Please check AnkiConnect settings and permissions.'
    }

    return `Anki integration failed: ${error.message || 'Unknown error'}`
  }
}