import type { HeroData } from './StepHero';

const HERO_OPTIONS = {
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

export function formatHeroDescription(data: HeroData): string {
  if (data.inputMode === 'photo') return '';

  const parts: string[] = [];
  const genderOption = HERO_OPTIONS.gender.find((option) => option.value === data.gender);
  const ageOption = HERO_OPTIONS.ageRange.find((option) => option.value === data.ageRange);

  if (genderOption && ageOption) {
    parts.push(`${genderOption.label} de ${ageOption.label}`);
  } else if (genderOption) {
    parts.push(genderOption.label);
  } else if (ageOption) {
    parts.push(`de ${ageOption.label}`);
  }

  const hairColorOption = HERO_OPTIONS.hairColor.find((option) => option.value === data.hairColor);
  const hairTypeOption = HERO_OPTIONS.hairType.find((option) => option.value === data.hairType);

  if (hairColorOption && hairTypeOption) {
    parts.push(`pelo ${hairColorOption.label.toLowerCase()} ${hairTypeOption.label.toLowerCase()}`);
  } else if (hairColorOption) {
    parts.push(`pelo ${hairColorOption.label.toLowerCase()}`);
  } else if (hairTypeOption) {
    parts.push(`pelo ${hairTypeOption.label.toLowerCase()}`);
  }

  const eyeColorOption = HERO_OPTIONS.eyeColor.find((option) => option.value === data.eyeColor);
  if (eyeColorOption) {
    parts.push(`ojos ${eyeColorOption.label.toLowerCase()}`);
  }

  const skinToneOption = HERO_OPTIONS.skinTone.find((option) => option.value === data.skinTone);
  if (skinToneOption) {
    parts.push(`piel ${skinToneOption.label.toLowerCase()}`);
  }

  if (data.peculiarities.trim()) {
    parts.push(data.peculiarities.trim());
  }

  return parts.length > 0 ? `${parts.join(', ')}.` : '';
}

export function mapAgeRangeToAgeGroup(ageRange: string): 'tiny' | 'little' | 'reader' {
  switch (ageRange) {
    case '3-4':
      return 'tiny';
    case '5-6':
      return 'little';
    case '7-8':
    case '9-10':
      return 'reader';
    default:
      return 'little';
  }
}
