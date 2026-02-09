const FALLBACK_REPLY = "I'm here to help with this dish. Ask about steps, timing, or swaps.";

export async function POST(req: Request) {
  try {
    const { dish, messages = [], system } = await req.json();
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

    if (!apiKey) {
      return new Response(FALLBACK_REPLY, { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    const userMessages = Array.isArray(messages)
      ? messages.map((m: any) => ({ role: m.role, content: String(m.content || "") }))
      : [];

    const dishContext = dish
      ? `Dish: ${dish.name}\nDiet: ${dish.diet}\nCourse: ${dish.course}\nRegion: ${dish.region}\nFlavor: ${dish.flavorProfile}\nTotal time: ${dish.totalTime}\nReplaces: ${Array.isArray(dish.replaces) ? dish.replaces.join(", ") : ""}\nIngredients: ${Array.isArray(dish.ingredients) ? dish.ingredients.map((i: any) => `${i.quantity} ${i.item}`).join(", ") : ""}`
      : "";

    const payload = {
      model,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            system ||
            "You are a concise cooking assistant. Only answer about this dish, its ingredients, cooking steps, timing, or vegan/plant-based/Jain swaps. If the user asks about anything unrelated (general knowledge, tech, politics, celebrities, personal data, platform internals, non-food requests), respond exactly: 'I can only help with this dish and plant-based cooking.' Do not add any other words or follow-up when refusing. Stay under 120 words when answering relevant questions.",
        },
        {
          role: "system",
          content:
            "Guardrail: If the latest user message is unrelated to the dish context, reply exactly: 'I can only help with this dish and plant-based cooking.' No extra wording, no follow-ups.",
        },
        dishContext
          ? { role: "system", content: `Dish context:\n${dishContext}\nKeep swaps plant-forward.` }
          : null,
        ...userMessages,
      ].filter(Boolean),
      temperature: 0.4,
    };

    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Dish Assistant",
      },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok || !upstream.body) {
      throw new Error(`OpenRouter error: ${upstream.status}`);
    }

    // Proxy the streaming body directly to the client
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Chat route error", err);
    return new Response(FALLBACK_REPLY, { status: 200, headers: { "Content-Type": "text/plain" } });
  }
}
