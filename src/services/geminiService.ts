export interface SolarAIResponse {
  impact: string;
  recommendedPackage: string;
  monthlySavings: string;
  paybackPeriod: string;
  environmentalBenefit: string;
}

export async function getSolarAIRecommendation(monthlyBill: string, location: string): Promise<SolarAIResponse> {
  const metaEnv = (import.meta as any).env;
  const apiUrl = metaEnv.VITE_API_URL || "";
  const response = await fetch(`${apiUrl}/api/estimate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ monthlyBill, location }),
  });

  if (!response.ok) {
    let errorMessage = `Server error: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch (e) {
      // Not JSON
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
