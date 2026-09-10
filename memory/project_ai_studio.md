---
name: AI Painting Studio implementation
description: Key decisions and architecture for the AI painting studio feature (/ai-painting)
type: project
---

AI painting studio now uses OpenAI gpt-image-1 (images.edit endpoint) instead of Gemini or CycleGAN Python backend.

**Why:** User requested removing Python backend dependency and switching to OpenAI Image API for professional conversion quality.

**How to apply:** When touching /api/ai-painting/preview, always use the OpenAI SDK (openai package, `openai.images.edit` with `gpt-image-1`). Never reintroduce Gemini or Python backend calls for this route.

Key files:
- API route: src/app/api/ai-painting/preview/route.ts (OpenAI, style prompts, session tracking)
- Studio UI: src/components/ai/AIPaintingStudio.tsx (4 styles, frame selector, canvas, checkout)
- Frame model: prisma/schema.prisma (Frame model - DB managed by admin)
- Session model: prisma/schema.prisma (AIPaintingSession model - tracks conversions for analytics)
- Public frames API: src/app/api/frames/route.ts
- Admin AI page: src/app/admin/ai-painting/page.tsx
- Admin component: src/components/admin/AdminAIPaintingManager.tsx (overview tab + frames tab)
- Admin frames CRUD: src/app/api/admin/frames/route.ts, [id]/route.ts, upload/route.ts
- Admin stats: src/app/api/admin/ai-painting/stats/route.ts

Style presets: monet, cezanne, vangogh, ukiyoe — each has a professional multi-line prompt in the API route.

Prisma model naming: `prisma.aIPaintingSession`, `prisma.frame`.
