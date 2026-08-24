import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

// Configure body parser with 80mb limit to support PDF files up to 50MB
app.use(express.json({ limit: '80mb' }));
app.use(express.urlencoded({ extended: true, limit: '80mb' }));

// Lazy/safe initialization for Google GenAI
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fast generation with auto-fallback and per-model timeout to prevent stalls
async function callGeminiFast(promptParts: any[], config: any, systemInstruction?: string) {
  const ai = getGeminiClient();
  // Order: 3.1-flash-lite (fastest, lowest latency), 3.6-flash, 3.7-flash, gemini-flash-latest
  const models = ['gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const modelConfig: any = {
        ...config,
        ...(systemInstruction ? { systemInstruction } : {}),
        temperature: config.temperature ?? 0.1,
      };

      if (model === 'gemini-3.7-flash') {
        modelConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      } else {
        delete modelConfig.thinkingConfig;
      }

      // 45s per-model timeout to support analyzing large PDF documents (up to 50MB)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Model ${model} timed out after 45s`)), 45000)
      );

      const generatePromise = ai.models.generateContent({
        model,
        contents: { parts: promptParts },
        config: modelConfig,
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`[Gemini API] Model ${model} failed: ${err?.message || err}. Attempting fallback...`);
      lastError = err;
    }
  }

  throw lastError || new Error('All AI models are currently busy. Please try again in a moment.');
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main endpoint: Analyze notes (PDF or Text) -> Summary, Key Concepts, and Quiz
app.post('/api/analyze-notes', async (req: Request, res: Response) => {
  try {
    const { filePayload, length = 'medium' } = req.body;

    if (!filePayload) {
      return res.status(400).json({ error: 'No file data or text provided.' });
    }

    const { fileName, fileType, mimeType, base64Data, textContent, pageImages, isScanned, pageCount } = filePayload;

    if (!base64Data && !textContent && (!pageImages || pageImages.length === 0)) {
      return res.status(400).json({ error: 'Please upload a valid file or enter text notes.' });
    }

    const ai = getGeminiClient();

    // Prepare contents for Gemini 3.7 Flash
    const promptParts: any[] = [];

    const lengthGuide = {
      short: 'Provide a concise, high-level summary in 1-2 focused paragraphs (approx 100-150 words), distilling the core takeaway.',
      medium: 'Provide a balanced, structured summary in 3-4 paragraphs (approx 250-350 words) with clear topic breakdowns.',
      detailed: 'Provide an in-depth, comprehensive summary (approx 450-600 words) thoroughly covering all sub-topics, context, nuances, and conclusions.',
    }[length as 'short' | 'medium' | 'detailed'] || 'Provide a balanced, clear summary.';

    const systemInstruction = `You are a high-speed academic study assistant and pedagogical summarizer.
Your mission is to analyze student study notes, digital PDFs, scanned documents, handwritten pages, lecture slides, and photos of study material accurately and return a concise, high-yield learning package fast.

OCR & Visual Multimodal Capabilities:
- If visual page images or scanned document pages are provided, visually transcribe all legible text, handwritten notes, diagrams, mathematical formulas, equations, headings, and definitions.
- Treat visual and digital inputs with equal pedagogical precision.

Grounding Rules:
1. Rely STRICTLY on the provided document/notes/images. Never invent or extrapolate facts not present in notes.
2. If content is completely unreadable or blank (<10 words), set isLowContent = true.
3. Summary: Provide clear markdown with bolded key terms matching requested length: ${lengthGuide}.
4. Key Points: Extract 5-6 high-yield learning points categorized into 'concept', 'definition', 'formula', 'date_fact', or 'takeaway'.
5. Quiz: Generate 4-5 grounded multiple-choice questions (4 options each, exactly one correctOptionIndex 0-3) with clear rationale and reference quote.
6. Stats: Estimate topicSubject, difficultyLevel, estimatedReadTimeMinutes, and wordCountEstimate.`;

    const userPrompt = `Analyze study notes ("${fileName || 'Study Notes'}"${isScanned ? ' [Scanned Document]' : ''}) with length: "${length.toUpperCase()}".

Return JSON with summary, keyPoints (5 items), quiz (4 items), overviewStats, isLowContent, lowContentMessage, rawTextPreview.`;

    // 1. Add visual page frames if it's a scanned PDF or contains rendered pages
    if (pageImages && Array.isArray(pageImages) && pageImages.length > 0) {
      for (const imgBase64 of pageImages.slice(0, 25)) {
        if (imgBase64 && typeof imgBase64 === 'string') {
          promptParts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: imgBase64,
            },
          });
        }
      }
    }

    // 2. Add inline PDF / Image if base64 provided
    if (base64Data && mimeType) {
      promptParts.push({
        inlineData: {
          mimeType: mimeType === 'application/pdf' ? 'application/pdf' : mimeType || 'text/plain',
          data: base64Data,
        },
      });
    }

    // 3. Add extracted or typed text
    if (textContent) {
      const safeText = typeof textContent === 'string' ? textContent.slice(0, 300000) : String(textContent);
      promptParts.push({
        text: `--- NOTES CONTENT ---\n${safeText}\n--- END NOTES CONTENT ---`,
      });
    }

    promptParts.push({ text: userPrompt });

    const text = await callGeminiFast(
      promptParts,
      {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: 'Clear structured summary of the notes' },
            keyPoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  category: {
                    type: Type.STRING,
                    enum: ['concept', 'definition', 'formula', 'date_fact', 'takeaway'],
                  },
                  highlightFact: { type: Type.STRING },
                  tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['id', 'title', 'explanation', 'category'],
              },
            },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctOptionIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                  referenceFact: { type: Type.STRING },
                },
                required: ['id', 'question', 'options', 'correctOptionIndex', 'explanation'],
              },
            },
            overviewStats: {
              type: Type.OBJECT,
              properties: {
                estimatedReadTimeMinutes: { type: Type.NUMBER },
                wordCountEstimate: { type: Type.NUMBER },
                keyTermsCount: { type: Type.NUMBER },
                topicSubject: { type: Type.STRING },
                difficultyLevel: {
                  type: Type.STRING,
                  enum: ['Beginner', 'Intermediate', 'Advanced'],
                },
              },
              required: ['estimatedReadTimeMinutes', 'wordCountEstimate', 'keyTermsCount', 'topicSubject', 'difficultyLevel'],
            },
            isLowContent: { type: Type.BOOLEAN },
            lowContentMessage: { type: Type.STRING },
            rawTextPreview: { type: Type.STRING },
          },
          required: ['summary', 'keyPoints', 'quiz', 'overviewStats'],
        },
      },
      systemInstruction
    );

    if (!text) {
      throw new Error('No response generated by the AI model. Please try again.');
    }

    const parsedData = JSON.parse(text);

    // Add unique IDs if missing and format timestamps
    const result = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileName: fileName || (fileType === 'pdf' ? 'Uploaded_Document.pdf' : 'Lecture_Notes.txt'),
      fileType: fileType || 'text',
      uploadedAt: new Date().toISOString(),
      summary: parsedData.summary || 'No summary generated.',
      keyPoints: (parsedData.keyPoints || []).map((kp: any, idx: number) => ({
        ...kp,
        id: kp.id || `kp_${idx + 1}`,
      })),
      quiz: (parsedData.quiz || []).map((q: any, idx: number) => ({
        ...q,
        id: q.id || `q_${idx + 1}`,
      })),
      overviewStats: parsedData.overviewStats || {
        estimatedReadTimeMinutes: 3,
        wordCountEstimate: 500,
        keyTermsCount: 8,
        topicSubject: 'Study Material',
        difficultyLevel: 'Intermediate',
      },
      lengthOption: length,
      isLowContent: parsedData.isLowContent || false,
      lowContentMessage: parsedData.lowContentMessage || '',
      rawTextPreview: parsedData.rawTextPreview || '',
      storedFilePayload: {
        fileName,
        fileType,
        mimeType,
        textContent: textContent ? textContent.slice(0, 100000) : undefined,
        pageImages: pageImages && pageImages.length > 0 ? pageImages.slice(0, 15) : undefined,
        isScanned,
        pageCount,
      },
    };

    res.json(result);
  } catch (error: any) {
    console.error('Error analyzing notes:', error);
    let errorMsg = 'Failed to analyze study notes. Please try again.';
    try {
      if (typeof error?.message === 'string' && error.message.startsWith('{')) {
        const parsedErr = JSON.parse(error.message);
        errorMsg = parsedErr?.error?.message || parsedErr?.message || errorMsg;
      } else if (error?.message) {
        errorMsg = error.message;
      }
    } catch {
      errorMsg = error?.message || errorMsg;
    }
    res.status(500).json({ error: errorMsg });
  }
});

