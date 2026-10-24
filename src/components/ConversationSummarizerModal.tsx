import React, { useState, useEffect } from "react";
import { aiApi } from "../api/client";
import {
  Sparkles,
  X,
  CheckCircle,
  HelpCircle,
  ArrowRightCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface ConversationSummarizerModalProps {
  ticketId: string;
  ticketTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ConversationSummarizerModal: React.FC<ConversationSummarizerModalProps> = ({
  ticketId,
  ticketTitle,
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    summary: string;
    main_problem: string;
    troubleshooting_steps: string[];
    unresolved_questions: string[];
    recommended_next_action: string;
  } | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await aiApi.summarize(ticketId);
      setData(res);
    } catch (e) {
      console.error("Summarizer error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSummary();
    }
  }, [isOpen, ticketId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-indigo-700">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-base">AI Conversation Summary</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm font-medium text-slate-700">Analyzing conversation thread with Gemini...</p>
              <p className="text-xs text-slate-400 mt-1">Extracting attempted steps and pending inquiries</p>
            </div>
          ) : data ? (
            <>
              {/* Executive Summary */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4">
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider block mb-1">
                  Executive Briefing
                </span>
                <p className="text-sm text-slate-700 leading-relaxed">{data.summary}</p>
              </div>

              {/* Main Problem */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Primary Unresolved Problem
                </h4>
                <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {data.main_problem}
                </p>
              </div>

              {/* Attempted Steps */}
              {data.troubleshooting_steps && data.troubleshooting_steps.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Troubleshooting Steps Attempted
                  </h4>
                  <ul className="space-y-1.5">
                    {data.troubleshooting_steps.map((step, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-start gap-2"
                      >
                        <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Unresolved Questions */}
              {data.unresolved_questions && data.unresolved_questions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-sky-500" />
                    Unresolved Questions & Missing Info
                  </h4>
                  <ul className="space-y-1.5">
                    {data.unresolved_questions.map((q, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-slate-700 bg-sky-50/50 p-2.5 rounded-lg border border-sky-100 flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0 mt-1.5" />
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Next Action */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-4">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <ArrowRightCircle className="w-4 h-4 text-emerald-600" />
                  Recommended Next Action
                </span>
                <p className="text-sm text-emerald-950 font-medium">{data.recommended_next_action}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500 text-center py-6">Could not generate summary.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Regenerate
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
