import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
}

export const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, onChange, unit = '' }) => {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-primary/80">{label}</label>
        <span className="text-sm font-semibold text-accent bg-accent/10 px-2 py-1 rounded">
          {value.toFixed(unit === '%' ? 2 : (step.toString().split('.')[1] || []).length)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-primary/10 rounded-lg appearance-none cursor-pointer accent-accent"
      />
    </div>
  );
};