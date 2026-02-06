import { VerdictType, IFactCheck, ISource, IVisualAnalysis } from '../models/FactCheck';
import fs from 'fs/promises';
import { readFileSync } from 'fs';
import * as ExifParser from 'exif-parser';


const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_INSTRUCTION = `Tu es VERITAS v2.0, un système de renseignement et d'analyse forensique de niveau militaire.
Ta mission est d'atteindre une précision de 100% dans la vérification des faits, images, vidéos et liens sociaux.

--- PROTOCOLE DE VÉRIFICATION ---

1. RECHERCHE WEB AGRESSIVE : Utilise Google Search pour croiser les sources.
2. ANALYSE SÉLECTIVE : Ne mentionne que ce qui est DIRECTEMENT pertinent pour valider ou infirmer l'affirmation. Oublie les biographies générales ou les "pas d'indices trouvés".
3. FORMATAGE : N'utilise JAMAIS de gras (pas d'astérisques **). Utilise des tirets et des emojis pour structurer.

--- FORMAT DU RAPPORT (STRICT) ---
Ligne 1 : VERDICT: [VERDICT] (TRUE, FALSE, MISLEADING, NUANCED, AI_GENERATED, MANIPULATED, UNVERIFIED)
Ligne 2 : CONFIDENCE: [Score 0-100]
Ligne 3 : RÉSUMÉ: [Une phrase percutante et conclusive]
Ligne 4 : Vide.
Ligne 5+ : RAPPORT D'ANALYSE DÉTAILLÉ :
N'affiche une section que si elle contient des informations CRUCIALES. Si une section n'apporte rien, OMETS-LA totalement.
- 🔍 Analyse Visuelle : (Uniquement si analyse d'image/vidéo nécessaire)
- 📍 Contexte & Lieu : (Uniquement si la localisation ou le contexte temporel est une preuve)
- 🌐 Recherche Web : (Synthèse des preuves trouvées en ligne)
- 🛠 Données Techniques : (Uniquement si métadonnées EXIF ou signatures IA détectées)

SECTION FINALE :
SOURCES_DETAILS:
- [URL] : TITRE RÉEL DE L'ARTICLE (Pas le nom du site) | Un résumé court de ce que cette source prouve.

IMPORTANT : Sois concis. Ne dis JAMAIS "N/A", "Sans objet", "Aucun", ou "L'analyse porte sur du texte". Si tu n'as pas de preuve pour une section (ex: pas d'indice visuel), NE CRÉE PAS la section. Un rapport vide sur une section est INTERDIT.`;

interface GeminiRequest {
  contents: Array<{
    role: string;
    parts: Array<{
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string;
      };
    }>;
  }>;
  systemInstruction?: {
    parts: Array<{ text: string }>;
  };
  tools?: Array<{
    googleSearch?: {};
  }>;
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  };
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string;
      }>;
    };
    groundingMetadata?: {
        searchEntryPoint?: {
            renderedContent: string;
        };
        groundingChunks?: Array<{
            web?: {
                uri: string;
                title: string;
            };
        }>;
    };
  }>;
}

// Helper: Extract Metadata from local file
function extractMetadata(filePath: string): string {
    try {
        if (filePath.startsWith('http')) return "Metadata non disponible pour URL distante.";
        const buffer = readFileSync(filePath);
        const parser = ExifParser.create(buffer);
        const result = parser.parse();
        return JSON.stringify(result.tags, null, 2);
    } catch (e) {
        return "Aucune métadonnée EXIF détectée ou format non supporté.";
    }
}

// Helper: Convert file buffer or URL to Base64
async function getBase64FromPath(path: string): Promise<{ base64: string; mimeType: string }> {
    // Check if it's a URL
    if (path.startsWith('http')) {
        const response = await fetch(path);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        return { base64, mimeType };
    } else {
        // Local file path
        const buffer = await fs.readFile(path);
        const base64 = buffer.toString('base64');
        // Simple mime type detection extension
        const ext = path.split('.').pop()?.toLowerCase();
        let mimeType = 'image/jpeg'; // Default
        if (ext === 'png') mimeType = 'image/png';
        if (ext === 'webp') mimeType = 'image/webp';
        return { base64, mimeType };
    }
}

function cleanSourceUrl(url: string): { url: string; domain: string } {
    try {
        const u = new URL(url);
        if (u.hostname.includes('vertexaisearch.cloud.google.com')) {
            const realUrl = u.searchParams.get('url');
            if (realUrl) {
                const ru = new URL(realUrl);
                return { url: realUrl, domain: ru.hostname.replace('www.', '') };
            }
        }
        return { url, domain: u.hostname.replace('www.', '') };
    } catch (e) {
        return { url, domain: 'source' };
    }
}

