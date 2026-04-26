export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };
  
  try {
    const { monthlyBill, location } = await request.json();

    const prompt = `
      You are an expert solar energy consultant for Solargear Kenya.
      Based on the following user details:
      - Monthly Electricity Bill: KES ${monthlyBill}
      - Location: ${location}

      Return JSON ONLY. Account for regional Kenyan sun patterns.
      Output format: { impact: string, recommendedPackage: string, monthlySavings: string, paybackPeriod: string, environmentalBenefit: string }
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

        if (data.candidates && data.candidates[0].content.parts[0].text) {
          const text = data.candidates[0].content.parts[0].text;
          return new Response(text, { headers: corsHeaders });
        }
      } catch (e) { 
        console.error("Gemini failed", e); 
      }
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
            messages: [{ role: "user", content: prompt }]
          })
        });
        const data = await response.json();
        if (data.choices && data.choices[0].message.content) {
          return new Response(data.choices[0].message.content, { headers: corsHeaders });
        }
      } catch (e) { 
        console.error("OpenRouter failed", e); 
      }
    }

    return new Response(JSON.stringify({ error: "AI Service Saturated" }), { 
      status: 503, 
      headers: corsHeaders 
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}
