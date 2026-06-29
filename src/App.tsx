import { useState, useEffect } from "react";
import { 
  GraduationCap, LogIn, LogOut, Shield, Database, 
  HelpCircle, Sparkles, BookOpen, User, CreditCard, 
  ChevronRight, Calendar, ArrowLeft, FileText, Globe, 
  Clock, CheckCircle, AlertCircle, RefreshCw, Bell, Award, TrendingUp, Menu, CheckSquare,
  Facebook, Youtube, Linkedin, Send
} from "lucide-react";

import { Profile, Course, Enrollment, Payment, CourseMaterial } from "./types";
import { authService, dbService, isMockMode } from "./supabase";
import { getCourseImage, getCategoryStyle } from "./courseImages";
import { motion } from "motion/react";

import { translations, Language } from "./translations";
import EnrollmentForm from "./components/EnrollmentForm";

// Sub-components
import AuthModal from "./components/AuthModal";
import AdminDashboard from "./components/AdminDashboard";
import PaymentUploadModal from "./components/PaymentUploadModal";
import SchemaView from "./components/SchemaView";
import AIChatbot from "./components/AIChatbot";

export default function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<Profile | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [enrollments, setEnrollments] = useState<(Enrollment & { course?: Course })[]>([]);
  const [payments, setPayments] = useState<(Payment & { course?: Course })[]>([]);
  
  // UI Panels states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSqlSchema, setShowSqlSchema] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'dashboard' | 'admin' | 'ai'>('catalog');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem("tb_lang") as Language) || "en";
  });

  const t = (key: keyof typeof translations['en']) => {
    return translations[lang][key] || translations['en'][key];
  };

  useEffect(() => {
    fetchSession();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setEnrollments([]);
      setPayments([]);
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseMaterials(selectedCourse.id);
    }
  }, [selectedCourse, enrollments]);

  const fetchSession = async () => {
    try {
      const activeUser = await authService.getSessionUser();
      setUser(activeUser);
    } catch (err) {
      console.error("Session fetch failed:", err);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetched = await dbService.getCourses();
      console.log("Fetched courses:", fetched);
      setCourses(fetched);
    } catch (err: any) {
      console.error("Failed to load courses:", err);
      setError(err?.message || "Could not connect to Supabase database. Please make sure the 'courses' table exists and schema is initialized.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    if (!user) return;
    try {
      const fetchedEnrollments = await dbService.getEnrollments(user.id);
      const fetchedPayments = await dbService.getPayments(user.id);
      setEnrollments(fetchedEnrollments);
      setPayments(fetchedPayments);
    } catch (err) {
      console.error("Failed to fetch student data:", err);
    }
  };

  const fetchCourseMaterials = async (courseId: string) => {
    try {
      const list = await dbService.getCourseMaterials(courseId);
      setMaterials(list);
    } catch (err) {
      console.error("Failed to fetch materials:", err);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setSelectedCourse(null);
    setActiveTab('catalog');
  };

  const getEnrollmentStatus = (courseId: string) => {
    const enrollment = enrollments.find(e => e.course_id === courseId);
    return enrollment ? enrollment.status : null;
  };

  const triggerEnrollment = (course: Course) => {
    setSelectedCourse(course);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] flex flex-col font-sans antialiased text-slate-100 selection:bg-blue-500/30 selection:text-white relative overflow-hidden">
      
      {/* Floating ambient gradient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[130px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />
      <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-cyan-600/5 blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }} />
      
      {/* 1. MOCK WARNING & SETUP RIBBON */}
      {isMockMode && (
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white text-xs px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-blue-800 shadow-sm relative z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-300 border border-blue-500/30 animate-pulse">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold">Supabase Local Sandbox Active</p>
              <p className="text-blue-200 text-[10px]">No environment variables configured. State is fully persistent in local storage for testing.</p>
            </div>
          </div>
          <div className="flex items-center space-x-3.5">
            <button
              onClick={() => setShowSqlSchema(!showSqlSchema)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 font-semibold rounded-lg transition-all border border-blue-400/20 text-[11px]"
            >
              {showSqlSchema ? "Hide SQL Setup" : "Show SQL Setup Guide"}
            </button>
          </div>
        </div>
      )}

      {/* SQL Setup Component Dropdown */}
      {showSqlSchema && <SchemaView />}

      {/* 2. MAIN APP NAVIGATION BAR */}
      <header className="sticky top-0 bg-white/10 backdrop-blur-[20px] border-b border-white/10 z-30 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            onClick={() => { setSelectedCourse(null); setActiveTab('catalog'); }}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="p-2.5 bg-gradient-to-tr from-[#2563EB] via-indigo-600 to-[#7C3AED] text-white rounded-2xl shadow-[0_4px_15px_-3px_rgba(37,99,235,0.4)] transition-transform duration-300 group-hover:scale-105">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent font-sans">{t('appName')}</span>
              <span className="text-[9px] font-bold block text-blue-400 tracking-widest uppercase">{t('tagline')}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => { setSelectedCourse(null); setActiveTab('catalog'); }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                activeTab === 'catalog' 
                  ? 'bg-white/15 text-white border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {t('courseCatalog')}
            </button>
            {user && (
              <button
                onClick={() => { setSelectedCourse(null); setActiveTab('dashboard'); }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                  activeTab === 'dashboard' 
                    ? 'bg-white/15 text-white border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' 
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {t('studentDashboard')}
              </button>
            )}
            <button
              onClick={() => { setSelectedCourse(null); setActiveTab('ai'); }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'ai' 
                  ? 'bg-gradient-to-r from-[#2563EB]/20 to-[#7C3AED]/20 text-white border border-indigo-500/30 shadow-[0_0_15px_rgba(124,58,237,0.2)]' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>{t('chatbotTitle')}</span>
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => { setSelectedCourse(null); setActiveTab('admin'); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center space-x-1.5 border border-purple-500/20 bg-purple-500/10 cursor-pointer ${
                  activeTab === 'admin' 
                    ? 'bg-purple-500/25 text-white border border-purple-500/30' 
                    : 'text-purple-300 hover:text-white hover:bg-purple-500/10'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>{t('roleAdmin')}</span>
              </button>
            )}
          </nav>

          {/* User Session Controls & Language Switcher */}
          <div className="flex items-center space-x-2.5">
            {/* Language Toggle Switcher */}
            <button
              onClick={() => {
                const nextLang = lang === 'en' ? 'om' : 'en';
                setLang(nextLang);
                localStorage.setItem('tb_lang', nextLang);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-slate-200 font-bold text-xs transition-all duration-200 shadow-3xs cursor-pointer active:scale-95"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>{lang === 'en' ? 'Afaan Oromoo' : 'English'}</span>
            </button>

            {/* Notification bell icon */}
            <div className="relative p-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer text-slate-300 hover:text-white">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border border-slate-950" />
            </div>

            {user ? (
              <div className="flex items-center space-x-2.5 pl-1.5 border-l border-white/10">
                <div className="text-right hidden sm:block">
                  <span className="font-bold text-xs text-white block leading-tight">{user.full_name}</span>
                  <span className="text-[9px] font-extrabold text-blue-300 bg-blue-500/15 border border-blue-500/20 px-1.5 py-0.5 rounded-md uppercase tracking-wider block mt-0.5 text-center">{user.role}</span>
                </div>
                <div className="w-9 h-9 bg-gradient-to-tr from-[#2563EB] to-[#7C3AED] text-white font-bold rounded-xl flex items-center justify-center text-sm shadow-md ring-2 ring-blue-500/20">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl transition-all cursor-pointer active:scale-95"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#3B82F6] hover:to-[#8B5CF6] text-white text-xs font-bold rounded-xl shadow-[0_4px_15px_rgba(37,99,235,0.4)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.4)] transition-all duration-300 flex items-center space-x-1.5 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('signInBtn')}</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* 3. APP WORKSPACE CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* MOBILE NAVIGATION BAR */}
        <div className="flex md:hidden bg-white/10 backdrop-blur-[20px] border border-white/10 p-1.5 rounded-2xl mb-6 shadow-xl overflow-x-auto gap-1">
          <button
            onClick={() => { setSelectedCourse(null); setActiveTab('catalog'); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
              activeTab === 'catalog' ? 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            {t('appName')}
          </button>
          {user && (
            <button
              onClick={() => { setSelectedCourse(null); setActiveTab('dashboard'); }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === 'dashboard' ? 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {t('studentDashboard')}
            </button>
          )}
          <button
            onClick={() => { setSelectedCourse(null); setActiveTab('ai'); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center justify-center space-x-1 ${
              activeTab === 'ai' ? 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI</span>
          </button>
          {user?.role === 'admin' && (
            <button
              onClick={() => { setSelectedCourse(null); setActiveTab('admin'); }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                activeTab === 'admin' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-300 hover:text-white hover:bg-white/5'
              }`}
            >
              Admin
            </button>
          )}
        </div>

        {/* ----------------------------------------------------
            TAB CATALOGUE SECTION
           ---------------------------------------------------- */}
        {activeTab === 'catalog' && !selectedCourse && (
          <div className="space-y-12">
            
            {/* Hero Branding */}
            <div className="bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#06B6D4] text-white rounded-[32px] p-8 sm:p-12 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-10 shadow-[0_30px_60px_-15px_rgba(37,99,235,0.3)] border border-white/10">
              
              {/* Absolutes floating gradient highlights */}
              <div className="absolute -right-20 -top-20 w-96 h-96 bg-white/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />
              <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-white/5 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />
              
              <div className="space-y-5 max-w-xl text-center lg:text-left relative z-10">
                <div className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-full text-white text-xs font-bold shadow-sm backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                  <span>{t('appName')} • {t('tagline')}</span>
                </div>
                
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-md">
                  {lang === 'en' ? "Master High-Income Skills with Active Mentorship" : "Dandeettii Gatii Guddaa Qabu Ogummaa Diijitaalaan Guuttadhaa"}
                </h1>
                
                <p className="text-white/90 text-xs sm:text-sm leading-relaxed max-w-lg font-medium">
                  {lang === 'en' 
                    ? "Join TB Academy to unlock expert-led coding, machine learning, and cyber security classes with instant 1-on-1 tutoring provided by Google Gemini AI models." 
                    : "Miseensa TB Academy ta'uun ogummaa bilisaa, viidiyoo barsiisaa fi silabasii gurgurtaa haaraa argadhaa. Gargaarsa addaa Gemini AI irraas ni argattu."}
                </p>
 
                {/* Animated Statistics */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <span className="block text-lg sm:text-2xl font-black text-white font-mono">5,000+</span>
                    <span className="text-[10px] sm:text-xs text-white/80 font-bold">{lang === 'en' ? "Students" : "Barattoota"}</span>
                  </div>
                  <div>
                    <span className="block text-lg sm:text-2xl font-black text-white font-mono">98.4%</span>
                    <span className="text-[10px] sm:text-xs text-white/80 font-bold">{lang === 'en' ? "Success Rate" : "Milkaa'ina"}</span>
                  </div>
                  <div>
                    <span className="block text-lg sm:text-2xl font-black text-white font-mono">24/7 AI</span>
                    <span className="text-[10px] sm:text-xs text-white/80 font-bold">{lang === 'en' ? "Study Help" : "AI Gargaaraa"}</span>
                  </div>
                </div>
 
                <div className="flex flex-wrap gap-4.5 justify-center lg:justify-start pt-4">
                  <button 
                    onClick={() => setActiveTab('ai')}
                    className="h-14 px-8 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#3B82F6] hover:to-[#8B5CF6] text-white font-bold rounded-2xl text-sm transition-all duration-300 flex items-center justify-center space-x-2.5 shadow-[0_12px_28px_-6px_rgba(37,99,235,0.45)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
                    <span>{lang === 'en' ? "Consult AI Career Advisor" : "Gargaaraa AI dubbisi"}</span>
                  </button>
                  
                  <a 
                    href="#catalog-view"
                    className="h-14 px-8 bg-white/10 hover:bg-white/15 border border-white/25 hover:border-white/40 text-white font-bold rounded-2xl text-sm transition-all duration-300 flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    {lang === 'en' ? "Browse Catalog" : "Barnoota Ilaali"}
                  </a>
                </div>
              </div>
 
              {/* Promo Banner Info */}
              <div className="bg-black/25 border border-white/15 backdrop-blur-md rounded-3xl p-6 w-full lg:w-80 space-y-4 relative z-10 shadow-2xl">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-cyan-300" />
                  <span className="text-[10px] font-extrabold text-slate-100 uppercase tracking-wider block">{t('chooseChannel')}</span>
                </div>
                
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3.5 bg-black/35 rounded-2xl border border-white/5 flex flex-col space-y-1">
                    <span className="font-sans font-semibold text-slate-300 text-[10px]">CBE Account</span>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-black text-sm">1000755134701</span>
                    </div>
                  </div>
                  
                  <div className="p-3.5 bg-black/35 rounded-2xl border border-white/5 flex flex-col space-y-1">
                    <span className="font-sans font-semibold text-slate-300 text-[10px]">Telebirr Wallet</span>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-black text-sm">0967145146</span>
                    </div>
                  </div>
                </div>
 
                <div className="bg-white/10 rounded-xl p-3 border border-white/10 text-[10px] text-white leading-relaxed font-sans font-medium">
                  {lang === 'en' 
                    ? "Verify instantly! Transfer exact tuition fees, capture screenshots, and unlock interactive syllabus materials instantly."
                    : "Kaffaltii kee herrega kanaan kaffaluun ragaa screenshot ergaa, yeroma sana silabasii kee bani!"}
                </div>
              </div>
            </div>

            {/* Courses Catalogue Grid */}
            <div 
              id="catalog-view" 
              className="space-y-8 scroll-mt-24 p-6 sm:p-10 rounded-[32px] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] backdrop-blur-md"
              style={{ background: 'linear-gradient(135deg, #0F172A, #111827, #1E293B)' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{t('activeCourses')}</h2>
                  <p className="text-sm text-slate-400 mt-0.5">{lang === 'en' ? "Choose your curriculum and launch your tech career today." : "Barnoota ogummaa kee filadhuu amma ka'i."}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchCourses}
                    disabled={loading}
                    className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 active:bg-white/15 rounded-xl text-slate-300 hover:text-white transition-all shadow-md flex items-center justify-center disabled:opacity-50 cursor-pointer"
                    title="Refresh Courses"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Search & Category Filter bar */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl focus:outline-none text-sm text-slate-200 placeholder-slate-500 shadow-sm backdrop-blur-md"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="w-4 h-4 text-slate-400" />
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  {["All", ...Array.from(new Set(courses.map(c => c.category)))].map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                        selectedCategory === category
                          ? "bg-gradient-to-r from-[#2563EB] to-[#7C3AED] border-transparent text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]"
                          : "bg-white/5 border-white/10 text-slate-300 hover:border-white/20 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-5 space-y-4 animate-pulse">
                      <div className="h-44 bg-white/5 rounded-xl w-full"></div>
                      <div className="h-4 bg-white/10 rounded-lg w-2/3"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-white/5 rounded-lg w-full"></div>
                        <div className="h-3 bg-white/5 rounded-lg w-5/6"></div>
                      </div>
                      <div className="h-8 bg-white/5 rounded-xl w-full"></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="p-8 text-center bg-red-500/10 border border-red-500/20 rounded-2xl space-y-4 max-w-2xl mx-auto backdrop-blur-md">
                  <div className="inline-flex p-3 bg-red-500/20 text-red-400 rounded-full">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-base">Unable to load courses</h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">{error}</p>
                  </div>
                  <button
                    onClick={fetchCourses}
                    className="px-4 py-2 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#3B82F6] hover:to-[#8B5CF6] text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center space-x-1.5 mx-auto cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Try Reconnecting</span>
                  </button>
                </div>
              ) : courses.length === 0 ? (
                <div className="p-12 text-center text-slate-400 bg-white/5 border border-white/10 rounded-2xl">
                  No courses found. Log in as an administrator to create courses.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses
                    .filter(course => {
                      const titleStr = (course.title || "").toLowerCase();
                      const descStr = (course.description || "").toLowerCase();
                      const instStr = (course.instructor || "").toLowerCase();
                      const searchLower = (searchQuery || "").toLowerCase();
                      
                      const matchesSearch = titleStr.includes(searchLower) || 
                                            descStr.includes(searchLower) ||
                                            instStr.includes(searchLower);
                      const matchesCategory = selectedCategory === "All" || course.category === selectedCategory;
                      return matchesSearch && matchesCategory;
                    })
                    .map(course => {
                      const status = getEnrollmentStatus(course.id);
                      const catStyle = getCategoryStyle(course.category, course.title);
                      const displayImg = getCourseImage(course.category, course.title, course.image_url);
                      return (
                        <motion.div 
                          key={course.id} 
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ y: -8, scale: 1.015 }}
                          transition={{ type: "spring", stiffness: 350, damping: 24 }}
                          className="group rounded-[24px] overflow-hidden flex flex-col justify-between h-full transition-all duration-300"
                          style={{ 
                            background: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)'
                          }}
                        >
                          <div>
                            {/* Card Image Block with Zoom on Hover */}
                            <div className="h-[210px] overflow-hidden relative bg-slate-900 border-b border-white/10">
                              <div className={`absolute inset-0 bg-gradient-to-t ${catStyle.gradientFrom} to-transparent opacity-45 z-10 pointer-events-none`} />
                              <img 
                                src={displayImg} 
                                alt={course.title} 
                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop";
                                }}
                              />
                              <span className="absolute top-4 left-4 z-20 backdrop-blur-md bg-white/10 border border-white/20 text-white font-extrabold text-[10px] tracking-wider px-3.5 py-1.5 rounded-xl uppercase shadow-md flex items-center space-x-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                                <span>{course.category}</span>
                              </span>
                            </div>

                            {/* Card Details Block */}
                            <div className="p-6 space-y-5">
                              <div className="space-y-2.5">
                                <h3 className="text-[22px] font-bold text-white leading-snug tracking-tight group-hover:text-cyan-400 transition-colors duration-200 line-clamp-1">
                                  {course.title}
                                </h3>
                                <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-3 min-h-[54px] font-medium">
                                  {course.description}
                                </p>
                              </div>

                              {/* Instructor & Price Row */}
                              <div 
                                className="flex items-center justify-between p-3.5 text-xs font-semibold text-[#CBD5E1] border border-white/5" 
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px' }}
                              >
                                <div className="flex items-center space-x-2.5">
                                  <div className="w-7 h-7 bg-white/10 text-white font-extrabold rounded-lg flex items-center justify-center text-[11px] border border-white/10">
                                    {(course.instructor || "I").charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-[#CBD5E1] text-xs">
                                    {t('instructor')}: <strong className="text-white font-bold">{course.instructor}</strong>
                                  </span>
                                </div>
                                
                                {/* Price badge */}
                                <span 
                                  className="font-mono text-white font-black px-3.5 py-1.5 rounded-xl text-xs border border-white/10 shadow-lg"
                                  style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
                                >
                                  {course.price} ETB
                                </span>
                              </div>

                              {/* Duration row */}
                              <div 
                                className="flex items-center justify-between text-xs font-bold text-[#CBD5E1] p-3.5 border border-white/5"
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px' }}
                              >
                                <span className="flex items-center space-x-2">
                                  <Clock className="w-4 h-4 text-[#CBD5E1]" />
                                  <span>{t('duration')}:</span>
                                </span>
                                <strong className="text-white font-extrabold">{course.duration || `4 ${t('weeks')}`}</strong>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Action Footer */}
                          <div className="p-6 pt-0 flex items-center gap-2.5 mt-auto">
                            <button
                              onClick={() => setSelectedCourse(course)}
                              className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold rounded-xl text-xs transition-all duration-200 text-center cursor-pointer active:scale-97"
                            >
                              {t('courseDetails')}
                            </button>
                            
                            {status === 'active' ? (
                              <span className="px-4 py-3 bg-emerald-500/10 text-emerald-300 font-extrabold text-xs rounded-xl flex items-center space-x-1.5 border border-emerald-500/20 shadow-3xs">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                <span>{t('enrolled')}</span>
                              </span>
                            ) : status === 'pending' ? (
                              <span className="px-4 py-3 bg-amber-500/10 text-amber-300 font-extrabold text-xs rounded-xl flex items-center space-x-1.5 border border-amber-500/20 shadow-3xs animate-pulse">
                                <Clock className="w-4 h-4 text-amber-400" />
                                <span>{t('pending')}</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => triggerEnrollment(course)}
                                className="px-4 py-3 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#3B82F6] hover:to-[#8B5CF6] text-white font-extrabold rounded-xl text-xs shadow-md transition-all duration-300 flex items-center space-x-1 cursor-pointer active:scale-97"
                              >
                                <span>{t('enrollNow')}</span>
                                <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ----------------------------------------------------
            COURSE DETAIL VIEW
           ---------------------------------------------------- */}
        {selectedCourse && (
          <div className="space-y-8">
            <button
              onClick={() => setSelectedCourse(null)}
              className="flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('backToCatalog')}</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left detail side */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-xl space-y-5">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-lg uppercase">
                      {selectedCourse.category}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                    {selectedCourse.title}
                  </h2>

                  <div className="flex items-center gap-6 text-xs text-slate-400 font-semibold border-y border-white/10 py-3 flex-wrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 bg-blue-600/25 text-blue-300 font-bold rounded-full flex items-center justify-center text-xs">
                        {selectedCourse.instructor.charAt(0).toUpperCase()}
                      </div>
                      <span>{t('instructor')}: <strong className="text-white">{selectedCourse.instructor}</strong></span>
                    </div>
                    <span>•</span>
                    <span className="font-mono text-cyan-400 font-bold">{selectedCourse.price} ETB</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1.5 text-slate-300">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{t('duration')}: <strong className="text-white">{selectedCourse.duration || `4 ${t('weeks')}`}</strong></span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-white text-sm">{t('courseOverview')}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      {selectedCourse.description}
                    </p>
                  </div>
                </div>

                {/* MATERIALS VIEW (Active status required) */}
                <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-xl space-y-4">
                  <h3 className="font-bold text-white text-base">{t('courseSyllabus')}</h3>
                  
                  {getEnrollmentStatus(selectedCourse.id) === 'active' ? (
                    materials.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">{t('noMaterials')}</p>
                    ) : (
                      <div className="space-y-2.5">
                        {materials.map(m => (
                          <a 
                            key={m.id} 
                            href={m.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-white/10 transition-all"
                          >
                            <div className="flex items-center space-x-3.5">
                              <div className={`p-2.5 rounded-xl ${m.file_type === 'pdf' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-sm text-white block">{m.title}</span>
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mt-0.5">{m.file_type} File</span>
                              </div>
                            </div>
                            <button className="px-3 py-1.5 bg-white/10 border border-white/15 text-xs font-bold rounded-lg hover:bg-white/15 hover:text-white text-slate-200 transition-all cursor-pointer">
                              {t('openResource')}
                            </button>
                          </a>
                        ))}
                      </div>
                    )
                  ) : (
                    /* Locked materials prompt */
                    <div className="p-8 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center space-y-3.5">
                      <div className="p-3 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{t('materialsLocked')}</h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                          {t('materialsLockedDesc')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right enrollment sidebar */}
              <div className="space-y-6">
                {getEnrollmentStatus(selectedCourse.id) === 'active' ? (
                  <div className="bg-gradient-to-b from-blue-950 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-indigo-900/40 space-y-4">
                    <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">{t('tuitionCost')}</span>
                    <div className="font-mono text-3xl font-extrabold text-white">
                      {selectedCourse.price} ETB
                    </div>
                    <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-3.5 flex items-center space-x-2 text-green-200 text-xs font-bold">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span>{t('activeUnlocked')}</span>
                    </div>
                  </div>
                ) : getEnrollmentStatus(selectedCourse.id) === 'pending' ? (
                  <div className="bg-gradient-to-b from-blue-950 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-indigo-900/40 space-y-4">
                    <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">{t('tuitionCost')}</span>
                    <div className="font-mono text-3xl font-extrabold text-white">
                      {selectedCourse.price} ETB
                    </div>
                    <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-3.5 flex items-center space-x-2 text-amber-200 text-xs font-bold animate-pulse">
                      <Clock className="w-5 h-5 text-amber-400" />
                      <span>{t('pendingAdmin')}</span>
                    </div>
                  </div>
                ) : (
                  <EnrollmentForm 
                    course={selectedCourse}
                    user={user}
                    lang={lang}
                    onSuccess={() => {
                      fetchUserData();
                    }}
                    onOpenAuth={() => setShowAuthModal(true)}
                  />
                )}

                {/* Gemini Help Sidebar */}
                <AIChatbot courses={courses} activeCourse={selectedCourse} />
              </div>

            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB STUDENT DASHBOARD SECTION
           ---------------------------------------------------- */}
        {activeTab === 'dashboard' && user && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-950">{t('studentDashboard')}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {lang === 'en' ? "Track your course enrollments, verify financial receipt statements, and communicate with tutors." : "Kaffaltii fi galmee barnootaa kee hordofi, ragaalee kaffaltii fi gargaaraa AI dubbisi."}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Enrolled Courses catalogue */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-bold text-white text-base">{t('myEnrollments')} ({enrollments.length})</h3>
                
                {enrollments.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center backdrop-blur-md shadow-xl">
                    <BookOpen className="w-10 h-10 text-slate-600 mb-2" />
                    <p className="text-sm font-semibold">{t('noEnrollmentsYet')}</p>
                    <button 
                      onClick={() => setActiveTab('catalog')}
                      className="text-xs text-blue-400 font-bold mt-2 hover:underline cursor-pointer"
                    >
                      {t('courseCatalog')}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {enrollments.map(e => (
                      <div key={e.id} className="flex items-center bg-white border border-blue-500/10 rounded-2xl p-4 gap-4 shadow-[0_10px_40px_rgba(37,99,235,0.15)] transition-all hover:scale-[1.01]">
                        <img 
                          src={getCourseImage(e.course?.category || "", e.course?.title || "", e.course?.image_url)} 
                          alt="Banner" 
                          className="w-20 h-20 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop";
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[#0F172A] text-sm truncate">{e.course?.title}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase mt-1 inline-block ${
                            e.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {e.status === 'active' ? t('enrolled') : t('pending')}
                          </span>
                        </div>
                        <button
                          onClick={() => { setSelectedCourse(e.course || null); }}
                          className="px-3.5 py-2 bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#3B82F6] hover:to-[#8B5CF6] text-xs font-bold rounded-lg text-white transition-all cursor-pointer shadow-sm"
                        >
                          {t('courseSyllabus')}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payments log & CBE instructions */}
              <div className="space-y-6">
                <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-4">
                  <h3 className="font-bold text-white text-sm">{t('transactionHistory')}</h3>
                  
                  {payments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">{t('noPaymentsYet')}</p>
                  ) : (
                    <div className="space-y-3">
                      {payments.map(p => (
                        <div key={p.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-200 block truncate max-w-[120px]">{p.course?.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Ref: {p.transaction_id}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            p.status === 'verified' ? 'bg-emerald-500/20 text-emerald-300' : p.status === 'rejected' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {p.status === 'verified' ? t('enrolled') : p.status === 'rejected' ? 'Rejected' : t('pending')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-3 text-xs">
                  <h3 className="font-bold text-cyan-400 text-sm flex items-center space-x-1.5">
                    <CreditCard className="w-4 h-4" />
                    <span>{t('chooseChannel')}</span>
                  </h3>
                  <div className="space-y-2.5 font-mono text-slate-300 pt-1">
                    <div className="p-2.5 bg-white/5 border border-white/5 rounded-lg">
                      <span className="font-sans font-semibold text-slate-300 block text-[11px]">Commercial Bank of Ethiopia (CBE)</span>
                      <strong className="text-xs text-blue-400 font-bold block mt-0.5">1000755134701</strong>
                    </div>
                    <div className="p-2.5 bg-white/5 border border-white/5 rounded-lg">
                      <span className="font-sans font-semibold text-slate-300 block text-[11px]">Telebirr Wallet Deposit</span>
                      <strong className="text-xs text-blue-400 font-bold block mt-0.5">0967145146</strong>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            TAB GOOGLE GEMINI AI HUB SECTION
           ---------------------------------------------------- */}
        {activeTab === 'ai' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">AI Tutoring & Advisory Station</h2>
              <p className="text-sm text-slate-400 mt-0.5">Get explanations, grade helper checks, and tailored course roadmap recommendations from Google Gemini models.</p>
            </div>
            <AIChatbot courses={courses} />
          </div>
        )}

        {/* ----------------------------------------------------
            TAB ADMIN COMMAND SECTION
           ---------------------------------------------------- */}
        {activeTab === 'admin' && user?.role === 'admin' && (
          <div className="space-y-6">
            <AdminDashboard />
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer 
        className="relative mt-24 pt-20 pb-12 font-sans border-t border-indigo-500/30 shadow-[0_-12px_40px_rgba(99,102,241,0.25)] backdrop-blur-lg overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B, #312E81)' }}
      >
        {/* Abstract background subtle glow lights */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-pink-500/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
          {/* Brand Card */}
          <div className="space-y-5">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500 text-white rounded-xl shadow-[0_4px_15px_rgba(6,182,212,0.3)]">
                <GraduationCap className="w-4.5 h-4.5" />
              </div>
              <span className="font-black text-lg tracking-tight text-white uppercase">{t('appName')}</span>
            </div>
            
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              {lang === 'en' 
                ? "Empowering the next generation of East African tech leaders with high-income digital skills, verified credentials, and real-time AI mentoring."
                : "Dandeettii Ogummaa Diijitaalaa Cimsuun barattoota keenya gahoomsuu fi jireenya dhuunfaa jijjiiruu."}
            </p>

            <div className="text-[10px] text-[#94A3B8] font-mono uppercase tracking-wider bg-white/5 p-3.5 rounded-2xl border border-white/10 backdrop-blur-md">
              <span className="block text-white font-black mb-1">{lang === 'en' ? "Operations supervisor" : "Gulaala Hooggansa"}</span>
              Amanuel • <span className="text-cyan-400">amanuel@tb.com</span>
            </div>

            {/* Social media icons block */}
            <div className="space-y-2">
              <span className="block text-[10px] text-[#94A3B8] uppercase tracking-widest font-black">Follow Us</span>
              <div className="flex items-center space-x-3">
                <a href="https://t.me/tb_academy" target="_blank" rel="noreferrer" className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] text-slate-300 hover:text-white rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer">
                  <Send className="w-4 h-4" />
                </a>
                <a href="https://youtube.com/@tb_academy" target="_blank" rel="noreferrer" className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] text-slate-300 hover:text-white rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer">
                  <Youtube className="w-4 h-4" />
                </a>
                <a href="https://facebook.com/tb_academy" target="_blank" rel="noreferrer" className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] text-slate-300 hover:text-white rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="https://linkedin.com/company/tb_academy" target="_blank" rel="noreferrer" className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] text-slate-300 hover:text-white rounded-full transition-all duration-300 flex items-center justify-center cursor-pointer">
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick links: Explore */}
          <div>
            <h4 className="font-extrabold text-xs text-white uppercase tracking-widest mb-5 border-b border-white/10 pb-2">{lang === 'en' ? "Platform" : "Siroota"}</h4>
            <ul className="space-y-3.5 text-xs">
              <li>
                <button 
                  onClick={() => { setSelectedCourse(null); setActiveTab('catalog'); }} 
                  className="text-[#94A3B8] hover:text-cyan-400 hover:translate-x-1.5 transition-all duration-300 transform inline-block cursor-pointer text-left font-medium"
                >
                  {t('courseCatalog')}
                </button>
              </li>
              {user && (
                <li>
                  <button 
                    onClick={() => { setSelectedCourse(null); setActiveTab('dashboard'); }} 
                    className="text-[#94A3B8] hover:text-cyan-400 hover:translate-x-1.5 transition-all duration-300 transform inline-block cursor-pointer text-left font-medium"
                  >
                    {t('studentDashboard')}
                  </button>
                </li>
              )}
              <li>
                <button 
                  onClick={() => { setSelectedCourse(null); setActiveTab('ai'); }} 
                  className="text-[#94A3B8] hover:text-cyan-400 hover:translate-x-1.5 transition-all duration-300 transform inline-block cursor-pointer text-left font-medium"
                >
                  {t('chatbotTitle')}
                </button>
              </li>
            </ul>
          </div>

          {/* Learn hub */}
          <div>
            <h4 className="font-extrabold text-xs text-white uppercase tracking-widest mb-5 border-b border-white/10 pb-2">{lang === 'en' ? "Academic Hub" : "Barnoota Koorsii"}</h4>
            <ul className="space-y-3.5 text-xs">
              <li>
                <button 
                  onClick={() => { setSelectedCourse(null); setActiveTab('ai'); }} 
                  className="text-[#94A3B8] hover:text-cyan-400 hover:translate-x-1.5 transition-all duration-300 transform inline-block cursor-pointer text-left font-medium"
                >
                  AI Tutoring Chat
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setSelectedCourse(null); setActiveTab('ai'); }} 
                  className="text-[#94A3B8] hover:text-cyan-400 hover:translate-x-1.5 transition-all duration-300 transform inline-block cursor-pointer text-left font-medium"
                >
                  Grade Assist Helper
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setSelectedCourse(null); setActiveTab('ai'); }} 
                  className="text-[#94A3B8] hover:text-cyan-400 hover:translate-x-1.5 transition-all duration-300 transform inline-block cursor-pointer text-left font-medium"
                >
                  AI Course Roadmaps
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setSelectedCourse(null); setActiveTab('ai'); }} 
                  className="text-[#94A3B8] hover:text-cyan-400 hover:translate-x-1.5 transition-all duration-300 transform inline-block cursor-pointer text-left font-medium"
                >
                  24/7 Student Advisory
                </button>
              </li>
            </ul>
          </div>

          {/* Payment channels */}
          <div>
            <h4 className="font-extrabold text-xs text-white uppercase tracking-widest mb-5 border-b border-white/10 pb-2">{lang === 'en' ? "Tuition Channels" : "Kaffaltiiwwan"}</h4>
            <div className="space-y-3.5 font-mono text-[11px]">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md flex flex-col hover:border-white/20 transition-all duration-300">
                <span className="font-sans font-extrabold text-[#94A3B8] block text-[10px] uppercase tracking-wider">CBE Account</span>
                <span className="text-cyan-400 font-bold block mt-1 text-sm">1000755134701</span>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md flex flex-col hover:border-white/20 transition-all duration-300">
                <span className="font-sans font-extrabold text-[#94A3B8] block text-[10px] uppercase tracking-wider">Telebirr Wallet</span>
                <span className="text-cyan-400 font-bold block mt-1 text-sm">0967145146</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#94A3B8] font-semibold gap-4">
          <p>© {new Date().getFullYear()} TB Academy (TB-WEBAPP). All rights reserved.</p>
          <p className="text-[10px] text-[#64748B]">Created by Senior Full Stack Developer. Operations supervised by Amanuel.</p>
        </div>
      </footer>

      {/* MODALS */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        lang={lang}
        onAuthSuccess={(profile) => {
          setUser(profile);
          fetchUserData();
        }}
      />

      {showPaymentModal && selectedCourse && user && (
        <PaymentUploadModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          course={selectedCourse}
          user={user}
          onSuccess={() => {
            fetchUserData();
            if (selectedCourse) {
              fetchCourseMaterials(selectedCourse.id);
            }
          }}
        />
      )}

    </div>
  );
}
