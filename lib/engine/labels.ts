import { Leg, Mode } from '../domain/types';

export function generateLegLabel(
  mode: Mode,
  durationMin: number,
  ascentM: number,
  descentM: number,
  costKrw: number
): string {
  const durStr = `${Math.ceil(durationMin)}분`;
  let typeStr = '';

  if (mode === 'walk') {
    if (ascentM < 5 && descentM >= 5) {
      typeStr = '내리막 도보';
    } else if (ascentM <= 5 && descentM <= 5) {
      typeStr = '평지 도보';
    } else {
      typeStr = '오르막 도보(주의)';
    }
  } else if (mode === 'taxi' || mode === 'bus') {
    typeStr = ascentM > 5 ? '오르막 탑승' : '이동';
  } else if (mode === 'pm') {
    typeStr = descentM > 5 ? '내리막 주행' : '평지 주행';
  }

  const modeName =
    mode === 'walk' ? '도보' : mode === 'taxi' ? '택시' : mode === 'bus' ? '버스' : '공유 킥보드/자전거';

  const costStr = costKrw > 0 ? ` · ${costKrw.toLocaleString()}원` : '';

  return `${modeName} ${durStr} · ${typeStr}${costStr}`;
}
