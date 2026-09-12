import { Leg, Mode } from '../domain/types';

export interface ProfilePoint {
  distM: number;
  eleM: number;
  mode: Mode;
  poiId?: string;
}

export function generateElevationProfile(legs: Leg[]): ProfilePoint[] {
  const profile: ProfilePoint[] = [];
  let accumDistM = 0;

  legs.forEach((leg, idx) => {
    if (idx === 0) {
      profile.push({
        distM: 0,
        eleM: leg.from.elevationM,
        mode: leg.mode,
        poiId: leg.from.poiId,
      });
    }

    if (leg.geometry && leg.geometry.length > 2) {
      // Sub-geometry points if available
      const subSegments = leg.geometry.length - 1;
      const subDist = leg.distanceM / subSegments;

      for (let i = 1; i < leg.geometry.length; i++) {
        accumDistM += subDist;
        const eleM = leg.geometry[i][2];
        profile.push({
          distM: Math.round(accumDistM),
          eleM,
          mode: leg.mode,
          poiId: i === leg.geometry.length - 1 ? leg.to.poiId : undefined,
        });
      }
    } else {
      // Linear interpolation between from and to
      accumDistM += leg.distanceM;
      profile.push({
        distM: Math.round(accumDistM),
        eleM: leg.to.elevationM,
        mode: leg.mode,
        poiId: leg.to.poiId,
      });
    }
  });

  return profile;
}
