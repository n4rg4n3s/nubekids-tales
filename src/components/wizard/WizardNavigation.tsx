// src/components/wizard/WizardNavigation.tsx
// Botones de navegación del wizard - Estilo táctil del Design Document

import { motion } from 'framer-motion';

interface WizardNavigationProps {
    currentStep: number;
    totalSteps: number;
    canContinue: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onFinish: () => void;
    accentColor?: string;
}

export default function WizardNavigation({
    currentStep,
    totalSteps,
    canContinue,
    onPrevious,
    onNext,
    onFinish,
    accentColor = '#FBBF24'
}: WizardNavigationProps) {
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;

    return (
        <div className="flex gap-4 mt-8 pt-6 border-t-2 border-[#1E293B]/10">
            {/* Previous button */}
            {!isFirstStep && (
                <motion.button
                    type="button"
                    onClick={onPrevious}
                    className="flex-1 py-4 px-6 rounded-xl border-4 border-[#1E293B] bg-white font-bold text-lg text-[#1E293B]"
                    style={{
                        boxShadow: '4px 4px 0px #1E293B',
                    }}
                    whileHover={{
                        x: 2,
                        y: 2,
                        boxShadow: '2px 2px 0px #1E293B'
                    }}
                    whileTap={{
                        x: 4,
                        y: 4,
                        boxShadow: '0px 0px 0px #1E293B'
                    }}
                >
                    ← Anterior
                </motion.button>
            )}

            {/* Next / Finish button */}
            <motion.button
                type="button"
                onClick={isLastStep ? onFinish : onNext}
                disabled={!canContinue}
                className={`
                    flex-1 py-4 px-6 rounded-xl border-4 border-[#1E293B] font-bold text-lg text-[#1E293B]
                    ${!canContinue ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={{
                    backgroundColor: canContinue ? accentColor : '#D1D5DB',
                    boxShadow: canContinue ? '4px 4px 0px #1E293B' : 'none',
                }}
                whileHover={canContinue ? {
                    x: 2,
                    y: 2,
                    boxShadow: '2px 2px 0px #1E293B'
                } : {}}
                whileTap={canContinue ? {
                    x: 4,
                    y: 4,
                    boxShadow: '0px 0px 0px #1E293B'
                } : {}}
            >
                {isLastStep ? '✨ Comenzar Aventura' : 'Siguiente →'}
            </motion.button>
        </div>
    );
}