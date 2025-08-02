// Save Options Component - Configure auto-save settings
// Clean React component following separation of concerns

import { useState } from 'react'
import { useWordWizardActions } from '../../lib/stores'

// shadcn/ui components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

interface SaveOptionsProps {
  notionEnabled: boolean
  ankiEnabled: boolean
  autoSaveEnabled: boolean
  onClose: () => void
}

export function SaveOptions({ 
  notionEnabled, 
  ankiEnabled, 
  autoSaveEnabled,
  onClose 
}: SaveOptionsProps) {
  const [localAutoSave, setLocalAutoSave] = useState(autoSaveEnabled)
  const { updateNotionSettings, updateAnkiSettings, setAutoSave } = useWordWizardActions()

  const handleAutoSaveToggle = () => {
    const newValue = !localAutoSave
    setLocalAutoSave(newValue)
    setAutoSave(newValue)
  }

  const handleNotionToggle = () => {
    updateNotionSettings(!notionEnabled)
  }

  const handleAnkiToggle = () => {
    updateAnkiSettings(!ankiEnabled)
  }

  const handleOpenSettings = () => {
    chrome.runtime.openOptionsPage()
    onClose()
  }

  return (
    <Card className="animate-in slide-in-from-top-2 duration-200">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          💾 Save Options
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Auto-save toggle */}
        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <div className="text-sm font-medium">🔄 Auto-save</div>
            <div className="text-xs text-muted-foreground">
              Automatically save looked up words
            </div>
          </div>
          <Switch
            checked={localAutoSave}
            onCheckedChange={handleAutoSaveToggle}
          />
        </div>

        <Separator />

        {/* Notion integration */}
        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <div className="text-sm font-medium">📝 Notion</div>
            <div className="text-xs text-muted-foreground">
              {notionEnabled ? 'Connected' : 'Not configured'}
            </div>
          </div>
          <Switch
            checked={notionEnabled}
            onCheckedChange={handleNotionToggle}
            disabled={!notionEnabled}
          />
        </div>

        <Separator />

        {/* Anki integration */}
        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <div className="text-sm font-medium">🧠 Anki</div>
            <div className="text-xs text-muted-foreground">
              {ankiEnabled ? 'Connected' : 'Not configured'}
            </div>
          </div>
          <Switch
            checked={ankiEnabled}
            onCheckedChange={handleAnkiToggle}
            disabled={!ankiEnabled}
          />
        </div>

        {/* Configuration hint */}
        {(!notionEnabled && !ankiEnabled) && (
          <Card className="bg-muted/50 border-muted">
            <CardContent className="p-4 text-center space-y-3">
              <p className="text-xs text-muted-foreground">
                ⚙️ Configure integrations in Settings
              </p>
              <Button onClick={handleOpenSettings} size="sm">
                Open Settings
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Save behavior explanation */}
        <div className="pt-4 border-t">
          <h5 className="text-xs font-semibold mb-2">How it works:</h5>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>
              <strong className="text-foreground">Auto-save ON:</strong> Words are saved immediately after lookup
            </li>
            <li>
              <strong className="text-foreground">Auto-save OFF:</strong> Manual save buttons will appear
            </li>
            <li>
              <strong className="text-foreground">Integrations:</strong> Must be configured in Settings first
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}