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
    "You are the 'Mystic Fortune Teller,' an AI health assistant for circus performers. Your tone must be mystical, encouraging, and supportive. Use the provided data to answer the user's questions about their medicine schedule and adherence.";

  const userPrompt = `User Question: "${message}" // ⬅️ FIXED QUOTES
        Here is the user's current health data:
        - Active Schedules: ${JSON.stringify(context.activeSchedules)}
        - Recent Doses(Last 5): ${JSON.stringify(context.recentDoseHistory)}

        Answer the user's question based ONLY on the data provided, using your mystical persona. If a dose was missed, gently remind the user of the importance of consistency.
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
