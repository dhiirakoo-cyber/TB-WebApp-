import React, { useState } from "react";
import { X, Upload, CheckCircle2, QrCode, PhoneCall, Receipt, Info } from "lucide-react";
import { storageService, dbService } from "../supabase";
import { Course, Profile } from "../types";
import CopyButton from "./CopyButton";

interface PaymentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  user: Profile;
  onSuccess: () => void;
}

export default function PaymentUploadModal({ isOpen, onClose, course, user, onSuccess }: PaymentUploadModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'Telebirr' | 'CBE'>('Telebirr');
  const [transactionId, setTransactionId] = useState("");
  const [amount, setAmount] = useState<number>(course.price);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please upload your transaction screenshot receipt.");
      return;
    }
    if (!transactionId) {
      setError("Please supply your transaction reference ID.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // 1. Upload screenshot to bucket
      const uploadedUrl = await storageService.uploadFile('payment-screenshots', selectedFile);

      // 2. Register payment submission
      await dbService.submitPayment({
        user_id: user.id,
        course_id: course.id,
        amount: Number(amount),
        payment_method: paymentMethod,
        screenshot_url: uploadedUrl,
        transaction_id: transactionId
      });

      // 3. Register enrollment in pending state
      await dbService.enrollUser(user.id, course.id);

      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to finalize payment registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col relative animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-950 font-sans tracking-tight">
              Course Tuition Payment
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Enrolling in: <strong className="text-gray-700">{course.title}</strong></p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-gray-200 active:bg-gray-300 rounded-full text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 1 ? (
          <form onSubmit={handlePaymentSubmit} className="flex-1 flex flex-col overflow-y-auto max-h-[85vh]">
            {/* Step 1: Transfer tuition */}
            <div className="p-6 space-y-5">
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-xs text-red-700 font-medium rounded-xl">
                  {error}
                </div>
              )}

              {/* Bank Transfer Information */}
              <div className="space-y-3.5">
                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  1. Choose Payment Channel
                </span>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Telebirr')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      paymentMethod === 'Telebirr' 
                        ? 'border-blue-600 bg-blue-50/30 ring-2 ring-blue-100' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-sm text-gray-950">Telebirr</span>
                      <QrCode className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-xs text-gray-500 block mt-1">Mobile Wallet Account</span>
                    <span className="text-sm font-bold text-blue-800 font-mono block mt-2">0967145146</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CBE')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      paymentMethod === 'CBE' 
                        ? 'border-blue-600 bg-blue-50/30 ring-2 ring-blue-100' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-sm text-gray-950">CBE Transfer</span>
                      <QrCode className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-xs text-gray-500 block mt-1">Commercial Bank of Ethiopia</span>
                    <span className="text-sm font-bold text-purple-800 font-mono block mt-2">1000755134701</span>
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 block uppercase tracking-wider">
                      Selected Account ({paymentMethod})
                    </span>
                    <span className="text-base font-extrabold text-gray-900 font-mono mt-0.5 block">
                      {paymentMethod === 'Telebirr' ? '0967145146' : '1000755134701'}
                    </span>
                  </div>
                  <CopyButton textToCopy={paymentMethod === 'Telebirr' ? '0967145146' : '1000755134701'} />
                </div>

                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                  <Info className="w-4 h-4 flex-shrink-0 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-0.5">Tuition Transfer Process:</p>
                    <p className="text-amber-700/90 leading-relaxed">
                      Transfer exactly <strong className="text-amber-900 font-bold">{course.price} ETB</strong> to the selected account above. Make sure to capture a screenshot of your successful receipt, then proceed to the fields below.
                    </p>
                  </div>
                </div>
              </div>

              {/* Verification Form */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  2. Upload Proof of Transfer
                </span>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs text-gray-600 font-semibold mb-1.5">Tuition Amount (ETB)</label>
                    <input
                      type="number"
                      disabled
                      value={amount}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 font-semibold mb-1.5">Transaction ID / Reference</label>
                    <input
                      type="text"
                      required
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="e.g. A293X8176"
                      className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100/50 focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-sm text-gray-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 font-semibold mb-1.5">Transaction Screenshot / Receipt File</label>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-blue-500 rounded-2xl p-6 bg-gray-50/50 cursor-pointer hover:bg-white transition-all relative">
                    <input
                      type="file"
                      required
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    {selectedFile ? (
                      <div className="text-center">
                        <p className="text-sm font-semibold text-blue-600 truncate max-w-xs">{selectedFile.name}</p>
                        <p className="text-xs text-gray-400 font-semibold mt-0.5">Click or drag another to replace</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-xs text-gray-600 font-semibold">Select image files (JPEG, PNG)</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Drag-and-drop or select locally</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Submit Action */}
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center space-x-1.5"
              >
                <Receipt className="w-4 h-4" />
                <span>{loading ? "Registering Tuition..." : "Verify Tuition Payment"}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Success Confirmation */
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center shadow-xs border border-green-100 scale-in animate-duration-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="font-bold text-gray-950 text-lg">Tuition Receipt Submitted</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                Thank you! Your reference <strong className="text-gray-800 font-mono">{transactionId}</strong> has been registered. Our Administrator <strong>Amanuel</strong> will verify this statement shortly to activate your academic material files.
              </p>
            </div>

            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-sm transition-all"
            >
              Back to Catalog
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
