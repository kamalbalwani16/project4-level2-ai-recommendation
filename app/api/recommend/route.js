import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request) {
  try {
    const { query } = await request.json();

    if (!query || !query.trim()) {
      return Response.json(
        { error: "Please enter a recommendation request." },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: "GEMINI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
    });

    const prompt = `
You are an AI recommendation assistant.

User request:
"${query}"

Analyze the user's request carefully, including category, preferences, budget, price limits, location, and other requirements.

Return exactly 5 relevant recommendations.

If the user mentions a budget or price limit, make sure the recommendations respect that budget as closely as possible and provide an estimated current price.

Return ONLY valid JSON in this exact format:

{
  "recommendations": [
    {
      "name": "Recommendation name",
      "price": "₹75,999",
      "description": "Short description",
      "reason": "Why this matches the user's request"
    }
  ]
}

Rules:
- Always include the "price" field.
- If a specific price is known, provide it.
- If an exact current price is not known, provide a reasonable estimated price range instead.
- Use ₹ for Indian prices when the request is related to India or uses INR.
- Respect the user's stated budget.
- Do not invent obviously unrealistic prices.
- Do not use markdown.
- Do not add any text before or after the JSON.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    const cleanedText = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const data = JSON.parse(cleanedText);

    return Response.json(data);
  } catch (error) {
    console.error("Recommendation API error:", error);

    return Response.json(
      { error: "Failed to generate recommendations." },
      { status: 500 }
    );
  }
}