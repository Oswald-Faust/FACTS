import { VerdictType, IFactCheck, ISource, IVisualAnalysis } from '../models/FactCheck';
import fs from 'fs/promises';


const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_INSTRUCTION = `Tu es Veritas, une IA d'élite spécialisée dans le fact-checking et l'analyse forensique.
Ta mission est de vérifier rigoureusement les affirmations et les images en utilisant la recherche Google en temps réel.

PROTOCOLE D'ANALYSE :
1. **Recherche & Vérification** : Scanne le web pour vérifier les faits (sources récentes).
2. **Gestion des LIENS (Crucial)** :
   - Si l'input contient un lien (TikTok, YouTube, Twitter...), NE TE CONTENTE PAS DE L'URL.
   - **EXTRAIS** le nom d'utilisateur ou la chaîne de l'URL (ex: "@jonathaneditz" dans tiktok.com/@jonathaneditz...).
   - **CHERCHE** la réputation de ce créateur : Est-il connu pour des fakes ? Des VFX ? De la satire ? Du contenu IA ?
   - Utilise cette réputation pour formuler un verdict probable si la vidéo spécifique n'est pas trouvée.
3. **Analyse d'Image (si présente)** :
   - Décris ce que tu vois et détecte les artefacts d'IA.

FORMAT DE RÉPONSE STRICT (EN FRANÇAIS) :
Ligne 1 : Uniquement le verdict en majuscules parmi : "TRUE", "FALSE", "MISLEADING", "NUANCED", "AI_GENERATED", "MANIPULATED", "UNVERIFIED".
Ligne 2 : Vide.
Ligne 3 : Un résumé court et percutant en 1 phrase (max 200 caractères).
Ligne 4 : Vide.
Ligne 5+ : Ton analyse détaillée structurée.
- Si c'est un lien vidéo : Analyse le profil du créateur (ex: "Ce compte est célèbre pour ses montages VFX réalistes...").
- Ne dis JAMAIS "Je ne peux pas voir la vidéo". Dis plutôt "D'après l'analyse du profil du créateur [Nom]...".

ATTENTION:
- Réponds TOUJOURS en FRANÇAIS.
- Ne mets JAMAIS de markdown sur la première ligne.`;

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
  
  // 1. Extraire les sources du grounding metadata
  const sources: ISource[] = [];
  const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
  
  groundingChunks.forEach((chunk, index) => {
    if (chunk.web) {
      sources.push({
        title: chunk.web.title || 'Source Web',
        url: chunk.web.uri || '',
        domain: new URL(chunk.web.uri || 'https://google.com').hostname,
        snippet: 'Source vérifiée via Google Search',
        // id: `source-${index}`, // Removed as per backend model usually not storing transient IDs or it generates _id
      });
    }
  });

  // 2. Parser le texte brut (Format Strict)
  const lines = textContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let verdict: VerdictType = 'UNVERIFIED';
  let summary = 'Analyse en cours...';
  let analysis = textContent;

  if (lines.length > 0) {
      // Line 1: Verdict
      const firstLine = lines[0].toUpperCase();
      
      if (firstLine.includes('TRUE')) verdict = 'TRUE';
      else if (firstLine.includes('FALSE')) verdict = 'FALSE';
      else if (firstLine.includes('MISLEADING')) verdict = 'MISLEADING';
      else if (firstLine.includes('NUANCE')) verdict = 'NUANCED';
      else if (firstLine.includes('GENERATED') || firstLine.includes('MANIPULATED') || firstLine.includes('GENEREE')) verdict = 'AI_GENERATED';
      else if (firstLine.includes('UNVERIFIED')) verdict = 'UNVERIFIED';
      
      // Line 2 (in filtered array) is Summary
      if (lines.length > 1) {
          summary = lines[1];
      }
      
      // Rest is analysis
      if (lines.length > 2) {
          analysis = lines.slice(2).join('\n\n');
      } else {
           analysis = textContent.replace(lines[0], '').trim();
      }
  }

  // Fallback
  if (!analysis) analysis = "Détails non disponibles.";
  if (!summary) summary = analysis.slice(0, 150) + '...';

  const visualAnalysis: IVisualAnalysis = {
        isAIGenerated: (verdict as string) === 'AI_GENERATED' || (verdict as string) === 'MANIPULATED',
        isManipulated: (verdict as string) === 'MANIPULATED',
        artifacts: [], // Could extract from text if instructed
        confidence: 85,
        details: analysis
  };

  return {
      verdict,
      summary,
      analysis,
      sources,
      visualAnalysis: verdict.includes('GENERATED') || verdict.includes('MANIPULATED') ? visualAnalysis : undefined,
      confidenceScore: 85
  };
}

export async function verifyWithGemini(claim: string, imagePath?: string): Promise<any> {
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
            text: `ANALYSE FORENSIQUE DE L'IMAGE:\n${claim ? `Contexte: "${claim}"` : ''}`
        });
    } else {
        // Text Analysis
        requestBody.contents[0].parts.push({
            text: `ANALYSE CETTE AFFIRMATION:\n"${claim}"`
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
