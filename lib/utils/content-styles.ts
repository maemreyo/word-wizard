// Content Script Styles - Modern CSS-in-JS approach for Word Wizard
// Clean, maintainable styling system for content script injections

export interface StyleConfig {
  theme?: 'light' | 'dark' | 'auto'
  primaryColor?: string
  accentColor?: string
  zIndex?: number
}

export class ContentStyleManager {
  private static instance: ContentStyleManager
  private styleElements: Map<string, HTMLStyleElement> = new Map()
  private config: StyleConfig

  private constructor(config: StyleConfig = {}) {
    this.config = {
      theme: 'auto',
      primaryColor: '#6366f1',
      accentColor: '#a855f7',
      zIndex: 10000,
      ...config
    }
  }

  static getInstance(config?: StyleConfig): ContentStyleManager {
    if (!ContentStyleManager.instance) {
      ContentStyleManager.instance = new ContentStyleManager(config)
    }
    return ContentStyleManager.instance
  }

  // CSS custom properties system
  private getCSSVariables() {
    const isDark = this.isDarkMode()
    
    return {
      // Core colors
      '--ww-primary': this.config.primaryColor!,
      '--ww-secondary': this.config.accentColor!,
      '--ww-accent': '#3b82f6',
      
      // Theme-aware colors
      '--ww-text': isDark ? '#f8fafc' : '#1e293b',
      '--ww-bg': isDark ? '#1e293b' : '#ffffff',
      '--ww-surface': isDark ? '#334155' : '#f8fafc',
      '--ww-border': isDark ? '#475569' : '#e2e8f0',
      
      // Semantic colors
      '--ww-success': '#10b981',
      '--ww-warning': '#f59e0b', 
      '--ww-error': '#ef4444',
      '--ww-info': '#3b82f6',
      
      // Highlight colors
      '--ww-highlight-easy': 'linear-gradient(120deg, #10b981 0%, #059669 100%)',
      '--ww-highlight-medium': 'linear-gradient(120deg, #f59e0b 0%, #d97706 100%)',
      '--ww-highlight-hard': 'linear-gradient(120deg, #ef4444 0%, #dc2626 100%)',
      '--ww-highlight-primary': `linear-gradient(120deg, ${this.config.accentColor} 0%, ${this.config.primaryColor} 100%)`,
      
      // Effects
      '--ww-shadow': '0 1px 3px rgba(0, 0, 0, 0.1)',
      '--ww-shadow-lg': '0 10px 25px rgba(0, 0, 0, 0.15)',
      '--ww-blur': 'blur(10px)',
      
      // Animation
      '--ww-transition': 'all 0.2s ease',
      '--ww-transition-smooth': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '--ww-bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      
      // Layout
      '--ww-z-index': this.config.zIndex!.toString(),
      '--ww-border-radius': '6px',
      '--ww-border-radius-lg': '8px'
    }
  }

