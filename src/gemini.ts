import { Course, ChatMessage } from "./types";

/**
 * Frontend client interface to interact with Google Gemini AI via our secure backend.
 */
export const geminiService = {
  /**
   * 1. Ask AI (Generic tutor Q&A)
   */
  async askAI(prompt: string): Promise<string> {
    try {
      const response = await fetch("/api/gemini/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate AI response");
      }
      const data = await response.json();
      return data.text;
    } catch (error: any) {
      console.error("Error in geminiService.askAI:", error);
      return `Failed to connect with Gemini. ${error.message || ""}`;
    }
  },

  /**
   * 2. Course Assistant (Chats about course materials)
   */
  async chatWithCourseAssistant(
    courseName: string,
    materialContext: string,
    message: string,
    chatHistory: ChatMessage[]
  ): Promise<string> {
    try {
      // Map frontend ChatMessage schema to backend structure
      const historyPayload = chatHistory.map(msg => ({
        role: msg.role,
        text: msg.text
      }));

      const response = await fetch("/api/gemini/course-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName,
          materialContext,
          message,
          chatHistory: historyPayload
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to chat with course assistant");
      }
      const data = await response.json();
      return data.text;
    } catch (error: any) {
      console.error("Error in geminiService.chatWithCourseAssistant:", error);
      return `Error: ${error.message || "Failed to reach Course Assistant"}`;
    }
  },

  /**
   * 3. Student Help Chatbot (onboarding and support helper)
   */
  async chatWithStudentHelp(message: string, chatHistory: ChatMessage[]): Promise<string> {
    try {
      const historyPayload = chatHistory.map(msg => ({
        role: msg.role,
        text: msg.text
      }));

      const response = await fetch("/api/gemini/student-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          chatHistory: historyPayload
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to communicate with help desk");
      }
      const data = await response.json();
      return data.text;
    } catch (error: any) {
      console.error("Error in geminiService.chatWithStudentHelp:", error);
      return `Error: ${error.message || "Help desk chatbot currently unavailable"}`;
    }
  },

  /**
   * 4. Assignment Helper (Interactive problem debugging)
   */
  async assignmentHelper(
    assignmentTitle: string,
    problemDescription: string,
    studentAttempt: string
  ): Promise<string> {
    try {
      const response = await fetch("/api/gemini/assignment-helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentTitle,
          problemDescription,
          studentAttempt
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to evaluate assignment details");
      }
      const data = await response.json();
      return data.text;
    } catch (error: any) {
      console.error("Error in geminiService.assignmentHelper:", error);
      return `Failed to analyze attempt. Error: ${error.message || ""}`;
    }
  },

  /**
   * 5. Course Recommendation (Personalized courses based on skills & goals)
   */
  async getCourseRecommendation(
    interest: string,
    skillLevel: string,
    background: string,
    availableCourses: Course[]
  ): Promise<string> {
    try {
      const response = await fetch("/api/gemini/course-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interest,
          skillLevel,
          background,
          availableCourses
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch custom course advice");
      }
      const data = await response.json();
      return data.text;
    } catch (error: any) {
      console.error("Error in geminiService.getCourseRecommendation:", error);
      return `Failed to analyze recommendation. Error: ${error.message || ""}`;
    }
  }
};
