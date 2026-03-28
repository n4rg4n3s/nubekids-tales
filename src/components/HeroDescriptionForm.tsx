// src/components/HeroDescriptionForm.tsx
// Formulario de características morfológicas del protagonista
// Alternativa a subir foto por privacidad

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface HeroDescription {
    gender: string;
    ageRange: string;
    hairColor: string;
    hairType: string;
    eyeColor: string;
    skinTone: string;
    peculiarities: string;
}

interface HeroDescriptionFormProps {
    onChange: (description: HeroDescription, formatted: string) => void;
}

const OPTIONS = {
    gender: [
        { value: 'girl', label: 'Niña', emoji: '👧' },
        { value: 'boy', label: 'Niño', emoji: '👦' },
        { value: 'neutral', label: 'Prefiero no decir', emoji: '🧒' },
    ],
    ageRange: [
        { value: '3-4', label: '3-4 años' },
        { value: '5-6', label: '5-6 años' },
        { value: '7-8', label: '7-8 años' },
        { value: '9-10', label: '9-10 años' },
    ],
    hairColor: [
        { value: 'blonde', label: 'Rubio', color: '#F4D03F' },
        { value: 'brown', label: 'Castaño', color: '#8B4513' },
        { value: 'dark-brown', label: 'Moreno', color: '#3D2314' },
        { value: 'red', label: 'Pelirrojo', color: '#C0392B' },
        { value: 'black', label: 'Negro', color: '#1C1C1C' },
    ],
    hairType: [
        { value: 'straight', label: 'Liso', emoji: '📏' },
        { value: 'curly', label: 'Rizado', emoji: '🌀' },
        { value: 'wavy', label: 'Ondulado', emoji: '〰️' },
        { value: 'short', label: 'Muy corto', emoji: '✂️' },
    ],
    eyeColor: [
        { value: 'brown', label: 'Marrones', color: '#8B4513' },
        { value: 'blue', label: 'Azules', color: '#3498DB' },
        { value: 'green', label: 'Verdes', color: '#27AE60' },
        { value: 'black', label: 'Negros', color: '#1C1C1C' },
        { value: 'hazel', label: 'Miel', color: '#D4A017' },
    ],
    skinTone: [
        { value: 'very-light', label: 'Muy clara', color: '#FDEBD0' },
        { value: 'light', label: 'Clara', color: '#F5CBA7' },
        { value: 'medium', label: 'Media', color: '#DC7633' },
        { value: 'dark', label: 'Oscura', color: '#A04000' },
        { value: 'very-dark', label: 'Muy oscura', color: '#6E2C00' },
    ],
};

function formatDescription(desc: HeroDescription): string {
    const parts: string[] = [];

    // Género y edad
    const genderLabel = OPTIONS.gender.find(o => o.value === desc.gender)?.label || '';
    if (desc.ageRange && genderLabel) {
        parts.push(`${genderLabel} de ${desc.ageRange} años`);
    }

    // Pelo
    const hairColorLabel = OPTIONS.hairColor.find(o => o.value === desc.hairColor)?.label?.toLowerCase();
    const hairTypeLabel = OPTIONS.hairType.find(o => o.value === desc.hairType)?.label?.toLowerCase();
    if (hairColorLabel && hairTypeLabel) {
        parts.push(`pelo ${hairColorLabel} ${hairTypeLabel}`);
    } else if (hairColorLabel) {
        parts.push(`pelo ${hairColorLabel}`);
    }

    // Ojos
    const eyeColorLabel = OPTIONS.eyeColor.find(o => o.value === desc.eyeColor)?.label?.toLowerCase();
    if (eyeColorLabel) {
        parts.push(`ojos ${eyeColorLabel}`);
    }

    // Piel
    const skinToneLabel = OPTIONS.skinTone.find(o => o.value === desc.skinTone)?.label?.toLowerCase();
    if (skinToneLabel) {
        parts.push(`piel ${skinToneLabel}`);
    }

    // Peculiaridades
    if (desc.peculiarities.trim()) {
        parts.push(desc.peculiarities.trim());
    }

    return parts.join(', ') + '.';
}

