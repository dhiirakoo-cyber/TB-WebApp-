import React, { useState } from "react";
import { Upload, CheckCircle2, QrCode, CreditCard, Info, AlertCircle, FileText, RefreshCw } from "lucide-react";
import { storageService, dbService } from "../supabase";
import { Course, Profile } from "../types";
import { translations, Language } from "../translations";

interface EnrollmentFormProps {
  course: Course;
  user: Profile | null;
  lang: Language;
  onSuccess: () => void;
  onOpenAuth: () => void;
}

export default function EnrollmentForm({ course, user, lang, onSuccess, onOpenAuth }: EnrollmentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<'Telebirr' | 'CBE'>('Telebirr');
  const [transactionId, setTransactionId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const t = (key: keyof typeof translations['en']) => {
    return translations[lang][key] || translations['en'][key];
  };

  if (!user) {
    return (
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs text-center space-y-4">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
          <CreditCard className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-gray-950 text-base">{t('paymentTitle')}</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
            {t('notLoggedInPrompt')}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAuth}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-sm active:bg-blue-700 transition-all cursor-pointer"
        >
          {t('signInBtn')} / {t('signUpBtn')}
        </button>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !transactionId.trim()) {
      setError(t('requiredFields'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Upload the payment receipt image
      const uploadedUrl = await storageService.uploadFile('payment-screenshots', selectedFile);

      // 2. Submit payment information
      await dbService.submitPayment({
        user_id: user.id,
        course_id: course.id,
        amount: Number(course.price),
        payment_method: paymentMethod,
        screenshot_url: uploadedUrl,
        transaction_id: transactionId.trim()
      });

      // 3. Register enrollment in pending state
      await dbService.enrollUser(user.id, course.id);

      setSuccess(true);
      onSuccess();
    } catch (err: any) {
      console.error("Enrollment failed:", err);
      setError(err.message || "Failed to submit payment enrollment verification. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 space-y-4 text-center animate-in fade-in zoom-in duration-200">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-extrabold text-gray-950 text-base leading-snug">
            {t('successTitle')}
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            {t('successDesc1')}
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            {t('successDesc2')}
          </p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-emerald-100 text-left space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Course Title</span>
          <span className="text-xs font-bold text-gray-950 block truncate">{course.title}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mt-2">Reference ID</span>
          <span className="text-xs font-mono font-bold text-emerald-700 block">{transactionId}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100/90 rounded-3xl p-6 shadow-md space-y-5">
      <div>
        <h3 className="font-extrabold text-gray-950 text-base tracking-tight">{t('paymentTitle')}</h3>
        <p className="text-xs text-gray-500 mt-1">{t('enrollingIn')}: <strong className="text-gray-800">{course.title}</strong></p>
      </div>

      {error && (
        <div className="p-3 bg-red-50/70 border border-red-100 text-xs text-red-700 font-semibold rounded-xl flex items-start gap-2.5 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Payment Channel Selection */}
        <div className="space-y-2">
          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {t('chooseChannel')}
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('Telebirr')}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-300 cursor-pointer relative overflow-hidden group ${
                paymentMethod === 'Telebirr' 
                  ? 'border-blue-600 bg-blue-50/25 ring-4 ring-blue-50' 
                  : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-extrabold text-xs text-gray-950">Telebirr</span>
                <QrCode className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-[10px] font-extrabold text-blue-800 font-mono block mt-1">0967145146</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('CBE')}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-300 cursor-pointer relative overflow-hidden group ${
                paymentMethod === 'CBE' 
                  ? 'border-blue-600 bg-blue-50/25 ring-4 ring-blue-50' 
                  : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-extrabold text-xs text-gray-950">CBE</span>
                <CreditCard className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-[10px] font-extrabold text-purple-800 font-mono block mt-1">1000755134701</span>
            </button>
          </div>
        </div>

        {/* Transfer guidelines */}
        <div className="bg-amber-50/50 border border-amber-100 p-3.5 rounded-2xl flex items-start gap-3 text-xs text-amber-800 leading-relaxed">
          <Info className="w-4.5 h-4.5 flex-shrink-0 text-amber-500 mt-0.5" />
          <div>
            <p className="font-extrabold text-amber-950 mb-0.5">{t('transferProcess')}</p>
            <p className="text-amber-800/90 text-[11px]">
              {t('transferDesc').replace('{price}', String(course.price))}
            </p>
          </div>
        </div>

        {/* Transaction Reference ID input */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {t('transactionIdLabel')}
          </label>
          <input
            type="text"
            required
            placeholder="e.g. A298CX34..."
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className="w-full px-4 py-2.5 text-xs bg-gray-50/30 border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl focus:outline-none text-gray-950 transition-all font-semibold"
          />
        </div>

        {/* Drag and Drop Screenshot upload area */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {t('uploadLabel')}
          </label>
          
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all duration-300 ${
              dragActive 
                ? 'border-blue-600 bg-blue-50/15' 
                : selectedFile 
                  ? 'border-emerald-400 bg-emerald-50/10' 
                  : 'border-gray-200 hover:border-gray-300 bg-gray-50/20'
            }`}
          >
            <input
              type="file"
              id="screenshot-input"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <label htmlFor="screenshot-input" className="cursor-pointer block space-y-2">
              <Upload className={`w-7 h-7 mx-auto transition-transform duration-300 ${selectedFile ? 'text-emerald-500 scale-110' : 'text-gray-400 hover:scale-105'}`} />
              
              {selectedFile ? (
                <div className="text-xs">
                  <span className="font-extrabold text-emerald-900 block truncate max-w-[200px] mx-auto">
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono mt-1 block">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ) : (
                <span className="text-[11px] font-bold text-gray-500 leading-normal block">
                  {t('dragDrop')}
                </span>
              )}
            </label>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all duration-300 shadow-[0_4px_12px_-2px_rgba(37,99,235,0.3)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.4)] disabled:from-gray-100 disabled:to-gray-100 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 cursor-pointer active:scale-98"
        >
          {loading ? (
            <span className="flex items-center space-x-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{t('submittingBtn')}</span>
            </span>
          ) : (
            <span>{t('submitEnrollmentBtn')}</span>
          )}
        </button>
      </form>
    </div>
  );
}
