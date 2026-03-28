// src/components/wizard/StepPedagogy.tsx
// Paso 2: El Viaje Interior - Personalización pedagógica sutil

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PedagogyData {
  enabled: boolean;
  behaviorChallenges: string[];
  skillsToReinforce: string[];
  emotionalContext: string[];
  motivations: string[];
  valuesToTransmit: string[];
  freeformContext: string;
  // Campos "Otro" personalizados
  customBehavior: string;
  customSkill: string;
  customEmotion: string;
  customMotivation: string;
  customValue: string;
}

interface StepPedagogyProps {
  data: PedagogyData;
  onChange: (data: PedagogyData) => void;
}

const SECTIONS = {
  behaviorChallenges: {
    label: '¿Hay algo que quieras trabajar con el cuento?',
    subtitle: 'Selecciona si aplica',
    customField: 'customBehavior' as const,
    options: [
      { id: 'tantrums', label: 'Gestionar emociones', icon: '🌋' },
      { id: 'sharing', label: 'Compartir', icon: '🤝' },
      { id: 'night-fears', label: 'Miedos nocturnos', icon: '🌙' },
      { id: 'sibling-rivalry', label: 'Celos de hermanos', icon: '👶' },
      { id: 'new-school', label: 'Adaptación escolar', icon: '🏫' },
      { id: 'shyness', label: 'Timidez', icon: '🙈' },
      { id: 'separation', label: 'Ansiedad separación', icon: '💔' },
      { id: 'eating', label: 'Comer mejor', icon: '🥦' },
    ],
  },
  skillsToReinforce: {
    label: '¿Qué habilidades quieres potenciar?',
    subtitle: 'El cuento las reforzará sutilmente',
    customField: 'customSkill' as const,
    options: [
      { id: 'reading', label: 'Amor por la lectura', icon: '📚' },
      { id: 'autonomy', label: 'Autonomía', icon: '⭐' },
      { id: 'creativity', label: 'Creatividad', icon: '🎨' },
      { id: 'problem-solving', label: 'Resolver problemas', icon: '🧩' },
      { id: 'focus', label: 'Concentración', icon: '🎯' },
      { id: 'patience', label: 'Paciencia', icon: '🐢' },
    ],
  },
  emotionalContext: {
    label: '¿Está viviendo alguna situación especial?',
    subtitle: 'El cuento puede ayudar a procesarla',
    customField: 'customEmotion' as const,
    options: [
      { id: 'new-sibling', label: 'Nuevo hermano', icon: '👶' },
      { id: 'moving', label: 'Mudanza', icon: '📦' },
      { id: 'loss', label: 'Pérdida', icon: '🌈' },
      { id: 'parents-divorce', label: 'Separación padres', icon: '💛' },
      { id: 'illness', label: 'Enfermedad', icon: '🏥' },
      { id: 'new-pet', label: 'Nueva mascota', icon: '🐕' },
    ],
  },
  motivations: {
    label: '¿Cuál es su gran pasión o sueño?',
    subtitle: 'Lo integraremos en la aventura',
    customField: 'customMotivation' as const,
    options: [
      { id: 'football', label: 'Fútbol', icon: '⚽' },
      { id: 'dance', label: 'Baile', icon: '💃' },
      { id: 'science', label: 'Ciencia', icon: '🚀' },
      { id: 'art', label: 'Arte', icon: '🖌️' },
      { id: 'animals', label: 'Animales', icon: '🦁' },
      { id: 'music', label: 'Música', icon: '🎵' },
      { id: 'cooking', label: 'Cocina', icon: '👨‍🍳' },
      { id: 'sports', label: 'Deportes', icon: '🏃' },
    ],
  },
  valuesToTransmit: {
    label: '¿Qué valores quieres transmitir?',
    subtitle: 'El mensaje central del cuento',
    customField: 'customValue' as const,
    options: [
      { id: 'empathy', label: 'Empatía', icon: '❤️' },
      { id: 'perseverance', label: 'Perseverancia', icon: '💪' },
      { id: 'honesty', label: 'Honestidad', icon: '✨' },
      { id: 'respect', label: 'Respeto', icon: '🌍' },
      { id: 'courage', label: 'Valentía', icon: '🦁' },
      { id: 'gratitude', label: 'Gratitud', icon: '🙏' },
      { id: 'teamwork', label: 'Trabajo en equipo', icon: '🤜🤛' },
      { id: 'self-love', label: 'Amor propio', icon: '💖' },
    ],
  },
};

type SectionKey = keyof typeof SECTIONS;

