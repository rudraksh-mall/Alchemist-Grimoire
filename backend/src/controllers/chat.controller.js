import { GoogleGenAI } from "@google/genai";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { MedicationSchedule } from "../models/medicationSchedule.model.js";
import { DoseLog } from "../models/doseLog.model.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const sendMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const userId = req.user._id;

  // Assuming your authentication middleware attaches user details like fullName
  const userFullName = req.user.fullName || "Esteemed Alchemist";

  if (!message) throw new ApiError(400, "Message content is required."); //  DATA RETRIEVAL

  const schedules = await MedicationSchedule.find({ userId }).select(
    "name dosage frequency times startDate"
  );

  const recentLogs = await DoseLog.find({ userId })
    .sort({ scheduledFor: -1 })
    .limit(5)
    .select("scheduledFor status")
    .lean(); // Convert to plain JS objects for JSON.stringify

  const context = {
    activeSchedules: schedules,
    recentDoseHistory: recentLogs,
    currentDate: new Date().toISOString(),
  }; // PROMPT CONSTRUCTION

  const systemInstruction =
    "You are the 'Mystic Fortune Teller,' a wise and helpful health assistant. Your core mission is to analyze the user's detailed medication schedule and dosage history (the Grimoire data) to provide concise, direct, and actionable answers to their questions. Prioritize clarity over extensive mystical language. Frame your advice with the app's theme (elixirs, potions) but ensure the actual health/schedule information is delivered in plain, simple English.";

  const userPrompt = `
Greetings, ${userFullName}. Analyze the following Grimoire data to answer the user's question clearly and concisely.

User Question: "${message}"

--- Grimoire Data for Analysis ---
- User Name: ${userFullName} 
- Active Schedules: ${JSON.stringify(context.activeSchedules)}
- Recent Dose History (Last 5): ${JSON.stringify(context.recentDoseHistory)}
- Current Date/Time: ${context.currentDate}

Task: Answer the user's question.
1. SCHEDULE/DOSE QUESTION: Answer directly using the supplied data. Use bullet points for clarity if listing items (e.g., "You need to take...").
2. GENERAL HEALTH/SAFETY QUESTION: Use your general knowledge and the Google Search tool (if necessary) to provide a factual, simple answer.
3. CONCISE PERSONA: Begin with a brief mystical greeting (1 sentence maximum) and then deliver the core answer in simple, direct language. Do not write long paragraphs or generate unnecessary lore.
`; //  AI GENERATION

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemInstruction,
        tools: [{ google_search: {} }],
      },
    });

    const aiResponse = response.text.trim();
    return res
      .status(200)
      .json(
        new ApiResponse(200, { response: aiResponse }, "AI response generated")
      );
  } catch (aiError) {
    console.log("Gemini API Error: ", aiError);
    throw new ApiError(
      500,
      "The Mystic Fortune Teller's crystal ball is cloudy. Try again."
    );
  }
});

export { sendMessage };
