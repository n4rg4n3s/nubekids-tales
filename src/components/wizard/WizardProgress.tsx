// src/components/wizard/WizardProgress.tsx
// Barra de progreso del wizard con indicador de paso

import { motion } from 'framer-motion';

interface WizardProgressProps {
    currentStep: number;
    totalSteps: number;
    steps: string[];
}

export default function WizardProgress({ currentStep, totalSteps, steps }: WizardProgressProps) {
    const progress = ((currentStep) / totalSteps) * 100;

    return (
        <div className="mb-6">
            {/* Step indicator */}
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-[#1E293B]">
                    Paso {currentStep + 1} de {totalSteps}
                </span>
                <span className="text-sm text-[#1E293B]/60">
                    {steps[currentStep]}
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-3 bg-[#1E293B]/10 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#38BDF8] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                />
            </div>

            {/* Step dots */}
            <div className="flex justify-between mt-2">
                {steps.map((step, index) => (
                    <div
                        key={step}
                        className={`
              w-3 h-3 rounded-full transition-all duration-300
              ${index <= currentStep
                                ? 'bg-[#8B5CF6] scale-110'
                                : 'bg-[#1E293B]/20'
                            }
            `}
                    />
                ))}
            </div>
        </div>
    );
}