import React, { useState } from "react";
import { 
  Sparkles, Send, Brain, Bot, HelpCircle, Dumbbell, 
  Compass, UserCheck, MessageSquare, RefreshCw, GraduationCap, Code
} from "lucide-react";
import { geminiService } from "../gemini";
import { Course, ChatMessage } from "../types";

interface AIChatbotProps {
  courses: Course[];
  activeCourse?: Course;
}

export default function AIChatbot({ courses, activeCourse }: AIChatbotProps) {
  const [activeTool, setActiveTool] = useState<'ask' | 'assistant' | 'help' | 'assignment' | 'recommend'>('ask');
  
  // States for general chat
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Chat message logs for different modules
  const [askHistory, setAskHistory] = useState<ChatMessage[]>([]);
  const [assistantHistory, setAssistantHistory] = useState<Record<string, ChatMessage[]>>({});
  const [helpHistory, setHelpHistory] = useState<ChatMessage[]>([
    {
      id: "h-init",
      role: "model",
      text: "Hello! I am your student support bot. Ask me anything about registering, payment channels, verification workflows, or certificate releases!",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);

  // Specific forms states
  const [selectedCourseId, setSelectedCourseId] = useState(activeCourse?.id || (courses[0]?.id || ""));
  
  // Assignment Helper States
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [studentAttempt, setStudentAttempt] = useState("");
  const [assignmentResult, setAssignmentResult] = useState<string | null>(null);

  // Recommendation States
  const [studentInterest, setStudentInterest] = useState("");
  const [skillLevel, setSkillLevel] = useState("Beginner");
  const [studentBackground, setStudentBackground] = useState("");
  const [recommendationResult, setRecommendationResult] = useState<string | null>(null);

  const getSelectedCourse = () => courses.find(c => c.id === selectedCourseId);

  // 1. Send handler for General Ask AI
  const handleSendAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMsg: ChatMessage = {
      id: "ask-u-" + Date.now(),
      role: "user",
      text: message,
      timestamp: new Date().toLocaleTimeString()
    };

    setAskHistory(prev => [...prev, userMsg]);
    setMessage("");
    setLoading(true);

    try {
      const responseText = await geminiService.askAI(userMsg.text);
      const modelMsg: ChatMessage = {
        id: "ask-m-" + Date.now(),
        role: "model",
        text: responseText,
        timestamp: new Date().toLocaleTimeString()
      };
      setAskHistory(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Send handler for Course Assistant
  const handleSendAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedCourseId) return;

    const currentCourse = getSelectedCourse();
    if (!currentCourse) return;

    const courseId = currentCourse.id;
    const userMsg: ChatMessage = {
      id: "asst-u-" + Date.now(),
      role: "user",
      text: message,
      timestamp: new Date().toLocaleTimeString()
    };

    const currentHistory = assistantHistory[courseId] || [];
    const updatedHistory = [...currentHistory, userMsg];

    setAssistantHistory(prev => ({
      ...prev,
      [courseId]: updatedHistory
    }));
    setMessage("");
    setLoading(true);

    try {
      // Simulate/provide course syllabus or description as materials context
      const context = `Syllabus/Description: ${currentCourse.description} | Category: ${currentCourse.category} | Instructor: ${currentCourse.instructor}`;
      
      const responseText = await geminiService.chatWithCourseAssistant(
        currentCourse.title,
        context,
        userMsg.text,
        currentHistory
      );

      const modelMsg: ChatMessage = {
        id: "asst-m-" + Date.now(),
        role: "model",
        text: responseText,
        timestamp: new Date().toLocaleTimeString()
      };

      setAssistantHistory(prev => ({
        ...prev,
        [courseId]: [...updatedHistory, modelMsg]
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Send handler for Student Support Help Chatbot
  const handleSendHelp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMsg: ChatMessage = {
      id: "help-u-" + Date.now(),
      role: "user",
      text: message,
      timestamp: new Date().toLocaleTimeString()
    };

    setHelpHistory(prev => [...prev, userMsg]);
    setMessage("");
    setLoading(true);

    try {
      const responseText = await geminiService.chatWithStudentHelp(userMsg.text, helpHistory);
      const modelMsg: ChatMessage = {
        id: "help-m-" + Date.now(),
        role: "model",
        text: responseText,
        timestamp: new Date().toLocaleTimeString()
      };
      setHelpHistory(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 4. Handler for Assignment Helper
  const handleAssignmentCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemDescription.trim()) return;

    setLoading(true);
    setAssignmentResult(null);
    try {
      const result = await geminiService.assignmentHelper(
        assignmentTitle || "Standard Homework Task",
        problemDescription,
        studentAttempt
      );
      setAssignmentResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 5. Handler for Course Recommendation
  const handleRecommendationCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentInterest.trim()) return;

    setLoading(true);
    setRecommendationResult(null);
    try {
      const result = await geminiService.getCourseRecommendation(
        studentInterest,
        skillLevel,
        studentBackground,
        courses
      );
      setRecommendationResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Formatter function to convert plain text markdown-like lines to basic structured JSX
  const formatTextResponse = (text: string) => {
    if (!text) return null;
    return text.split("\n").map((line, i) => {
      if (line.startsWith("### ")) {
        return <h4 key={i} className="text-sm font-bold text-white mt-3 mb-1.5">{line.replace("### ", "")}</h4>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={i} className="text-base font-extrabold text-blue-400 mt-4 mb-2">{line.replace("## ", "")}</h3>;
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={i} className="ml-4 list-disc text-xs text-slate-300 leading-relaxed my-0.5">
            {line.replace(/^[-*]\s+/, "")}
          </li>
        );
      }
      if (/^\d+\.\s+/.test(line)) {
        return (
          <li key={i} className="ml-4 list-decimal text-xs text-slate-300 leading-relaxed my-0.5">
            {line.replace(/^\d+\.\s+/, "")}
          </li>
        );
      }
      return <p key={i} className="text-xs text-slate-300 leading-relaxed my-1.5 font-normal">{line}</p>;
    });
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-xl border border-slate-800 overflow-hidden flex flex-col h-[650px] font-sans">
      
      {/* Sidebar Tool Switcher Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/10">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight text-white">AI Learning Hub</h3>
            <p className="text-[10px] text-slate-400">Powered by Google Gemini AI</p>
          </div>
        </div>
      </div>

      {/* Sub Tools Navigation Ribbon */}
      <div className="flex bg-slate-950/60 p-1.5 border-b border-slate-800/80 overflow-x-auto gap-1">
        <button
          onClick={() => { setActiveTool('ask'); setMessage(""); }}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
            activeTool === 'ask' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Ask AI</span>
        </button>
        <button
          onClick={() => { setActiveTool('assistant'); setMessage(""); }}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
            activeTool === 'assistant' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Course Tutor</span>
        </button>
        <button
          onClick={() => { setActiveTool('help'); setMessage(""); }}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
            activeTool === 'help' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Support Bot</span>
        </button>
        <button
          onClick={() => { setActiveTool('assignment'); setMessage(""); }}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
            activeTool === 'assignment' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Grade Helper</span>
        </button>
        <button
          onClick={() => { setActiveTool('recommend'); setMessage(""); }}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
            activeTool === 'recommend' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Career Advisor</span>
        </button>
      </div>

      {/* Main Panel Content Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-900/45 flex flex-col justify-between">
        
        {/* VIEW 1: ASK AI */}
        {activeTool === 'ask' && (
          <div className="flex-1 flex flex-col justify-between h-full">
            {askHistory.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Brain className="w-12 h-12 text-slate-600 mb-2" />
                <h4 className="font-bold text-white text-sm">Ask Gemini General Questions</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                  Stuck on algorithmic loops, databases, or science principles? Submit your prompt for deep explanations.
                </p>
              </div>
            ) : (
              <div className="flex-1 space-y-4 mb-4 overflow-y-auto pr-1">
                {askHistory.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-3.5 rounded-2xl max-w-[85%] text-xs ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/80'
                    }`}>
                      {msg.role === 'user' ? msg.text : formatTextResponse(msg.text)}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 font-semibold">{msg.timestamp}</span>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold animate-pulse">
                    <Brain className="w-4 h-4 animate-spin" />
                    <span>Gemini is synthesizing explanation...</span>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSendAsk} className="flex gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
              <input
                type="text"
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 bg-transparent border-0 focus:outline-hidden text-xs text-slate-100"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* VIEW 2: COURSE ASSISTANT */}
        {activeTool === 'assistant' && (
          <div className="flex-1 flex flex-col justify-between h-full">
            <div className="mb-3.5 bg-slate-950 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">Tutoring Course:</span>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="bg-slate-900 text-xs font-bold text-blue-400 border border-slate-800 rounded-lg p-1.5 focus:outline-hidden"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            {(!assistantHistory[selectedCourseId] || assistantHistory[selectedCourseId].length === 0) ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Bot className="w-12 h-12 text-slate-600 mb-2" />
                <h4 className="font-bold text-white text-sm">Course Material Tutor</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                  Select a course above to converse about course syllabus, specific concepts, homework guides, or assignments!
                </p>
              </div>
            ) : (
              <div className="flex-1 space-y-4 mb-4 overflow-y-auto pr-1">
                {assistantHistory[selectedCourseId].map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-3.5 rounded-2xl max-w-[85%] text-xs ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/80'
                    }`}>
                      {msg.role === 'user' ? msg.text : formatTextResponse(msg.text)}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 font-semibold">{msg.timestamp}</span>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold animate-pulse">
                    <Bot className="w-4 h-4 animate-spin" />
                    <span>Tutor is writing response...</span>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSendAssistant} className="flex gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
              <input
                type="text"
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask your course tutor..."
                className="flex-1 bg-transparent border-0 focus:outline-hidden text-xs text-slate-100"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* VIEW 3: STUDENT HELP CHATBOT */}
        {activeTool === 'help' && (
          <div className="flex-1 flex flex-col justify-between h-full">
            <div className="flex-1 space-y-4 mb-4 overflow-y-auto pr-1">
              {helpHistory.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3.5 rounded-2xl max-w-[85%] text-xs ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/80'
                  }`}>
                    {msg.role === 'user' ? msg.text : formatTextResponse(msg.text)}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 font-semibold">{msg.timestamp}</span>
                </div>
              ))}
              {loading && (
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-semibold animate-pulse">
                  <HelpCircle className="w-4 h-4 animate-spin" />
                  <span>Checking Academy logs...</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSendHelp} className="flex gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
              <input
                type="text"
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask support bot..."
                className="flex-1 bg-transparent border-0 focus:outline-hidden text-xs text-slate-100"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* VIEW 4: ASSIGNMENT HELPER */}
        {activeTool === 'assignment' && (
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3.5">
              <div className="flex items-center space-x-2 text-blue-400">
                <Code className="w-5 h-5" />
                <h4 className="font-bold text-xs text-white">Gemini Code & Logic Helper</h4>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Provide an assignment problem statement and your attempt. Gemini will inspect it for syntax/logic bugs and offer hints without giving direct answers!
              </p>

              <form onSubmit={handleAssignmentCheck} className="space-y-3 text-xs text-slate-300">
                <div>
                  <label className="block mb-1 text-[10px] text-slate-400 font-semibold uppercase">Assignment Title</label>
                  <input
                    type="text"
                    required
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    placeholder="e.g. Reverse a Linked List"
                    className="w-full p-2 bg-slate-900 border border-slate-800 focus:border-blue-500 focus:outline-hidden rounded-lg font-normal text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[10px] text-slate-400 font-semibold uppercase">Problem Description</label>
                  <textarea
                    required
                    rows={3}
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    placeholder="Paste the homework task details here..."
                    className="w-full p-2 bg-slate-900 border border-slate-800 focus:border-blue-500 focus:outline-hidden rounded-lg font-normal text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[10px] text-slate-400 font-semibold uppercase">Your Attempt / Solution Code</label>
                  <textarea
                    rows={3}
                    value={studentAttempt}
                    onChange={(e) => setStudentAttempt(e.target.value)}
                    placeholder="Paste your active draft solution code..."
                    className="w-full p-2 bg-slate-900 border border-slate-800 focus:border-blue-500 focus:outline-hidden rounded-lg font-mono text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center space-x-1"
                >
                  <Brain className="w-4 h-4" />
                  <span>{loading ? "Analyzing logic..." : "Evaluate Draft Logic"}</span>
                </button>
              </form>
            </div>

            {assignmentResult && (
              <div className="mt-4 p-4 bg-white text-slate-900 rounded-2xl border border-slate-200">
                <div className="flex items-center space-x-1.5 border-b border-slate-100 pb-2 mb-2 text-blue-800 font-bold text-xs">
                  <Brain className="w-4 h-4" />
                  <span>Gemini Tutor Analysis & Feedback</span>
                </div>
                <div className="text-xs">
                  {formatTextResponse(assignmentResult)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: COURSE RECOMMENDATION */}
        {activeTool === 'recommend' && (
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3.5">
              <div className="flex items-center space-x-2 text-blue-400">
                <Compass className="w-5 h-5" />
                <h4 className="font-bold text-xs text-white">Personalized Course Advisor</h4>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Describe your goals, background, and career direction. Gemini will find the matching curriculum course map on TB Academy.
              </p>

              <form onSubmit={handleRecommendationCheck} className="space-y-3 text-xs text-slate-300">
                <div>
                  <label className="block mb-1 text-[10px] text-slate-400 font-semibold uppercase">Areas of Interest</label>
                  <input
                    type="text"
                    required
                    value={studentInterest}
                    onChange={(e) => setStudentInterest(e.target.value)}
                    placeholder="e.g. Web Apps, Deep Neural Nets"
                    className="w-full p-2 bg-slate-900 border border-slate-800 focus:border-blue-500 focus:outline-hidden rounded-lg font-normal text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-[10px] text-slate-400 font-semibold uppercase">Skill Level</label>
                    <select
                      value={skillLevel}
                      onChange={(e) => setSkillLevel(e.target.value)}
                      className="w-full p-2 bg-slate-900 border border-slate-800 focus:border-blue-500 focus:outline-hidden rounded-lg font-normal text-xs text-white"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-[10px] text-slate-400 font-semibold uppercase">Background / Career Goals</label>
                    <input
                      type="text"
                      value={studentBackground}
                      onChange={(e) => setStudentBackground(e.target.value)}
                      placeholder="e.g. Get a remote job"
                      className="w-full p-2 bg-slate-900 border border-slate-800 focus:border-blue-500 focus:outline-hidden rounded-lg font-normal text-xs text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center space-x-1"
                >
                  <Brain className="w-4 h-4" />
                  <span>{loading ? "Synthesizing roadmap..." : "Get Personal Roadmap"}</span>
                </button>
              </form>
            </div>

            {recommendationResult && (
              <div className="mt-4 p-4 bg-white text-slate-900 rounded-2xl border border-slate-200">
                <div className="flex items-center space-x-1.5 border-b border-slate-100 pb-2 mb-2 text-blue-800 font-bold text-xs">
                  <Compass className="w-4 h-4" />
                  <span>Your Academic Learning Roadmap</span>
                </div>
                <div className="text-xs">
                  {formatTextResponse(recommendationResult)}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
