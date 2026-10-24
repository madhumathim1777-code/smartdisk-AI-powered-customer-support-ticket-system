import React, { useState } from "react";
import { AIAnalysis, Ticket } from "../types";
import { UrgencyMeter } from "./UrgencyMeter";
import { PriorityBadge } from "./Badge";
import { aiApi } from "../api/client";
import {
  Sparkles,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Copy,
  MessageSquareQuote,
  ShieldAlert,
} from "lucide-react";

interface AIInsightsPanelProps {
  ticket: Ticket;
  analysis?: AIAnalysis;
  onAnalysisUpdated: (newAnalysis: AIAnalysis) => void;
  onInsertDraft?: (draft: string) => void;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  ticket,
  analysis,
  onAnalysisUpdated,
  onInsertDraft,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const updated = await aiApi.analyze(ticket.id);
      onAnalysisUpdated(updated);
    } catch (err) {
      console.error("AI Analysis refresh failed", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyDraft = () => {
    if (analysis?.suggested_response) {
      navigator.clipboard.writeText(analysis.suggested_response);
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2000);
    }
  };

  if (!analysis) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>AI Triage & Insights</span>
          </div>
        </div>
        <div className="text-center py-6 text-slate-500 text-xs">
          <p className="mb-3">AI analysis is pending for this ticket.</p>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Run Analysis Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 leading-tight">Gemini AI Insights</h3>
            <span className="text-[10px] text-slate-400 font-medium">Model: gemini-3.8-flash</span>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
          title="Re-run AI Analysis"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Urgency Score</span>
          <UrgencyMeter score={analysis.urgency_score || 5} />
        </div>
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Suggested Priority</span>
          <PriorityBadge priority={analysis.suggested_priority || "medium"} />
        </div>
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Predicted Sentiment</span>
          <span className="font-semibold text-slate-800">{analysis.predicted_sentiment || "Neutral"}</span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Confidence Score</span>
          <span className="font-semibold text-indigo-700">
            {analysis.confidence ? `${Math.round(analysis.confidence * 100)}%` : "88%"}
          </span>
          <span className="text-[9px] text-slate-400 block mt-0.5">Estimated confidence</span>
        </div>
      </div>

      {/* Problem Summary */}
      <div>
        <h4 className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          AI Issue Summary
        </h4>
        <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
          {analysis.summary || "No summary available."}
        </p>
      </div>

      {/* Suggested Solutions */}
      {analysis.suggested_solutions && analysis.suggested_solutions.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Recommended Troubleshooting Steps
          </h4>
          <ul className="space-y-1.5">
            {analysis.suggested_solutions.map((step, idx) => (
              <li
                key={idx}
                className="text-xs text-slate-600 bg-emerald-50/50 border border-emerald-100/60 p-2 rounded-lg flex items-start gap-2"
              >
                <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested Customer Reply */}
      {analysis.suggested_response && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <MessageSquareQuote className="w-3.5 h-3.5 text-indigo-500" />
              Suggested Response Draft
            </h4>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopyDraft}
                className="text-[11px] text-slate-500 hover:text-slate-800 p-1 flex items-center gap-1"
                title="Copy to clipboard"
              >
                <Copy className="w-3 h-3" />
                {copiedDraft ? "Copied!" : "Copy"}
              </button>
              {onInsertDraft && (
                <button
                  onClick={() => onInsertDraft(analysis.suggested_response!)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium px-2 py-0.5 rounded bg-indigo-50"
                >
                  Insert in Composer
                </button>
              )}
            </div>
          </div>
          <div className="text-xs text-slate-600 bg-indigo-50/40 p-3 rounded-lg border border-indigo-100 italic">
            "{analysis.suggested_response}"
          </div>
        </div>
      )}

      {/* Reasoning Note */}
      {analysis.reasoning && (
        <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-3">
          <span className="font-semibold text-slate-700">Classification Rationale: </span>
          {analysis.reasoning}
        </div>
      )}
    </div>
  );
};
