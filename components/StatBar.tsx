import React from 'react';

interface StatBarProps {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}

export const StatBar: React.FC<StatBarProps> = ({ label, value, color, icon }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between items-center text-xs font-mono text-gray-400 uppercase tracking-wider">
        <div className="flex items-center gap-2">
            {icon}
            <span>{label}</span>
        </div>
        <span>{value}%</span>
      </div>
      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
        <div 
          className={`h-full transition-all duration-500 ease-out ${color}`} 
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
};