export default function HeroDescriptionForm({ onChange }: HeroDescriptionFormProps) {
    const [description, setDescription] = useState<HeroDescription>({
        gender: '',
        ageRange: '',
        hairColor: '',
        hairType: '',
        eyeColor: '',
        skinTone: '',
        peculiarities: '',
    });

    useEffect(() => {
        const formatted = formatDescription(description);
        onChange(description, formatted);
    }, [description, onChange]);

    const updateField = (field: keyof HeroDescription, value: string) => {
        setDescription(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-4">
            {/* Género */}
            <div>
                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                    ¿Quién es el protagonista?
                </label>
                <div className="flex gap-2">
                    {OPTIONS.gender.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateField('gender', opt.value)}
                            className={`
                flex-1 py-3 px-2 rounded-lg border-2 font-medium transition-all
                ${description.gender === opt.value
                                    ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 text-[#8B5CF6]'
                                    : 'border-[#1E293B]/20 hover:border-[#1E293B]/40'
                                }
              `}
                        >
                            <span className="text-xl">{opt.emoji}</span>
                            <span className="block text-sm mt-1">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Edad */}
            <div>
                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                    Edad aproximada
                </label>
                <div className="flex gap-2">
                    {OPTIONS.ageRange.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateField('ageRange', opt.value)}
                            className={`
                flex-1 py-2 px-3 rounded-lg border-2 font-medium text-sm transition-all
                ${description.ageRange === opt.value
                                    ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 text-[#8B5CF6]'
                                    : 'border-[#1E293B]/20 hover:border-[#1E293B]/40'
                                }
              `}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Color de pelo */}
            <div>
                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                    Color de pelo
                </label>
                <div className="flex gap-2">
                    {OPTIONS.hairColor.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateField('hairColor', opt.value)}
                            className={`
                flex-1 py-2 px-2 rounded-lg border-2 font-medium text-sm transition-all flex flex-col items-center gap-1
                ${description.hairColor === opt.value
                                    ? 'border-[#8B5CF6] bg-[#8B5CF6]/10'
                                    : 'border-[#1E293B]/20 hover:border-[#1E293B]/40'
                                }
              `}
                        >
                            <div
                                className="w-6 h-6 rounded-full border-2 border-white shadow"
                                style={{ backgroundColor: opt.color }}
                            />
                            <span>{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tipo de pelo */}
            <div>
                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                    Tipo de pelo
                </label>
                <div className="flex gap-2">
                    {OPTIONS.hairType.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateField('hairType', opt.value)}
                            className={`
                flex-1 py-2 px-2 rounded-lg border-2 font-medium text-sm transition-all
                ${description.hairType === opt.value
                                    ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 text-[#8B5CF6]'
                                    : 'border-[#1E293B]/20 hover:border-[#1E293B]/40'
                                }
              `}
                        >
                            <span className="text-lg">{opt.emoji}</span>
                            <span className="block">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Color de ojos */}
            <div>
                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                    Color de ojos
                </label>
                <div className="flex gap-2">
                    {OPTIONS.eyeColor.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateField('eyeColor', opt.value)}
                            className={`
                flex-1 py-2 px-2 rounded-lg border-2 font-medium text-sm transition-all flex flex-col items-center gap-1
                ${description.eyeColor === opt.value
                                    ? 'border-[#8B5CF6] bg-[#8B5CF6]/10'
                                    : 'border-[#1E293B]/20 hover:border-[#1E293B]/40'
                                }
              `}
                        >
                            <div
                                className="w-5 h-5 rounded-full border-2 border-white shadow"
                                style={{ backgroundColor: opt.color }}
                            />
                            <span>{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tono de piel */}
            <div>
                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                    Tono de piel
                </label>
                <div className="flex gap-2">
                    {OPTIONS.skinTone.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateField('skinTone', opt.value)}
                            className={`
                flex-1 py-2 px-2 rounded-lg border-2 font-medium text-sm transition-all flex flex-col items-center gap-1
                ${description.skinTone === opt.value
                                    ? 'border-[#8B5CF6] bg-[#8B5CF6]/10'
                                    : 'border-[#1E293B]/20 hover:border-[#1E293B]/40'
                                }
              `}
                        >
                            <div
                                className="w-6 h-6 rounded-full border-2 border-white shadow"
                                style={{ backgroundColor: opt.color }}
                            />
                            <span>{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Peculiaridades */}
            <div>
                <label className="block text-sm font-semibold text-[#1E293B] mb-2">
                    Rasgos especiales (opcional)
                </label>
                <textarea
                    value={description.peculiarities}
                    onChange={(e) => updateField('peculiarities', e.target.value)}
                    placeholder="Ej: Lleva gafas, tiene pecas, tiene un lunar en la mejilla, lleva coletas..."
                    className="w-full px-4 py-3 rounded-lg border-2 border-[#1E293B]/20 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent resize-none"
                    rows={2}
                />
            </div>

            {/* Preview de la descripción generada */}
            {(description.gender || description.hairColor) && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 bg-[#8B5CF6]/10 rounded-lg border border-[#8B5CF6]/30"
                >
                    <p className="text-sm text-[#1E293B]/70">
                        <span className="font-semibold">Descripcion para la IA:</span>{' '}
                        {formatDescription(description)}
                    </p>
                </motion.div>
            )}
        </div>
    );
}
