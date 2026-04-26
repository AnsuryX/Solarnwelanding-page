export interface SolarAIResponse {
  impact: string;
  recommendedPackage: string;
  monthlySavings: string;
  paybackPeriod: string;
  environmentalBenefit: string;
}

export async function getSolarAIRecommendation(monthlyBill: string, location: string): Promise<SolarAIResponse> {
  const response = await fetch("/api/estimate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ monthlyBill, location }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  return response.json();
}
