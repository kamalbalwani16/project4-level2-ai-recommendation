import { GoogleGenerativeAI } from "@google/generative-ai";

const languageCurrencyMap = {
  English: ["USD", "INR"],

  Hindi: ["INR"],
  Hinglish: ["INR"],
  Marathi: ["INR"],
  Bengali: ["INR"],
  Gujarati: ["INR"],
  Punjabi: ["INR"],
  Tamil: ["INR"],
  Telugu: ["INR"],
  Kannada: ["INR"],
  Malayalam: ["INR"],
  Urdu: ["INR"],
  Odia: ["INR"],
  Assamese: ["INR"],

  Spanish: ["EUR", "INR"],
  French: ["EUR", "INR"],
  German: ["EUR", "INR"],
  Portuguese: ["EUR", "INR"],
  Italian: ["EUR", "INR"],
  Dutch: ["EUR", "INR"],

  Russian: ["RUB", "INR"],
  Ukrainian: ["UAH", "INR"],
  Polish: ["PLN", "INR"],
  Turkish: ["TRY", "INR"],
  Arabic: ["AED", "INR"],
  Persian: ["IRR", "INR"],
  Hebrew: ["ILS", "INR"],

  "Chinese Simplified": ["CNY", "INR"],
  "Chinese Traditional": ["TWD", "INR"],
  Japanese: ["JPY", "INR"],
  Korean: ["KRW", "INR"],
  Vietnamese: ["VND", "INR"],
  Thai: ["THB", "INR"],
  Indonesian: ["IDR", "INR"],
  Malay: ["MYR", "INR"],
};

const countryCurrencyMap = {
  Kuwait: "KWD",
  UAE: "AED",
  Dubai: "AED",
  "Abu Dhabi": "AED",
  "Saudi Arabia": "SAR",
  Saudi: "SAR",
  Qatar: "QAR",
  Bahrain: "BHD",
  Oman: "OMR",
  Muscat: "OMR",
  India: "INR",
  Indian: "INR",
};

