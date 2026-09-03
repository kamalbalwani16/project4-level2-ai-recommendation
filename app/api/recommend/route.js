import { GoogleGenerativeAI } from "@google/generative-ai";

const languageCurrencyMap = {
  English: {
    currency: "USD ($)",
    display: "USD ($) + INR (₹)",
  },

  Hindi: {
    currency: "INR (₹)",
    display: "INR (₹)",
  },

  Hinglish: {
    currency: "INR (₹)",
    display: "INR (₹)",
  },

  Marathi: {
    currency: "INR (₹)",
    display: "INR (₹)",
  },

  Bengali: {
    currency: "INR (₹)",
    display: "INR (₹)",
  },

  Gujarati: {
    currency: "INR (₹)",
    display: "INR (₹)",
  },

  Punjabi: {
    currency: "INR (₹)",
    display: "INR (₹)",
  },

  Tamil: {
    currency: "INR (₹)",
    display: "INR (₹)",
  },

  Telugu: {
    currency: "INR (₹)",
    display: "INR (₹)",
  },

  Kannada: {
    currency: "INR (₹)",
    display: "INR (₹)",
  },

  Malayalam: {
    currency: "INR (₹)",
    display: "INR (₹)",
  },

  Urdu: {
    currency: "INR (₹)",
    display: "INR (₹)",
  },

  Odia: {
    currency: "INR (₹)",
    display: "INR (₹)",
  },

  Assamese: {
    currency: "INR (₹)",
    display: "INR (₹)",
  },

  Spanish: {
    currency: "EUR (€)",
    display: "EUR (€) + INR (₹)",
  },

  French: {
    currency: "EUR (€)",
    display: "EUR (€) + INR (₹)",
  },

  German: {
    currency: "EUR (€)",
    display: "EUR (€) + INR (₹)",
  },

  Portuguese: {
    currency: "EUR (€)",
    display: "EUR (€) + INR (₹)",
  },

  Italian: {
    currency: "EUR (€)",
    display: "EUR (€) + INR (₹)",
  },

  Dutch: {
    currency: "EUR (€)",
    display: "EUR (€) + INR (₹)",
  },

  Russian: {
    currency: "RUB (₽)",
    display: "RUB (₽) + INR (₹)",
  },

  Ukrainian: {
    currency: "UAH (₴)",
    display: "UAH (₴) + INR (₹)",
  },

  Polish: {
    currency: "PLN (zł)",
    display: "PLN (zł) + INR (₹)",
  },

  Turkish: {
    currency: "TRY (₺)",
    display: "TRY (₺) + INR (₹)",
  },

  Arabic: {
    currency: "AED (د.إ)",
    display: "AED (د.إ) + INR (₹)",
  },

  Persian: {
    currency: "IRR (﷼)",
    display: "IRR (﷼) + INR (₹)",
  },

  Hebrew: {
    currency: "ILS (₪)",
    display: "ILS (₪) + INR (₹)",
  },

  "Chinese (Simplified)": {
    currency: "CNY (¥)",
    display: "CNY (¥) + INR (₹)",
  },

  "Chinese (Traditional)": {
    currency: "TWD (NT$)",
    display: "TWD (NT$) + INR (₹)",
  },

  Japanese: {
    currency: "JPY (¥)",
    display: "JPY (¥) + INR (₹)",
  },

  Korean: {
    currency: "KRW (₩)",
    display: "KRW (₩) + INR (₹)",
  },

  Vietnamese: {
    currency: "VND (₫)",
    display: "VND (₫) + INR (₹)",
  },

  Thai: {
    currency: "THB (฿)",
    display: "THB (฿) + INR (₹)",
  },

  Indonesian: {
    currency: "IDR (Rp)",
    display: "IDR (Rp) + INR (₹)",
  },

  Malay: {
    currency: "MYR (RM)",
    display: "MYR (RM) + INR (₹)",
  },
};

// Explicit country/location currency has priority over language.
const countryCurrencyMap = [
  {
    keywords: ["kuwait"],
    currency: "KWD (د.ك)",
    display: "KWD (د.ك) + INR (₹)",
  },
  {
    keywords: ["uae", "united arab emirates", "dubai", "abu dhabi"],
    currency: "AED (د.إ)",
    display: "AED (د.إ) + INR (₹)",
  },
  {
    keywords: ["saudi arabia", "saudi"],
    currency: "SAR (﷼)",
    display: "SAR (﷼) + INR (₹)",
  },
  {
    keywords: ["qatar"],
    currency: "QAR (﷼)",
    display: "QAR (﷼) + INR (₹)",
  },
  {
    keywords: ["bahrain"],
    currency: "BHD (د.ب)",
    display: "BHD (د.ب) + INR (₹)",
  },
  {
    keywords: ["oman", "muscat"],
    currency: "OMR (ر.ع.)",
    display: "OMR (ر.ع.) + INR (₹)",
  },
  {
    keywords: ["india", "indian"],
    currency: "INR (₹)",
    display: "INR (₹)",
  },
];

function detectCountryCurrency(query) {
  const lowerQuery = query.toLowerCase();

  for (const country of countryCurrencyMap) {
    if (
      country.keywords.some((keyword) =>
        lowerQuery.includes(keyword)
      )
    ) {
      return country;
    }
  }

  return null;
}

