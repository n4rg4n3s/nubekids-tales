// src/components/wizard/StepHero.tsx
// Paso 1: Datos del protagonista

import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatHeroDescription } from './stepHeroUtils';

export interface HeroData {
  name: string;
  inputMode: 'description' | 'photo';
  photo: string | null;
  gender: string;
  ageRange: string;
  hairColor: string;
  hairType: string;
  eyeColor: string;
  skinTone: string;
  peculiarities: string;
}

interface StepHeroProps {
  data: HeroData;
  onChange: (data: HeroData) => void;
}

const OPTIONS = {
  gender: [
    { value: 'girl', label: 'Niña' },
    { value: 'boy', label: 'Niño' },
    { value: 'neutral', label: 'Prefiero no decir' },
  ],
  ageRange: [
    { value: '3-4', label: '3-4 años' },
    { value: '5-6', label: '5-6 años' },
    { value: '7-8', label: '7-8 años' },
    { value: '9-10', label: '9-10 años' },
  ],
  hairColor: [
    { value: 'blonde', label: 'Rubio' },
    { value: 'brown', label: 'Castaño' },
    { value: 'dark-brown', label: 'Moreno' },
    { value: 'red', label: 'Pelirrojo' },
    { value: 'black', label: 'Negro' },
  ],
  hairType: [
    { value: 'straight', label: 'Liso' },
    { value: 'curly', label: 'Rizado' },
    { value: 'wavy', label: 'Ondulado' },
    { value: 'short', label: 'Muy corto' },
  ],
  eyeColor: [
    { value: 'brown', label: 'Marrones' },
    { value: 'blue', label: 'Azules' },
    { value: 'green', label: 'Verdes' },
    { value: 'black', label: 'Negros' },
    { value: 'hazel', label: 'Miel' },
  ],
  skinTone: [
    { value: 'very-light', label: 'Muy clara' },
    { value: 'light', label: 'Clara' },
    { value: 'medium', label: 'Media' },
    { value: 'dark', label: 'Oscura' },
    { value: 'very-dark', label: 'Muy oscura' },
  ],
};