function detectCountryCurrency(query) {
  const lowerQuery = query.toLowerCase();

  for (const [country, currency] of Object.entries(countryCurrencyMap)) {
    if (lowerQuery.includes(country.toLowerCase())) {
      return currency;
    }
  }

  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/*
  Try one model.
  503 = temporary service overload
  429 = rate limit
*/
async function generateWithRetry(genAI, modelName, prompt) {
  const maxRetries = 3;

  const model = genAI.getGenerativeModel({
    model: modelName,
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Trying ${modelName} - attempt ${attempt}/${maxRetries}`
      );

      const result = await model.generateContent(prompt);

      console.log(`Success with ${modelName}`);

      return result;
    } catch (error) {
      const status = error?.status || error?.statusCode;

      console.error(
        `${modelName} attempt ${attempt}/${maxRetries} failed. Status: ${status}`
      );

      // Only retry temporary overload/rate-limit errors.
      if (status !== 503 && status !== 429) {
        throw error;
      }

      if (attempt === maxRetries) {
        throw error;
      }

      // Increasing delay:
      // attempt 1 -> 1.5 sec
      // attempt 2 -> 3 sec
      const delay = attempt * 1500;

      console.log(
        `Retrying ${modelName} in ${delay / 1000} seconds...`
      );

      await sleep(delay);
    }
  }

  throw new Error(`Failed with model ${modelName}`);
}

async function generateWithFallback(genAI, prompt) {
  const models = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.6-flash",
  ];

  let lastError = null;

  for (const modelName of models) {
    try {
      console.log(`\nStarting model: ${modelName}`);

      const result = await generateWithRetry(
        genAI,
        modelName,
        prompt
      );

      return result;
    } catch (error) {
      lastError = error;

      const status = error?.status || error?.statusCode;

      console.error(
        `${modelName} completely failed. Status: ${status}`
      );

      console.log(
        `Switching to next fallback model...`
      );
    }
  }

  throw lastError || new Error("All Gemini models failed.");
}

export async function POST(request) {
  try {
    const body = await request.json();

    const query = body?.query?.trim();
    const language = body?.language || "English";

    if (!query) {
      return Response.json(
        {
          error: "Please enter a recommendation query.",
        },
        {
          status: 400,
        }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is missing.");

      return Response.json(
        {
          error: "Gemini API key is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    const genAI = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY
    );

    const detectedCurrency = detectCountryCurrency(query);

    const currencies =
      languageCurrencyMap[language] || ["USD", "INR"];

    const primaryCurrency =
      detectedCurrency || currencies[0];

    const secondaryCurrency =
      detectedCurrency
        ? "INR"
        : currencies[1] || "INR";

    const prompt = `
You are an expert multilingual AI recommendation assistant.

User query:
"${query}"

Selected language:
${language}

Primary currency:
${primaryCurrency}

Secondary currency:
${secondaryCurrency}

Important currency and location rules:

1. If the user explicitly mentions a country, city, region, or currency,
   prioritize that location/currency over the selected language.

2. If the user mentions Kuwait, use KWD.

3. If the user mentions UAE, Dubai, or Abu Dhabi, use AED.

4. If the user mentions Saudi Arabia or Saudi, use SAR.

5. If the user mentions Qatar, use QAR.

6. If the user mentions Bahrain, use BHD.

7. If the user mentions Oman or Muscat, use OMR.

8. If the user mentions India or Indian, use INR.

9. Use realistic approximate prices for the requested location.

10. If useful, provide the price in the local currency and INR.

11. Never ignore an explicitly mentioned location or currency.

Language rules:

- Answer in ${language}.
- Recommendation names may remain in their original/common names.
- Descriptions should be natural and understandable in ${language}.
- Do not switch languages unnecessarily.

Recommendation rules:

- Understand the user's intent carefully.
- Recommend relevant and realistic options.
- Consider location, budget, preferences, and context.
- Avoid generic or unrelated recommendations.
- Give exactly 5 recommendations.

Output rules:

Return ONLY valid JSON.
Do not use markdown.
Do not use code fences.
Do not include any explanation outside JSON.

The JSON must have exactly this structure:

{
  "recommendations": [
    {
      "name": "Recommendation name",
      "description": "Short useful description",
      "price": "Approximate price",
      "category": "Category",
      "location": "Relevant location"
    },
    {
      "name": "Recommendation name",
      "description": "Short useful description",
      "price": "Approximate price",
      "category": "Category",
      "location": "Relevant location"
    },
    {
      "name": "Recommendation name",
      "description": "Short useful description",
      "price": "Approximate price",
      "category": "Category",
      "location": "Relevant location"
    },
    {
      "name": "Recommendation name",
      "description": "Short useful description",
      "price": "Approximate price",
      "category": "Category",
      "location": "Relevant location"
    },
    {
      "name": "Recommendation name",
      "description": "Short useful description",
      "price": "Approximate price",
      "category": "Category",
      "location": "Relevant location"
    }
  ]
}

Make sure there are exactly 5 recommendation objects.
`;

    /*
      MODEL PRIORITY:

      1. gemini-3.5-flash-lite
      2. gemini-3.1-flash-lite
      3. gemini-3.6-flash

      If 3.5 works -> stop.
      If 3.5 gives repeated 503/429 -> try 3.1.
      If 3.1 also fails -> try 3.6.
    */
    const result = await generateWithFallback(
      genAI,
      prompt
    );

    let text = result.response.text().trim();

    // Remove accidental markdown code fences.
    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let data;

    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error(
        "Gemini returned invalid JSON:",
        text
      );

      return Response.json(
        {
          error:
            "Gemini returned an invalid recommendation response. Please try again.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !data ||
      !Array.isArray(data.recommendations)
    ) {
      console.error(
        "Invalid recommendation structure:",
        data
      );

      return Response.json(
        {
          error:
            "Invalid recommendation response. Please try again.",
        },
        {
          status: 500,
        }
      );
    }

    return Response.json(data);
  } catch (error) {
    console.error(
      "Recommendation API error:",
      error
    );

    return Response.json(
      {
        error:
          "Failed to generate recommendations. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}