import React, { useState } from "react";
import { X, Mail, Lock, User, Key, Info } from "lucide-react";
import { authService, isMockMode } from "../supabase";
import { Profile } from "../types";
import { translations, Language } from "../translations";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: Profile) => void;
  lang: Language;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess, lang }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const t = (key: keyof typeof translations['en']) => {
    return translations[lang][key] || translations['en'][key];
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { profile, error: err } = await authService.login(email, password);
      if (err) {
        setError(err.message || "Invalid credentials.");
      } else if (profile) {
        onAuthSuccess(profile);
        onClose();
      }
    } catch (ex: any) {
      setError(ex.message || "An error occurred during sign-in.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { profile, error: err } = await authService.register(email, password, fullName);
      if (err) {
        setError(err.message || "Failed to register.");
      } else if (profile) {
        onAuthSuccess(profile);
        onClose();
      }
    } catch (ex: any) {
      setError(ex.message || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please provide your email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { error: err, message } = await authService.resetPassword(email);
      if (err) {
        setError(err.message || "Failed to trigger recovery reset.");
      } else {
        setSuccess(message || "Password recovery instructions sent to your inbox!");
      }
    } catch (ex: any) {
      setError(ex.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Mock Mode Shortcuts for faster testing inside the iframe
  const fillQuickCredentials = (role: 'student' | 'admin') => {
    if (role === 'admin') {
      setEmail("amanuel@tb.com");
      setPassword("amanuel123");
      setFullName("Amanuel (Admin)");
    } else {
      setEmail("student@test.com");
      setPassword("student123");
      setFullName("Abebe Kebede");
    }
    setActiveTab('login');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100/90 flex flex-col relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100/60 bg-gray-50/40">
          <h2 className="text-xl font-extrabold text-gray-950 font-sans tracking-tight">
            {activeTab === 'login' && t('signInTitle')}
            {activeTab === 'register' && t('signUpTitle')}
            {activeTab === 'forgot' && t('forgotTitle')}
          </h2>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-full text-gray-400 hover:text-gray-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner for Mock Mode */}
        {isMockMode && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-y border-blue-100/40 px-6 py-4.5 text-xs text-blue-900 flex items-start gap-3">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600 animate-pulse" />
            <div>
              <p className="font-extrabold text-blue-950 mb-1">Local Sandbox Mode Enabled</p>
              <p className="text-blue-800/80 leading-relaxed">Direct login trigger profiles. Easily access both active student boards and administrative operations consoles:</p>
              <div className="flex gap-2 mt-3">
                <button 
                  onClick={() => fillQuickCredentials('admin')}
                  className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg transition-all cursor-pointer shadow-3xs active:scale-95"
                >
                  Admin (Amanuel)
                </button>
                <button 
                  onClick={() => fillQuickCredentials('student')}
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 text-blue-900 font-bold rounded-lg transition-all border border-blue-200/60 shadow-3xs cursor-pointer active:scale-95"
                >
                  Student Demo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        {activeTab !== 'forgot' && (
          <div className="flex border-b border-gray-100/50 bg-gray-50/10">
            <button
              onClick={() => { setActiveTab('login'); setError(null); }}
              className={`flex-1 py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'login' 
                  ? 'border-blue-600 text-blue-600 bg-white' 
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50/50'
              }`}
            >
              {t('signInBtn')}
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(null); }}
              className={`flex-1 py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'register' 
                  ? 'border-blue-600 text-blue-600 bg-white' 
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50/50'
              }`}
            >
              {t('signUpBtn')}
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-medium animate-in fade-in">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 font-medium animate-in fade-in">
              {success}
            </div>
          )}

          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  {t('emailLabel')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-sm transition-all focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-gray-900 animate-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('passwordLabel')}
                  </label>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('forgot'); setError(null); }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer"
                  >
                    {t('forgotPassLink')}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-sm transition-all focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-gray-900 animate-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>{loading ? `${t('signInBtn')}...` : t('signInBtn')}</span>
              </button>
            </form>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  {t('nameLabel')}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Abebe Kebede"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-sm transition-all focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-gray-900 animate-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  {t('emailLabel')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-sm transition-all focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-gray-900 animate-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  {t('passwordLabel')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-sm transition-all focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-gray-900 animate-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>{loading ? `${t('signUpBtn')}...` : t('signUpBtn')}</span>
              </button>
            </form>
          )}

          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Enter your registered email address and we'll send you an interactive link to securely reset your password credentials.
              </p>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  {t('emailLabel')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-sm transition-all focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-gray-900 animate-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>{loading ? `${t('sendResetBtn')}...` : t('sendResetBtn')}</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(null); setSuccess(null); }}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-800 font-medium transition-all cursor-pointer"
              >
                {t('backToSignIn')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
