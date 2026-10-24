import React from "react";

export const UrgencyMeter: React.FC<{ score?: number; showLabel?: boolean }> = ({
  score = 5,
  showLabel = true,
}) => {
  const safeScore = Math.max(1, Math.min(10, score));

  // Determine color based on 1-10
  let color = "bg-emerald-500";
  let textColor = "text-emerald-700";
  let label = "Low";

  if (safeScore >= 8) {
    color = "bg-rose-500";
    textColor = "text-rose-700";
    label = "Critical";
  } else if (safeScore >= 6) {
    color = "bg-amber-500";
    textColor = "text-amber-700";
    label = "High";
  } else if (safeScore >= 4) {
    color = "bg-blue-500";
    textColor = "text-blue-700";
    label = "Medium";
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden flex">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${safeScore * 10}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-semibold ${textColor}`}>
          {safeScore}/10 ({label})
        </span>
      )}
    </div>
  );
};
