// src/components/wizard/StepStory.tsx
// Paso 4: La Historia - Género visual e idioma
// La edad del lector se infiere del Step 1 (edad del protagonista)

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Genre, Language, TenantConfig, AgeGroup } from '../../types';
import { GENRES, LANGUAGES, AGE_GROUP_CONFIGS } from '../../types';

export interface StoryData {
  ageGroup: AgeGroup;
  genre: Genre;
  language: Language;
}

interface StepStoryProps {
  data: StoryData;
  onChange: (data: StoryData) => void;
  tenantConfig: TenantConfig;
  inferredAgeGroup: AgeGroup;
}

// Previews neutrales por género. No dependen del tenant ni del vertical legacy.
const STYLE_IMAGES: Record<Genre, string> = {
  '3D Animation Magic': '/assets/images/3d-animation-magic.webp',
  'Classic Fairytale': '/assets/images/classic-fairytale.webp',
  'Anime Adventure': '/assets/images/anime-adventure.webp',
  'Whimsical Claymation': '/assets/images/whimsical-claymation.webp',
  'Custom': '/assets/images/custom.webp',
};

// Descripciones por género (sin emojis)
const GENRE_DESCRIPTIONS: Record<Genre, string> = {
  '3D Animation Magic': 'Estilo Pixar/Disney moderno',
  'Classic Fairytale': 'Ilustración de cuento clásico',
  'Anime Adventure': 'Estilo manga japonés',
  'Whimsical Claymation': 'Estilo plastilina/stop-motion',
  'Custom': 'Estilo personalizado',
};

// Banderas por idioma
const LANGUAGE_FLAGS: Record<Language, string> = {
  'Español': 'ES',
  'English': 'GB',
  'Français': 'FR',
  'Português': 'PT',
  'Italiano': 'IT',
};

const AGE_GROUP_UI: Record<AgeGroup, { emoji: string; description: string }> = {
  baby: {
    emoji: '🍼',
    description: 'Texto mínimo, ritmo oral e imagen claramente protagonista',
  },
  tiny: {
    emoji: '🌟',
    description: 'Frases cortas, repetición y una idea emocional por página',
  },
  little: {
    emoji: '🚀',
    description: 'Aventura simple con causa y efecto, deseo y resolución claros',
  },
  reader: {
    emoji: '📖',
    description: 'Nudo y desenlace completos, vocabulario accesible y más autonomía',
  },
};

export default function StepStory({
  data,
  onChange,
  tenantConfig,
  inferredAgeGroup
}: StepStoryProps) {

  // Actualizar ageGroup si es diferente al inferido
  // IMPORTANTE: Usar useEffect para evitar setState durante render
  useEffect(() => {
    if (data.ageGroup !== inferredAgeGroup) {
      onChange({ ...data, ageGroup: inferredAgeGroup });
    }
  }, [inferredAgeGroup, data, onChange]);

  const ageGroupConfig = AGE_GROUP_CONFIGS[inferredAgeGroup];
  const ageGroupUi = AGE_GROUP_UI[inferredAgeGroup];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Info de edad detectada */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-gradient-to-r from-[#8B5CF6]/10 to-[#38BDF8]/10 rounded-xl border-2 border-[#8B5CF6]/30"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{ageGroupUi.emoji}</span>
          <div>
            <p className="font-bold text-[#1E293B]">
              Cuento para {ageGroupConfig.label}
            </p>
            <p className="text-sm text-[#1E293B]/60">
              {ageGroupUi.description}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Selector de género visual */}
      <div>
        <label className="block text-sm font-bold text-[#1E293B] mb-3">
          Estilo visual del cuento
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {GENRES.filter(g => tenantConfig.activeGenres.includes(g)).map((genre) => {
            const isSelected = data.genre === genre;
            const imageUrl = STYLE_IMAGES[genre];

            return (
              <motion.button
                key={genre}
                type="button"
                onClick={() => onChange({ ...data, genre })}
                className={`
                  relative overflow-hidden rounded-xl border-3 text-left transition-all
                  ${isSelected
                    ? 'border-[#8B5CF6] shadow-[4px_4px_0px_#1E293B]'
                    : 'border-[#1E293B]/20 hover:border-[#8B5CF6]/50'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Imagen de fondo */}
                <div
                  className="aspect-[4/3] bg-cover bg-center"
                  style={{ backgroundImage: `url(${imageUrl})` }}
                >
                  {/* Overlay gradient para legibilidad */}
                  <div className={`
                    absolute inset-0 
                    ${isSelected
                      ? 'bg-gradient-to-t from-[#8B5CF6]/90 via-[#8B5CF6]/40 to-transparent'
                      : 'bg-gradient-to-t from-black/70 via-black/30 to-transparent'
                    }
                  `} />
                </div>

                {/* Texto sobre la imagen */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-white'}`}>
                    {genre}
                  </p>
                  <p className="text-xs text-white/80 mt-0.5">
                    {GENRE_DESCRIPTIONS[genre]}
                  </p>
                </div>

                {/* Checkmark si está seleccionado */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <span className="text-[#8B5CF6] text-sm">✓</span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selector de idioma */}
      <div>
        <label className="block text-sm font-bold text-[#1E293B] mb-3">
          Idioma del cuento
        </label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.filter(l => tenantConfig.activeLanguages.includes(l)).map((language) => {
            const isSelected = data.language === language;
            const flagCode = LANGUAGE_FLAGS[language];

            return (
              <motion.button
                key={language}
                type="button"
                onClick={() => onChange({ ...data, language })}
                className={`
                  px-4 py-2.5 rounded-xl border-3 font-bold text-sm flex items-center gap-2 transition-all
                  ${isSelected
                    ? 'border-[#8B5CF6] bg-[#8B5CF6] text-white shadow-[3px_3px_0px_#1E293B]'
                    : 'border-[#1E293B]/20 bg-white text-[#1E293B] hover:border-[#8B5CF6]/50'
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-xs font-mono bg-white/20 px-1.5 py-0.5 rounded">
                  {flagCode}
                </span>
                <span>{language}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Resumen final */}
      {data.genre && data.language && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-[#34D399]/10 to-[#FBBF24]/10 rounded-xl border-2 border-[#34D399]/30"
        >
          <p className="text-sm text-[#1E293B]">
            <span className="font-bold text-[#34D399]">✓ Todo listo:</span>{' '}
            Cuento en <strong>{data.language}</strong> con estilo <strong>{data.genre}</strong>
            {' '}para peques de <strong>{ageGroupConfig.label}</strong>
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
