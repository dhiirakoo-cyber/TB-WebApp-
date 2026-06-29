import { useState } from "react";
import { Check, Copy, Database, HelpCircle } from "lucide-react";
import { SUPABASE_SQL_SCHEMA } from "../supabase";

export default function SchemaView() {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-4xl mx-auto my-8">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">Supabase SQL Schema</h3>
            <p className="text-sm text-gray-500">Run this SQL code in your Supabase SQL Editor to establish tables, triggers, and Row-Level Security.</p>
          </div>
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-all"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy SQL Code</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center space-x-2 text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4 text-xs">
          <HelpCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Required Storage Buckets:</strong> In your Supabase dashboard, create three public buckets named exactly:
            <code className="mx-1 px-1.5 py-0.5 bg-amber-100 font-mono text-amber-800 rounded">course-images</code>, 
            <code className="mx-1 px-1.5 py-0.5 bg-amber-100 font-mono text-amber-800 rounded">course-pdfs</code>, and 
            <code className="mx-1 px-1.5 py-0.5 bg-amber-100 font-mono text-amber-800 rounded">payment-screenshots</code>.
          </span>
        </div>

        <pre className="text-xs font-mono text-gray-800 h-96 overflow-y-auto whitespace-pre p-2 bg-gray-900 text-gray-100 rounded-lg select-all">
          {SUPABASE_SQL_SCHEMA}
        </pre>
      </div>
    </div>
  );
}
