import { User } from '../models/user.model.js';
import { DoseLog } from '../models/doseLog.model.js';
import { ApiError } from '../utils/ApiError.js';

// NOTE: Use a unique model ID for the prediction output, not the generic chat model.
const GEMINI_MODEL = 'gemini-2.5-flash-preview-05-20'; 

const fetchAdherenceHistory = async (userId) => {
    // Look at the last 14 days of history
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const history = await DoseLog.find({
        userId,
        scheduledFor: { $gte: twoWeeksAgo },
        // Only interested in completed actions (taken/missed)
        status: { $in: ['taken', 'missed'] } 
    })
    .populate({
        path: 'scheduleId',
        select: 'name'
    })
    .sort({ scheduledFor: 1 });

    // Simplify the data structure for the AI
    return history.map(log => ({
        doseName: log.scheduleId?.name || 'Unknown',
        scheduled: log.scheduledFor.toISOString(),
        status: log.status,
        dayOfWeek: log.scheduledFor.toLocaleDateString('en-US', { weekday: 'long' }),
        hour: log.scheduledFor.getUTCHours(),
    }));
};

export const analyzeAndPredictAdherence = async (userId, upcomingDose) => {
    const historyData = await fetchAdherenceHistory(userId);
    console.log(historyData.length, "historical dose logs fetched for AI analysis.");

    if (historyData.length < 5) {
        return {
            summary: "Not enough data for an accurate prediction. Keep logging your doses!",
            riskLevel: "LOW",
            proactiveNudge: null
        };
    }

    const systemPrompt = `
        You are the Mystic Fortune Teller, an AI trained to analyze performer adherence data.
        Your task is to analyze the user's past 14 days of medication history and predict the risk of missing their upcoming dose.

        1. ANALYSIS: Find any patterns (e.g., always missing morning doses, missing doses on weekends, missing a specific pill).
        2. PREDICTION: Assign a Risk Level (LOW, MEDIUM, HIGH) for the upcoming dose.
        3. NUDGE: Formulate a short, friendly, proactive reminder suggestion (under 15 words) based on the pattern.

        Output MUST be a single JSON object.
    `;

    const userQuery = `
        User's Past Dose History (Status: taken or missed):
        ${JSON.stringify(historyData, null, 2)}

        Upcoming Dose to Predict:
        Pill: ${upcomingDose.name}, Scheduled: ${upcomingDose.scheduledFor.toLocaleTimeString()} on ${upcomingDose.scheduledFor.toLocaleDateString()}
    `;
    
    // Define the required JSON structure for the Gemini response
    const responseSchema = {
        type: "OBJECT",
        properties: {
            summary: { type: "STRING", description: "A concise 1-2 sentence analysis of the user's observed patterns." },
            riskLevel: { type: "STRING", enum: ["LOW", "MEDIUM", "HIGH"], description: "Predicted risk level for the upcoming dose." },
            proactiveNudge: { type: "STRING", description: "A friendly, proactive reminder question (e.g., 'Remind you again in 15 minutes?')." }
        },
        required: ["summary", "riskLevel", "proactiveNudge"]
    };

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        // Extract and parse the JSON string from the response
        const jsonString = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!jsonString) {
             throw new Error("Gemini returned empty or malformed JSON.");
        }
        
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Gemini API call failed:", error);
        // Fallback response if the API fails
        return {
            summary: "The Fortune Teller is resting. Prediction unavailable.",
            riskLevel: "UNKNOWN",
            proactiveNudge: null
        };
    }
};