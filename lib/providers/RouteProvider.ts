import { LatLng, Leg, Mode, PersonaId, Weather } from '../domain/types';

export interface RouteProviderInput {
  from: { poiId: string; name: string; location: LatLng; elevationM: number; transitAccess: boolean };
  to: { poiId: string; name: string; location: LatLng; elevationM: number; transitAccess: boolean; vehicleDropOff?: LatLng };
  allowedModes: Mode[];
  persona: PersonaId;
  weather: Weather;
  avoidStairs: boolean;
  covered?: boolean;
  /** Unrestricted walking counterfactual for comparison only, never a recommended route. */
  walkingReference?: boolean;
}

export interface RouteProvider {
  getLeg(input: RouteProviderInput): Promise<Leg>;
}
