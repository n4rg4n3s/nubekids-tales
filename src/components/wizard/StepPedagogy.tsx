// src/components/wizard/StepPedagogy.tsx
// Paso 2: El Viaje Interior — modelo "Ancla + Foco"
// · ANCLA: la gran pasión/sueño (1 selección) → el mundo del cuento
// · FOCO: UNA categoría → UNA sub-opción → lo único que trabaja el cuento
// · Toque final opcional: 1 valor de refuerzo + contexto libre

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FocusCategory, PedagogyProfile } from '../../types';
import {
  CUSTOM_OPTION_ID,
  FOCUS_CATEGORIES,
  PASSION_OPTIONS,
  getFocusCategory,
  resolveAnchorLabel,
  resolveFocusLabel,
  resolveReinforcementLabel,
} from '../../config/pedagogyCatalog';

export type PedagogyData = PedagogyProfile;

interface StepPedagogyProps {
  data: PedagogyData;
  onChange: (data: PedagogyData) => void;
}

const VALUE_CATEGORY = getFocusCategory('value');

export default function StepPedagogy({ data, onChange }: StepPedagogyProps) {
  const [editingCustomAnchor, setEditingCustomAnchor] = useState(false);
  const [editingCustomFocus, setEditingCustomFocus] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);

  const selectedCategory = data.focus ? getFocusCategory(data.focus.category) : null;

  // ── ANCLA ──────────────────────────────────────────────────────
  const selectAnchor = (optionId: string) => {
    setEditingCustomAnchor(false);
    onChange({
      ...data,
      anchor: data.anchor?.id === optionId ? null : { id: optionId },
    });
  };

  const setCustomAnchor = (text: string) => {
    onChange({
      ...data,
      anchor: text.trim() ? { id: CUSTOM_OPTION_ID, custom: text } : null,
    });
  };

  // ── FOCO ───────────────────────────────────────────────────────
  const selectCategory = (categoryId: FocusCategory) => {
    setEditingCustomFocus(false);
    if (data.focus?.category === categoryId) return;
    onChange({
      ...data,
      // Al cambiar de categoría se descarta la sub-opción anterior
      focus: { category: categoryId, id: '' },
      // Si la nueva categoría es "valor", el refuerzo secundario sobra
      reinforcementValue: categoryId === 'value' ? null : data.reinforcementValue,
    });
  };

  const selectFocusOption = (optionId: string) => {
    if (!data.focus) return;
    setEditingCustomFocus(false);
    onChange({
      ...data,
      focus: {
        ...data.focus,
        id: data.focus.id === optionId ? '' : optionId,
        custom: undefined,
      },
    });
  };

  const setCustomFocus = (text: string) => {
    if (!data.focus) return;
    onChange({
      ...data,
      focus: {
        ...data.focus,
        id: text.trim() ? CUSTOM_OPTION_ID : '',
        custom: text,
      },
    });
  };

  const setFocusNuance = (text: string) => {
    if (!data.focus) return;
    onChange({ ...data, focus: { ...data.focus, nuance: text } });
  };

  // ── TOQUE FINAL ────────────────────────────────────────────────
  const selectReinforcement = (valueId: string) => {
    onChange({
      ...data,
      reinforcementValue: data.reinforcementValue === valueId ? null : valueId,
    });
  };

  // ── Resumen vivo ───────────────────────────────────────────────
  const anchorLabel = resolveAnchorLabel(data.anchor);
  const focusLabel = resolveFocusLabel(data.focus);
  const reinforcementLabel = resolveReinforcementLabel(data.reinforcementValue);

  const chipClass = (isSelected: boolean) => `
    px-3 py-2 rounded-lg text-sm font-medium transition-all
    flex items-center gap-2 border-2
    ${isSelected
      ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-[2px_2px_0px_#1E293B]'
      : 'bg-white border-[#1E293B]/20 text-[#1E293B] hover:border-[#8B5CF6]/50'
    }
  `;

  const renderCustomChip = (
    isEditing: boolean,
    value: string,
    onEdit: () => void,
    onChangeText: (text: string) => void,
    onDone: () => void
  ) => {
    if (isEditing) {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onChangeText(e.target.value)}
          onBlur={onDone}
          onKeyDown={(e) => e.key === 'Enter' && onDone()}
          placeholder="1-4 palabras"
          maxLength={40}
          autoFocus
          className="px-3 py-2 rounded-lg text-sm font-medium border-2 border-[#8B5CF6] bg-white text-[#1E293B] focus:outline-none w-36"
        />
      );
    }

    return (
      <button
        type="button"
        onClick={onEdit}
        className={`
          px-3 py-2 rounded-lg text-sm font-medium transition-all
          flex items-center gap-2 border-2
          ${value.trim()
            ? 'bg-[#FBBF24] text-[#1E293B] border-[#FBBF24] shadow-[2px_2px_0px_#1E293B]'
            : 'bg-white border-dashed border-[#1E293B]/30 text-[#1E293B]/60 hover:border-[#8B5CF6]/50'
          }
        `}
      >
        <span>✏️</span>
        <span>{value.trim() || 'Otro...'}</span>
      </button>
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
              Un mundo que le apasiona + una sola cosa a trabajar
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...data, enabled: !data.enabled })}
            aria-label="Activar personalización pedagógica"
            className={`
              relative w-14 h-8 rounded-full transition-all duration-300 border-2 shrink-0
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
            className="space-y-4"
          >
            {/* ── 1 · SU MUNDO (Ancla) ─────────────────────────── */}
            <div className="border-3 border-[#1E293B]/20 rounded-xl p-4 bg-white">
              <p className="font-bold text-[#1E293B] text-sm">
                1 · ¿Cuál es su gran pasión o sueño?
              </p>
              <p className="text-xs text-[#1E293B]/50 mt-0.5 mb-3">
                Será el escenario de toda la aventura
              </p>
              <div className="flex flex-wrap gap-2">
                {PASSION_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => selectAnchor(option.id)}
                    className={chipClass(data.anchor?.id === option.id)}
                  >
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
                {renderCustomChip(
                  editingCustomAnchor,
                  data.anchor?.id === CUSTOM_OPTION_ID ? data.anchor.custom ?? '' : '',
                  () => setEditingCustomAnchor(true),
                  setCustomAnchor,
                  () => setEditingCustomAnchor(false)
                )}
              </div>
            </div>

            {/* ── 2 · LA MISIÓN (Foco único) ───────────────────── */}
            <div className="border-3 border-[#1E293B]/20 rounded-xl p-4 bg-white">
              <p className="font-bold text-[#1E293B] text-sm">
                2 · ¿Qué quieres que trabaje este cuento?
              </p>
              <p className="text-xs text-[#1E293B]/50 mt-0.5 mb-3">
                Elige una sola cosa: en 10 páginas, un mensaje único llega más hondo
              </p>

              {/* Tarjetas de categoría (excluyentes) */}
              <div className="grid grid-cols-2 gap-2">
                {FOCUS_CATEGORIES.map((category) => {
                  const isSelected = data.focus?.category === category.id;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => selectCategory(category.id)}
                      aria-pressed={isSelected}
                      className={`
                        rounded-xl border-3 p-3 text-left transition-all
                        ${isSelected
                          ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 shadow-[3px_3px_0px_#1E293B]'
                          : 'border-[#1E293B]/20 bg-white hover:border-[#8B5CF6]/50'
                        }
                      `}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xl leading-none">{category.icon}</span>
                        <div>
                          <p className="font-bold text-xs text-[#1E293B]">{category.label}</p>
                          <p className="mt-0.5 text-[11px] leading-snug text-[#1E293B]/60">
                            {category.subtitle}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Sub-opciones de la categoría elegida */}
              <AnimatePresence mode="wait">
                {selectedCategory && (
                  <motion.div
                    key={selectedCategory.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t-2 border-[#1E293B]/10">
                      <div className="flex flex-wrap gap-2">
                        {selectedCategory.options.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => selectFocusOption(option.id)}
                            className={chipClass(data.focus?.id === option.id)}
                          >
                            <span>{option.icon}</span>
                            <span>{option.label}</span>
                          </button>
                        ))}
                        {renderCustomChip(
                          editingCustomFocus,
                          data.focus?.id === CUSTOM_OPTION_ID ? data.focus.custom ?? '' : '',
                          () => setEditingCustomFocus(true),
                          setCustomFocus,
                          () => setEditingCustomFocus(false)
                        )}
                      </div>

                      {/* Matiz opcional */}
                      {(data.focus?.id ?? '') !== '' && (
                        <input
                          type="text"
                          value={data.focus?.nuance ?? ''}
                          onChange={(e) => setFocusNuance(e.target.value)}
                          placeholder="¿Quieres contarnos algo de esto? (opcional)"
                          maxLength={80}
                          className="mt-3 w-full px-3 py-2 rounded-lg border-2 border-[#1E293B]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── 3 · EL TOQUE FINAL (opcional) ────────────────── */}
            <div className="border-3 border-[#1E293B]/20 rounded-xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setExtrasOpen(!extrasOpen)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <p className="font-bold text-[#1E293B] text-sm">
                  3 · El toque final <span className="font-normal text-[#1E293B]/50">(opcional)</span>
                </p>
                <span
                  className={`text-[#1E293B]/50 transition-transform duration-200 ${extrasOpen ? 'rotate-180' : ''}`}
                >
                  ▼
                </span>
              </button>

              <AnimatePresence>
                {extrasOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4 border-t-2 border-[#1E293B]/10 pt-3 bg-gray-50">
                      {/* Valor de refuerzo — oculto si el foco YA es un valor */}
                      {data.focus?.category !== 'value' && VALUE_CATEGORY && (
                        <div>
                          <p className="text-xs font-bold text-[#1E293B]/70 mb-2">
                            ¿Un valor extra para el final? (máx. 1)
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {VALUE_CATEGORY.options.map((option) => (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => selectReinforcement(option.id)}
                                className={chipClass(data.reinforcementValue === option.id)}
                              >
                                <span>{option.icon}</span>
                                <span>{option.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Contexto libre */}
                      <div>
                        <p className="text-xs font-bold text-[#1E293B]/70 mb-2">
                          ¿Algo más que debamos saber?
                        </p>
                        <textarea
                          value={data.freeformContext ?? ''}
                          onChange={(e) => onChange({ ...data, freeformContext: e.target.value })}
                          placeholder="Ej: Tiene una amiga imaginaria llamada Luna, le calma su peluche azul..."
                          className="w-full px-4 py-3 rounded-xl border-2 border-[#1E293B]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] resize-none bg-white"
                          rows={3}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Resumen vivo ─────────────────────────────────── */}
            {(anchorLabel || focusLabel) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-[#34D399]/10 rounded-xl border-2 border-[#34D399]/30"
              >
                <p className="text-sm text-[#1E293B]">
                  <span className="font-bold text-[#34D399]">✓ El cuento:</span>{' '}
                  {anchorLabel && (
                    <>su pasión por <strong>{anchorLabel}</strong> será el escenario</>
                  )}
                  {anchorLabel && focusLabel && ' para trabajar '}
                  {!anchorLabel && focusLabel && 'trabajará '}
                  {focusLabel && <strong>{focusLabel.toLowerCase()}</strong>}
                  {reinforcementLabel && (
                    <>, con un toque final de <strong>{reinforcementLabel.toLowerCase()}</strong></>
                  )}
                  .
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
