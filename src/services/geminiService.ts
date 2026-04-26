export interface SolarAIResponse {
  impact: string;
  recommendedPackage: string;
  monthlySavings: string;
  paybackPeriod: string;
  environmentalBenefit: string;
}

export async function getSolarAIRecommendation(monthlyBill: string, location: string): Promise<SolarAIResponse> {
  const metaEnv = (import.meta as any).env;
  let apiUrl = metaEnv.VITE_API_URL || "";
  
  // Clean up potential trailing slash to prevent double-slashes
  if (apiUrl.endsWith('/')) {
    apiUrl = apiUrl.slice(0, -1);
  }

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(`${apiUrl}/api/estimate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ monthlyBill, location }),
      });

      if (response.ok) {
        return response.json();
      }

      const errorText = await response.text();
      let errorMessage = `Server error: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // Not JSON
      }

      // If it's a 503 or 429, we should retry. Other errors (like 400) usually won't go away with a retry.
      if (response.status === 503 || response.status === 429) {
        console.warn(`Attempt ${attempt + 1} failed: ${errorMessage}. Retrying...`);
        lastError = new Error(errorMessage);
        // Exponential backoff: 1s, 2s, 4s...
        await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1000));
        continue;
      }

      throw new Error(errorMessage);

    } catch (err: any) {
      lastError = err;
      if (attempt === maxRetries - 1) break;
      // For network errors, also retry
      await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1000));
    }
  }

  throw lastError || new Error("Failed to reach the energy modeling engine after several attempts.");
}
