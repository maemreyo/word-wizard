# 📚 WORD WIZARD - COMPREHENSIVE APPLICATION DOCUMENTATION

> **Tài liệu chi tiết về toàn bộ tính năng, kiến trúc và business model của Word Wizard**
> 
> **Mục đích**: Revive ứng dụng sang project mới với khả năng kiếm tiền và mở rộng quy mô

---

## 🎯 **TỔNG QUAN ỨNG DỤNG**

### **Định vị sản phẩm**
- **Tên**: Word Wizard - AI-First Vocabulary Learning Extension
- **Version**: 2.1.0
- **Mô tả**: Chrome Extension học từ vựng thông minh với AI, tích hợp Notion và Anki
- **Target Users**: Học sinh, sinh viên, người học tiếng Anh, đặc biệt là IELTS

### **Value Proposition**
1. **AI-First**: Ưu tiên AI (Google Gemini) cho phân tích từ vựng chính xác
2. **Seamless Integration**: Tự động lưu vào Notion và Anki
3. **Context-Aware**: Hiểu ngữ cảnh và cung cấp ví dụ phù hợp
4. **Professional UI**: Giao diện đẹp, UX mượt mà
5. **Monetized Service**: Model kiếm tiền qua API proxy

---

## 🏗️ **KIẾN TRÚC TỔNG QUAN**

### **Tech Stack**
```
Frontend:
├── Chrome Extension (Plasmo Framework)
├── React + TypeScript
├── Tailwind CSS + shadcn/ui
└── Content Scripts

Backend Services:
├── Proxy API (Vercel) - Monetized
├── Supabase Database
├── AI Providers (Gemini, OpenAI, Claude)
└── External APIs (Notion, AnkiConnect)

Dashboard:
├── Next.js 14
├── Supabase Auth
├── React Query
└── Responsive Design
```

### **Kiến trúc Components**
```
word-wizard/
├── 🎯 Core Extension
│   ├── background.ts          # Background script
│   ├── popup.tsx             # Extension popup
│   ├── sidepanel.tsx         # Side panel
│   ├── options.tsx           # Options page
│   └── newtab.tsx           # New tab override
│
├── 📄 Content Scripts
│   ├── word-lookup-overlay.tsx    # Popup overlay
│   ├── text-selection-icon.tsx   # Selection icon
│   └── highlight-popup-overlay.tsx # Highlight system
│
├── 🧩 Components
│   ├── ui/                   # shadcn/ui components
│   ├── word-lookup/          # Word lookup components
│   ├── dashboard/            # Dashboard components
│   └── options-pages/        # Options components
│
├── 🔧 Services (lib/)
│   ├── ai-service.ts         # AI orchestration
│   ├── notion-service.ts     # Notion integration
│   ├── anki-service.ts       # Anki integration
│   ├── cache-service.ts      # Caching system
│   ├── proxy-service.ts      # Monetized proxy
│   └── storage.ts           # Chrome storage
│
├── 🌐 Dashboard (Next.js)
│   ├── src/app/             # App router
│   ├── src/components/      # Dashboard components
│   ├── src/services/        # API services
│   └── supabase/           # Database migrations
│
└── 📚 Documentation
    ├── docs/               # Architecture guides
    └── database-schema.md  # Database design
```

---

## ⚡ **TÍNH NĂNG CHI TIẾT**

### **1. CORE FEATURES - Extension**

#### **F1: Word Lookup System**
```typescript
// Trigger Methods:
1. Context Menu: Right-click → "Lookup with Word Wizard"
2. Keyboard Shortcut: Alt+W (Cmd+W on Mac)
3. Selection Icon: Click icon after text selection
4. Manual Input: Type in sidepanel

// Workflow:
Text Selection → AI Analysis → Display Results → Save Options
```

**Components liên quan:**
- `contents/word-lookup-overlay.tsx` - Popup display
- `contents/text-selection-icon.tsx` - Selection trigger
- `components/word-lookup-popup.tsx` - Main UI
- `lib/background/word-lookup-handler.ts` - Background processing

#### **F2: AI-Powered Analysis**
```typescript
// AI Providers Priority:
1. Word Wizard Proxy API (Monetized) ⭐
2. Custom Providers (User-configured)
3. Fallback Dictionary API (Free)

// Analysis Output:
interface WordData {
  term: string
  ipa: string                    # Pronunciation
  definition: string             # AI-generated definition
  example: string               # Context example
  wordFamily: WordFamilyItem[]  # Related words
  synonyms: string[]            # Synonyms
  antonyms: string[]            # Antonyms
  
  // Enhanced Classification
  primaryTopic?: string         # Main topic
  secondaryTopics?: string[]    # Sub-topics
  domain?: string              # Academic/Business/Daily
  complexityLevel?: string     # Word/Phrase/Sentence
  cefrLevel?: string          # A1-C2 level
  frequencyScore?: number     # Usage frequency
}
```

