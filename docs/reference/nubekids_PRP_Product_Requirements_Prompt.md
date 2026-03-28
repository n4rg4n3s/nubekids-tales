name: "Magic Sneakers Storybook Generator PRP"
description: |

## Purpose
Template optimized for AI agents to implement features with sufficient context and self-validation capabilities to achieve working code through iterative refinement.

## Core Principles
1. **Context is King**: Include ALL necessary documentation, examples, and caveats
2. **Validation Loops**: Provide executable tests/lints the AI can run and fix
3. **Information Dense**: Use keywords and patterns from the codebase
4. **Progressive Success**: Start simple, validate, then enhance
5. **Global rules**: Be sure to follow all rules in CLAUDE.md

---

## Goal
Build a React-based, AI-powered children's storybook generator ("Magic Sneakers") that uses Gemini 3.1 Flash to create personalized, multi-page stories. Users upload images of a Hero, a Co-Star, and their respective magical shoes. The app generates consistent character and object illustrations alongside localized story text, outputting a digital book that can be downloaded as a PDF.

## Why
- **Business value and user impact**: Creates highly engaging, personalized children's content that puts the child and their favorite items (shoes) directly into the story.
- **Integration with existing features**: Showcases advanced multimodal AI capabilities, specifically maintaining character and object (shoe) consistency across multiple generated images using Gemini's reference image features.
- **Problems this solves and for whom**: Solves the problem of generic children's books by allowing parents/creators to instantly generate high-quality, customized stories in multiple languages and artistic styles.

## What
A web application with two main phases:
1. **Setup Phase**: A UI for users to upload 4 images (Hero face, Hero shoes, Co-Star face, Co-Star shoes), select a genre (e.g., 3D Animation Magic, Classic Fairytale), select a language, and toggle "Novel Mode" (rich text).
2. **Reading Phase**: An interactive book UI that dynamically generates pages (beats) using the `@google/genai` SDK. It maintains narrative history, generates consistent images using the uploaded references, and allows users to download the final story as a PDF.

### Success Criteria
- [ ] Users can successfully upload 4 distinct images (Hero, Hero Shoe, Co-Star, Co-Star Shoe).
- [ ] The app successfully calls Gemini to generate story beats (JSON) in the selected language.
- [ ] The app successfully calls Gemini to generate images, strictly passing the uploaded images as `REFERENCE 1` through `REFERENCE 4` to maintain likeness.
- [ ] The UI displays a flippable book layout that updates as new pages are generated.
- [ ] Users can download the completed story as a formatted PDF using `jspdf`.

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://www.npmjs.com/package/@google/genai
  why: Official Google Gen AI SDK documentation. Required for `generateContent` with multiple inlineData references.
  
- file: src/services/geminiService.ts
  why: Core AI logic. Contains the exact prompt engineering required to force Gemini to output strict JSON and use multiple image references for character/shoe consistency.
  
- doc: https://artskydj.github.io/jsPDF/docs/jsPDF.html
  section: addImage, addPage
  critical: Required for exporting the generated base64 images into a paginated PDF document.

  ## Current Codebase tree

  .
├── package.json
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx                 # Main orchestrator, state management
│   ├── types.ts                # Interfaces (Persona, Beat, ComicFace) and Constants
│   ├── Setup.tsx               # Configuration UI (Uploads, Dropdowns)
│   ├── Book.tsx                # Book layout container
│   ├── Panel.tsx               # Individual page renderer
│   ├── ApiKeyDialog.tsx        # API Key input modal
│   ├── useApiKey.ts            # API Key local storage hook
│   ├── LoadingFX.tsx           # Visual effects during generation
│   └── services/
│       └── geminiService.ts    # Gemini API calls (Text & Image generation)

## Desired Codebase tree with files to be added and responsibility of file

# The current tree is optimal, but future scaling might require:
.
├── src/
│   ├── components/             # Move Setup, Book, Panel, ApiKeyDialog here
│   ├── hooks/                  # Move useApiKey here
│   ├── utils/                  # Add pdfExport.ts to extract jsPDF logic from App.tsx
│   └── services/
│       └── geminiService.ts    # Keep AI logic isolated

## Known Gotchas of our codebase & Library Quirks

# CRITICAL: @google/genai Image Generation
# The model `gemini-3.1-flash-image-preview` MUST be used for generating images with multiple references.
# References must be passed as text prompts followed by inlineData in the contents array.
# Example: 
# contents: [
#   { text: "REFERENCE 1 [HERO]:" }, { inlineData: { ... } },
#   { text: "REFERENCE 2 [HERO'S SHOES]:" }, { inlineData: { ... } }
# ]

# CRITICAL: JSON Parsing from Gemini
# Gemini sometimes wraps JSON in markdown blocks (```json ... ```). 
# The `generateBeat` service MUST strip these before calling `JSON.parse()`.

# CRITICAL: React State & Async Generation
# Because page generation is asynchronous and depends on previous pages, `historyRef` and `generatingPages` (Set) are used alongside React state to prevent race conditions and duplicate generations.

## Implementation Blueprint

### Data models and structure

// src/types.ts
export interface Persona {
  base64: string;
  desc: string;
  shoeImageBase64?: string; // CRITICAL: Added for shoe consistency
}

export interface Beat {
  caption?: string;
  dialogue?: string;
  scene: string;
  choices: string[];
  focus_char: 'hero' | 'friend' | 'other';
}

