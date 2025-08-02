// Notion Integration Service - Clean separation for Notion API integration
// Handles Word Wizard vocabulary data synchronization with Notion databases

import { z } from 'zod'
import { ImprovedBaseService } from './improved-base-service'
import type {
  NotionConfig,
  NotionSaveRequest,
  NotionSaveResult,
  WordData,
  LearningProgress
} from '../types'

// Notion API types (minimal subset for Word Wizard needs)
interface NotionPageProperties {
  [key: string]: any
}

interface NotionPage {
  id: string
  properties: NotionPageProperties
  url: string
  created_time: string
  last_edited_time: string
}

interface NotionSearchResult {
  results: NotionPage[]
  has_more: boolean
  next_cursor?: string
}

// Validation schemas
const notionConfigSchema = z.object({
  apiKey: z.string().min(1),
  databaseId: z.string().min(1),
  titleProperty: z.string().default('Word'),
  definitionProperty: z.string().default('Definition'),
  examplesProperty: z.string().default('Examples'),
  topicProperty: z.string().default('Topic'),
  statusProperty: z.string().default('Status'),
  customFields: z.record(z.string()).optional()
})

const notionSaveRequestSchema = z.object({
  wordData: z.object({
    term: z.string().min(1),
    definition: z.string(),
    examples: z.array(z.string()),
    synonyms: z.array(z.string()),
    primaryTopic: z.string().optional(),
    domain: z.string().optional(),
    cefrLevel: z.string().optional()
  }),
  config: notionConfigSchema,
  userId: z.string().optional()
})

export class NotionService extends ImprovedBaseService {
  private readonly NOTION_API_VERSION = '2022-06-28'
  
  constructor() {
    super()
    // Set base URL for Notion API
    this.baseUrl = 'https://api.notion.com/v1'
  }

  /**
   * Save Word Wizard vocabulary data to Notion database
   */
  async saveWordData(request: NotionSaveRequest): Promise<NotionSaveResult> {
    try {
      // Validate request
      const validated = notionSaveRequestSchema.parse(request)
      const { wordData, config } = validated

      // Check for existing entry first
      const existingPageId = await this.searchExistingWord(wordData.term, config)
      
      if (existingPageId) {
        // Update existing page
        const pageUrl = await this.updateExistingPage(existingPageId, this.ensureCompleteWordData(wordData), config)
        return {
          success: true,
          pageId: existingPageId,
          pageUrl,
          duplicateDetected: true
        }
      } else {
        // Create new page
        const { pageId, pageUrl } = await this.createNewPage(this.ensureCompleteWordData(wordData), config)
        return {
          success: true,
          pageId,
          pageUrl,
          duplicateDetected: false
        }
      }

    } catch (error) {
      return {
        success: false,
        error: this.handleNotionError(error),
        duplicateDetected: false
      }
    }
  }

  /**
   * Search for existing word in Notion database
   */
  async searchExistingWord(term: string, config: NotionConfig): Promise<string | null> {
    try {
      const response = await this.post<NotionSearchResult>('/databases/' + config.databaseId + '/query', {
        filter: {
          property: config.titleProperty || 'Word',
          title: {
            equals: term
          }
        },
        page_size: 1
      }, {
        headers: this.getNotionHeaders(config.apiKey)
      })

      return response.results.length > 0 ? response.results[0].id : null

    } catch (error) {
      console.warn('Failed to search existing word in Notion:', error)
      return null
    }
  }

  /**
   * Update learning progress for existing word
   */
  async updateWordProgress(pageId: string, progress: LearningProgress, config: NotionConfig): Promise<void> {
    try {
      const properties: NotionPageProperties = {}
      
      // Update status property if configured
      if (config.statusProperty) {
        properties[config.statusProperty] = {
          select: {
            name: this.mapLearningStatusToNotion(progress.status)
          }
        }
      }

      // Add custom progress fields if configured
      if (config.customFields?.accuracy) {
        properties[config.customFields.accuracy] = {
          number: Math.round((progress.correctAnswers / progress.totalAttempts) * 100)
        }
      }

      if (config.customFields?.difficulty) {
        properties[config.customFields.difficulty] = {
          number: progress.difficultyLevel
        }
      }

      await this.patch('/pages/' + pageId, {
        properties
      }, {
        headers: this.getNotionHeaders(config.apiKey)
      })

    } catch (error) {
      throw new Error(`Failed to update word progress in Notion: ${error.message}`)
    }
  }

