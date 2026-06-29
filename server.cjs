var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
var import_vite = require("vite");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var apiKey = process.env.GEMINI_API_KEY;
var ai = null;
if (apiKey) {
  ai = new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
} else {
  console.warn("GEMINI_API_KEY is not defined. AI features will run in Mock Mode.");
}
app.post("/api/gemini/ask-ai", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    if (!ai) {
      return res.json({
        text: `[Mock AI Mode] Thank you for asking: "${prompt}". Please add your GEMINI_API_KEY in the Secrets panel of AI Studio to connect the real Gemini 3.5 model!`
      });
    }
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert academic tutor. Provide clear, detailed, and accurate explanations."
      }
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Error in ask-ai:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response" });
  }
});
app.post("/api/gemini/course-assistant", async (req, res) => {
  try {
    const { courseName, materialContext, message, chatHistory } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    if (!ai) {
      return res.json({
        text: `[Mock AI Mode] Chatting about course: ${courseName || "General"}.
Response: That's an interesting question about ${message}. Integrate your real API key for active Gemini assistance!`
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
      contents,
      config: {
        systemInstruction: contextInstruction
      }
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Error in course-assistant:", error);
    res.status(500).json({ error: error.message || "Failed to generate course assistant response" });
  }
});
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
      contents,
      config: { systemInstruction }
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Error in student-help:", error);
    res.status(500).json({ error: error.message || "Failed to generate student support response" });
  }
});
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
      model: "gemini-3.1-pro-preview",
      // Complex reasoning model
      contents: prompt,
      config: {
        systemInstruction: "You are an elite software engineering and academic assignment coach. Help students learn, debug, and understand concepts deeply rather than just giving away direct answers."
      }
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Error in assignment-helper:", error);
    res.status(500).json({ error: error.message || "Failed to analyze assignment" });
  }
});
app.post("/api/gemini/course-recommendation", async (req, res) => {
  try {
    const { interest, skillLevel, background, availableCourses } = req.body;
    if (!interest) {
      return res.status(400).json({ error: "Interest is required" });
    }
    const coursesListStr = availableCourses && Array.isArray(availableCourses) ? availableCourses.map((c) => `- ID: ${c.id}, Title: ${c.title}, Description: ${c.description}, Category: ${c.category}`).join("\n") : "No courses currently loaded.";
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
        systemInstruction: "You are the head academic advisor at TB Academy. Match students to courses based on their skill profile, career direction, and background."
      }
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Error in course-recommendation:", error);
    res.status(500).json({ error: error.message || "Failed to generate course recommendations" });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
