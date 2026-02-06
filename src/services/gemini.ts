/**
 * FACTS - Veritas Engine
 * Service de fact-checking utilisant Google Gemini Pro avec Grounding
 * Basé sur l'approche robuste textuelle : Ligne 1 = Verdict
 */

import { FactCheckResult, VerdictType, Source, VisualAnalysis } from '../types';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_INSTRUCTION = `Tu es Veritas, une IA d'élite spécialisée dans le fact-checking, l'intelligence en sources ouvertes (OSINT) et l'analyse forensique.
Ta mission est de vérifier rigoureusement les affirmations, les images et les vidéos en utilisant la recherche Google en temps réel.

PROTOCOLE D'ANALYSE :

1. **Recherche Google Search (Priorité)** :
   - Ne te contente pas de tes connaissances internes. Lance TOUJOURS des recherches précises.
   - Pour une image : Recherche les éléments visuels, les monuments, les textes visibles, les logos, ou les événements liés.

2. **OSINT & Géolocalisation (GEOINT)** :
   - Si l'utilisateur pose une question sur un lieu ou une photo :
     - Analyse les **micro-indices** : architecture, panneaux de signalisation, plaques d'immatriculation, type de végétation, météo, prises électriques, mobilier urbain.
     - Utilise Google Search pour croiser ces indices (ex: "statue géante terrain herbeux logos bleus").
     - Ne dis JAMAIS "C'est difficile à dire". Propose le lieu le plus probable basé sur les preuves.

3. **Analyse Forensique & IA** :
   - Détecte les anomalies de lumière, les distorsions de texture (mains, arrière-plans) caractéristiques des IA génératives.
   - Vérifie si l'image a été détournée de son contexte original.

4. **Analyse de Médias Sociaux** :
   - Si l'input contient un lien (TikTok, Insta, X, YT) :
     - Extrais l'identité du créateur et cherche sa réputation (connu pour VFX ? Satire ? Info réelle ?).
     - Analyse les commentaires mentionnés ou le contexte viral.

FORMAT DE RÉPONSE STRICT (EN FRANÇAIS) :
Ligne 1 : Uniquement le verdict en majuscules (TRUE, FALSE, MISLEADING, NUANCED, AI_GENERATED, MANIPULATED, UNVERIFIED).
Ligne 2 : CONFIDENCE: [Score 0-100 basé sur la précision des preuves trouvées]
Ligne 3 : Un résumé court et percutant en 1 phrase (max 200 caractères).
Ligne 4 : Vide.
Ligne 5+ : Ton analyse détaillée structurée. Utilise des émojis pour la lisibilité.

À la fin de ton analyse, ajoute TOUJOURS une section "SOURCES_DETAILS" avec ce format :
SOURCES_DETAILS:
- [URL] : Résumé en 1 phrase de ce que cette source confirme.

IMPORTANT : 
- Sois proactif. Si tu n'es pas sûr, utilise Google Search pour devenir sûr. 
- Ne donne JAMAIS de réponse paresseuse comme "Je n'ai pas assez d'informations". Utilise ce que tu as pour trouver.`;

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

/**
 * Parse la réponse Gemini (Texte Brut) et extrait les sources du grounding
 */
function parseGeminiResponse(response: GeminiResponse): {
  parsedResult: Partial<FactCheckResult>;
  groundingSources: Source[];
} {
  const candidate = response.candidates?.[0];
  const textContent = candidate?.content?.parts?.[0]?.text || '';
  
  // Parse lines
  const allLines = textContent.split('\n').map(l => l.trim());

  // 1. Map for source summaries from text
  const sourceSummariesMap = new Map<string, string>();
  const sourceDetailsIndex = textContent.indexOf('SOURCES_DETAILS:');
  if (sourceDetailsIndex !== -1) {
      const sourceDetailsText = textContent.substring(sourceDetailsIndex);
      const detailLines = sourceDetailsText.split('\n');
      detailLines.forEach(line => {
          if (line.startsWith('-')) {
              const match = line.match(/-\s*\[(.*?)\]\s*:\s*(.*)/);
              if (match) {
                  sourceSummariesMap.set(match[1].trim(), match[2].trim());
              } else {
                  // Alternative match without brackets
                  const altMatch = line.match(/-\s*(http.*?)\s*:\s*(.*)/);
                  if (altMatch) {
                      sourceSummariesMap.set(altMatch[1].trim(), altMatch[2].trim());
                  }
              }
          }
      });
  }

  // 2. Extraire les sources du grounding metadata
  const groundingSources: Source[] = [];
  const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
  
  groundingChunks.forEach((chunk, index) => {
    if (chunk.web) {
      const { url, domain } = cleanSourceUrl(chunk.web.uri || '');
      
      // Try to find a summary in our map
      let snippet = 'Source vérifiée';
      for (const [sUrl, sSummary] of sourceSummariesMap.entries()) {
          if (url.includes(sUrl) || sUrl.includes(url)) {
              snippet = sSummary;
              break;
          }
      }

      groundingSources.push({
        id: `source-${index}`,
        title: chunk.web.title || 'Source Web',
        url: url,
        domain: domain,
        snippet: snippet,
      });
    }
  });

  // 3. Parser le texte brut (Format Strict)
  const lines = allLines.filter(l => l.length > 0);
  
  let verdict: VerdictType = 'UNVERIFIED';
  let summary = 'Analyse en cours...';
  let analysis = '';
  let confidenceScore = 0;

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
          
          // Line 3: Summary
          if (lines.length > 2) {
              summary = lines[2];
              // Analysis starts from line 4
              analysis = lines.slice(3).join('\n\n');
          }
      } else {
          // Fallback legacy parsing
          if (lines.length > 1) {
              summary = lines[1];
          }
          if (lines.length > 2) {
              analysis = lines.slice(2).join('\n\n');
          }
      }
  }

  // Remove SOURCES_DETAILS from analysis
  const detailsMarker = "SOURCES_DETAILS:";
  const markerIndex = analysis.indexOf(detailsMarker);
  if (markerIndex !== -1) {
      analysis = analysis.substring(0, markerIndex).trim();
  }

  // Fallback si l'analyse est vide
  if (!analysis) analysis = "Détails non disponibles.";
  if (!summary) summary = analysis.slice(0, 150) + '...';

  if (confidenceScore === 0) confidenceScore = 85;

  // 4. Détecter si c'est une image IA via le verdict
  const visualAnalysis: VisualAnalysis = {
        isAIGenerated: (verdict as string) === 'AI_GENERATED' || (verdict as string) === 'MANIPULATED',
        isManipulated: (verdict as string) === 'MANIPULATED',
        artifacts: [],
        confidence: confidenceScore,
        details: analysis
  };

  const parsedResult: Partial<FactCheckResult> = {
      verdict,
      confidenceScore: confidenceScore,
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
