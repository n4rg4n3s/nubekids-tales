// src/components/AgeGroupSelector.tsx
import { motion } from 'framer-motion';
import type { AgeGroup } from '../types';
import { AGE_GROUP_CONFIGS } from '../types';

interface AgeGroupSelectorProps {
  selected: AgeGroup | null;
  onSelect: (ageGroup: AgeGroup) => void;
}

const AGE_GROUP_UI: Record<AgeGroup, { emoji: string; color: string; hoverColor: string; borderColor: string; description: string }> = {
  tiny: {
    emoji: '🧸',
    color: 'bg-pink-400',
    hoverColor: 'hover:bg-pink-500',
    borderColor: 'border-pink-600',
    description: 'Frases cortitas y mucha repeticion'
  },
  little: {
    emoji: '🎨',
    color: 'bg-sky-400',
    hoverColor: 'hover:bg-sky-500',
    borderColor: 'border-sky-600',
    description: 'Mas palabras, primeras aventuras'
  },
  reader: {
    emoji: '📚',
    color: 'bg-purple-400',
    hoverColor: 'hover:bg-purple-500',
    borderColor: 'border-purple-600',
    description: 'Vocabulario rico, giros narrativos'
  }
};

export default function AgeGroupSelector({ selected, onSelect }: AgeGroupSelectorProps) {
  const ageGroups: AgeGroup[] = ['tiny', 'little', 'reader'];

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-xl text-[#1E293B]">
        Edad del protagonista
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ageGroups.map((ageGroup) => {
          const config = AGE_GROUP_CONFIGS[ageGroup];
          const ui = AGE_GROUP_UI[ageGroup];
          const isSelected = selected === ageGroup;

          return (
            <motion.button
              key={ageGroup}
              onClick={() => onSelect(ageGroup)}
              className={`
                relative p-6 rounded-xl
                border-4 ${isSelected ? ui.borderColor : 'border-[#1E293B]'}
                ${isSelected ? ui.color : 'bg-white'}
                ${!isSelected ? ui.hoverColor : ''}
                transition-all duration-200
                ${isSelected ? 'shadow-[4px_4px_0px_0px_rgba(30,41,59,1)]' : 'shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]'}
                hover:shadow-[6px_6px_0px_0px_rgba(30,41,59,1)]
                active:shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]
                active:translate-x-[2px] active:translate-y-[2px]
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-5xl mb-3">
                {ui.emoji}
              </div>

              <div className="font-bold text-lg text-[#1E293B] mb-1">
                {config.label}
              </div>

              <div className="text-sm text-[#1E293B]/70">
                {ui.description}
              </div>

              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-lg"
                >
                  ✓
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {selected && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-4 bg-gray-100 rounded-lg border-2 border-[#1E293B]/20"
        >
          <div className="text-sm text-[#1E293B]/70">
            <span className="font-semibold">Ajuste narrativo:</span>
            {' '}Max {AGE_GROUP_CONFIGS[selected].maxWordsPerPage} palabras/pagina,
            complejidad {AGE_GROUP_CONFIGS[selected].sentenceComplexity},
            estructura {AGE_GROUP_CONFIGS[selected].narrativeStructure}.
          </div>
        </motion.div>
      )}
    </div>
  );
}