// Endpoint: Regenerate summary with new length or focus
app.post('/api/regenerate-summary', async (req: Request, res: Response) => {
  try {
    const { filePayload, length = 'medium', previousSummary } = req.body;

    if (!filePayload) {
      return res.status(400).json({ error: 'Missing source note content.' });
    }

    const promptParts: any[] = [];

    if (filePayload.pageImages && Array.isArray(filePayload.pageImages) && filePayload.pageImages.length > 0) {
      for (const imgBase64 of filePayload.pageImages.slice(0, 15)) {
        if (imgBase64 && typeof imgBase64 === 'string') {
          promptParts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: imgBase64,
            },
          });
        }
      }
    }

    if (filePayload.base64Data && filePayload.mimeType) {
      promptParts.push({
        inlineData: {
          mimeType: filePayload.mimeType === 'application/pdf' ? 'application/pdf' : filePayload.mimeType || 'text/plain',
          data: filePayload.base64Data,
        },
      });
    }

    if (filePayload.textContent) {
      promptParts.push({
        text: `--- NOTES CONTENT ---\n${filePayload.textContent}\n--- END NOTES CONTENT ---`,
      });
    }

    const lengthGuide = {
      short: 'Provide an ultra-concise, punchy summary in 1-2 paragraphs (approx 100-150 words).',
      medium: 'Provide a well-balanced summary with clear sections in 3-4 paragraphs (approx 250-350 words).',
      detailed: 'Provide an exhaustive, detailed study breakdown with all definitions, examples, and nuances (approx 450-600 words).',
    }[length as 'short' | 'medium' | 'detailed'] || 'Provide a clear summary.';

    promptParts.push({
      text: `Regenerate a fresh summary strictly grounded in the notes above.
Target summary format: ${lengthGuide}.
Highlight important terminology in bold markdown.
Return JSON with { "summary": "...", "estimatedReadTimeMinutes": number }.`,
    });

    const text = await callGeminiFast(
      promptParts,
      {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            estimatedReadTimeMinutes: { type: Type.NUMBER },
          },
          required: ['summary'],
        },
      },
      'You are an academic study summarizer. Never invent facts. Ground solely in provided notes.'
    );

    const parsed = JSON.parse(text || '{}');
    res.json({
      summary: parsed.summary || 'Summary regenerated successfully.',
      estimatedReadTimeMinutes: parsed.estimatedReadTimeMinutes || 3,
      length,
    });
  } catch (error: any) {
    console.error('Error regenerating summary:', error);
    res.status(500).json({ error: error?.message || 'Failed to regenerate summary.' });
  }
});

