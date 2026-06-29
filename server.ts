import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent for AI Studio telemetry
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("GEMINI_API_KEY is not defined. AI features will run in Mock Mode.");
}

// ----------------------------------------------------
// AI Integration Endpoints
// ----------------------------------------------------

// 1. Generic Ask AI
app.post("/api/gemini/ask-ai", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (!ai) {
      // Mock Response when API Key is missing
      return res.json({
        text: `[Mock AI Mode] Thank you for asking: "${prompt}". Please add your GEMINI_API_KEY in the Secrets panel of AI Studio to connect the real Gemini 3.5 model!`
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert academic tutor. Provide clear, detailed, and accurate explanations.",
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in ask-ai:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response" });
  }
});

// 2. Course Assistant (Chats about specific course materials)
app.post("/api/gemini/course-assistant", async (req, res) => {
  try {
    const { courseName, materialContext, message, chatHistory } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!ai) {
      return res.json({
        text: `[Mock AI Mode] Chatting about course: ${courseName || "General"}.\nResponse: That's an interesting question about ${message}. Integrate your real API key for active Gemini assistance!`
      });
    }

    const contextInstruction = `You are a Course Assistant for the course: "${courseName || "General Topic"}". 
Here is some specific material context for reference:
---
${materialContext || "No specific course material uploaded yet."}
---
Use this context to answer the student's questions. If the answer cannot be found in the context, use your expert academic knowledge but prioritize the provided materials. Be encouraging, concise, and educational.`;

    const contents = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      // Map standard history (role: user/model) to contents
      for (const msg of chatHistory) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      }
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: contextInstruction,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in course-assistant:", error);
    res.status(500).json({ error: error.message || "Failed to generate course assistant response" });
  }
});

// 3. Student Help Chatbot (General onboarding & support helper)
app.post("/api/gemini/student-help", async (req, res) => {
  try {
    const { message, chatHistory } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!ai) {
      return res.json({
        text: `[Mock AI Mode] How can I assist you with your student account, payments, or courses? Add your API key to talk to the real TB Academy support bot.`
      });
    }

    const systemInstruction = `You are the friendly automated Student Help Chatbot for "TB Academy" (TB-WEBAPP).
You assist students with:
- Navigating the platform (enrolling in courses, viewing materials, contacting support)
- Payment instructions (Telebirr: 0967145146, CBE: 1000755134701). Inform them they must upload a screenshot of their transaction, which is then verified by our Admin Amanuel.
- General questions about academic schedules and certificates.
Keep responses warm, helpful, and formatted beautifully in markdown.`;

    const contents = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const msg of chatHistory) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      }
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: { systemInstruction }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in student-help:", error);
    res.status(500).json({ error: error.message || "Failed to generate student support response" });
  }
});

// 4. Assignment Helper (Interactive problem solver)
app.post("/api/gemini/assignment-helper", async (req, res) => {
  try {
    const { assignmentTitle, problemDescription, studentAttempt } = req.body;
    if (!problemDescription) {
      return res.status(400).json({ error: "Problem description is required" });
    }

    if (!ai) {
      return res.json({
        text: `[Mock AI Mode] Assignment Helper: Great attempt! Your code/logic looks like a good start. Set up your Gemini API Key in secrets to get step-by-step code analysis, grading, and hints from Gemini.`
      });
    }

    const prompt = `Assignment: ${assignmentTitle || "General Practice Problem"}
Problem:
${problemDescription}

Student's Solution/Attempt:
${studentAttempt || "No attempt provided yet."}

Please analyze the student's attempt. Offer constructiveness:
1. Identify any syntax, logic, or algorithmic errors.
2. Give conceptual hints without directly writing the final code for them (let them learn!).
3. Suggest 2-3 best practices to improve their solution.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview", // Complex reasoning model
      contents: prompt,
      config: {
        systemInstruction: "You are an elite software engineering and academic assignment coach. Help students learn, debug, and understand concepts deeply rather than just giving away direct answers.",
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in assignment-helper:", error);
    res.status(500).json({ error: error.message || "Failed to analyze assignment" });
  }
});

// 5. Course Recommendation (Analyzes goals and skills)
app.post("/api/gemini/course-recommendation", async (req, res) => {
  try {
    const { interest, skillLevel, background, availableCourses } = req.body;
    if (!interest) {
      return res.status(400).json({ error: "Interest is required" });
    }

    const coursesListStr = availableCourses && Array.isArray(availableCourses)
      ? availableCourses.map(c => `- ID: ${c.id}, Title: ${c.title}, Description: ${c.description}, Category: ${c.category}`).join("\n")
      : "No courses currently loaded.";

    if (!ai) {
      return res.json({
        text: `Based on your interest in "${interest}" at a ${skillLevel || "beginner"} level, we suggest checking out any of our programming courses! (Mock mode: configure Gemini API Key for dynamic personalization)`
      });
    }

    const prompt = `Student Profile:
- Interest: ${interest}
- Skill Level: ${skillLevel || "Beginner"}
- Background/Goal: ${background || "Self-improvement"}

Available Courses:
${coursesListStr}

Please evaluate which courses fit this student best. Provide:
1. Top recommended courses (by ID/Title) with matching reasons.
2. A recommended learning roadmap order.
3. Brief advice on how to succeed.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the head academic advisor at TB Academy. Match students to courses based on their skill profile, career direction, and background.",
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in course-recommendation:", error);
    res.status(500).json({ error: error.message || "Failed to generate course recommendations" });
  }
});

// Serve static assets/frontend
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
