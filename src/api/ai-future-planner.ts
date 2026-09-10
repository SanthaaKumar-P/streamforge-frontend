import { apiRequest } from "@/lib/api";

/* =========================================================
   FORECAST POINT
========================================================= */

export interface AIFutureForecastPoint {
  month: string;

  demandScore: number;

  valueScore: number;

  priceChangePercent: number;

  seasonalityIndex: number;
}

/* =========================================================
   FUTURE PLANNER RESPONSE
========================================================= */

export interface AIFuturePlannerResponse {
  showId: number;

  showTitle: string;

  currentDemandScore: number;

  projectedDemandScore: number;

  priceChangePercent: number;

  priceOutlook: string;

  peakMonth: string;

  confidenceScore: number;

  recommendation: string;

  forecast: AIFutureForecastPoint[];
}

/* =========================================================
   GET FUTURE FORECAST
========================================================= */

export async function getAIFutureForecast(
  showId: number,
): Promise<AIFuturePlannerResponse> {
  return apiRequest<AIFuturePlannerResponse>(
    `/api/ai-future-planner/show/${showId}`,
  );
}