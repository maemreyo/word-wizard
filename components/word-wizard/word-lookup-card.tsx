// Word Lookup Card Component - Display AI-analyzed vocabulary data
// Clean React component following separation of concerns

import React from 'react'
import type { WordData } from '../../lib/types'

interface WordLookupCardProps {
  wordData: WordData
  onSaveToNotion?: () => void
  onSaveToAnki?: () => void
  showSaveButtons?: boolean
  compact?: boolean
}

export function WordLookupCard({ 
  wordData, 
  onSaveToNotion, 
  onSaveToAnki, 
  showSaveButtons = false,
  compact = false 
}: WordLookupCardProps) {
  const {
    term,
    ipa,
    definition,
    examples,
    synonyms,
    antonyms,
    wordFamily,
    primaryTopic,
    domain,
    cefrLevel,
    imageUrl
  } = wordData

  return (
    <div className={`word-lookup-card ${compact ? 'compact' : ''}`}>
      {/* Header with word and pronunciation */}
      <div className="word-header">
        <div className="word-title">
          <h3 className="word-term">{term}</h3>
          {ipa && (
            <span className="word-pronunciation">
              /{ipa}/
            </span>
          )}
        </div>
        <div className="word-meta">
          {cefrLevel && (
            <span className={`cefr-badge cefr-${cefrLevel.toLowerCase()}`}>
              {cefrLevel}
            </span>
          )}
          {domain && (
            <span className={`domain-badge domain-${domain}`}>
              {domain}
            </span>
          )}
        </div>
      </div>

      {/* Generated image if available */}
      {imageUrl && !compact && (
        <div className="word-image">
          <img 
            src={imageUrl} 
            alt={`Visual representation of ${term}`}
            className="vocab-image"
            loading="lazy"
          />
        </div>
      )}

      {/* Definition */}
      <div className="word-definition">
        <h4 className="section-title">📖 Definition</h4>
        <p className="definition-text">{definition}</p>
      </div>

      {/* Examples */}
      {examples && examples.length > 0 && !compact && (
        <div className="word-examples">
          <h4 className="section-title">💬 Examples</h4>
          <ul className="examples-list">
            {examples.slice(0, 3).map((example, index) => (
              <li key={index} className="example-item">
                "{example}"
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Synonyms and Antonyms */}
      {!compact && (synonyms?.length > 0 || antonyms?.length > 0) && (
        <div className="word-relations">
          {synonyms && synonyms.length > 0 && (
            <div className="synonyms">
              <h4 className="section-title">🔄 Synonyms</h4>
              <div className="tags-container">
                {synonyms.slice(0, 5).map((synonym, index) => (
                  <span key={index} className="tag synonym-tag">
                    {synonym}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {antonyms && antonyms.length > 0 && (
            <div className="antonyms">
              <h4 className="section-title">↔️ Antonyms</h4>
              <div className="tags-container">
                {antonyms.slice(0, 3).map((antonym, index) => (
                  <span key={index} className="tag antonym-tag">
                    {antonym}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Word Family */}
      {wordFamily && wordFamily.length > 0 && !compact && (
        <div className="word-family">
          <h4 className="section-title">👥 Word Family</h4>
          <div className="family-grid">
            {wordFamily.slice(0, 4).map((item, index) => (
              <div key={index} className="family-item">
                <span className="family-type">{item.type}</span>
                <span className="family-word">{item.word}</span>
                <span className="family-definition">{item.definition}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic classification */}
      {primaryTopic && (
        <div className="word-topic">
          <span className="topic-label">🏷️ Topic:</span>
          <span className="topic-value">{primaryTopic}</span>
        </div>
      )}

      {/* Save actions */}
      {showSaveButtons && (
        <div className="save-actions">
          <h4 className="section-title">💾 Save to</h4>
          <div className="save-buttons">
            {onSaveToNotion && (
              <button 
                onClick={onSaveToNotion}
                className="save-button notion-button"
                title="Save to Notion"
              >
                📝 Notion
              </button>
            )}
            {onSaveToAnki && (
              <button 
                onClick={onSaveToAnki}
                className="save-button anki-button"
                title="Save to Anki"
              >
                🧠 Anki
              </button>
            )}
          </div>
        </div>
      )}

      {/* Compact view shows only essential info */}
      {compact && (
        <div className="compact-summary">
          {synonyms && synonyms.length > 0 && (
            <div className="compact-synonyms">
              <strong>Synonyms:</strong> {synonyms.slice(0, 3).join(', ')}
            </div>
          )}
          {examples && examples.length > 0 && (
            <div className="compact-example">
              <strong>Example:</strong> "{examples[0]}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// CSS styles for the component (to be added to popup.css)
const styles = `
.word-lookup-card {
  background: var(--card-background, #ffffff);
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.word-lookup-card.compact {
  padding: 12px;
  margin-top: 8px;
}

.word-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.word-title {
  flex: 1;
}

.word-term {
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-color, #2563eb);
  margin: 0 0 4px 0;
}

.word-pronunciation {
  font-size: 14px;
  color: var(--secondary-text, #6b7280);
  font-style: italic;
}

.word-meta {
  display: flex;
  gap: 8px;
  flex-direction: column;
  align-items: flex-end;
}

.cefr-badge, .domain-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
}

.cefr-badge {
  background: var(--cefr-bg, #f3f4f6);
  color: var(--cefr-text, #374151);
}

.domain-badge {
  background: var(--domain-bg, #eff6ff);
  color: var(--domain-text, #1d4ed8);
}

.word-image {
  margin: 12px 0;
  text-align: center;
}

.vocab-image {
  max-width: 100%;
  max-height: 120px;
  border-radius: 8px;
  object-fit: cover;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color, #374151);
  margin: 12px 0 8px 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.definition-text {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-color, #374151);
  margin: 0;
}

.examples-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.example-item {
  font-size: 13px;
  color: var(--secondary-text, #6b7280);
  margin-bottom: 4px;
  font-style: italic;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.synonym-tag {
  background: var(--synonym-bg, #f0f9ff);
  color: var(--synonym-text, #0369a1);
}

.antonym-tag {
  background: var(--antonym-bg, #fef2f2);
  color: var(--antonym-text, #dc2626);
}

.family-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.family-item {
  padding: 8px;
  background: var(--family-bg, #f9fafb);
  border-radius: 6px;
  font-size: 12px;
}

.family-type {
  display: block;
  font-weight: 500;
  color: var(--family-type, #6b7280);
  text-transform: uppercase;
}

.family-word {
  display: block;
  font-weight: 600;
  color: var(--primary-color, #2563eb);
  margin: 2px 0;
}

.family-definition {
  display: block;
  color: var(--secondary-text, #6b7280);
  line-height: 1.3;
}

.word-topic {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light, #f3f4f6);
  font-size: 13px;
}

.topic-label {
  color: var(--secondary-text, #6b7280);
  margin-right: 8px;
}

.topic-value {
  color: var(--primary-color, #2563eb);
  font-weight: 500;
}

.save-actions {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light, #f3f4f6);
}

.save-buttons {
  display: flex;
  gap: 8px;
}

.save-button {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 6px;
  background: white;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.save-button:hover {
  background: var(--hover-bg, #f9fafb);
}

.notion-button {
  border-color: var(--notion-color, #ff5733);
  color: var(--notion-color, #ff5733);
}

.anki-button {
  border-color: var(--anki-color, #0093ff);
  color: var(--anki-color, #0093ff);
}

.compact-summary {
  margin-top: 8px;
  font-size: 12px;
}

.compact-synonyms, .compact-example {
  margin-bottom: 4px;
  color: var(--secondary-text, #6b7280);
}
`