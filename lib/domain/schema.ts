import { z } from 'zod';

export const LatLngSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
});

export const ModeSchema = z.enum(['walk', 'taxi', 'bus', 'pm']);
export const PersonaIdSchema = z.enum(['gold_toad', 'toad', 'turtle', 'rabbit', 'sloth']);
export const WeatherSchema = z.enum(['clear', 'rain', 'heat', 'cold']);
export const PoiCategorySchema = z.enum([
  'station', 'park', 'viewpoint', 'market', 'heritage',
  'museum', 'cafe', 'food', 'parking', 'rest'
]);

export const PoiSchema = z.object({
  id: z.string(),
  regionId: z.string(),
  name: z.string(),
  location: LatLngSchema,
  elevationM: z.number(),
  category: PoiCategorySchema,
  themes: z.array(z.string()),
  indoor: z.boolean(),
  covered: z.boolean(),
  stayMin: z.number(),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  transitAccess: z.boolean(),
  vehicleDropOff: LatLngSchema.optional(),
  description: z.string().optional(),
});

export const RouteRequestSchema = z.object({
  regionId: z.literal('dongincheon'),
  start: z.union([z.object({ poiId: z.string().min(1) }), LatLngSchema]),
  poiIds: z.array(z.string().min(1)).min(1).max(8).refine(ids => new Set(ids).size === ids.length, 'Duplicate POIs are not allowed'),
  persona: PersonaIdSchema,
  allowedModes: z.array(ModeSchema).refine(modes => modes.includes('walk'), {
    message: "'walk' mode must always be included",
  }),
  car: z.union([
    z.object({ enabled: z.literal(false) }),
    z.object({ enabled: z.literal(true), parkingId: z.union([z.string(), z.literal('auto')]) }),
  ]),
  avoidStairs: z.boolean(),
  weather: WeatherSchema,
  note: z.string().max(200).optional(),
}).strict();