**Services liên quan:**
- `lib/ai-service.ts` - Main orchestrator
- `lib/ai/ai-orchestrator.ts` - AI coordination
- `lib/ai/prompt-builder.ts` - Prompt engineering
- `lib/ai/response-parser.ts` - Response processing

#### **F3: Image Generation**
```typescript
// Image Generation Flow:
Word/Phrase → AI Image Prompt → DALL-E/Midjourney → Upload → Cloud URL

// Supported Providers:
- DALL-E 3 (via OpenAI)
- Stable Diffusion (via custom providers)

// Image Hosting:
- ImgBB (Free tier)
- Cloudinary (Professional)
```

**Components:**
- `lib/ai/image-generator.ts` - Image generation
- `lib/image-upload-service.ts` - Cloud upload
- `lib/background/image-generation-handler.ts` - Background processing

#### **F4: Notion Integration**
```typescript
// Notion Workflow:
Word Data → Schema Mapping → Property Building → Page Creation

// Database Schema:
- Main Vocabulary Table (Enhanced with topics)
- Topics Master Table (Hierarchical)
- Learning Analytics Table (Progress tracking)

// Auto-mapping:
- Detects existing database properties
- Suggests missing properties
- Handles schema evolution
```

**Services:**
- `lib/notion-service.ts` - Main service
- `lib/notion/notion-client.ts` - API client
- `lib/notion/notion-transformer.ts` - Data transformation
- `lib/notion/notion-property-mapper.ts` - Property mapping
- `lib/notion/notion-schema-manager.ts` - Schema management

#### **F5: Anki Integration**
```typescript
// Anki Workflow:
Word Data → Cloze Deletion → AnkiConnect → Deck Creation

// Card Format:
Text: "The company focuses on {{c1::sustainable development}} practices"
Extra: Definition, IPA, Examples, Word Family

// Features:
- Duplicate detection
- Custom deck selection
- Auto-sync capability
```

**Service:**
- `lib/anki-service.ts` - AnkiConnect integration
- `lib/background/anki-handlers.ts` - Background processing

### **2. ADVANCED FEATURES**

#### **F6: IELTS Synonym Generator**
```typescript
// Batch Processing:
Input: List of words/phrases (5-25 items optimal)
Output: Comprehensive synonym analysis with examples

// Optimization:
- Batch size validation (5-15 optimal)
- Rate limiting protection
- Progress tracking
- Bulk save to Notion
```

**Location:** `sidepanel.tsx` - IELTS Study mode

#### **F7: Vocabulary Review System**
```typescript
// Spaced Repetition Algorithm:
- Difficulty-based intervals
- Performance tracking
- Mastery level progression
- Review statistics

// Review Types:
- Daily review queue
- Topic-based review
- Weak areas focus
- Random review
```

**Services:**
- `lib/review/vocabulary-review-service.ts`
- `lib/review/spaced-repetition-service.ts`
- `lib/review/review-stats-service.ts`

#### **F8: Highlighting System**
```typescript
// Persistent Highlights:
- Save highlights across sessions
- Sync to cloud storage
- Context preservation
- Batch analysis

// Features:
- Visual highlighting on pages
- Highlight popup with analysis
- Export capabilities
```

**Components:**
- `contents/highlight-popup-overlay.tsx`
- `lib/highlight-service.ts`

#### **F9: Custom AI Providers**
```typescript
// Provider Management:
- Add custom OpenAI-compatible APIs
- Test connection and performance
- Rate limiting per provider
- Fallback chain configuration

// Supported Types:
- OpenAI Compatible
- Gemini Compatible
- Claude Compatible
- Custom implementations
```

**Service:** `lib/custom-provider-service.ts`

### **3. DASHBOARD FEATURES**

#### **D1: User Authentication**
```typescript
// Auth Flow:
Signup → Email Verification → Profile Setup → API Key Generation

// Features:
- Supabase Auth
- Social login (Google, GitHub)
- Password reset
- Profile management
```

**Pages:**
- `dashboard/src/app/auth/signup/page.tsx`
- `dashboard/src/app/auth/login/page.tsx`
- `dashboard/src/app/auth/setup/page.tsx`

