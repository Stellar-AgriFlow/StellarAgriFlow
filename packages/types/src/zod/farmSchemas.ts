import { z } from 'zod';

export const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const FarmRegistrationSchema = z.object({
  farmerName: z.string().min(2).max(100),
  location: z.string().min(3).max(150),
  sizeHectares: z.number().positive().max(100000),
  primaryCrop: z.string().min(2).max(50),
  coordinates: CoordinatesSchema,
  soilType: z.enum(['Clay', 'Loam', 'Sandy', 'Silt', 'Peat', 'Chalky']),
  certifications: z.array(z.string()).default([]),
});

export const YieldForecastSchema = z.object({
  farmId: z.number().int().positive(),
  cropType: z.string().min(2),
  projectedYieldKg: z.number().positive(),
  expectedHarvestDate: z.number().int().positive(),
});

export type ValidatedFarmRegistration = z.infer<typeof FarmRegistrationSchema>;
export type ValidatedYieldForecast = z.infer<typeof YieldForecastSchema>;
