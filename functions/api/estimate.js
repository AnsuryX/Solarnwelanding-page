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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { 
              responseMimeType: "application/json",
              temperature: 0.7,
              maxOutputTokens: 800
            }
          })
        });
        
        const data = await response.json();
        
        if (data.error) {
          console.error("Gemini API returned error:", data.error.message);
          // Don't return yet, let it fall back
        } else if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
          const text = data.candidates[0].content.parts[0].text;
          return new Response(text, { headers: corsHeaders });
        }
      } catch (e) { 
        console.error("Gemini fetch failed:", e.message); 
      }
    } else {
      console.warn("GEMINI_API_KEY is not configured in environment.");
    }

    // Attempt 2: Fallback (OpenRouter)
    if (env.OPENROUTER_API_KEY) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://solargear.co.ke',
            'X-Title': 'Solargear AI'
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001",
            messages: [{ role: "user", content: prompt + " \nIMPORTANT: Output strictly valid JSON." }],
            response_format: { type: "json_object" }
          })
        });
        const data = await response.json();
        if (data.choices && data.choices[0].message.content) {
          let text = data.choices[0].message.content;
          text = text.replace(/```json/g, "").replace(/```/g, "").trim();
          return new Response(text, { headers: corsHeaders });
        }
      } catch (e) { 
        console.error("OpenRouter fallback failed:", e.message); 
      }
    }

    // Attempt 3: Fallback (OpenAI)
    if (env.OPENAI_API_KEY) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt + " Output JSON only." }],
            response_format: { type: "json_object" }
          })
        });
        const data = await response.json();
        if (data.choices && data.choices[0].message.content) {
          return new Response(data.choices[0].message.content, { headers: corsHeaders });
        }
      } catch (e) {
        console.error("OpenAI fallback failed:", e.message);
      }
    }

    let failureReason = "AI Modeling Engine Saturation: All provider attempts (Gemini, OpenRouter, OpenAI) failed or returned invalid data.";
    
    // Check if keys are actually present in the env object
    const missingKeys = [];
    if (!env.GEMINI_API_KEY) missingKeys.push("GEMINI_API_KEY");
    if (!env.OPENROUTER_API_KEY) missingKeys.push("OPENROUTER_API_KEY");
    if (!env.OPENAI_API_KEY) missingKeys.push("OPENAI_API_KEY");

    if (missingKeys.length > 0) {
      failureReason = `Configuration Issue: The following keys are missing from the Cloudflare environment: ${missingKeys.join(", ")}. Please ensure they are added in Settings -> Variables -> Environment Variables (Production & Preview).`;
    }

    return new Response(JSON.stringify({ error: failureReason }), { 
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
