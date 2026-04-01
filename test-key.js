/**
 * Local dev helper: lists Gemini models your key can access.
 * Never commit keys. Set GOOGLE_GENAI_API_KEY in .env.local or the shell.
 */
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GOOGLE_GENAI_API_KEY?.trim();
if (!API_KEY) {
  console.error("Set GOOGLE_GENAI_API_KEY (e.g. in .env.local) and run again.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function listMyModels() {
  try {
    genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("Asking Google for available models...");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`,
    );
    const data = await response.json();
    if (data.models) {
      console.log("\nSUCCESS! Models your key can access (generateContent):");
      data.models.forEach((m) => {
        if (m.supportedGenerationMethods?.includes("generateContent")) {
          console.log(` - ${m.name.replace("models/", "")}`);
        }
      });
    } else {
      console.error("ERROR: No models returned. Full response:", data);
    }
  } catch (error) {
    console.error("FAILED to list models.", error);
  }
}

listMyModels();