#### **D2: API Key Management**
```typescript
// Monetization Model:
Free Tier: 100 lookups/month
Pro Tier: 1000 lookups/month ($9.99)
Premium Tier: Unlimited ($19.99)

// Features:
- Usage tracking
- Quota monitoring
- Billing integration
- Plan upgrades
```

#### **D3: Analytics Dashboard**
```typescript
// Metrics:
- Daily/Monthly usage
- Popular words/topics
- Learning progress
- Performance analytics

// Visualizations:
- Usage charts (Recharts)
- Progress tracking
- Topic distribution
- Learning streaks
```

---

## 🔧 **TECHNICAL SPECIFICATIONS**

### **1. Chrome Extension Manifest**
```json
{
  "manifest_version": 3,
  "permissions": [
    "storage",
    "activeTab", 
    "contextMenus",
    "sidePanel",
    "tabs"
  ],
  "host_permissions": [
    "https://*/*",
    "https://api.notion.com/*",
    "http://127.0.0.1:8765/*"
  ],
  "commands": {
    "lookup-word": {
      "suggested_key": { "default": "Alt+W" },
      "description": "Lookup selected word with AI"
    }
  }
}
```

### **2. Message Passing System**
```typescript
// Background Script Messages:
- LOOKUP_WORD
- GENERATE_IMAGE
- UPLOAD_IMAGE
- SAVE_TO_NOTION
- SAVE_TO_ANKI
- SEARCH_NOTION_WORD
- GENERATE_SYNONYMS
- LOAD_REVIEW_VOCABULARY
- SAVE_REVIEW_RESULT

// Content Script Messages:
- SHOW_LOOKUP_POPUP
- GET_SELECTED_TEXT
- WORD_WIZARD_LOOKUP
- SIDEPANEL_LOOKUP_REQUEST
```

### **3. Storage Schema**
```typescript
// Chrome Storage:
interface Config {
  wordWizardApiKey?: string      # Monetized API key
  notionApiKey?: string          # Notion integration
  notionDatabaseId?: string      # Main vocabulary DB
  notionSynonymDatabaseId?: string # Synonym DB
  ankiDeckName?: string          # Anki deck
  customProviders?: CustomAIProvider[]
  lookupDisplayMode?: 'dialog' | 'sidepanel'
}

// Cache Storage:
interface CachedLookupResult {
  data: WordData
  timestamp: number
  expiresAt: number
  source: string
}
```

### **4. Database Schema (Supabase)**
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free',
  usage_count INTEGER DEFAULT 0,
  usage_limit INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage tracking
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  endpoint TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vocabulary tracking
CREATE TABLE vocabulary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  term TEXT NOT NULL,
  definition TEXT,
  source TEXT DEFAULT 'extension',
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 💰 **BUSINESS MODEL & MONETIZATION**

### **1. Revenue Streams**

#### **Primary: SaaS Subscription**
```
Free Tier:
- 100 AI lookups/month
- Basic Notion integration
- Community support

Pro Tier ($9.99/month):
- 1,000 AI lookups/month
- Advanced features (image generation, synonyms)
- Priority support
- Analytics dashboard

Premium Tier ($19.99/month):
- Unlimited AI lookups
- Custom AI providers
- Advanced analytics
- White-label options
```

#### **Secondary: Enterprise**
```
Team Plans ($49.99/month):
- Multi-user management
- Team analytics
- Custom integrations
- Dedicated support

Enterprise ($199.99/month):
- On-premise deployment
- Custom AI models
- Advanced security
- SLA guarantees
```

### **2. Cost Structure**
```
AI API Costs:
- Gemini Pro: ~$0.001 per lookup
- Image Generation: ~$0.02 per image
- Hosting: ~$50/month (Vercel Pro)

Gross Margins:
- Free users: -$0.001 per lookup (loss leader)
- Pro users: ~85% margin
- Premium users: ~90% margin
```

### **3. Growth Strategy**
```
Phase 1: Product-Market Fit
- Focus on IELTS students
- University partnerships
- Content marketing (YouTube, Blog)

Phase 2: Scale
- Multi-language support
- Mobile app
- API marketplace

Phase 3: Platform
- Third-party integrations
- White-label solutions
- AI model marketplace
```

---

## 🚀 **DEPLOYMENT & SCALING**