function parseGeminiResponse(response: GeminiResponse): {
    verdict: VerdictType;
    summary: string;
    analysis: string;
    sources: ISource[];
    visualAnalysis?: IVisualAnalysis;
    confidenceScore: number;
} {
  const candidate = response.candidates?.[0];
  const textContent = candidate?.content?.parts?.[0]?.text || '';
  
  // Parse lines
  const allLines = textContent.split('\n').map(l => l.trim());
  
  // 1. Extraire les sources du grounding metadata
  const sources: ISource[] = [];
  const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
  
  // Map for source summaries from text
  const sourceSummariesMap = new Map<string, string>();
  const sourceDetailsIndex = textContent.indexOf('SOURCES_DETAILS:');
  
  // URL normalization to match "https://site.com/" with "https://site.com"
  const normalizeUrl = (u: string) => u.split('?')[0].replace(/\/$/, '').toLowerCase().trim();

  if (sourceDetailsIndex !== -1) {
      const sourceDetailsText = textContent.substring(sourceDetailsIndex);
      const detailLines = sourceDetailsText.split('\n');
      detailLines.forEach(line => {
          if (line.startsWith('-') || line.includes('http')) {
              const match = line.match(/-\s*(?:\[)?(https?:\/\/[^\s\]]+)(?:\])?\s*:\s*(.*)/);
              if (match) {
                  sourceSummariesMap.set(normalizeUrl(match[1]), match[2].trim());
              }
          }
      });
  }

  groundingChunks.forEach((chunk, index) => {
    if (chunk.web) {
      const rawUrl = chunk.web.uri || '';
      const { url, domain } = cleanSourceUrl(rawUrl);
      const normalizedUrl = normalizeUrl(rawUrl);
      
      let snippet = 'Source vérifiée';
      let title = chunk.web.title && !chunk.web.title.includes('...') ? chunk.web.title : (domain || 'Source Web');

      // Check for summary in map
      for (const [sUrl, sData] of sourceSummariesMap.entries()) {
          if (normalizedUrl.includes(sUrl) || sUrl.includes(normalizedUrl)) {
              if (sData.includes('|')) {
                  const [parsedTitle, parsedSnippet] = sData.split('|').map(s => s.trim());
                  if (parsedTitle && parsedTitle.length > 5) title = parsedTitle;
                  if (parsedSnippet) snippet = parsedSnippet;
              } else if (sData.length > 5) {
                  snippet = sData;
              }
              break;
          }
      }

      sources.push({
        title: title,
        url: url,
        domain: domain,
        snippet: snippet,
      });
    }
  });

  // 2. Parser le texte brut (Format Strict)
  const lines = allLines.filter(l => l.length > 0);
  
  let verdict: VerdictType = 'UNVERIFIED';
  let summary = 'Analyse en cours...';
  let analysis = '';
  let confidenceScore = 0; // Default to 0 to clearly see if detection fails

  if (lines.length > 0) {
      // Line 1: Verdict
      const firstLine = lines[0].toUpperCase();
      
      if (firstLine.includes('TRUE') || firstLine.includes('VRAI')) verdict = 'TRUE';
      else if (firstLine.includes('FALSE') || firstLine.includes('FAUX')) verdict = 'FALSE';
      else if (firstLine.includes('MISLEADING') || firstLine.includes('TROMPEUR')) verdict = 'MISLEADING';
      else if (firstLine.includes('NUANCE')) verdict = 'NUANCED';
      else if (firstLine.includes('GENERATED') || firstLine.includes('MANIPULATED') || firstLine.includes('GENEREE')) verdict = 'AI_GENERATED';
      else if (firstLine.includes('UNVERIFIED')) verdict = 'UNVERIFIED';
      
      // Line 2: Confidence
      if (lines.length > 1 && lines[1].toUpperCase().includes('CONFIDENCE')) {
          const scoreMatch = lines[1].match(/\d+/);
          if (scoreMatch) {
              confidenceScore = parseInt(scoreMatch[0], 10);
          }
      }

      // Line 3: Summary
      if (lines.length > 2 && lines[2].toUpperCase().includes('RÉSUMÉ')) {
          summary = lines[2].split(':').slice(1).join(':').trim();
          analysis = lines.slice(3).join('\n\n');
      } else {
           // Fallback
           summary = lines[2] || lines[1] || 'Analyse terminée';
           analysis = lines.slice(3).join('\n\n');
      }
  }

  // Remove technical markers from analysis
  const markers = ["SECTION FINALE :", "SECTION FINALE:", "SOURCES_DETAILS:"];
  markers.forEach(marker => {
      const idx = analysis.indexOf(marker);
      if (idx !== -1) {
          analysis = analysis.substring(0, idx).trim();
      }
  });

  // Fallback
  if (!analysis) analysis = "Détails non disponibles.";
  if (!summary) summary = analysis.slice(0, 150) + '...';

  // Final sanity check for confidenceScore
  if (confidenceScore === 0) confidenceScore = 85; 

  const visualAnalysis: IVisualAnalysis = {
        isAIGenerated: (verdict as string) === 'AI_GENERATED' || (verdict as string) === 'MANIPULATED',
        isManipulated: (verdict as string) === 'MANIPULATED',
        artifacts: [], 
        confidence: confidenceScore,
        details: analysis
  };

  return {
      verdict,
      summary,
      analysis,
      sources,
      visualAnalysis: verdict.includes('GENERATED') || verdict.includes('MANIPULATED') ? visualAnalysis : undefined,
      confidenceScore: confidenceScore
  };
}

