// Content Script - Handles page interaction and text selection
// Injected into web pages to provide text selection and highlighting functionality

import { MESSAGE_TYPES } from './lib/utils/constants'
import type { TextSelection, HighlightData, ExtensionMessage } from './lib/types'
import { initWordWizardStyles, ContentStyleManager } from './lib/utils/content-styles'

class ContentScript {
  private selectedText: string = ''
  private selectionRange: Range | null = null
  private contextMenuItems: Set<string> = new Set()
  private highlights: Map<string, HTMLElement> = new Map()
  private lastShiftTime: number = 0 // For double-shift detection
  private styleManager: ContentStyleManager

  constructor() {
    // Initialize modern styling system
    this.styleManager = initWordWizardStyles({
      theme: 'auto',
      primaryColor: '#6366f1',
      accentColor: '#a855f7'
    })
    
    this.init()
  }

  private init() {
    this.setupMessageListener()
    this.setupSelectionListener()
    this.setupContextMenu()
    this.setupKeyboardShortcuts()
    // Modern styling system is already initialized in constructor
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
      switch (message.type) {
        // Original handlers
        case MESSAGE_TYPES.GET_SELECTED_TEXT:
          this.handleGetSelectedText(sendResponse)
          return true // Keep message channel open for async response

        case MESSAGE_TYPES.HIGHLIGHT_TEXT:
          this.handleHighlightText(message.data, sendResponse)
          return true

        case 'CLEAR_HIGHLIGHTS':
          this.clearAllHighlights()
          sendResponse({ success: true })
          return true

        case 'GET_PAGE_INFO':
          this.handleGetPageInfo(sendResponse)
          return true

        // Word Wizard specific handlers
        case 'WORD_WIZARD_GET_SELECTION':
          this.handleWordWizardGetSelection(sendResponse)
          return true

        case 'WORD_WIZARD_HIGHLIGHT_WORD':
          this.handleWordWizardHighlight(message.data, sendResponse)
          return true

        case 'WORD_WIZARD_SHOW_TOOLTIP':
          this.handleWordWizardTooltip(message.data, sendResponse)
          return true

        case 'WORD_WIZARD_INJECT_STYLES':
          // Styles are already injected via modern system
          sendResponse({ success: true })
          return true

        default:
          return false
      }
    })
  }

  private setupSelectionListener() {
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const text = selection.toString().trim()
        if (text && text.length > 0) {
          this.selectedText = text
          this.selectionRange = selection.getRangeAt(0).cloneRange()
          
          // Notify background script of selection
          this.notifySelectionChange(text)
        } else {
          this.selectedText = ''
          this.selectionRange = null
        }
      }
    })

    // Handle mouse up for selection completion
    document.addEventListener('mouseup', (event) => {
      setTimeout(() => {
        if (this.selectedText) {
          this.showSelectionTooltip(event.clientX, event.clientY)
        }
      }, 100)
    })
  }

  private setupContextMenu() {
    document.addEventListener('contextmenu', (event) => {
      const selection = window.getSelection()
      const selectedText = selection?.toString().trim()
      
      if (selectedText) {
        // Store selection data for context menu actions
        chrome.runtime.sendMessage({
          type: 'CONTEXT_MENU_DATA',
          data: {
            selectedText,
            pageUrl: window.location.href,
            pageTitle: document.title,
            selectionRect: this.getSelectionRect()
          }
        })
      }
    })
  }

  private setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Original shortcuts (legacy support)
      
      // Ctrl+Shift+E (or Cmd+Shift+E on Mac) - Process selected text
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'E') {
        event.preventDefault()
        if (this.selectedText) {
          this.processSelectedText()
        }
      }

      // Ctrl+Shift+H (or Cmd+Shift+H on Mac) - Highlight selected text
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'H') {
        event.preventDefault()
        if (this.selectedText) {
          this.highlightSelectedText()
        }
      }

      // Word Wizard shortcuts
      
      // Ctrl+Shift+W (or Cmd+Shift+W on Mac) - Word Wizard lookup
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'W') {
        event.preventDefault()
        if (this.selectedText) {
          this.handleWordWizardLookup()
        } else {
          // No selection, open popup
          chrome.runtime.sendMessage({
            type: 'WORD_WIZARD_OPEN_POPUP'
          })
        }
      }

      // Ctrl+Shift+S (or Cmd+Shift+S on Mac) - Open IELTS sidepanel
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
        event.preventDefault()
        chrome.runtime.sendMessage({
          type: 'OPEN_SIDE_PANEL',
          data: { selectedText: this.selectedText }
        })
      }

      // Ctrl+Shift+Q (or Cmd+Shift+Q on Mac) - Quick Word Wizard highlight
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Q') {
        event.preventDefault()
        if (this.selectedText) {
          this.createWordWizardHighlight({
            text: this.selectedText,
            difficulty: 'medium'
          })
          
          this.showWordWizardQuickTooltip(this.selectedText, 
            window.innerWidth / 2, 
            window.innerHeight / 2
          )
        }
      }

      // Double Shift - Quick Word Wizard analysis (advanced feature)
      if (event.key === 'Shift') {
        if (!this.lastShiftTime) {
          this.lastShiftTime = Date.now()
        } else if (Date.now() - this.lastShiftTime < 300) {
          // Double shift detected
          event.preventDefault()
          if (this.selectedText) {
            this.handleWordWizardLookup()
          }
          this.lastShiftTime = 0
        }
        
        // Reset after 300ms
        setTimeout(() => {
          this.lastShiftTime = 0
        }, 300)
      }

      // Escape - Clear Word Wizard highlights and tooltips
      if (event.key === 'Escape') {
        this.clearAllHighlights()
        this.clearWordWizardTooltips()
      }
    })
  }

  // Helper methods for Word Wizard
  private handleWordWizardLookup() {
    if (!this.selectedText) return

    chrome.runtime.sendMessage({
      type: 'WORD_WIZARD_LOOKUP',
      data: {
        term: this.selectedText,
        context: this.getEnhancedContext(this.selectedText),
        options: {
          includeImage: false,
          includeExamples: true,
          includeWordFamily: true,
          saveToNotion: false,
          saveToAnki: false,
          complexityLevel: 'intermediate'
        }
      }
    })
  }

  private clearWordWizardTooltips() {
    const tooltips = document.querySelectorAll('.word-wizard-tooltip, .word-wizard-quick-tooltip')
    tooltips.forEach(tooltip => {
      tooltip.classList.remove('show')
      setTimeout(() => tooltip.remove(), 200)
    })
  }

  private getEnhancedContext(selectedText: string): string {
    if (!this.selectionRange) return selectedText

    try {
      // Get the parent element containing the selection
      const container = this.selectionRange.commonAncestorContainer
      const parentElement = container.nodeType === Node.TEXT_NODE 
        ? container.parentElement 
        : container as Element

      if (parentElement) {
        // Get surrounding text context (up to 200 characters before and after)
        const fullText = parentElement.textContent || ''
        const selectedIndex = fullText.indexOf(selectedText)
        
        if (selectedIndex !== -1) {
          const start = Math.max(0, selectedIndex - 100)
          const end = Math.min(fullText.length, selectedIndex + selectedText.length + 100)
          return fullText.substring(start, end).trim()
        }
      }
    } catch (error) {
      console.warn('Error getting enhanced context:', error)
    }

    return selectedText
  }

  // Modern styling system is handled by ContentStyleManager
  // All styles are automatically injected and managed

  // Message handlers
  private handleGetSelectedText(sendResponse: (response: any) => void) {
    sendResponse({
      success: true,
      data: {
        text: this.selectedText,
        hasSelection: this.selectedText.length > 0,
        selectionRect: this.getSelectionRect()
      }
    })
  }

  private handleHighlightText(data: HighlightData, sendResponse: (response: any) => void) {
    try {
      if (!this.selectionRange) {
        sendResponse({ success: false, error: 'No selection range available' })
        return
      }

      // Create highlight element
      const span = document.createElement('span')
      span.className = 'extension-highlight'
      span.style.backgroundColor = data.color || '#fef08a'
      
      if (data.note) {
        span.title = data.note
      }

      // Wrap the selection
      try {
        this.selectionRange.surroundContents(span)
        
        // Store the highlight
        const highlightId = `highlight-${Date.now()}`
        span.setAttribute('data-highlight-id', highlightId)
        this.highlights.set(highlightId, span)

        sendResponse({ 
          success: true, 
          data: { highlightId, text: data.text } 
        })
      } catch (error) {
        // Fallback for complex selections
        const contents = this.selectionRange.extractContents()
        span.appendChild(contents)
        this.selectionRange.insertNode(span)
        
        const highlightId = `highlight-${Date.now()}`
        span.setAttribute('data-highlight-id', highlightId)
        this.highlights.set(highlightId, span)

        sendResponse({ 
          success: true, 
          data: { highlightId, text: data.text } 
        })
      }
    } catch (error) {
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create highlight' 
      })
    }
  }

  private clearAllHighlights() {
    // Remove extension highlights
    document.querySelectorAll('.extension-highlight').forEach(element => {
      const parent = element.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(element.textContent || ''), element)
        parent.normalize()
      }
    })

    // Remove Word Wizard highlights
    document.querySelectorAll('.word-wizard-highlight').forEach(element => {
      const parent = element.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(element.textContent || ''), element)
        parent.normalize()
      }
    })

    // Clear stored highlights
    this.highlights.clear()

    // Remove tooltips
    document.querySelectorAll('.extension-tooltip, .word-wizard-tooltip, .word-wizard-quick-tooltip').forEach(tooltip => {
      tooltip.remove()
    })
  }

  private handleGetPageInfo(sendResponse: (response: any) => void) {
    const pageInfo = {
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
      selectedText: this.selectedText,
      hasSelection: this.selectedText.length > 0,
      wordCount: document.body.textContent?.split(/\s+/).length || 0,
      language: document.documentElement.lang || 'unknown'
    }

    sendResponse({
      success: true,
      data: pageInfo
    })
  }

  // Word Wizard specific handlers
  private handleWordWizardGetSelection(sendResponse: (response: any) => void) {
    sendResponse({
      success: true,
      data: {
        selectedText: this.selectedText,
        context: this.getEnhancedContext(this.selectedText),
        selectionRect: this.getSelectionRect(),
        pageInfo: {
          url: window.location.href,
          title: document.title,
          domain: window.location.hostname
        }
      }
    })
  }

  private handleWordWizardHighlight(data: any, sendResponse: (response: any) => void) {
    try {
      this.createWordWizardHighlight(data)
      sendResponse({ success: true, data: { highlighted: true } })
    } catch (error) {
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create Word Wizard highlight' 
      })
    }
  }

  private handleWordWizardTooltip(data: any, sendResponse: (response: any) => void) {
    try {
      this.showWordWizardTooltip(data.wordData, data.x || 0, data.y || 0)
      sendResponse({ success: true, data: { shown: true } })
    } catch (error) {
      sendResponse({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to show Word Wizard tooltip' 
      })
    }
  }

  // Utility methods
  private notifySelectionChange(text: string) {
    chrome.runtime.sendMessage({
      type: 'SELECTION_CHANGED',
      data: {
        selectedText: text,
        context: this.getEnhancedContext(text),
        timestamp: Date.now()
      }
    }).catch(() => {
      // Ignore errors - background script might not be ready
    })
  }

  private showSelectionTooltip(x: number, y: number) {
    // Remove existing tooltips
    document.querySelectorAll('.extension-tooltip').forEach(tooltip => tooltip.remove())

    if (!this.selectedText || this.selectedText.length < 2) return

    const tooltip = document.createElement('div')
    tooltip.className = 'extension-tooltip'
    tooltip.textContent = `🧙‍♂️ Press Ctrl+Shift+W to lookup "${this.selectedText}"`
    
    // Position tooltip
    tooltip.style.left = Math.min(x, window.innerWidth - 220) + 'px'
    tooltip.style.top = (y + 10) + 'px'
    
    document.body.appendChild(tooltip)
    
    // Show tooltip with animation
    setTimeout(() => tooltip.classList.add('show'), 10)
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      tooltip.classList.remove('show')
      setTimeout(() => tooltip.remove(), 200)
    }, 3000)
  }

  private getSelectionRect() {
    if (!this.selectionRange) return { x: 0, y: 0, width: 0, height: 0 }

    try {
      const rect = this.selectionRange.getBoundingClientRect()
      return {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height
      }
    } catch (error) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }
  }

  private processSelectedText() {
    if (!this.selectedText) return

    chrome.runtime.sendMessage({
      type: 'PROCESS_FEATURE',
      data: {
        input: this.selectedText,
        options: {
          priority: 'normal',
          timeout: 10000
        }
      }
    })
  }

  private highlightSelectedText() {
    if (!this.selectedText || !this.selectionRange) return

    this.handleHighlightText({
      text: this.selectedText,
      color: '#fef08a',
      timestamp: Date.now()
    }, () => {})
  }

  private createWordWizardHighlight(data: { text: string; difficulty?: string }) {
    if (!this.selectionRange) return

    try {
      const span = document.createElement('span')
      span.className = `word-wizard-highlight ${data.difficulty ? `difficulty-${data.difficulty}` : ''}`
      span.setAttribute('data-word-wizard', 'true')
      span.setAttribute('data-difficulty', data.difficulty || 'medium')
      span.title = `🧙‍♂️ Word Wizard: ${data.text} (${data.difficulty || 'medium'} difficulty)`

      // Add click handler for Word Wizard popup
      span.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        
        chrome.runtime.sendMessage({
          type: 'WORD_WIZARD_LOOKUP',
          data: {
            term: data.text,
            context: this.getEnhancedContext(data.text)
          }
        })
      })

      // Wrap the selection
      this.selectionRange.surroundContents(span)
    } catch (error) {
      console.warn('Failed to create Word Wizard highlight:', error)
    }
  }

  private showWordWizardQuickTooltip(text: string, x: number, y: number) {
    // Remove existing quick tooltips
    document.querySelectorAll('.word-wizard-quick-tooltip').forEach(tooltip => tooltip.remove())

    const tooltip = document.createElement('div')
    tooltip.className = 'word-wizard-quick-tooltip'
    tooltip.textContent = `✨ Added "${text}" to Word Wizard`
    
    // Position tooltip
    tooltip.style.left = Math.min(x - 50, window.innerWidth - 150) + 'px'
    tooltip.style.top = (y - 30) + 'px'
    
    document.body.appendChild(tooltip)
    
    // Show tooltip with animation
    setTimeout(() => tooltip.classList.add('show'), 10)
    
    // Auto-hide after 2 seconds
    setTimeout(() => {
      tooltip.classList.remove('show')
      setTimeout(() => tooltip.remove(), 200)
    }, 2000)
  }

  private showWordWizardTooltip(wordData: any, x: number, y: number) {
    // Remove existing Word Wizard tooltips
    document.querySelectorAll('.word-wizard-tooltip').forEach(tooltip => tooltip.remove())

    const tooltip = document.createElement('div')
    tooltip.className = 'word-wizard-tooltip'
    
    const content = `
      <div style="font-weight: bold; margin-bottom: 4px;">🧙‍♂️ ${wordData.term}</div>
      <div style="font-size: 11px; opacity: 0.9; margin-bottom: 6px;">/${wordData.ipa || 'pronunciation'}/</div>
      <div style="margin-bottom: 6px;">${wordData.definition || 'Loading definition...'}</div>
      ${wordData.examples && wordData.examples.length > 0 ? 
        `<div style="font-size: 11px; opacity: 0.8; font-style: italic;">"${wordData.examples[0]}"</div>` : 
        ''
      }
    `
    
    tooltip.innerHTML = content
    
    // Position tooltip
    tooltip.style.left = Math.min(x, window.innerWidth - 300) + 'px'
    tooltip.style.top = (y + 15) + 'px'
    
    document.body.appendChild(tooltip)
    
    // Show tooltip with animation
    setTimeout(() => tooltip.classList.add('show'), 10)
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      tooltip.classList.remove('show')
      setTimeout(() => tooltip.remove(), 300)
    }, 5000)
  }
}

// Initialize content script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ContentScript()
  })
} else {
  new ContentScript()
}

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentScript
}