### **1. Infrastructure**
```
Frontend:
- Chrome Web Store (Extension)
- Vercel (Dashboard)
- CDN (Static assets)

Backend:
- Vercel (Proxy API)
- Supabase (Database + Auth)
- Redis (Caching)

Monitoring:
- Sentry (Error tracking)
- PostHog (Analytics)
- Uptime monitoring
```

### **2. CI/CD Pipeline**
```yaml
# GitHub Actions
name: Deploy
on:
  push:
    branches: [main]

jobs:
  extension:
    - Build extension
    - Run tests
    - Upload to Chrome Web Store
    
  dashboard:
    - Build Next.js app
    - Deploy to Vercel
    
  api:
    - Deploy proxy service
    - Update environment variables
```

### **3. Scaling Considerations**
```
Performance:
- Redis caching layer
- CDN for static assets
- Database indexing
- API rate limiting

Security:
- API key encryption
- CORS policies
- Input validation
- SQL injection prevention

Reliability:
- Health checks
- Graceful degradation
- Error boundaries
- Backup strategies
```

---

## 📊 **METRICS & KPIs**

### **1. Product Metrics**
```
User Engagement:
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Session duration
- Words looked up per session

Feature Usage:
- Lookup method distribution
- Notion save rate
- Anki integration usage
- Image generation requests

Quality Metrics:
- AI accuracy feedback
- User satisfaction scores
- Feature adoption rates
- Churn analysis
```

### **2. Business Metrics**
```
Revenue:
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Customer Lifetime Value (CLV)
- Average Revenue Per User (ARPU)

Growth:
- User acquisition cost (CAC)
- Conversion rates (Free → Paid)
- Retention rates
- Referral rates

Operational:
- API cost per user
- Support ticket volume
- Infrastructure costs
- Gross margins
```

---

## 🔄 **DEVELOPMENT ROADMAP**

### **Phase 1: Foundation (Completed)**
- ✅ Core extension functionality
- ✅ AI integration with fallbacks
- ✅ Notion/Anki integrations
- ✅ Basic monetization model

### **Phase 2: Enhancement (Current)**
- 🔄 Dashboard completion
- 🔄 Advanced analytics
- 🔄 Mobile responsiveness
- 🔄 Performance optimization

### **Phase 3: Scale (Next 6 months)**
- 📋 Multi-language support
- 📋 Mobile app (React Native)
- 📋 Advanced AI features
- 📋 Enterprise features

### **Phase 4: Platform (Next 12 months)**
- 📋 API marketplace
- 📋 Third-party integrations
- 📋 White-label solutions
- 📋 International expansion

---

## 🛠️ **DEVELOPMENT SETUP**

### **Prerequisites**
```bash
# Required tools
Node.js 18+
pnpm (package manager)
Chrome browser
Git

# API Keys needed
Google Gemini API key
Notion integration token
ImgBB/Cloudinary API key (optional)
Supabase project credentials
```

### **Installation**
```bash
# Clone repository
git clone <repository-url>
cd word-wizard

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Fill in API keys

# Development
pnpm dev

# Build for production
pnpm build

# Package extension
pnpm package
```

### **Dashboard Setup**
```bash
cd dashboard

# Install dependencies
pnpm install

# Setup Supabase
pnpm supabase start
pnpm supabase db reset

# Development
pnpm dev

# Build
pnpm build
```

---

## 📚 **PATTERNS & BEST PRACTICES**

### **1. Chrome Extension Patterns**
```typescript
// Background Script Pattern
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "ACTION_TYPE":
      handleAction(message.data, sendResponse)
      return true // Keep channel open for async
  }
})

// Content Script Communication
window.postMessage({
  type: "WORD_WIZARD_ACTION",
  data: payload
}, "*")

// Storage Pattern
import { Storage } from "@plasmohq/storage"
const storage = new Storage()
await storage.set("key", value)
const value = await storage.get("key")
```

### **2. Service Architecture**
```typescript
// Dependency Injection Pattern
class AIService {
  constructor(
    private proxyService: ProxyService,
    private cacheService: CacheService,
    private rateLimitService: RateLimitService
  ) {}
}

// Factory Pattern
class ServiceFactory {
  static createAIService(config: Config): AIService {
    return new AIService(
      new ProxyService(config.proxyConfig),
      new CacheService(),
      new RateLimitService()
    )
  }
}
```

