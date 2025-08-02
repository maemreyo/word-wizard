// Word Wizard Business Orchestrator - Simplified Business Logic
// Centralizes complex Word Wizard workflows into clean, manageable services

import { z } from 'zod'
import { AIService, ImprovedBaseService, NotionService, AnkiService } from '.'
import type { 
  WordData, 
  LookupRequest,
  LookupOptions,
  AnalysisResult,
  BatchRequest,
  BatchResult,
  NotionConfig,
  AnkiConfig,
  WordWizardError
} from '../types'

// Schemas for business logic validation
const lookupRequestSchema = z.object({
  term: z.string().min(1).max(500),
  context: z.string().optional(),
  userId: z.string().uuid().optional(),
  options: z.object({
    includeImage: z.boolean().default(false),
    includeExamples: z.boolean().default(true),
    includeWordFamily: z.boolean().default(true),
    complexityLevel: z.enum(['simple', 'intermediate', 'advanced']).default('intermediate'),
    saveToNotion: z.boolean().default(false),
    saveToAnki: z.boolean().default(false),
    generateSynonyms: z.boolean().default(false)
  }).optional()
})

export type WordWizardLookupRequest = z.infer<typeof lookupRequestSchema>

// Main Word Wizard Orchestrator
export class WordWizardOrchestrator extends ImprovedBaseService {
  private aiService: AIService
  private proxyApiUrl: string
  private userId?: string

  constructor(config: {
    proxyApiUrl: string
    userId?: string
    aiConfig?: any
  }) {
    super()
    this.proxyApiUrl = config.proxyApiUrl
    this.userId = config.userId
    
    // Initialize AI service with proxy or direct provider
    this.aiService = new AIService(config.aiConfig || {
      provider: 'custom',
      apiKey: 'proxy-will-handle',
      model: 'gpt-4',
      baseUrl: `${this.proxyApiUrl}/ai`
    })
  }

  /**
   * CORE BUSINESS FLOW: Word Lookup with AI Analysis
   * Simplifies: Text → AI Analysis → Structured Data → Optional Saves
   */
  async lookupWord(request: WordWizardLookupRequest): Promise<WordData> {
    // 1. Validate request
    const validated = lookupRequestSchema.parse(request)
    
    try {
      // 2. Check quota (monetization layer)
      await this.checkUserQuota(validated.term)
      
      // 3. Try cache first (performance optimization)
      const cached = await this.getCachedLookup(validated.term)
      if (cached && !this.isCacheExpired(cached)) {
        return cached.data
      }

      // 4. Generate AI prompt based on complexity
      const prompt = this.buildAnalysisPrompt(validated)
      
      // 5. Call AI service (via proxy for monetization)
      const aiResponse = await this.callWordAnalysisAPI(prompt)
      
      // 6. Parse and structure the response
      const wordData = this.parseWordAnalysis(aiResponse, validated.term)
      
      // 7. Generate image if requested (premium feature)
      if (validated.options?.includeImage) {
        wordData.imageUrl = await this.generateWordImage(validated.term)
      }
      
      // 8. Save to external services if requested
      await this.handleExternalSaves(wordData, validated.options)
      
      // 9. Cache the result
      await this.cacheResult(validated.term, wordData)
      
      // 10. Track usage for billing
      await this.trackUsage(validated.term, wordData)
      
      return wordData
      
    } catch (error) {
      throw this.handleBusinessError(error, validated.term)
    }
  }

