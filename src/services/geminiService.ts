import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface SolarAIResponse {
  impact: string;
  recommendedPackage: string;
  monthlySavings: string;
  paybackPeriod: string;
  environmentalBenefit: string;
}

export async function getSolarAIRecommendation(monthlyBill: string, location: string): Promise<SolarAIResponse> {
  const prompt = `
    You are an expert solar energy consultant for Solargear Kenya.
    Based on the following user details:
    - Monthly Electricity Bill: KES ${monthlyBill}
    - Location: ${location}

    Provide a professional solar recommendation in JSON format.
    CRITICAL: Account for regional solar irradiance in Kenya:
    - Coast/North Eastern: Extreme sun (~6.5+ kWh/m2/day)
    - Rift Valley/Western: High sun (~5.5-6.0 kWh/m2/day)
    - Nairobi/Central: Moderate (~5.0-5.5 kWh/m2/day)
    
    Adjust "monthlySavings" and "paybackPeriod" based on the ${location} irradiance.
    
    The recommendedPackage should be one of our standard offerings:
    1. SolarStart™ Backup (5kWh Battery, 3.5kW Inverter) - for bills < 10k
    2. SmartFamily™ Energy (10kWh Battery, 5kW Inverter) - for bills 10k-30k
    3. SolarElite™ Ultra (20kWh Battery, 10kW Inverter) - for bills > 30k

    Be realistic about saving up to 90% and a payback period of 3-5 years.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          impact: { type: Type.STRING, description: "A punchy summary of the energy impact" },
          recommendedPackage: { type: Type.STRING, description: "The name of the package" },
          monthlySavings: { type: Type.STRING, description: "Estimated KES saved per month" },
          paybackPeriod: { type: Type.STRING, description: "Estimated time to ROI" },
          environmentalBenefit: { type: Type.STRING, description: "Trees planted or CO2 saved equivalent" },
        },
        required: ["impact", "recommendedPackage", "monthlySavings", "paybackPeriod", "environmentalBenefit"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}
