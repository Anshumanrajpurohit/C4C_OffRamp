import { NextResponse } from "next/server";

type CostSavingsRequest = {
  originalDishName?: string;
  originalCost?: string;
  veganDishName?: string;
  veganCost?: string;
};

type OpenRouterChoice = {
  message?: {
    content?: string;
  };
};

type OpenRouterResponse = {
  choices?: OpenRouterChoice[];
};

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(request: Request) {
  let payload: CostSavingsRequest;
  try {
    payload = (await request.json()) as CostSavingsRequest;
  } catch (error) {
    console.error("cost-savings invalid JSON", error);
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const { originalDishName, originalCost, veganDishName, veganCost } = payload;

  if (!originalDishName || !originalCost || !veganDishName || !veganCost) {
    return NextResponse.json({ error: "Missing cost comparison fields" }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is not configured");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    const response = await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a food cost estimation assistant.",
          },
          {
            role: "user",
            content: `Compare the cost of these dishes in India:\n\nNon-vegan dish: ${originalDishName}\nAverage cost: ${originalCost}\n\nVegan dish: ${veganDishName}\nAverage cost: ${veganCost}\n\nReturn only the estimated savings in rupees as a number.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenRouter error", response.status, text);
      return NextResponse.json({ error: "Failed to calculate savings" }, { status: 502 });
    }

    const data = (await response.json()) as OpenRouterResponse;
    const content = data.choices?.[0]?.message?.content ?? "";
    const numericText = content.replace(/[^0-9-]/g, "");
    const parsed = Number.parseInt(numericText, 10);
    const savings = Number.isFinite(parsed) ? parsed : null;

    return NextResponse.json({ savings });
  } catch (error) {
    console.error("cost-savings fetch failed", error);
    return NextResponse.json({ error: "Unable to reach cost savings service" }, { status: 500 });
  }
}
