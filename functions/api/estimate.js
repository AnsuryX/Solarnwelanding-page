export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { monthlyBill, location } = await request.json();

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
      Return ONLY valid JSON.
    `;

    // Attempt 1: Gemini (Native via Fetch for Workers)
    if (env.GEMINI_API_KEY) {
      try {
        const genAIUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`;
        const response = await fetch(genAIUrl, {
          method: 'POST',
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });
        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        return new Response(text, { headers: { 'Content-Type': 'application/json' } });
      } catch (e) { console.error("Gemini failed"); }
    }

    // Attempt 2: Fallback (OpenRouter)
    if (env.OPENROUTER_API_KEY) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "anthropic/claude-3-haiku",
            messages: [{ role: "user", content: prompt + " Output JSON only." }]
          })
        });
        const data = await response.json();
        return new Response(data.choices[0].message.content, { headers: { 'Content-Type': 'application/json' } });
      } catch (e) { console.error("OpenRouter failed"); }
    }

    return new Response(JSON.stringify({ error: "AI Service Unavailable" }), { status: 503 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
