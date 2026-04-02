// src/components/Setup.tsx
// Wizard de 4 pasos para configurar el cuento

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TenantConfig, AgeGroup, Genre, Language } from '../types';

import WizardProgress from './wizard/WizardProgress';
import WizardNavigation from './wizard/WizardNavigation';
import StepHero, { formatHeroDescription, mapAgeRangeToAgeGroup } from './wizard/StepHero';
import type { HeroData } from './wizard/StepHero';
import StepPedagogy from './wizard/StepPedagogy';
import type { PedagogyData } from './wizard/StepPedagogy';
import StepItem from './wizard/StepItem';
import type { ItemData } from './wizard/StepItem';
import StepStory from './wizard/StepStory';
import type { StoryData } from './wizard/StepStory';

// Output del Setup hacia App.tsx
export interface SetupData {
  heroName: string;
  heroInputMode: 'description' | 'photo';
  heroPhoto: string | null;
  heroDescription: string | null;
  pedagogy: PedagogyData;
  itemImage: string | null;
  itemDescription: string;
  ageGroup: AgeGroup;
  genre: Genre;
  language: Language;
}

interface SetupProps {
  tenantConfig: TenantConfig;
  /** Nombre/descripción del producto (plan Standard o token antiguo) */
  initialItemModel?: string;
  /** Base64 puro de la imagen del producto (plan Premium — cargada por itemImageLoader) */
  initialItemImage?: string;
  /** URL de la imagen cuando no se pudo convertir a base64 (fallback CORS) */
  initialItemImageUrl?: string;
  onComplete: (data: SetupData) => void;
}

const STEPS = ['El Protagonista', 'El Viaje Interior', 'El Objeto Mágico', 'La Historia'];

export default function Setup({
  tenantConfig,
  initialItemModel,
  initialItemImage,
  initialItemImageUrl,
  onComplete,
}: SetupProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Estado de cada paso
  const [heroData, setHeroData] = useState<HeroData>({
    name: '',
    inputMode: 'description',
    photo: null,
    gender: '',
    ageRange: '',
    hairColor: '',
    hairType: '',
    eyeColor: '',
    skinTone: '',
    peculiarities: '',
  });

  const [pedagogyData, setPedagogyData] = useState<PedagogyData>({
    enabled: false,
    behaviorChallenges: [],
    skillsToReinforce: [],
    emotionalContext: [],
    motivations: [],
    valuesToTransmit: [],
    freeformContext: '',
    customBehavior: '',
    customSkill: '',
    customEmotion: '',
    customMotivation: '',
    customValue: '',
  });

  // Inicializar con datos pre-rellenados del B2B (o vacío si no hay)
  const [itemData, setItemData] = useState<ItemData>({
    // Si hay base64 del producto, construir la data URL completa para el wizard
    image: initialItemImage
      ? `data:image/jpeg;base64,${initialItemImage}`
      : null,
    // Si hay nombre del producto (Standard o token antiguo), pre-rellenar descripción
    description: initialItemModel || '',
  });

  // Inferir ageGroup del heroData.ageRange
  const inferredAgeGroup: AgeGroup = heroData.ageRange
    ? mapAgeRangeToAgeGroup(heroData.ageRange)
    : 'little';

  const [storyData, setStoryData] = useState<StoryData>({
    ageGroup: inferredAgeGroup,
    genre: tenantConfig.activeGenres[0] || '3D Animation Magic',
    language: tenantConfig.activeLanguages[0] || 'Español',
  });

  // Validación por paso
  const canContinue = (): boolean => {
    switch (currentStep) {
      case 0:
        if (!heroData.name.trim()) return false;
        if (heroData.inputMode === 'photo' && !heroData.photo) return false;
        return true;
      case 1:
        return true;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1 && canContinue()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    if (!canContinue()) return;

    const setupData: SetupData = {
      heroName: heroData.name.trim(),
      heroInputMode: heroData.inputMode,
      heroPhoto: heroData.photo,
      heroDescription: heroData.inputMode === 'description'
        ? formatHeroDescription(heroData)
        : null,
      pedagogy: pedagogyData,
      itemImage: itemData.image,
      itemDescription: itemData.description,
      ageGroup: inferredAgeGroup,
      genre: storyData.genre,
      language: storyData.language,
    };

    onComplete(setupData);
  };

  // ¿Los datos del objeto vienen pre-rellenados de B2B?
  const isPreloadedFromB2B = !!(initialItemImage || initialItemImageUrl || initialItemModel);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepHero data={heroData} onChange={setHeroData} />;
      case 1:
        return <StepPedagogy data={pedagogyData} onChange={setPedagogyData} />;
      case 2:
        return (
          <StepItem
            data={itemData}
            onChange={setItemData}
            tenantConfig={tenantConfig}
            isPreloadedFromB2B={isPreloadedFromB2B}
            prefilledItemImageUrl={initialItemImageUrl}
          />
        );
      case 3:
        return (
          <StepStory
            data={storyData}
            onChange={setStoryData}
            tenantConfig={tenantConfig}
            inferredAgeGroup={inferredAgeGroup}
          />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto p-6 min-h-screen flex flex-col justify-center"
    >
      <div
        className="bg-white rounded-2xl border-4 border-[#1E293B] p-6"
        style={{
          boxShadow: '8px 8px 0px #1E293B',
          transform: 'rotate(0.5deg)'
        }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1
            className="text-2xl md:text-3xl font-black"
            style={{
              fontFamily: "'Fredoka', sans-serif",
              color: tenantConfig.brandColors.primary
            }}
          >
            {tenantConfig.tenantName}
          </h1>
          <p className="text-[#1E293B]/60 text-sm mt-1">
            Crea un cuento mágico personalizado
          </p>
        </div>

        {/* Progress bar */}
        <WizardProgress
          currentStep={currentStep}
          totalSteps={STEPS.length}
          steps={STEPS}
        />

        {/* Contenido del paso */}
        <div className="min-h-[350px] py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navegación */}
        <WizardNavigation
          currentStep={currentStep}
          totalSteps={STEPS.length}
          canContinue={canContinue()}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onFinish={handleFinish}
          accentColor={tenantConfig.brandColors.accent}
        />
      </div>
    </motion.div>
  );
}