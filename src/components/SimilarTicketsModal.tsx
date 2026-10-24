import React, { useState, useEffect } from "react";
import { aiApi } from "../api/client";
import { SimilarTicket } from "../types";
import { Search, Sparkles, X, CheckCircle, ExternalLink, Copy } from "lucide-react";
import { Link } from "react-router-dom";

interface SimilarTicketsModalProps {
  initialQuery: string;
  isOpen: boolean;
  onClose: () => void;
  onUseResolution?: (text: string) => void;
}

export const SimilarTicketsModal: React.FC<SimilarTicketsModalProps> = ({
  initialQuery,
  isOpen,
  onClose,
  onUseResolution,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SimilarTicket[]>([]);

  const handleSearch = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await aiApi.searchSimilar(text, 5);
      setResults(res);
    } catch (e) {
      console.error("Semantic search failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-indigo-700">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-800 text-base">Similar Resolved Tickets</h3>
              <p className="text-[11px] text-slate-500">Vector similarity & semantic search engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-white flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
              placeholder="Search previous issues or symptoms..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => handleSearch(query)}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Results List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {results.length === 0 && !loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No matching resolved tickets found for this query.
            </div>
          ) : (
            results.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors bg-white shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {item.ticket_number}
                    </span>
                    <span className="text-xs text-slate-500">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {Math.round(item.similarity_score * 100)}% Match
                    </span>
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-slate-800">{item.title}</h4>

                {/* Resolution Summary */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700">
                  <div className="flex items-center gap-1 text-emerald-700 font-semibold mb-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Resolution Strategy</span>
                  </div>
                  <p>{item.resolution_summary}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  {onUseResolution && (
                    <button
                      onClick={() => {
                        onUseResolution(item.resolution_summary);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium hover:bg-indigo-100 transition"
                    >
                      <Copy className="w-3 h-3" />
                      Apply Solution to Reply
                    </button>
                  )}
                  <Link
                    to={`/tickets/${item.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-3 py-1 text-slate-600 hover:text-slate-900 rounded-md text-xs font-medium"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open Ticket
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