  /**
   * SIMPLIFIED BATCH PROCESSING: IELTS Synonym Generation
   * Replaces complex batch logic with clean orchestration
   */
  async generateIELTSSynonyms(words: string[]): Promise<Array<{word: string, synonyms: WordData}>> {
    if (words.length > 25) {
      throw new Error('Maximum 25 words allowed for batch processing')
    }

    // Check batch quota
    await this.checkBatchQuota(words.length)
    
    const results: Array<{word: string, synonyms: WordData}> = []
    
    // Process in optimal batches of 5
    for (let i = 0; i < words.length; i += 5) {
      const batch = words.slice(i, i + 5)
      
      const batchPromises = batch.map(async (word) => {
        const synonymData = await this.generateSynonymsForWord(word)
        return { word, synonyms: synonymData }
      })
      
      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          results.push({
            word: batch[index],
            synonyms: this.createErrorWordData(batch[index], result.reason.message)
          })
        }
      })
      
      // Rate limiting between batches
      if (i + 5 < words.length) {
        await this.delay(1000)
      }
    }
    
    return results
  }

  /**
   * UNIFIED SAVE ORCHESTRATION
   * Simplifies: Save to Notion + Anki + Analytics in one call
   */
  private async handleExternalSaves(
    wordData: WordData, 
    options?: WordWizardLookupRequest['options']
  ): Promise<void> {
    const savePromises: Promise<any>[] = []
    
    if (options?.saveToNotion) {
      savePromises.push(this.saveToNotion(wordData))
    }
    
    if (options?.saveToAnki) {
      savePromises.push(this.saveToAnki(wordData))
    }
    
    // Always save to analytics for dashboard
    savePromises.push(this.saveToAnalytics(wordData))
    
    // Execute all saves in parallel, handle errors gracefully
    const results = await Promise.allSettled(savePromises)
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn(`External save failed (${index}):`, result.reason)
        // Don't throw - external saves are non-critical
      }
    })
  }

  // MONETIZATION LAYER: Quota and Usage Tracking
  private async checkUserQuota(term: string): Promise<void> {
    if (!this.userId) return // Guest usage allowed
    
    const response = await this.post<{canProceed: boolean, quota: any}>('/quota/check', {
      userId: this.userId,
      operation: 'lookup',
      data: { term }
    })
    
    if (!response.canProceed) {
      throw new Error('Quota exceeded. Please upgrade your plan.')
    }
  }

  private async checkBatchQuota(batchSize: number): Promise<void> {
    if (!this.userId) throw new Error('Batch processing requires account')
    
    const response = await this.post<{canProceed: boolean}>('/quota/check-batch', {
      userId: this.userId,
      batchSize
    })
    
    if (!response.canProceed) {
      throw new Error('Batch quota exceeded. Please upgrade to Premium.')
    }
  }

  // AI INTEGRATION: Proxy API calls
  private async callWordAnalysisAPI(prompt: string): Promise<string> {
    const response = await this.post<{analysis: string}>('/ai/word-analysis', {
      prompt,
      userId: this.userId,
      model: 'word-wizard-optimized'
    })
    
    return response.analysis
  }

  // PROMPT ENGINEERING: Optimized for Word Wizard
  private buildAnalysisPrompt(request: WordWizardLookupRequest): string {
    const complexity = request.options?.complexityLevel || 'intermediate'
    const includeExamples = request.options?.includeExamples !== false
    const includeWordFamily = request.options?.includeWordFamily !== false
    
    return `
Analyze the word "${request.term}" ${request.context ? `in context: "${request.context}"` : ''}.

Complexity Level: ${complexity}
Include Examples: ${includeExamples}
Include Word Family: ${includeWordFamily}

Provide structured analysis in JSON format:
{
  "term": "${request.term}",
  "ipa": "pronunciation",
  "definition": "clear definition for ${complexity} level",
  "examples": ["context example 1", "context example 2"],
  "wordFamily": [{"word": "related", "type": "noun", "definition": "..."}],
  "synonyms": ["synonym1", "synonym2"],
  "antonyms": ["antonym1"],
  "primaryTopic": "main category",
  "domain": "academic/business/daily",
  "cefrLevel": "A1-C2",
  "frequencyScore": 0-100
}
`
  }

  // DATA PARSING: Convert AI response to structured data
  private parseWordAnalysis(aiResponse: string, term: string): WordData {
    try {
      const parsed = JSON.parse(aiResponse)
      
      // Validate and clean the response
      return {
        term: parsed.term || term,
        ipa: parsed.ipa || '',
        definition: parsed.definition || '',
        examples: Array.isArray(parsed.examples) ? parsed.examples : [],
        wordFamily: Array.isArray(parsed.wordFamily) ? parsed.wordFamily : [],
        synonyms: Array.isArray(parsed.synonyms) ? parsed.synonyms : [],
        antonyms: Array.isArray(parsed.antonyms) ? parsed.antonyms : [],
        primaryTopic: parsed.primaryTopic,
        domain: parsed.domain,
        cefrLevel: parsed.cefrLevel,
        frequencyScore: typeof parsed.frequencyScore === 'number' ? parsed.frequencyScore : 0,
        timestamp: Date.now(),
        source: 'word-wizard-ai'
      }
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error.message}`)
    }
  }

  // EXTERNAL INTEGRATIONS
  private async saveToNotion(wordData: WordData): Promise<void> {
    await this.post('/integrations/notion/save', {
      userId: this.userId,
      wordData
    })
  }

  private async saveToAnki(wordData: WordData): Promise<void> {
    await this.post('/integrations/anki/save', {
      userId: this.userId,
      wordData
    })
  }

  private async saveToAnalytics(wordData: WordData): Promise<void> {
    await this.post('/analytics/track', {
      userId: this.userId,
      event: 'word_lookup',
      data: {
        term: wordData.term,
        domain: wordData.domain,
        cefrLevel: wordData.cefrLevel,
        timestamp: wordData.timestamp
      }
    })
  }

  // IMAGE GENERATION (Premium Feature)
  private async generateWordImage(term: string): Promise<string> {
    const response = await this.post<{imageUrl: string}>('/ai/generate-image', {
      term,
      userId: this.userId,
      style: 'educational'
    })
    
    return response.imageUrl
  }

  // CACHING LAYER
  private async getCachedLookup(term: string): Promise<{data: WordData, timestamp: number} | null> {
    try {
      return await this.get(`/cache/lookup/${encodeURIComponent(term)}`)
    } catch {
      return null
    }
  }

  private async cacheResult(term: string, data: WordData): Promise<void> {
    try {
      await this.post('/cache/lookup', {
        term,
        data,
        ttl: 24 * 60 * 60 * 1000 // 24 hours
      })
    } catch (error) {
      console.warn('Failed to cache result:', error)
    }
  }

  private isCacheExpired(cached: {timestamp: number}): boolean {
    const TTL = 24 * 60 * 60 * 1000 // 24 hours
    return Date.now() - cached.timestamp > TTL
  }

  // USAGE TRACKING
  private async trackUsage(term: string, wordData: WordData): Promise<void> {
    try {
      await this.post('/usage/track', {
        userId: this.userId,
        operation: 'lookup',
        term,
        tokensUsed: this.estimateTokens(wordData),
        timestamp: Date.now()
      })
    } catch (error) {
      console.warn('Failed to track usage:', error)
    }
  }

  // ERROR HANDLING
  private handleBusinessError(error: any, term: string): Error {
    if (error.message?.includes('quota')) {
      return new Error(`Quota exceeded for "${term}". Please upgrade your plan.`)
    }
    
    if (error.status === 429) {
      return new Error('Rate limit exceeded. Please try again in a moment.')
    }
    
    if (error.status === 401) {
      return new Error('Authentication failed. Please check your API key.')
    }
    
    return new Error(`Word lookup failed: ${error.message || 'Unknown error'}`)
  }

  // HELPER METHODS
  private async generateSynonymsForWord(word: string): Promise<WordData> {
    const prompt = `Generate comprehensive synonyms for "${word}" with IELTS context`
    const response = await this.callWordAnalysisAPI(prompt)
    return this.parseWordAnalysis(response, word)
  }

  private createErrorWordData(term: string, errorMessage: string): WordData {
    return {
      term,
      ipa: '',
      definition: `Error: ${errorMessage}`,
      examples: [],
      wordFamily: [],
      synonyms: [],
      antonyms: [],
      timestamp: Date.now(),
      source: 'error'
    }
  }

  private estimateTokens(wordData: WordData): number {
    const text = JSON.stringify(wordData)
    return Math.ceil(text.length / 4) // Rough token estimation
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// FACTORY FOR EASY INITIALIZATION
export class WordWizardFactory {
  static create(config: {
    proxyApiUrl?: string
    userId?: string
    environment?: 'development' | 'production'
  }): WordWizardOrchestrator {
    const defaultProxyUrl = config.environment === 'production'
      ? 'https://api.wordwizard.com'
      : 'http://localhost:3001'

    return new WordWizardOrchestrator({
      proxyApiUrl: config.proxyApiUrl || defaultProxyUrl,
      userId: config.userId
    })
  }
}