export default function StepHero({ data, onChange }: StepHeroProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof HeroData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      onChange({ ...data, photo: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      {/* Nombre */}
      <div>
        <label className="block text-sm font-bold text-[#1E293B] mb-2">
          Nombre del protagonista <span className="text-red-500">* Obligatorio</span>
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Ej: Lucía, Pablo, Martín..."
          className="w-full px-4 py-3 rounded-xl border-3 border-[#1E293B] text-lg font-medium focus:outline-none focus:ring-4 focus:ring-[#8B5CF6]/30"
          style={{ boxShadow: '3px 3px 0px #1E293B' }}
        />
      </div>

      {/* Toggle foto/descripción */}
      <div>
        <label className="block text-sm font-bold text-[#1E293B] mb-2">
          ¿Cómo describimos al protagonista?
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => updateField('inputMode', 'description')}
            className={`
              flex-1 py-3 px-4 rounded-xl border-3 font-bold text-sm transition-all
              ${data.inputMode === 'description'
                ? 'border-[#8B5CF6] bg-[#8B5CF6] text-white'
                : 'border-[#1E293B]/30 bg-white text-[#1E293B] hover:border-[#8B5CF6]/50'
              }
            `}
            style={data.inputMode === 'description' ? { boxShadow: '3px 3px 0px #1E293B' } : {}}
          >
            📝 Describir rasgos
          </button>
          <button
            type="button"
            onClick={() => updateField('inputMode', 'photo')}
            className={`
              flex-1 py-3 px-4 rounded-xl border-3 font-bold text-sm transition-all
              ${data.inputMode === 'photo'
                ? 'border-[#8B5CF6] bg-[#8B5CF6] text-white'
                : 'border-[#1E293B]/30 bg-white text-[#1E293B] hover:border-[#8B5CF6]/50'
              }
            `}
            style={data.inputMode === 'photo' ? { boxShadow: '3px 3px 0px #1E293B' } : {}}
          >
            📷 Subir foto
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {data.inputMode === 'description' ? (
          <motion.div
            key="description"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Grid de selects - Desktop: 3 cols, Mobile: 2 cols */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Género */}
              <div>
                <label className="block text-xs font-semibold text-[#1E293B]/70 mb-1">
                  Protagonista
                </label>
                <select
                  value={data.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border-3 border-[#1E293B]/30 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] bg-white cursor-pointer"
                >
                  <option value="">Seleccionar...</option>
                  {OPTIONS.gender.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Edad */}
              <div>
                <label className="block text-xs font-semibold text-[#1E293B]/70 mb-1">
                  Edad
                </label>
                <select
                  value={data.ageRange}
                  onChange={(e) => updateField('ageRange', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border-3 border-[#1E293B]/30 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] bg-white cursor-pointer"
                >
                  <option value="">Seleccionar...</option>
                  {OPTIONS.ageRange.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Color pelo */}
              <div>
                <label className="block text-xs font-semibold text-[#1E293B]/70 mb-1">
                  Color pelo
                </label>
                <select
                  value={data.hairColor}
                  onChange={(e) => updateField('hairColor', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border-3 border-[#1E293B]/30 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] bg-white cursor-pointer"
                >
                  <option value="">Seleccionar...</option>
                  {OPTIONS.hairColor.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Tipo pelo */}
              <div>
                <label className="block text-xs font-semibold text-[#1E293B]/70 mb-1">
                  Tipo pelo
                </label>
                <select
                  value={data.hairType}
                  onChange={(e) => updateField('hairType', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border-3 border-[#1E293B]/30 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] bg-white cursor-pointer"
                >
                  <option value="">Seleccionar...</option>
                  {OPTIONS.hairType.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Color ojos */}
              <div>
                <label className="block text-xs font-semibold text-[#1E293B]/70 mb-1">
                  Color ojos
                </label>
                <select
                  value={data.eyeColor}
                  onChange={(e) => updateField('eyeColor', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border-3 border-[#1E293B]/30 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] bg-white cursor-pointer"
                >
                  <option value="">Seleccionar...</option>
                  {OPTIONS.eyeColor.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Tono piel */}
              <div>
                <label className="block text-xs font-semibold text-[#1E293B]/70 mb-1">
                  Tono piel
                </label>
                <select
                  value={data.skinTone}
                  onChange={(e) => updateField('skinTone', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border-3 border-[#1E293B]/30 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] bg-white cursor-pointer"
                >
                  <option value="">Seleccionar...</option>
                  {OPTIONS.skinTone.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rasgos especiales */}
            <div>
              <label className="block text-xs font-semibold text-[#1E293B]/70 mb-1">
                Rasgos especiales (opcional)
              </label>
              <textarea
                value={data.peculiarities}
                onChange={(e) => updateField('peculiarities', e.target.value)}
                placeholder="Ej: Lleva gafas, tiene pecas, tiene un lunar..."
                className="w-full px-4 py-3 rounded-lg border-3 border-[#1E293B]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] resize-none"
                rows={2}
              />
            </div>

            {/* Preview - Sin "Para la IA" */}
            {formatHeroDescription(data) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gradient-to-r from-[#8B5CF6]/10 to-[#38BDF8]/10 rounded-xl border-2 border-[#8B5CF6]/30"
              >
                <p className="text-sm text-[#1E293B]">
                  <span className="font-bold text-[#8B5CF6]">✨ Resumen:</span>{' '}
                  {formatHeroDescription(data)}
                </p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="photo"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <motion.div
              onClick={() => photoInputRef.current?.click()}
              className={`
                w-full h-48 rounded-xl cursor-pointer border-4 border-dashed
                flex items-center justify-center transition-all
                ${data.photo 
                  ? 'border-[#34D399] bg-[#34D399]/10' 
                  : 'border-[#1E293B]/30 hover:border-[#8B5CF6]/50 bg-gray-50 hover:bg-[#8B5CF6]/5'
                }
              `}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {data.photo ? (
                <div className="relative w-full h-full p-2">
                  <img 
                    src={data.photo} 
                    alt="Preview" 
                    className="w-full h-full object-cover rounded-lg"
                    style={{ transform: 'rotate(-2deg)' }}
                  />
                  <div className="absolute top-4 right-4 bg-[#34D399] text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold shadow-lg border-2 border-white">
                    ✓
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-4xl mb-2">📷</p>
                  <p className="text-[#1E293B]/60 font-medium">Sube una foto</p>
                  <p className="text-[#1E293B]/40 text-sm mt-1">JPG, PNG o WebP</p>
                </div>
              )}
            </motion.div>
            <p className="text-xs text-[#1E293B]/50 mt-3 text-center">
              🔒 La foto solo se usa para generar ilustraciones y no se almacena.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