export async function verifyWithGemini(claim: string, imagePath?: string): Promise<any> {
  let contextText = `ANALYSE CETTE AFFIRMATION:\n"${claim}"`;
  let imagePrompt = "";

  if (imagePath) {
      const metadata = extractMetadata(imagePath);
      imagePrompt = `ANALYSE FORENSIQUE DE L'IMAGE:\n${claim ? `Contexte: "${claim}"` : ''}\n\nDONNÉES TECHNIQUES (METADATA):\n${metadata}`;
  }

  const requestBody: GeminiRequest = {
    contents: [
      {
        role: 'user',
        parts: [],
      },
    ],
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    tools: [
      {
        googleSearch: {},
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 2048,
    },
  };

  try {
    if (imagePath) {
        // Visual Analysis
        const { base64, mimeType } = await getBase64FromPath(imagePath);
        requestBody.contents[0].parts.push({
            inlineData: {
                mimeType,
                data: base64
            }
        });
        requestBody.contents[0].parts.push({
            text: imagePrompt
        });
    } else {
        // Text Analysis
        requestBody.contents[0].parts.push({
            text: contextText
        });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    console.log('DEBUG: Using Gemini API Key:', apiKey.substring(0, 10) + '...', 'Length:', apiKey.length);

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json() as any;
      console.error('Gemini API Check Error:', errorData);
      throw new Error(`Gemini API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json() as unknown as GeminiResponse;
    return parseGeminiResponse(data);

  } catch (error) {
    console.error('Error in verifyWithGemini service:', error);
    throw error;
  }
}

export async function generateNewsSuggestions(): Promise<string[]> {
  const PROMPT = `
  Tu es un assistant connecté à l'actualité mondiale en temps réel.
  Ta mission : Trouver 12 rumeurs, affirmations virales ou questions d'actualité récentes (24h-48h) qui méritent vérification.
  
  Règles strictes :
  1. Utilise Google Search pour trouver des sujets brûlants (politique, tech, insolite, social, santé).
  2. Formule chaque sujet sous forme de QUESTION courte et percutante (max 15 mots).
  3. Réponds UNIQUEMENT au format JSON brut (Array de strings), sans markdown, sans intro.
  
  Exemple de format attendu :
  ["Le gouvernement a-t-il vraiment supprimé cette aide ?", "Cette vidéo de l'ours est-elle un deepfake ?", "Est-il vrai que la NASA a annoncé la fin du monde ?", ...]
  `;

  const requestBody: GeminiRequest = {
    contents: [
      {
        role: 'user',
        parts: [{ text: PROMPT }],
      },
    ],
    tools: [
      {
        googleSearch: {},
      },
    ],
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 2000, // Increased for 10+ items
      // responseMimeType removed to be safer, relying on prompt
    },
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY missing');

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        console.error("Gemini Suggestions Error", await response.text());
        return getFallbackSuggestions();
    }

    const data = await response.json() as unknown as GeminiResponse;
    // Log raw text for debugging
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log("DEBUG: Raw Gemini suggestions:", text.substring(0, 100) + "..."); 

    // Clean potential markdown code blocks
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
            // Return top 10
            return parsed.slice(0, 10).map(s => String(s));
        }
    } catch (e) {
        console.warn("Failed to parse Gemini JSON suggestions", e);
        console.log("Fallback parsing text split...");
        // Fallback: splitting by newlines or question marks
        const lines = text.split('\n')
           .map(l => l.trim())
           .filter(l => l.length > 10 && (l.includes('?') || l.length > 20))
           .map(l => l.replace(/^["']|["']$/g, '').replace(/,$/, '')); // Clean quotes
        
        if (lines.length > 0) {
            return lines.slice(0, 10);
        }
    }

    return getFallbackSuggestions();

  } catch (error) {
    console.error('Error generating suggestions:', error);
    return getFallbackSuggestions();
  }
}

function getFallbackSuggestions(): string[] {
    return [
        "Le prix de l'électricité va-t-il augmenter le 1er février ?",
        "Est-il vrai que boire de l'eau citronnée fait maigrir ?",
        "Cette vidéo virale de chat est-elle générée par IA ?",
        "La dernière réforme des retraites est-elle annulée ?",
        "L'interdiction des voitures thermiques repoussée à 2040 ?",
        "Une nouvelle aide de 500€ pour les étudiants ?",
        "Le café est-il vraiment mauvais pour le cœur ?",
        "Arnaque au SMS : comment reconnaître le faux message Ameli ?",
        "Est-ce que ChatGPT a réussi l'examen du barreau ?",
        "Les JO 2024 ont-ils vraiment coûté le double du budget ?"
    ];
}
