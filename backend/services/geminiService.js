const {GoogleGenerativeAI} =require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function convertTranscript(text){
    const model = genAI.getGenerativeModel("gemini-2.5-pro");

    const prompt = 
    `Convert the following meeting transcript into structured JSON.
    
    Return JSON with:
    - decisions
    - action_items (owner, task, deadline)
    - goals
    - follow_ups
    
    Transcript:
    ${text}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return JSON.parse(response);
}

module.exports = convertTranscript;