export interface ComicFace {
  id: string;
  type: 'cover' | 'story' | 'back_cover';
  imageUrl?: string;
  narrative?: Beat;
  choices: string[];
  resolvedChoice?: string;
  isLoading: boolean;
  pageIndex?: number;
  isDecisionPage?: boolean;
}

### List of tasks to be completed to fulfill the PRP

Task 1: Define Types and Constants
  - CREATE src/types.ts
  - DEFINE GENRES, LANGUAGES, SHOE_MODELS
  - DEFINE Persona, Beat, ComicFace interfaces

Task 2: Implement Gemini Service (Core AI Logic)
  - CREATE src/services/geminiService.ts
  - IMPLEMENT `generateBeat`: Constructs the narrative prompt, enforces children's book rules, injects shoe context, and parses JSON output.
  - IMPLEMENT `generateImage`: Constructs the multimodal prompt using up to 4 image references (Hero, Hero Shoe, Friend, Friend Shoe).

Task 3: Build Setup UI
  - CREATE src/Setup.tsx
  - IMPLEMENT image upload handlers for Hero face, Hero shoe, Friend face, Friend shoe.
  - IMPLEMENT dropdowns for Genre and Language.

Task 4: Build Book and Panel UI
  - CREATE src/Book.tsx and src/Panel.tsx
  - IMPLEMENT page turning logic and rendering of generated images, captions, and dialogue bubbles.

Task 5: Orchestrate State in App.tsx
  - MODIFY src/App.tsx
  - IMPLEMENT `generateSinglePage` and `generateBatch` to manage the asynchronous flow of text -> image generation.
  - IMPLEMENT `downloadPDF` using jsPDF.

### Per task pseudocode as needed added to each task

# Task 2: Gemini Service Image Generation Pseudocode
async function generateImage(beat, type, hero, friend, genre, language) {
    const contents = [];
    
    // PATTERN: Inject references sequentially
    if (hero?.base64) {
        contents.push({ text: "REFERENCE 1 [HERO]:" });
        contents.push({ inlineData: { mimeType: 'image/jpeg', data: hero.base64 } });
    }
    if (hero?.shoeImageBase64) {
        contents.push({ text: "REFERENCE 2 [HERO'S SHOES]:" });
        contents.push({ inlineData: { mimeType: 'image/jpeg', data: hero.shoeImageBase64 } });
    }
    // ... repeat for friend and friend shoes
    
    // CRITICAL: Explicitly tell the model how to use the references
    let promptText = `STYLE: ${genre} style children's book illustration... `;
    promptText += `INSTRUCTIONS: Maintain strict character and object likeness. If scene mentions 'HERO', you MUST use REFERENCE 1 for their face/body and REFERENCE 2 for their shoes.`;
    
    contents.push({ text: promptText });
    
    const res = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: contents,
        config: { imageConfig: { aspectRatio: '2:3' } }
    });
    
    return extractBase64FromResponse(res);
}

### Integration Points

API:
  - SDK: "@google/genai"
  - Auth: API Key provided via UI (`ApiKeyDialog.tsx`) and stored in localStorage (`useApiKey.ts`).
  
EXPORT:
  - Library: "jspdf"
  - Action: Iterates over `comicFaces` state, filtering for `imageUrl`, and adds them to a 480x720 PDF document.


## Validation Loop

### Level 1: Syntax & Style
# Run these FIRST - fix any errors before proceeding
npm run lint
npx tsc --noEmit

# Expected: No errors. If errors, READ the error and fix.

### Level 2: Unit Tests

# CREATE src/services/__tests__/geminiService.test.ts
def test_json_parsing_strips_markdown():
    """Ensures generateBeat handles markdown-wrapped JSON"""
    # Mock Gemini response to return ```json { "scene": "test" } ```
    # Assert parsed object is { scene: "test" }

def test_image_prompt_construction():
    """Ensures references are added correctly based on provided Personas"""
    # Pass Hero with shoeImageBase64
    # Assert contents array contains exactly 4 items (2 text, 2 inlineData)

    # Run and iterate until passing:
npm run test

### Level 3: Integration Test

# Start the service
npm run dev

# Manual Testing Steps:
# 1. Enter API Key.
# 2. Upload Hero Image and Hero Shoe Image.
# 3. Click "START ADVENTURE!".
# 4. Verify Cover page generates.
# 5. Verify Page 1 and 2 generate text, then images.
# 6. Verify images visually incorporate the uploaded shoe references.
# 7. Click "DOWNLOAD STORY" and verify PDF creation.

# Expected: Smooth UI transitions, no console errors, PDF downloads successfully.

Final validation Checklist

No linting errors: npm run lint

No type errors: npx tsc --noEmit

Manual test successful: Full story generation completes without hanging.

Error cases handled gracefully (e.g., API key invalid, image generation fails).

JSON parsing from Gemini is robust against markdown formatting.

PDF export includes all generated pages in the correct order.

## Anti-Patterns to Avoid

❌ Don't use gemini-2.5-flash-image for this; it lacks the advanced multi-reference capabilities needed for the shoe consistency. Use gemini-3.1-flash-image-preview.
❌ Don't store large base64 strings in standard React state without being mindful of re-renders; use refs where appropriate for history tracking.
❌ Don't assume Gemini will always return perfect JSON; always wrap JSON.parse in a try/catch or sanitize the string first.
❌ Don't use standard <img src="url"> for the PDF export if CORS is an issue; since we generate base64 directly from Gemini, pass the base64 string directly to jsPDF.