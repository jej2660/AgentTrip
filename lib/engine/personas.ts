import { PersonaId } from '../domain/types';

export interface PersonaConfig {
  id: PersonaId;
  name: string;
  slogan: string;
  lambdaE: number;       // 원/flat-m
  lambdaT: number;       // 원/분
  maxWalkLegM: number;
  maxAscentWalkM: number;
  effortBudget: number;  // flat-m
  policySummary: string;
}

export const PERSONAS: Record<PersonaId, PersonaConfig> = {
  gold_toad: {
    id: 'gold_toad',
    name: '금두꺼비',
    slogan: '오르막길에 내 다리를 쓸 순 없지!',
    lambdaE: 4,
    lambdaT: 0.5,
    maxWalkLegM: 150,
    maxAscentWalkM: 2000, // 금지
    effortBudget: 6000,
    policySummary: '오르막 도보 절대 금지. 택시/PM 선호.',
  },
  toad: {
    id: 'toad',
    name: '두꺼비',
    slogan: '돈으로 체력 100% 사겠다',
    lambdaE: 8,
    lambdaT: 0.5,
    maxWalkLegM: 150,
    maxAscentWalkM: 600, // 금지 + 계단 금지
    effortBudget: 2500,
    policySummary: '오르막 및 계단 도보 금지. 목적지 바로 앞 하차.',
  },
  turtle: {
    id: 'turtle',
    name: '거북이',
    slogan: '돈도 아끼고 싶지만… 오르막은 못 걸어요',
    lambdaE: 8,
    lambdaT: 3,
    maxWalkLegM: 100,
    maxAscentWalkM: 500,
    effortBudget: 3000,
    policySummary: '오르막 도보 금지. 버스/공공 인프라 선호, 택시는 최후 수단.',
  },
  rabbit: {
    id: 'rabbit',
    name: '토끼',
    slogan: '오르막만 아니면 하루종일도 걸어요!',
    lambdaE: 1,
    lambdaT: 3,
    maxWalkLegM: 60,
    maxAscentWalkM: 4000,
    effortBudget: 12000,
    policySummary: '오르막 가중치 W_UP×4 적용. 구간 상승 40m 초과시 금지. 버스 1회 선호.',
  },
  sloth: {
    id: 'sloth',
    name: '나무늘보',
    slogan: '5개 입력했지만 2개만 가고 누워있을래요',
    lambdaE: 8,
    lambdaT: 1,
    maxWalkLegM: 150,
    maxAscentWalkM: 500,
    effortBudget: 1500,
    policySummary: '체력 예산(1,500m) 초과 시 핵심 POI 위주로 자동 스킵.',
  },
};
