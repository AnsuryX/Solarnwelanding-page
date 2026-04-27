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
  
  if (apiUrl && apiUrl.endsWith('/')) {
    apiUrl = apiUrl.slice(0, -1);
  }

  // Use relative path if no VITE_API_URL is provided, which is safer on Cloudflare Pages
  const endpoint = apiUrl ? `${apiUrl}/api/estimate` : '/api/estimate';

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ monthlyBill, location }),
      });

      if (response.ok) {
        return await response.json();
      }

      const errorText = await response.text();
      let errorMessage = `Server error: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        if (errorText.length < 200) errorMessage = errorText;
      }

      if ([503, 429, 500].includes(response.status)) {
        console.warn(`[AI Engine] Attempt ${attempt + 1} failed: ${errorMessage}. Retrying...`);
        lastError = new Error(errorMessage);
        await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1500));
        continue;
      }

      throw new Error(errorMessage);

    } catch (err: any) {
      lastError = err;
      if (attempt === maxRetries - 1) break;
      await new Promise(res => setTimeout(res, Math.pow(2, attempt) * 1500));
    }
  }

  throw lastError || new Error("Energy modeling engine is unreachable.");
}