  /**
   * Validate Notion database configuration
   */
  async validateDatabase(config: NotionConfig): Promise<boolean> {
    try {
      const response = await this.get('/databases/' + config.databaseId, {
        headers: this.getNotionHeaders(config.apiKey)
      })

      // Check if required properties exist
      const properties = response.properties || {}
      const requiredProps = [
        config.titleProperty || 'Word',
        config.definitionProperty || 'Definition'
      ]

      return requiredProps.every(prop => prop in properties)

    } catch (error) {
      return false
    }
  }

  /**
   * Create a new database with Word Wizard schema
   */
  async createDatabase(pageId: string, config: Partial<NotionConfig> & { apiKey: string }): Promise<string> {
    try {
      const response = await this.post('/databases', {
        parent: {
          type: 'page_id',
          page_id: pageId
        },
        title: [
          {
            type: 'text',
            text: {
              content: 'Word Wizard Vocabulary'
            }
          }
        ],
        properties: {
          [config.titleProperty || 'Word']: {
            title: {}
          },
          [config.definitionProperty || 'Definition']: {
            rich_text: {}
          },
          [config.examplesProperty || 'Examples']: {
            rich_text: {}
          },
          [config.topicProperty || 'Topic']: {
            select: {
              options: [
                { name: 'Academic', color: 'blue' },
                { name: 'Business', color: 'green' },
                { name: 'Daily', color: 'yellow' },
                { name: 'Technical', color: 'red' }
              ]
            }
          },
          [config.statusProperty || 'Status']: {
            select: {
              options: [
                { name: 'New', color: 'gray' },
                { name: 'Learning', color: 'orange' },
                { name: 'Review', color: 'blue' },
                { name: 'Mastered', color: 'green' }
              ]
            }
          },
          'CEFR Level': {
            select: {
              options: [
                { name: 'A1', color: 'gray' },
                { name: 'A2', color: 'brown' },
                { name: 'B1', color: 'orange' },
                { name: 'B2', color: 'yellow' },
                { name: 'C1', color: 'green' },
                { name: 'C2', color: 'blue' }
              ]
            }
          },
          'Synonyms': {
            multi_select: {
              options: []
            }
          },
          'Date Added': {
            date: {}
          },
          'Source': {
            select: {
              options: [
                { name: 'Word Wizard', color: 'purple' },
                { name: 'Manual', color: 'gray' }
              ]
            }
          }
        }
      }, {
        headers: this.getNotionHeaders(config.apiKey)
      })

      return response.id

    } catch (error) {
      throw new Error(`Failed to create Notion database: ${error.message}`)
    }
  }

  /**
   * Get database schema information
   */
  async getDatabaseSchema(databaseId: string, apiKey: string): Promise<Record<string, any>> {
    try {
      const response = await this.get('/databases/' + databaseId, {
        headers: this.getNotionHeaders(apiKey)
      })

      return response.properties || {}

    } catch (error) {
      throw new Error(`Failed to get database schema: ${error.message}`)
    }
  }

  // Private helper methods

