// Word Lookup Card Component - Display AI-analyzed vocabulary data
// Clean React component following separation of concerns

import React from 'react'
import type { WordData } from '../../lib/types'

// shadcn/ui components
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

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
    <Card className={compact ? 'p-3' : ''}>
      {/* Header with word and pronunciation */}
      <CardHeader className={`flex-row items-start justify-between space-y-0 ${compact ? 'pb-2' : 'pb-4'}`}>
        <div className="flex-1">
          <CardTitle className="text-xl text-primary mb-1">{term}</CardTitle>
          {ipa && (
            <p className="text-sm text-muted-foreground italic">
              /{ipa}/
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {cefrLevel && (
            <Badge variant="secondary" className="text-xs">
              {cefrLevel}
            </Badge>
          )}
          {domain && (
            <Badge variant="outline" className="text-xs">
              {domain}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Generated image if available */}
        {imageUrl && !compact && (
          <div className="text-center">
            <img 
              src={imageUrl} 
              alt={`Visual representation of ${term}`}
              className="max-w-full max-h-32 rounded-lg object-cover mx-auto"
              loading="lazy"
            />
          </div>
        )}

        {/* Definition */}
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
            📖 Definition
          </h4>
          <p className="text-sm leading-relaxed">{definition}</p>
        </div>

        {/* Examples */}
        {examples && examples.length > 0 && !compact && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
              💬 Examples
            </h4>
            <ul className="space-y-1">
              {examples.slice(0, 3).map((example, index) => (
                <li key={index} className="text-sm text-muted-foreground italic">
                  "{example}"
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Synonyms and Antonyms */}
        {!compact && (synonyms?.length > 0 || antonyms?.length > 0) && (
          <div className="space-y-3">
            {synonyms && synonyms.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  🔄 Synonyms
                </h4>
                <div className="flex flex-wrap gap-2">
                  {synonyms.slice(0, 5).map((synonym, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                      {synonym}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {antonyms && antonyms.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  ↔️ Antonyms
                </h4>
                <div className="flex flex-wrap gap-2">
                  {antonyms.slice(0, 3).map((antonym, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-red-50 text-red-700">
                      {antonym}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Word Family */}
        {wordFamily && wordFamily.length > 0 && !compact && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
              👥 Word Family
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {wordFamily.slice(0, 4).map((item, index) => (
                <Card key={index} className="p-3 bg-muted/50">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-xs uppercase">
                      {item.type}
                    </Badge>
                    <p className="font-semibold text-primary text-sm">{item.word}</p>
                    <p className="text-xs text-muted-foreground leading-tight">
                      {item.definition}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Topic classification */}
        {primaryTopic && (
          <>
            <Separator />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">🏷️ Topic:</span>
              <Badge variant="outline" className="text-primary font-medium">
                {primaryTopic}
              </Badge>
            </div>
          </>
        )}

        {/* Save actions */}
        {showSaveButtons && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-1">
                💾 Save to
              </h4>
              <div className="flex gap-2">
                {onSaveToNotion && (
                  <Button 
                    onClick={onSaveToNotion}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    📝 Notion
                  </Button>
                )}
                {onSaveToAnki && (
                  <Button 
                    onClick={onSaveToAnki}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    🧠 Anki
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Compact view shows only essential info */}
        {compact && (
          <div className="space-y-2 text-sm">
            {synonyms && synonyms.length > 0 && (
              <div className="text-muted-foreground">
                <strong>Synonyms:</strong> {synonyms.slice(0, 3).join(', ')}
              </div>
            )}
            {examples && examples.length > 0 && (
              <div className="text-muted-foreground">
                <strong>Example:</strong> "{examples[0]}"
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