### **3. Error Handling**
```typescript
// Graceful Degradation
async lookupWord(term: string): Promise<LookupResult> {
  try {
    return await this.aiProvider.lookup(term)
  } catch (error) {
    console.warn("AI lookup failed, falling back to dictionary")
    return await this.dictionaryAPI.lookup(term)
  }
}

// User-Friendly Errors
catch (error) {
  if (error.code === 'QUOTA_EXCEEDED') {
    return {
      success: false,
      error: "Daily limit reached. Please upgrade your plan.",
      upgradeUrl: "https://dashboard.wordwizard.com/upgrade"
    }
  }
}
```

### **4. Performance Optimization**
```typescript
// Caching Strategy
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
const cacheKey = `lookup:${term.toLowerCase()}`

// Rate Limiting
const rateLimiter = new RateLimitService({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10
})

// Lazy Loading
const LazyComponent = React.lazy(() => import('./HeavyComponent'))
```

---

## 🔐 **SECURITY CONSIDERATIONS**

### **1. API Security**
```typescript
// API Key Encryption
const encryptedKey = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv: iv },
  key,
  encoder.encode(apiKey)
)

// Request Validation
const validateRequest = (req: Request) => {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey || !isValidApiKey(apiKey)) {
    throw new Error('Invalid API key')
  }
}

// Rate Limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
```

### **2. Data Privacy**
```typescript
// Local Storage Only
// Never send user data to external servers except configured services
const sensitiveData = {
  userExamples: "stored locally only",
  personalNotes: "never transmitted",
  browsingHistory: "not collected"
}

// GDPR Compliance
const gdprCompliance = {
  dataMinimization: "Only collect necessary data",
  userConsent: "Explicit consent for each integration",
  dataPortability: "Export functionality available",
  rightToDelete: "Account deletion removes all data"
}
```

---

## 📈 **SUCCESS METRICS**

### **Target KPIs (6 months)**
```
Users:
- 10,000+ active users
- 1,000+ paid subscribers
- 15% free-to-paid conversion

Revenue:
- $15,000+ MRR
- $180,000+ ARR
- 85%+ gross margin

Product:
- 4.5+ Chrome Store rating
- <2% churn rate
- 90%+ feature adoption (core features)

Technical:
- 99.9% uptime
- <500ms API response time
- <1% error rate
```

---

## 🎯 **COMPETITIVE ADVANTAGES**

### **1. Technical Differentiators**
- **AI-First Architecture**: Prioritizes AI over traditional dictionaries
- **Seamless Integration**: One-click save to Notion and Anki
- **Context Awareness**: Understands usage context and provides relevant examples
- **Professional UI/UX**: Modern, intuitive interface using shadcn/ui

### **2. Business Differentiators**
- **Monetized from Day 1**: Built-in revenue model via proxy API
- **Scalable Architecture**: Microservices ready for enterprise
- **Data-Driven**: Comprehensive analytics and user insights
- **Community-Focused**: Built for specific user segments (IELTS, students)

### **3. Market Position**
```
Direct Competitors:
- Grammarly (broader scope, less specialized)
- Anki (flashcards only, no AI)
- Notion Web Clipper (no AI analysis)

Indirect Competitors:
- Google Translate (basic translation)
- Dictionary extensions (no AI, no integration)
- Language learning apps (different use case)

Competitive Moat:
- AI-powered analysis quality
- Seamless workflow integration
- Specialized for vocabulary learning
- Strong technical architecture
```

---

## 📋 **CONCLUSION & NEXT STEPS**

### **Key Takeaways**
1. **Solid Foundation**: Well-architected codebase with clear separation of concerns
2. **Monetization Ready**: Built-in revenue model with tiered pricing
3. **Scalable Design**: Microservices architecture ready for growth
4. **Market Opportunity**: Large addressable market in language learning

### **Immediate Actions for Revival**
1. **Complete Dashboard**: Finish user management and billing integration
2. **Marketing Launch**: Content marketing targeting IELTS students
3. **Performance Optimization**: Improve API response times and caching
4. **User Feedback**: Implement feedback collection and iteration cycles

### **Long-term Vision**
Transform Word Wizard from a Chrome extension into a comprehensive language learning platform with:
- Multi-platform support (mobile, web, desktop)
- Advanced AI tutoring capabilities
- Community features and social learning
- Enterprise solutions for educational institutions

---

**📞 Contact & Support**
- Documentation: `/docs` folder
- Architecture Guides: `/docs/chrome-extension-architecture-patterns.md`
- Database Schema: `/database-schema-enhanced.md`
- Development Setup: This document, Development Setup section

**🚀 Ready to Scale!**
This codebase represents a production-ready, monetizable application with clear growth potential and solid technical foundations.