const {GoogleGenerativeAI} = require("@google/generative-ai");
if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY not set — convertTranscript will throw if called.");
}
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
function safeParseJSON(text) {
  // Remove markdown fences
  let cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // Extract JSON object only
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No JSON object found in model response");
  }

  const jsonString = cleaned.substring(firstBrace, lastBrace + 1);

  let parsed = JSON.parse(jsonString);

  // Normalize missing fields
  return {
    decisions: parsed.decisions || [],
    action_items: parsed.action_items || [],
    goals: parsed.goals || [],
    follow_ups: parsed.follow_ups || []
  };
}

async function convertTranscript(text){
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not set");
    }
    
    const model = genai.getGenerativeModel({
        model: "gemini-2.5-pro"
    });

    const prompt = 
    `Convert the following meeting transcript into structured JSON.

    STRICT RULES:
    - Respond with ONLY valid JSON
    - Do NOT use markdown
    - Do NOT wrap in triple backticks
    - Do NOT add explanations
    
    JSON schema:
    {
    "decisions": [],
    "action_items": [
        {
        "owner": "", 
        "task": "",
        "deadline": ""
        "status": ""  // one of "pending", "in_progress", "completed"
        }
    ],
    "goals": [],
    "follow_ups": []
    }
    
    Transcript:
    ${text}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // HARD CLEANING (handles markdown, stray text)
    try {
    return safeParseJSON(response);
  } catch (err) {
    console.error("Transcript conversion failed:", err, {
      rawResponse: response
    });

    return {
      decisions: [],
      action_items: [],
      goals: [],
      follow_ups: [],
      error: "LLM_OUTPUT_INVALID"
    };
  }
}
module.exports = convertTranscript;