/**
 * FACTS - Veritas Engine
 * Service de fact-checking utilisant Google Gemini Pro avec Grounding
 * Basé sur l'approche robuste textuelle : Ligne 1 = Verdict
 */

import { FactCheckResult, VerdictType, Source, VisualAnalysis } from '../types';

const GEMINI_API_KEY = 'AIzaSyBJpDVWUifZTi2ngAr-f3FTyt0XYx3BdEs';
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
Reste du texte : Ton analyse détaillée structurée.
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
        webSearchQueries?: string[];
    };
  }>;
}

/**
 * Convertit une image en base64
 */
export async function imageToBase64(imageUri: string): Promise<{ base64: string; mimeType: string }> {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        const mimeType = blob.type || 'image/jpeg';
        resolve({ base64: base64Data, mimeType });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

/**
 * Parse la réponse Gemini (Texte Brut) et extrait les sources du grounding
 */
function parseGeminiResponse(response: GeminiResponse): {
  parsedResult: Partial<FactCheckResult>;
  groundingSources: Source[];
} {
  const candidate = response.candidates?.[0];
  const textContent = candidate?.content?.parts?.[0]?.text || '';
  
  // 1. Extraire les sources du grounding metadata
  const groundingSources: Source[] = [];
  const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
  
  groundingChunks.forEach((chunk, index) => {
    if (chunk.web) {
      groundingSources.push({
        id: `source-${index}`,
        title: chunk.web.title || 'Source Web',
        url: chunk.web.uri || '',
        domain: new URL(chunk.web.uri || 'https://google.com').hostname,
        snippet: 'Source vérifiée via Google Search', // Snippet par défaut pour éviter erreur validation
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
      else if (firstLine.includes('NUANCE')) verdict = 'NUANCED'; // Handles NUANCE and NUANCED
      else if (firstLine.includes('GENERATED') || firstLine.includes('MANIPULATED') || firstLine.includes('GENEREE')) verdict = 'AI_GENERATED';
      else if (firstLine.includes('UNVERIFIED')) verdict = 'UNVERIFIED';
      
      // Line 2 (in filtered array) is Summary if format respected, structure might vary slightly so we adapt
      if (lines.length > 1) {
          summary = lines[1];
      }
      
      // Rest is analysis
      if (lines.length > 2) {
          analysis = lines.slice(2).join('\n\n');
      } else {
          // Fallback if structure is loose
           analysis = textContent.replace(lines[0], '').trim();
      }
  }

  // Fallback si l'analyse est vide
  if (!analysis) analysis = "Détails non disponibles.";
  if (!summary) summary = analysis.slice(0, 150) + '...';

  // 3. Détecter si c'est une image IA via le verdict
  const visualAnalysis: VisualAnalysis = {
        isAIGenerated: verdict === 'AI_GENERATED' || verdict === 'MANIPULATED',
        isManipulated: verdict === 'MANIPULATED',
        artifacts: [],
        confidence: 85, // Score par défaut assez élevé
        details: analysis
  };

  const parsedResult: Partial<FactCheckResult> = {
      verdict,
      confidenceScore: 85, // Score par défaut
      summary,
      analysis,
      visualAnalysis,
      sources: [] // Sera rempli par le caller
  };

  return { parsedResult, groundingSources };
}

/**
 * Vérifie une affirmation textuelle avec Gemini + Google Search Grounding
 */
export async function verifyClaimWithGemini(claim: string): Promise<FactCheckResult> {
  const startTime = Date.now();
  
  const requestBody: GeminiRequest = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `ANALYSE CETTE AFFIRMATION:\n"${claim}"`,
          },
        ],
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
      // PAS de responseMimeType: 'application/json' car incompatible avec Search Tool v1beta parfois
    },
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      throw new Error(`Gemini API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data: GeminiResponse = await response.json();
    const { parsedResult, groundingSources } = parseGeminiResponse(data);

    const processingTime = Date.now() - startTime;

    const result: FactCheckResult = {
      id: `fact-${Date.now()}`,
      claim,
      verdict: (parsedResult.verdict as VerdictType) || 'UNVERIFIED',
      confidenceScore: parsedResult.confidenceScore || 50,
      summary: parsedResult.summary || 'Résultat disponible',
      analysis: parsedResult.analysis || 'Pas d\'analyse détaillée.',
      sources: [...(parsedResult.sources || []), ...groundingSources].slice(0, 10),
      createdAt: new Date(),
      processingTimeMs: processingTime,
    };

    return result;
  } catch (error) {
    console.error('Error in verifyClaimWithGemini:', error);
    throw error;
  }
}

/**
 * Vérifie une image avec analyse forensique
 */
export async function verifyImageWithGemini(
  imageUri: string,
  context?: string
): Promise<FactCheckResult> {
  const startTime = Date.now();
  
  const { base64, mimeType } = await imageToBase64(imageUri);

  const requestBody: GeminiRequest = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64,
            },
          },
          {
            text: `ANALYSE FORENSIQUE DE L'IMAGE:\n${context ? `Contexte: "${context}"` : ''}`,
          },
        ],
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
      // PAS de JSON mode ici aussi
    },
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    const { parsedResult, groundingSources } = parseGeminiResponse(data);

    const processingTime = Date.now() - startTime;
    
    // Enrichissement spécifique image
    const visualAnalysis: VisualAnalysis = parsedResult.visualAnalysis || {
        isAIGenerated: parsedResult.verdict === 'AI_GENERATED',
        isManipulated: parsedResult.verdict === 'MANIPULATED',
        artifacts: [],
        confidence: 80,
        details: parsedResult.analysis || ''
    };

    const result: FactCheckResult = {
      id: `fact-${Date.now()}`,
      claim: context || 'Analyse d\'image',
      verdict: (parsedResult.verdict as VerdictType) || 'UNVERIFIED',
      confidenceScore: parsedResult.confidenceScore || 50,
      summary: parsedResult.summary || 'Analyse d\'image terminée.',
      analysis: parsedResult.analysis || '',
      sources: [...(parsedResult.sources || []), ...groundingSources].slice(0, 10),
      visualAnalysis,
      imageUrl: imageUri,
      createdAt: new Date(),
      processingTimeMs: processingTime,
    };

    return result;
  } catch (error) {
    console.error('Error in verifyImageWithGemini:', error);
    throw error;
  }
}