// Endpoint: Generate a new fresh quiz strictly based on the content
app.post('/api/generate-quiz', async (req: Request, res: Response) => {
  try {
    const { filePayload, count = 5, difficulty = 'balanced' } = req.body;

    if (!filePayload) {
      return res.status(400).json({ error: 'Missing note content for quiz generation.' });
    }

    const promptParts: any[] = [];

    if (filePayload.pageImages && Array.isArray(filePayload.pageImages) && filePayload.pageImages.length > 0) {
      for (const imgBase64 of filePayload.pageImages.slice(0, 15)) {
        if (imgBase64 && typeof imgBase64 === 'string') {
          promptParts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: imgBase64,
            },
          });
        }
      }
    }

    if (filePayload.base64Data && filePayload.mimeType) {
      promptParts.push({
        inlineData: {
          mimeType: filePayload.mimeType === 'application/pdf' ? 'application/pdf' : filePayload.mimeType || 'text/plain',
          data: filePayload.base64Data,
        },
      });
    }

    if (filePayload.textContent) {
      promptParts.push({
        text: `--- NOTES CONTENT ---\n${filePayload.textContent}\n--- END NOTES CONTENT ---`,
      });
    }

    promptParts.push({
      text: `Generate a brand new set of ${count} challenging multiple-choice questions for students based STRICTLY on the notes above.
Ensure each question has 4 plausible options with exactly ONE correct answer (0-3).
Include a clear explanatory rationale and reference quote/fact from the source.`,
    });

    const text = await callGeminiFast(
      promptParts,
      {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctOptionIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                  referenceFact: { type: Type.STRING },
                },
                required: ['id', 'question', 'options', 'correctOptionIndex', 'explanation'],
              },
            },
          },
          required: ['quiz'],
        },
      },
      'You are an exam generator. Generate questions strictly from the provided text. Never test outside knowledge.'
    );

    const parsed = JSON.parse(text || '{}');
    const questions = (parsed.quiz || []).map((q: any, idx: number) => ({
      ...q,
      id: `new_q_${Date.now()}_${idx + 1}`,
    }));

    res.json({ quiz: questions });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate new quiz questions.' });
  }
});

// Explicit 404 handler for API routes (prevent falling through to SPA index.html)
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: `API route ${req.method} ${req.path} not found.` });
});

// Global Express Error Middleware (ensures all API errors return clean JSON, never HTML)
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('[Global API Error Handler]', err);
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({
      error: 'File or payload is too large. Please select a document under 50MB.',
    });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON request payload.' });
  }
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected server error occurred while processing your request.',
  });
});

// Vite & Static Asset Handling
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Notes Summarizer server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
