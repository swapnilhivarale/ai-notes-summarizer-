import * as pdfjsLib from 'pdfjs-dist';

try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch {
  // fallback if worker URL assignment fails
}

export interface ExtractedPdfResult {
  text: string;
  pageCount: number;
  hasExtractedText: boolean;
  pageImages?: string[]; // Array of base64 JPEG strings (without data URL prefix) for scanned pages
  isScanned?: boolean;
}

// Fallback binary text stream parser if worker isn't available
function extractTextFromBinaryPdf(buffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(buffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const rawContent = decoder.decode(bytes);
    
    const textBlocks: string[] = [];
    // Extract text in parentheses (PDF text strings) inside stream blocks
    const matches = rawContent.match(/\(([^()]{3,})\)\s*Tj/g) || [];
    for (const match of matches) {
      const textMatch = match.match(/\((.+)\)\s*Tj/);
      if (textMatch && textMatch[1]) {
        const cleaned = textMatch[1].replace(/\\([0-9]{3}|.)/g, ' ').trim();
        if (cleaned.length > 2 && !/^[0-9\s.]+$/.test(cleaned)) {
          textBlocks.push(cleaned);
        }
      }
    }
    
    // Also match BT ... ET blocks
    const btEtBlocks = rawContent.match(/BT[\s\S]*?ET/g) || [];
    for (const block of btEtBlocks) {
      const parts = block.match(/\(([^()]+)\)/g);
      if (parts) {
        const words = parts.map(p => p.slice(1, -1).trim()).filter(p => p.length > 1);
        if (words.length > 0) {
          textBlocks.push(words.join(' '));
        }
      }
    }

    return textBlocks.join(' ').replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}

/**
 * Render a single PDF page to an optimized JPEG base64 string
 */
async function renderPageToJpeg(page: any, maxDimension = 1100): Promise<string | null> {
  try {
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const largestDim = Math.max(unscaledViewport.width, unscaledViewport.height);
    const scale = largestDim > 0 ? Math.min(1.5, maxDimension / largestDim) : 1.0;
    const viewport = page.getViewport({ scale: Math.max(scale, 0.75) });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return null;

    // Fill white background before rendering to prevent dark/transparent artifacts
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    // Convert to compressed JPEG (quality 0.80 for high clarity OCR with small footprint)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.80);
    const base64 = dataUrl.split(',')[1];
    return base64 || null;
  } catch (err) {
    console.warn('Page canvas render error:', err);
    return null;
  }
}

export async function extractTextFromPdf(
  fileOrBuffer: File | ArrayBuffer,
  onProgress?: (msg: string) => void
): Promise<ExtractedPdfResult> {
  const arrayBuffer = fileOrBuffer instanceof File ? await fileOrBuffer.arrayBuffer() : fileOrBuffer;

  try {
    if (onProgress) onProgress('Loading PDF structure...');
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const textPieces: string[] = [];

    // Step 1: Attempt fast digital text extraction from pages
    if (onProgress) onProgress(`Extracting content from ${numPages} pages...`);
    const maxPagesToRead = Math.min(numPages, 100);

    for (let i = 1; i <= maxPagesToRead; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        const pageStrings = textContent.items
          .map((item: any) => item.str || '')
          .filter((str: string) => str.trim().length > 0);

        if (pageStrings.length > 0) {
          textPieces.push(`--- Page ${i} ---\n` + pageStrings.join(' '));
        }
      } catch (pageErr) {
        console.warn(`Error reading page ${i}:`, pageErr);
      }
    }

    let fullText = textPieces.join('\n\n');
    
    // Check fallback stream if standard extraction was empty
    if (fullText.trim().length < 50) {
      const fallback = extractTextFromBinaryPdf(arrayBuffer);
      if (fallback.length > 50) {
        fullText = fallback;
      }
    }

    const hasExtractedText = fullText.trim().length > 80;
    const pageImages: string[] = [];
    let isScanned = false;

    // Step 2: If the document is a scanned document (no digital text) or has very sparse text,
    // render pages to high-resolution JPEG images for multimodal OCR
    if (!hasExtractedText || fullText.trim().split(/\s+/).length < 25) {
      isScanned = true;
      const pagesToRender = Math.min(numPages, 20); // Render up to 20 pages for visual OCR
      
      for (let i = 1; i <= pagesToRender; i++) {
        if (onProgress) onProgress(`Visualizing scanned page ${i} of ${pagesToRender}...`);
        try {
          const page = await pdf.getPage(i);
          const imgBase64 = await renderPageToJpeg(page);
          if (imgBase64) {
            pageImages.push(imgBase64);
          }
        } catch (renderErr) {
          console.warn(`Failed to render scanned page ${i}:`, renderErr);
        }
      }
    }

    return {
      text: fullText,
      pageCount: numPages || 1,
      hasExtractedText,
      isScanned,
      pageImages: pageImages.length > 0 ? pageImages : undefined,
    };
  } catch (err) {
    console.warn('PDF.js parsing failed, using fallback stream extractor:', err);
    const fallbackText = extractTextFromBinaryPdf(arrayBuffer);
    return {
      text: fallbackText,
      pageCount: 1,
      hasExtractedText: fallbackText.trim().length > 30,
      isScanned: false,
    };
  }
}

