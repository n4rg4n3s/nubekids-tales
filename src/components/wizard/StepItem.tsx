// src/components/wizard/StepItem.tsx
// Paso 3: El Objeto Mágico - Opcional, con contexto de tienda

import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { TenantConfig } from '../../types';

export interface ItemData {
  image: string | null;
  description: string;
}

interface StepItemProps {
  data: ItemData;
  onChange: (data: ItemData) => void;
  tenantConfig: TenantConfig;
}

export default function StepItem({ data, onChange, tenantConfig }: StepItemProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      onChange({ ...data, image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    onChange({ ...data, image: null });
  };

  // Determinar el título según el tenant
  const getTitle = () => {
    if (tenantConfig.storeName) {
      return `${tenantConfig.itemLabelSingular} de ${tenantConfig.storeName}`;
    }
    return tenantConfig.itemLabelSingular || 'El Objeto Mágico';
  };

  // Determinar si mostrar sugerencia de tienda
  const showStoreSuggestion = tenantConfig.integrationLevel === 'standard' && tenantConfig.storeName;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      {/* Header con contexto de tienda */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-[#1E293B]">
          {getTitle()}
        </h3>
        <p className="text-sm text-[#1E293B]/60 mt-1">
          El objeto que tendrá poderes mágicos en la historia
        </p>
      </div>

      {/* Sugerencia para plan standard */}
      {showStoreSuggestion && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-[#FBBF24]/20 to-[#F59E0B]/20 rounded-xl border-2 border-[#FBBF24]/40"
        >
          <p className="text-sm text-[#1E293B]">
            <span className="font-bold">💡 Sugerencia:</span>{' '}
            ¿Has comprado algo especial en <strong>{tenantConfig.storeName}</strong>?{' '}
            ¡Sube una foto y lo convertiremos en el objeto mágico del cuento!
          </p>
        </motion.div>
      )}

      {/* Upload de imagen */}
      <div>
        <label className="block text-sm font-bold text-[#1E293B] mb-2">
          Foto del objeto <span className="text-[#1E293B]/50 font-normal">(opcional)</span>
        </label>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        
        <motion.div
          onClick={() => fileInputRef.current?.click()}
          className={`
            w-full h-48 rounded-xl cursor-pointer border-4 border-dashed
            flex items-center justify-center transition-all
            ${data.image 
              ? 'border-[#34D399] bg-[#34D399]/10' 
              : 'border-[#1E293B]/30 hover:border-[#8B5CF6]/50 bg-gray-50 hover:bg-[#8B5CF6]/5'
            }
          `}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {data.image ? (
            <div className="relative w-full h-full p-2">
              <img 
                src={data.image} 
                alt="Preview del objeto" 
                className="w-full h-full object-contain rounded-lg"
                style={{ transform: 'rotate(-2deg)' }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage();
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg hover:bg-red-600 transition-colors"
              >
                ✕
              </button>
              <div className="absolute bottom-2 left-2 bg-[#34D399] text-white rounded-full px-3 py-1 text-xs font-bold shadow-lg">
                ✓ Listo
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-4xl mb-2">👟</p>
              <p className="text-[#1E293B]/60 font-medium">
                Sube una foto de {tenantConfig.itemLabel}
              </p>
              <p className="text-[#1E293B]/40 text-sm mt-1">JPG, PNG o WebP</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Descripción del objeto - MÁS RELEVANCIA */}
      <div className={`transition-all ${!data.image ? 'ring-2 ring-[#8B5CF6]/50 rounded-xl p-4 bg-[#8B5CF6]/5' : ''}`}>
        {!data.image && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-3 p-3 bg-[#8B5CF6]/10 rounded-lg border border-[#8B5CF6]/30"
          >
            <p className="text-sm text-[#1E293B] font-medium">
              ✏️ <strong>Sin foto?</strong> No te preocupes. Describe el objeto y lo incluiremos en el cuento.
            </p>
          </motion.div>
        )}
        
        <label className="block text-sm font-bold text-[#1E293B] mb-2">
          Descripción del objeto {!data.image && <span className="text-[#8B5CF6]">(recomendado)</span>}
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder={tenantConfig.itemPlaceholderText || `Ej: Zapatillas rojas con rayas brillantes y velcro de estrellitas...`}
          className="w-full px-4 py-3 rounded-xl border-3 border-[#1E293B]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] resize-none"
          rows={3}
        />
        <p className="text-xs text-[#1E293B]/50 mt-2">
          💡 Cuanto más detallada sea la descripción, más personalizado será el cuento.
        </p>
      </div>

      {/* Preview / Resumen */}
      {(data.image || data.description.trim()) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-[#34D399]/10 to-[#38BDF8]/10 rounded-xl border-2 border-[#34D399]/30"
        >
          <p className="text-sm font-bold text-[#34D399] mb-1">✓ Objeto mágico configurado</p>
          <p className="text-sm text-[#1E293B]/70">
            {data.image && data.description.trim() 
              ? `Con foto y descripción: "${data.description.substring(0, 50)}${data.description.length > 50 ? '...' : ''}"`
              : data.image 
                ? 'Con foto subida'
                : `Descripción: "${data.description.substring(0, 60)}${data.description.length > 60 ? '...' : ''}"`
            }
          </p>
        </motion.div>
      )}

      {/* Info de que es opcional */}
      {!data.image && !data.description.trim() && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-[#1E293B]/50 text-center py-4 bg-gray-50 rounded-xl"
        >
          💫 Puedes continuar sin objeto. El cuento tendrá magia de todas formas.
        </motion.p>
      )}
    </motion.div>
  );
}
