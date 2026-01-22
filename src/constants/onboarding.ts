/**
 * FACTS - Onboarding Content
 */

import { OnboardingSlide } from '../types';

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'forensic',
    title: 'Analyse Forensique',
    description: 'Notre IA Veritas analyse chaque détail avec une précision chirurgicale. Texte, images, métadonnées — rien n\'échappe à notre analyse.',
    icon: 'scan-circle',
    gradient: ['#007AFF', '#5856D6'],
  },
  {
    id: 'realtime',
    title: 'Vérification Temps Réel',
    description: 'Accédez à des millions de sources fiables en quelques secondes. Chaque affirmation est confrontée à l\'actualité mondiale.',
    icon: 'globe',
    gradient: ['#5856D6', '#AF52DE'],
  },
  {
    id: 'verdict',
    title: 'Verdicts Transparents',
    description: 'Des conclusions claires avec un score de confiance précis. Chaque source est vérifiable et traçable.',
    icon: 'shield-checkmark',
    gradient: ['#AF52DE', '#FF2D55'],
  },
];

export const VERDICTS = {
  TRUE: {
    label: 'VRAI',
    color: '#34C759',
    icon: 'checkmark-circle-fill',
    description: 'L\'information a été vérifiée et confirmée par des sources fiables.',
  },
  FALSE: {
    label: 'FAUX',
    color: '#FF3B30',
    icon: 'xmark-circle-fill',
    description: 'L\'information est incorrecte selon les preuves disponibles.',
  },
  MISLEADING: {
    label: 'TROMPEUR',
    color: '#FF9500',
    icon: 'exclamationmark-triangle-fill',
    description: 'L\'information contient des éléments vrais mais présentés de manière trompeuse.',
  },
  NUANCED: {
    label: 'NUANCÉ',
    color: '#5856D6',
    icon: 'minus-circle-fill',
    description: 'La vérité est plus complexe et nécessite une analyse approfondie.',
  },
  AI_GENERATED: {
    label: 'IMAGE IA',
    color: '#AF52DE',
    icon: 'cpu-fill',
    description: 'Cette image a été générée par une intelligence artificielle.',
  },
  MANIPULATED: {
    label: 'MANIPULÉE',
    color: '#FF2D55',
    icon: 'photo-badge-exclamationmark',
    description: 'Cette image a été modifiée ou manipulée.',
  },
  UNVERIFIED: {
    label: 'NON VÉRIFIÉ',
    color: '#8E8E93',
    icon: 'questionmark-circle-fill',
    description: 'Impossible de vérifier cette information avec les sources disponibles.',
  },
};
