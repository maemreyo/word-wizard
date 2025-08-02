// test-shadcn.tsx - Simple test page to verify shadcn/ui integration
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import '@/src/styles/globals.css'
import { CheckCircleIcon } from 'lucide-react'

export default function TestShadcn() {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">shadcn/ui Integration Test</h1>
        <p className="text-muted-foreground">Testing core components</p>
      </div>

      <Alert>
        <CheckCircleIcon className="h-4 w-4" />
        <AlertDescription>
          shadcn/ui components are successfully integrated!
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Component Test</CardTitle>
          <CardDescription>
            Testing various shadcn/ui components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-input">Test Input</Label>
            <Input id="test-input" placeholder="Type something..." />
          </div>

          <Separator />

          <div className="flex gap-2 flex-wrap">
            <Button>Primary Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>

          <Separator />

          <div className="flex gap-2 flex-wrap">
            <Badge>Default Badge</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              <span className="text-sm">Tailwind CSS with shadcn/ui theme</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              <span className="text-sm">CSS Variables working</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              <span className="text-sm">Components rendering correctly</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              <span className="text-sm">Dark mode support ready</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}