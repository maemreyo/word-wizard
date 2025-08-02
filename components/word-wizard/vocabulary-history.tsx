// Vocabulary History Component - Display user's learning progress and word collection
// Clean React component following separation of concerns

import React, { useState } from 'react'
import type { WordData } from '../../lib/types'

interface VocabularyHistoryItem {
  id: string
  term: string
  definition: string
  timestamp: Date
  lookupCount: number
  lastViewed: Date
  mastered: boolean
  difficulty: 'easy' | 'medium' | 'hard'
  source: 'popup' | 'sidepanel' | 'batch' | 'context-menu'
}

interface VocabularyHistoryProps {
  history: VocabularyHistoryItem[]
  onWordClick: (word: VocabularyHistoryItem) => void
  onExport: () => void
  onClear: () => void
}

export function VocabularyHistory({ 
  history, 
  onWordClick, 
  onExport, 
  onClear 
}: VocabularyHistoryProps) {
  const [searchFilter, setSearchFilter] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'frequency'>('recent')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  const [masteredFilter, setMasteredFilter] = useState<'all' | 'mastered' | 'learning'>('all')

  // Filter and sort history
  const filteredHistory = history
    .filter(item => {
      const matchesSearch = item.term.toLowerCase().includes(searchFilter.toLowerCase()) ||
                           item.definition.toLowerCase().includes(searchFilter.toLowerCase())
      const matchesDifficulty = difficultyFilter === 'all' || item.difficulty === difficultyFilter
      const matchesMastered = masteredFilter === 'all' || 
                             (masteredFilter === 'mastered' && item.mastered) ||
                             (masteredFilter === 'learning' && !item.mastered)
      return matchesSearch && matchesDifficulty && matchesMastered
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'alphabetical':
          return a.term.localeCompare(b.term)
        case 'frequency':
          return b.lookupCount - a.lookupCount
        case 'recent':
        default:
          return b.timestamp.getTime() - a.timestamp.getTime()
      }
    })

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return `${Math.floor(diffInHours / 168)}w ago`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#10b981'
      case 'medium': return '#f59e0b'
      case 'hard': return '#ef4444'
      default: return '#6b7280'
    }
  }

  return (
    <div className="vocabulary-history">
      {/* Header with stats and actions */}
      <div className="history-header">
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-number">{history.length}</span>
            <span className="stat-label">Total Words</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{history.filter(h => h.mastered).length}</span>
            <span className="stat-label">Mastered</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{history.reduce((sum, h) => sum + h.lookupCount, 0)}</span>
            <span className="stat-label">Total Lookups</span>
          </div>
        </div>

        <div className="history-actions">
          <button onClick={onExport} className="action-button export-button" title="Export vocabulary list">
            📤 Export
          </button>
          <button onClick={onClear} className="action-button clear-button" title="Clear all history">
            🗑️ Clear All
          </button>
        </div>
      </div>

      {/* Filters and search */}
      <div className="history-filters">
        <div className="search-section">
          <input
            type="text"
            placeholder="🔍 Search words or definitions..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-section">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'alphabetical' | 'frequency')}
            className="filter-select"
          >
            <option value="recent">📅 Most Recent</option>
            <option value="alphabetical">🔤 Alphabetical</option>
            <option value="frequency">📊 Most Viewed</option>
          </select>

          <select 
            value={difficultyFilter} 
            onChange={(e) => setDifficultyFilter(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">🟢 Easy</option>
            <option value="medium">🟡 Medium</option>
            <option value="hard">🔴 Hard</option>
          </select>

          <select 
            value={masteredFilter} 
            onChange={(e) => setMasteredFilter(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="learning">📚 Learning</option>
            <option value="mastered">✅ Mastered</option>
          </select>
        </div>
      </div>

      {/* Word list */}
      <div className="history-list">
        {filteredHistory.length === 0 ? (
          <div className="empty-state">
            {history.length === 0 ? (
              <>
                <div className="empty-icon">📚</div>
                <h3>No vocabulary yet</h3>
                <p>Start looking up words to build your vocabulary collection!</p>
              </>
            ) : (
              <>
                <div className="empty-icon">🔍</div>
                <h3>No matches found</h3>
                <p>Try adjusting your search or filters.</p>
              </>
            )}
          </div>
        ) : (
          <div className="word-cards">
            {filteredHistory.map((item) => (
              <div 
                key={item.id} 
                className={`word-card ${item.mastered ? 'mastered' : ''}`}
                onClick={() => onWordClick(item)}
              >
                <div className="word-card-header">
                  <div className="word-info">
                    <h4 className="word-term">{item.term}</h4>
                    <div className="word-meta">
                      <span 
                        className="difficulty-badge"
                        style={{ backgroundColor: getDifficultyColor(item.difficulty) }}
                      >
                        {item.difficulty}
                      </span>
                      {item.mastered && (
                        <span className="mastered-badge">✅ Mastered</span>
                      )}
                    </div>
                  </div>
                  <div className="word-stats">
                    <span className="lookup-count" title="Times looked up">
                      👁️ {item.lookupCount}
                    </span>
                    <span className="timestamp" title={item.timestamp.toLocaleString()}>
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>
                </div>

                <div className="word-definition">
                  <p>{item.definition}</p>
                </div>

                <div className="word-card-footer">
                  <span className="source-badge">
                    {item.source === 'popup' && '🔍'}
                    {item.source === 'sidepanel' && '📚'}
                    {item.source === 'batch' && '⚡'}
                    {item.source === 'context-menu' && '📝'}
                    {item.source}
                  </span>
                  <span className="last-viewed">
                    Last viewed: {formatRelativeTime(item.lastViewed)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Show results count when filtered */}
      {filteredHistory.length < history.length && (
        <div className="results-info">
          Showing {filteredHistory.length} of {history.length} words
        </div>
      )}
    </div>
  )
}