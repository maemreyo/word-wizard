// Content Script - Handles page interaction and text selection
// Injected into web pages to provide text selection and highlighting functionality

import { MESSAGE_TYPES } from './lib/utils/constants'
import type { TextSelection, HighlightData, ExtensionMessage } from './lib/types'

class ContentScript {
  private selectedText: string = ''
  private selectionRange: Range | null = null
  private contextMenuItems: Set<string> = new Set()
  private highlights: Map<string, HTMLElement> = new Map()
  private lastShiftTime: number = 0 // For double-shift detection

  constructor() {
    this.init()
  }

  private init() {
    this.setupMessageListener()
    this.setupSelectionListener()
    this.setupContextMenu()
    this.setupKeyboardShortcuts()
    this.injectStyles()
    this.injectWordWizardStyles()
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
          this.injectWordWizardStyles()
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

  // All the other methods will be added next...
  
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
    return selectedText // Simplified for now
  }

  // Stub methods - will implement fully later
  private injectStyles() { }
  private injectWordWizardStyles() { }
  private handleGetSelectedText(sendResponse: any) { }
  private handleHighlightText(data: any, sendResponse: any) { }
  private clearAllHighlights() { }
  private handleGetPageInfo(sendResponse: any) { }
  private handleWordWizardGetSelection(sendResponse: any) { }
  private handleWordWizardHighlight(data: any, sendResponse: any) { }
  private handleWordWizardTooltip(data: any, sendResponse: any) { }
  private notifySelectionChange(text: string) { }
  private showSelectionTooltip(x: number, y: number) { }
  private getSelectionRect() { return { x: 0, y: 0 } }
  private processSelectedText() { }
  private highlightSelectedText() { }
  private createWordWizardHighlight(data: any) { }
  private showWordWizardQuickTooltip(text: string, x: number, y: number) { }
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