export async function POST(request) {
  try {
    const body = await request.json();

    const query = body.query?.trim();
    const language = body.language || "English";

    if (!query) {
      return Response.json(
        {
          error: "Please enter what you are looking for.",
        },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        {
          error: "GEMINI_API_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    const selectedLanguage =
      languageCurrencyMap[language]
        ? language
        : "English";

    // First check explicit country/location.
    const detectedCountry = detectCountryCurrency(query);

    // If country is not mentioned, use language default.
    const currencyInfo =
      detectedCountry || languageCurrencyMap[selectedLanguage];

    const genAI = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY
    );

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
    });

    const prompt = `
You are an expert multilingual AI recommendation assistant.

USER REQUEST:
"${query}"

OUTPUT LANGUAGE:
${selectedLanguage}

CURRENCY RULE:
${currencyInfo.display}

IMPORTANT CURRENCY INSTRUCTIONS:

1. If the user explicitly mentions a currency, use that currency.

2. If the user explicitly mentions a country or location, use the currency of that country.

3. Country/location currency has priority over the language default.

4. If the request mentions Kuwait:
   Use KWD (د.ك) + INR (₹).

5. If the request mentions UAE, United Arab Emirates, Dubai, or Abu Dhabi:
   Use AED (د.إ) + INR (₹).

6. If the request mentions Saudi Arabia or Saudi:
   Use SAR (﷼) + INR (₹).

7. If the request mentions Qatar:
   Use QAR (﷼) + INR (₹).

8. If the request mentions Bahrain:
   Use BHD (د.ب) + INR (₹).

9. If the request mentions Oman or Muscat:
   Use OMR (ر.ع.) + INR (₹).

10. If the request mentions India or Indian products:
    Use INR (₹).

11. English without an explicit country/currency:
    Show USD ($) + INR (₹).

12. Indian languages such as Hindi, Hinglish, Marathi, Bengali,
    Gujarati, Punjabi, Tamil, Telugu, Kannada, Malayalam, Urdu,
    Odia and Assamese:
    Use INR (₹).

13. Persian:
    Default to IRR (﷼) + INR (₹), unless another country/currency
    is explicitly mentioned.

14. Hebrew:
    Default to ILS (₪) + INR (₹), unless another country/currency
    is explicitly mentioned.

15. Spanish, French, German, Portuguese, Italian and Dutch:
    Default to EUR (€) + INR (₹), unless another country/location
    is explicitly mentioned.

16. Japanese:
    Default to JPY (¥) + INR (₹).

17. Korean:
    Default to KRW (₩) + INR (₹).

18. Chinese Simplified:
    Default to CNY (¥) + INR (₹).

19. Chinese Traditional:
    Default to TWD (NT$) + INR (₹).

20. Russian:
    Default to RUB (₽) + INR (₹).

21. Ukrainian:
    Default to UAH (₴) + INR (₹).

22. Polish:
    Default to PLN (zł) + INR (₹).

23. Turkish:
    Default to TRY (₺) + INR (₹).

24. Vietnamese:
    Default to VND (₫) + INR (₹).

25. Thai:
    Default to THB (฿) + INR (₹).

26. Indonesian:
    Default to IDR (Rp) + INR (₹).

27. Malay:
    Default to MYR (RM) + INR (₹).

PRICE CONVERSION:
- Always use realistic approximate exchange rates.
- Never simply copy the same numerical value between currencies.
- Example:
  $100 should NOT become ₹100.
  It should be converted approximately to the current realistic INR value.
- Prices can be approximate estimates.
- If the user gives a budget, respect that budget.
- If the user gives a budget in a specific currency, interpret it in
  that currency first.

LANGUAGE INSTRUCTIONS:
- Write the descriptions and reasons in ${selectedLanguage}.
- Keep well-known product, brand, movie, game and place names in their
  original names when appropriate.
- Do not unnecessarily translate proper names.

RECOMMENDATION RULES:
- Give exactly 5 recommendations.
- Make each recommendation relevant to the user's request.
- Avoid duplicate recommendations.
- Give useful descriptions.
- Explain why each item is recommended.
- If the user asks for products, recommend realistic products.
- If the user asks for movies, recommend realistic movies.
- If the user asks for travel destinations, recommend realistic destinations.

RETURN FORMAT:
Return ONLY valid JSON.
Do not use markdown.
Do not use code fences.

{
  "recommendations": [
    {
      "name": "Recommendation name",
      "price": "price with correct currency/currencies",
      "description": "Short description",
      "reason": "Why this is recommended"
    }
  ]
}
`;

    const result = await model.generateContent(prompt);

    const text = result.response.text().trim();

    // Remove markdown code fences if Gemini adds them.
    const cleanedText = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const data = JSON.parse(cleanedText);

    if (
      !data.recommendations ||
      !Array.isArray(data.recommendations)
    ) {
      throw new Error("Invalid recommendation response.");
    }

    return Response.json(data);
  } catch (error) {
    console.error("Recommendation API error:", error);

    return Response.json(
      {
        error:
          "Failed to generate recommendations. Please try again.",
      },
      { status: 500 }
    );
  }
}