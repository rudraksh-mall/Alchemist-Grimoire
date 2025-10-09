// backend/src/controllers/chat.controller.js (Final Stable Version)

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

  if (!message) throw new ApiError(400, "Message content is required.");

  //  1. DATA RETRIEVAL

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
  };

  //  PROMPT CONSTRUCTION

  const systemInstruction =
    "You are the 'Mystic Fortune Teller,' a wise, helpful, and supportive health assistant dedicated to the user. Your primary role is to analyze the user's provided medication schedules and dose history (Grimoire data) to answer their natural language questions clearly and concisely. Your tone must be encouraging and knowledgeable, framing your response with the app's mystical theme (e.g., using elixirs, potions, Grimoire). Do not engage in fortune-telling or provide generic medical advice outside of the supplied data.";

  const userPrompt = `User Question: "${message}"

--- Grimoire Data ---
- Active Schedules: ${JSON.stringify(context.activeSchedules)}
- Recent Dose History (Last 5): ${JSON.stringify(context.recentDoseHistory)}

Task: Answer the user's question.
1. If the question relates to the user's schedule, dosage, or missed doses (like "What do I take now?"), use the Grimoire Data ONLY.
2. If the question is general health, safety, or wellness-related (like "Is Tylenol safe to take with my medicine?"), use your general knowledge and Google Search tool to provide a factual answer.
3. Maintain the Mystic Fortune Teller persona in the final response.
`;

  // --- 3. AI GENERATION ---
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemInstruction,
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