  private isDarkMode(): boolean {
    if (this.config.theme === 'dark') return true
    if (this.config.theme === 'light') return false
    
    // Auto-detect system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  // Style injection with modern approach
  injectStyles(styleId: string, styles: string) {
    // Remove existing style if present
    this.removeStyles(styleId)

    const styleElement = document.createElement('style')
    styleElement.id = styleId
    styleElement.setAttribute('data-word-wizard', 'true')
    
    // Add CSS variables
    const cssVars = this.getCSSVariables()
    const varsString = Object.entries(cssVars)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n        ')

    const fullStyles = `
      :root {
        ${varsString}
      }
      
      ${styles}
    `

    styleElement.textContent = fullStyles
    document.head.appendChild(styleElement)
    this.styleElements.set(styleId, styleElement)
  }

  removeStyles(styleId: string) {
    const existing = this.styleElements.get(styleId)
    if (existing) {
      existing.remove()
      this.styleElements.delete(styleId)
    }
  }

  removeAllStyles() {
    this.styleElements.forEach((element) => element.remove())
    this.styleElements.clear()
  }

  updateConfig(newConfig: Partial<StyleConfig>) {
    this.config = { ...this.config, ...newConfig }
    // Re-inject all styles with new config
    const currentStyles = new Map(this.styleElements)
    currentStyles.forEach((element, id) => {
      const content = element.textContent || ''
      this.injectStyles(id, content.split('\n').slice(6).join('\n')) // Remove CSS vars part
    })
  }
}

// Pre-defined style templates
export const WordWizardStyles = {
  // Base highlight styles
  highlights: `
    .extension-highlight {
      background-color: var(--ww-warning) !important;
      border-radius: var(--ww-border-radius) !important;
      padding: 1px 4px !important;
      box-shadow: var(--ww-shadow) !important;
      transition: var(--ww-transition) !important;
      font-weight: 500 !important;
    }
    
    .extension-highlight:hover {
      background-color: #fbbf24 !important;
      cursor: pointer !important;
      transform: translateY(-1px) !important;
    }

    .word-wizard-highlight {
      background: var(--ww-highlight-primary) !important;
      color: white !important;
      border-radius: var(--ww-border-radius) !important;
      padding: 2px 6px !important;
      box-shadow: var(--ww-shadow) !important;
      cursor: pointer !important;
      transition: var(--ww-transition-smooth) !important;
      position: relative !important;
      font-weight: 600 !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
    }
    
    .word-wizard-highlight:hover {
      transform: translateY(-1px) scale(1.02) !important;
      box-shadow: var(--ww-shadow-lg) !important;
    }
    
    .word-wizard-highlight.difficulty-easy {
      background: var(--ww-highlight-easy) !important;
    }
    
    .word-wizard-highlight.difficulty-medium {
      background: var(--ww-highlight-medium) !important;
    }
    
    .word-wizard-highlight.difficulty-hard {
      background: var(--ww-highlight-hard) !important;
    }
  `,

  // Tooltip styles with modern design
  tooltips: `
    .extension-tooltip,
    .word-wizard-tooltip {
      position: fixed !important;
      background: var(--ww-surface) !important;
      color: var(--ww-text) !important;
      border: 1px solid var(--ww-border) !important;
      padding: 12px 16px !important;
      border-radius: var(--ww-border-radius-lg) !important;
      font-size: 13px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      z-index: var(--ww-z-index) !important;
      pointer-events: none !important;
      opacity: 0 !important;
      transform: translateY(10px) scale(0.95) !important;
      transition: var(--ww-transition-smooth) !important;
      max-width: 320px !important;
      box-shadow: var(--ww-shadow-lg) !important;
      backdrop-filter: var(--ww-blur) !important;
      line-height: 1.5 !important;
    }

    .word-wizard-tooltip {
      background: linear-gradient(135deg, var(--ww-primary), var(--ww-secondary)) !important;
      color: white !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
    }
    
    .extension-tooltip.show,
    .word-wizard-tooltip.show {
      opacity: 1 !important;
      transform: translateY(0) scale(1) !important;
    }
    
    .word-wizard-quick-tooltip {
      position: fixed !important;
      background: var(--ww-primary) !important;
      color: white !important;
      padding: 8px 12px !important;
      border-radius: var(--ww-border-radius) !important;
      font-size: 12px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      z-index: var(--ww-z-index) !important;
      pointer-events: none !important;
      opacity: 0 !important;
      transform: translateY(5px) !important;
      transition: var(--ww-transition) !important;
      white-space: nowrap !important;
      font-weight: 500 !important;
      box-shadow: var(--ww-shadow) !important;
    }
    
    .word-wizard-quick-tooltip.show {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `,

  // Enhanced interactive elements
  interactive: `
    .word-wizard-floating-button {
      position: fixed !important;
      bottom: 20px !important;
      right: 20px !important;
      width: 56px !important;
      height: 56px !important;
      background: var(--ww-primary) !important;
      border-radius: 50% !important;
      box-shadow: var(--ww-shadow-lg) !important;
      cursor: pointer !important;
      transition: var(--ww-transition-smooth) !important;
      z-index: calc(var(--ww-z-index) - 1) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border: none !important;
      color: white !important;
      font-size: 24px !important;
    }

    .word-wizard-floating-button:hover {
      transform: scale(1.1) !important;
      box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4) !important;
    }

    .word-wizard-selection-indicator {
      position: absolute !important;
      pointer-events: none !important;
      border: 2px solid var(--ww-primary) !important;
      border-radius: var(--ww-border-radius) !important;
      background: rgba(99, 102, 241, 0.1) !important;
      opacity: 0 !important;
      transition: var(--ww-transition) !important;
      z-index: calc(var(--ww-z-index) - 2) !important;
    }

    .word-wizard-selection-indicator.active {
      opacity: 1 !important;
      animation: ww-pulse 1.5s infinite !important;
    }

    @keyframes ww-pulse {
      0%, 100% { 
        transform: scale(1); 
        opacity: 0.8; 
      }
      50% { 
        transform: scale(1.05); 
        opacity: 0.4; 
      }
    }
  `
}

// Helper function for easy usage
export function initWordWizardStyles(config?: StyleConfig) {
  const styleManager = ContentStyleManager.getInstance(config)
  
  // Inject all Word Wizard styles
  styleManager.injectStyles('word-wizard-highlights', WordWizardStyles.highlights)
  styleManager.injectStyles('word-wizard-tooltips', WordWizardStyles.tooltips)
  styleManager.injectStyles('word-wizard-interactive', WordWizardStyles.interactive)
  
  return styleManager
}