export default function StepPedagogy({ data, onChange }: StepPedagogyProps) {
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>(null);
  const [editingCustom, setEditingCustom] = useState<SectionKey | null>(null);

  const toggleOption = (section: SectionKey, optionId: string) => {
    const currentValues = data[section] as string[];
    const newValues = currentValues.includes(optionId)
      ? currentValues.filter((id) => id !== optionId)
      : [...currentValues, optionId];
    
    onChange({ ...data, [section]: newValues });
  };

  const handleCustomChange = (section: SectionKey, value: string) => {
    const customField = SECTIONS[section].customField;
    onChange({ ...data, [customField]: value });
  };

  const getSelectedCount = (section: SectionKey): number => {
    const customField = SECTIONS[section].customField;
    const hasCustom = data[customField]?.trim() ? 1 : 0;
    return (data[section] as string[]).length + hasCustom;
  };

  const getTotalSelected = (): number => {
    return (
      data.behaviorChallenges.length +
      data.skillsToReinforce.length +
      data.emotionalContext.length +
      data.motivations.length +
      data.valuesToTransmit.length +
      (data.customBehavior?.trim() ? 1 : 0) +
      (data.customSkill?.trim() ? 1 : 0) +
      (data.customEmotion?.trim() ? 1 : 0) +
      (data.customMotivation?.trim() ? 1 : 0) +
      (data.customValue?.trim() ? 1 : 0)
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      {/* Toggle principal */}
      <div className="p-4 bg-gradient-to-r from-[#8B5CF6]/10 to-[#38BDF8]/10 rounded-xl border-3 border-[#8B5CF6]/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[#1E293B]">
              ¿Quieres personalizar el mensaje del cuento?
            </h3>
            <p className="text-sm text-[#1E293B]/60 mt-1">
              Podemos adaptar la historia para trabajar algo específico
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...data, enabled: !data.enabled })}
            className={`
              relative w-14 h-8 rounded-full transition-all duration-300 border-2
              ${data.enabled 
                ? 'bg-[#8B5CF6] border-[#8B5CF6]' 
                : 'bg-[#1E293B]/20 border-[#1E293B]/30'
              }
            `}
          >
            <div
              className={`
                absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300
                ${data.enabled ? 'left-7' : 'left-0.5'}
              `}
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {data.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {/* Secciones colapsables */}
            {(Object.keys(SECTIONS) as SectionKey[]).map((sectionKey) => {
              const section = SECTIONS[sectionKey];
              const isExpanded = expandedSection === sectionKey;
              const selectedCount = getSelectedCount(sectionKey);
              const customField = section.customField;
              const customValue = data[customField] || '';

              return (
                <div
                  key={sectionKey}
                  className="border-3 border-[#1E293B]/20 rounded-xl overflow-hidden"
                >
                  {/* Header de sección */}
                  <button
                    type="button"
                    onClick={() => setExpandedSection(isExpanded ? null : sectionKey)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-left">
                      <p className="font-bold text-[#1E293B] text-sm">
                        {section.label}
                      </p>
                      {selectedCount > 0 && (
                        <p className="text-xs text-[#8B5CF6] font-medium mt-0.5">
                          {selectedCount} seleccionado{selectedCount > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedCount > 0 && (
                        <span className="w-6 h-6 bg-[#8B5CF6] text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {selectedCount}
                        </span>
                      )}
                      <span
                        className={`text-[#1E293B]/50 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      >
                        ▼
                      </span>
                    </div>
                  </button>

                  {/* Contenido expandible */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 py-3 bg-gray-50 border-t-2 border-[#1E293B]/10">
                          <p className="text-xs text-[#1E293B]/50 mb-3">
                            {section.subtitle}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {section.options.map((option) => {
                              const isSelected = (data[sectionKey] as string[]).includes(option.id);
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() => toggleOption(sectionKey, option.id)}
                                  className={`
                                    px-3 py-2 rounded-lg text-sm font-medium transition-all
                                    flex items-center gap-2 border-2
                                    ${isSelected
                                      ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-[2px_2px_0px_#1E293B]'
                                      : 'bg-white border-[#1E293B]/20 text-[#1E293B] hover:border-[#8B5CF6]/50'
                                    }
                                  `}
                                >
                                  <span>{option.icon}</span>
                                  <span>{option.label}</span>
                                </button>
                              );
                            })}

                            {/* Opción "Otro" - como chip editable */}
                            {editingCustom === sectionKey ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={customValue}
                                  onChange={(e) => handleCustomChange(sectionKey, e.target.value)}
                                  onBlur={() => setEditingCustom(null)}
                                  onKeyDown={(e) => e.key === 'Enter' && setEditingCustom(null)}
                                  placeholder="1-4 palabras"
                                  maxLength={30}
                                  autoFocus
                                  className="px-3 py-2 rounded-lg text-sm font-medium border-2 border-[#8B5CF6] bg-white text-[#1E293B] focus:outline-none w-32"
                                />
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingCustom(sectionKey)}
                                className={`
                                  px-3 py-2 rounded-lg text-sm font-medium transition-all
                                  flex items-center gap-2 border-2
                                  ${customValue.trim()
                                    ? 'bg-[#FBBF24] text-[#1E293B] border-[#FBBF24] shadow-[2px_2px_0px_#1E293B]'
                                    : 'bg-white border-dashed border-[#1E293B]/30 text-[#1E293B]/60 hover:border-[#8B5CF6]/50'
                                  }
                                `}
                              >
                                <span>✏️</span>
                                <span>{customValue.trim() || 'Otro...'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Contexto adicional */}
            <div className="mt-4">
              <label className="block text-sm font-bold text-[#1E293B]/70 mb-2">
                ¿Algo más que debamos saber? (opcional)
              </label>
              <textarea
                value={data.freeformContext}
                onChange={(e) => onChange({ ...data, freeformContext: e.target.value })}
                placeholder="Ej: Le encantan los dinosaurios, tiene una amiga imaginaria llamada Luna..."
                className="w-full px-4 py-3 rounded-xl border-3 border-[#1E293B]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] resize-none"
                rows={3}
              />
            </div>

            {/* Resumen */}
            {getTotalSelected() > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-[#34D399]/10 rounded-xl border-2 border-[#34D399]/30"
              >
                <p className="text-sm text-[#1E293B]">
                  <span className="font-bold text-[#34D399]">✓ Perfecto.</span>{' '}
                  El cuento se adaptará para trabajar {getTotalSelected()} aspecto{getTotalSelected() > 1 ? 's' : ''} de forma sutil y positiva.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mensaje si no activa */}
      {!data.enabled && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-[#1E293B]/50 text-center py-6 bg-gray-50 rounded-xl"
        >
          ✨ El cuento será una aventura divertida e inspiradora
        </motion.p>
      )}
    </motion.div>
  );
}