  private async createNewPage(wordData: WordData, config: NotionConfig): Promise<{ pageId: string, pageUrl: string }> {
    const properties: NotionPageProperties = {}

    // Required fields
    properties[config.titleProperty || 'Word'] = {
      title: [
        {
          type: 'text',
          text: {
            content: wordData.term
          }
        }
      ]
    }

    properties[config.definitionProperty || 'Definition'] = {
      rich_text: [
        {
          type: 'text',
          text: {
            content: wordData.definition
          }
        }
      ]
    }

    // Optional fields
    if (wordData.examples && wordData.examples.length > 0) {
      properties[config.examplesProperty || 'Examples'] = {
        rich_text: [
          {
            type: 'text',
            text: {
              content: wordData.examples.join('\n• ')
            }
          }
        ]
      }
    }

    if (wordData.primaryTopic) {
      properties[config.topicProperty || 'Topic'] = {
        select: {
          name: wordData.primaryTopic
        }
      }
    }

    if (wordData.cefrLevel) {
      properties['CEFR Level'] = {
        select: {
          name: wordData.cefrLevel
        }
      }
    }

    if (wordData.synonyms && wordData.synonyms.length > 0) {
      properties['Synonyms'] = {
        multi_select: wordData.synonyms.slice(0, 5).map(synonym => ({ name: synonym }))
      }
    }

    // System fields
    properties['Date Added'] = {
      date: {
        start: new Date().toISOString().split('T')[0]
      }
    }

    properties['Source'] = {
      select: {
        name: 'Word Wizard'
      }
    }

    properties[config.statusProperty || 'Status'] = {
      select: {
        name: 'New'
      }
    }

    // Add custom fields if configured
    if (config.customFields) {
      Object.entries(config.customFields).forEach(([customField, sourceField]) => {
        if (wordData[sourceField as keyof WordData]) {
          properties[customField] = {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: String(wordData[sourceField as keyof WordData])
                }
              }
            ]
          }
        }
      })
    }

    const response = await this.post('/pages', {
      parent: {
        database_id: config.databaseId
      },
      properties
    }, {
      headers: this.getNotionHeaders(config.apiKey)
    })

    return {
      pageId: response.id,
      pageUrl: response.url
    }
  }

  private async updateExistingPage(pageId: string, wordData: WordData, config: NotionConfig): Promise<string> {
    const properties: NotionPageProperties = {}

    // Update definition if it's more comprehensive
    if (wordData.definition && wordData.definition.length > 50) {
      properties[config.definitionProperty || 'Definition'] = {
        rich_text: [
          {
            type: 'text',
            text: {
              content: wordData.definition
            }
          }
        ]
      }
    }

    // Add new examples if available
    if (wordData.examples && wordData.examples.length > 0) {
      properties[config.examplesProperty || 'Examples'] = {
        rich_text: [
          {
            type: 'text',
            text: {
              content: wordData.examples.join('\n• ')
            }
          }
        ]
      }
    }

    // Update classification if available
    if (wordData.primaryTopic) {
      properties[config.topicProperty || 'Topic'] = {
        select: {
          name: wordData.primaryTopic
        }
      }
    }

    const response = await this.patch('/pages/' + pageId, {
      properties
    }, {
      headers: this.getNotionHeaders(config.apiKey)
    })

    return response.url
  }

  private getNotionHeaders(apiKey: string): Record<string, string> {
    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': this.NOTION_API_VERSION
    }
  }

  private mapLearningStatusToNotion(status: string): string {
    const statusMap: Record<string, string> = {
      'new': 'New',
      'learning': 'Learning',
      'review': 'Review',
      'mastered': 'Mastered'
    }
    return statusMap[status] || 'New'
  }

  private handleNotionError(error: any): string {
    if (error.status === 401) {
      return 'Invalid Notion API key. Please check your integration settings.'
    }
    
    if (error.status === 404) {
      return 'Notion database not found. Please check your database ID.'
    }
    
    if (error.status === 403) {
      return 'Insufficient permissions. Please ensure the integration has access to the database.'
    }
    
    if (error.message?.includes('validation')) {
      return 'Invalid data format. Please check your Notion database properties.'
    }

    return `Notion integration failed: ${error.message || 'Unknown error'}`
  }

  // Helper to ensure WordData has all required properties
  private ensureCompleteWordData(partialData: any): WordData {
    return {
      term: partialData.term || '',
      ipa: partialData.ipa || '',
      definition: partialData.definition || '',
      examples: partialData.examples || [],
      wordFamily: partialData.wordFamily || [],
      synonyms: partialData.synonyms || [],
      antonyms: partialData.antonyms || [],
      timestamp: partialData.timestamp || Date.now(),
      source: partialData.source || 'word-wizard-ai',
      primaryTopic: partialData.primaryTopic,
      cefrLevel: partialData.cefrLevel as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | undefined,
      domain: partialData.domain,
      complexityLevel: partialData.complexityLevel,
      frequencyScore: partialData.frequencyScore
    } as WordData
  }
}
