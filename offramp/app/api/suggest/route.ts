import { NextResponse } from "next/server";

const localFallback = [
  {
    name: "Jackfruit Biryani",
    prepTime: "25 mins",
    rating: 4.8,
    ingredients: 12,
    tags: ["High protein", "Fiber rich", "Trending"],
    moneySaved: 60,
    description: "Slow-cooked jackfruit in aromatic rice with caramelized onions and mint.",
    origin: "West Bengal",
    estimatedCost: 90,
    videoId: "MJUeygZ8MeQ",
    vegan: true,
    impact: { animals: 1, water: 900, co2: 2.5 },
  },
];

function buildPrompt(query: string, preferences: any) {
  return `You are a culinary guide for plant-based swaps.
User query: ${query}
Preferences: ${JSON.stringify(preferences)}
Return ONLY a JSON array of 3 objects with keys: name, prepTime, rating (number), ingredients (number), tags (array of short strings), moneySaved (number, rupees), description, origin, estimatedCost (number), vegan (boolean), impact {animals, water, co2}, videoId (YouTube id or empty).
Make sure the output is valid JSON without extra text.`;
}

export async function POST(req: Request) {
  const { query, preferences } = await req.json().catch(() => ({ query: "", preferences: {} }));

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";

  if (!apiKey) {
    return NextResponse.json({ suggestions: localFallback, provider: "local-fallback" });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Plant-Based Swap Guide",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a precise API returning JSON only." },
          { role: "user", content: buildPrompt(query, preferences) },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    const textContent = Array.isArray(content) ? content.map((c: any) => c.text || "").join("\n") : content;

    let suggestions: any[] = [];
    try {
      suggestions = JSON.parse(textContent);
    } catch (err) {
      // If the model returned JSON inside markdown, try to extract it.
      const match = String(textContent).match(/```json\n([\s\S]*?)```/);
      if (match?.[1]) {
        suggestions = JSON.parse(match[1]);
      }
    }

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      suggestions = localFallback;
    }

    return NextResponse.json({ suggestions, provider: "openrouter" });
  } catch (error) {
    console.error("OpenRouter suggest error", error);
    return NextResponse.json({ suggestions: localFallback, provider: "local-fallback" }, { status: 200 });
  }
}
