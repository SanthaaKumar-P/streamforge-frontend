import { apiRequest } from "@/lib/api";

/* =========================================================
   AI ANALYSIS RESPONSE
========================================================= */

export interface AIAnalysisResponse {
  analysisId?: number | null;

  summary?: string | null;

  predictedGenre?: string | null;

  targetAudience?: string | null;

  originalityScore?: number | null;

  marketPotentialScore?: number | null;

  predictedSuccessRate?: number | null;

  recommendations?: string | null;
}

/* =========================================================
   GET EXISTING AI ANALYSIS
========================================================= */

export async function getAIAnalysis(
  showId: number,
): Promise<AIAnalysisResponse> {
  return apiRequest<AIAnalysisResponse>(
    `/api/ai-analysis/show/${showId}`,
  );
}

/* =========================================================
   GENERATE AI PREDICTION
========================================================= */

export async function generateAIPrediction(
  showId: number,
): Promise<AIAnalysisResponse> {
  return apiRequest<AIAnalysisResponse>(
    `/api/ai-analysis/predict/show/${showId}`,
    {
      method: "POST",
    },
  );
}