import React, { useState, useEffect } from 'react';
import { formatNumber, parseFormattedNumber } from '../utils/formatters';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  prefix,
  suffix,
  min,
  max,
  step
}) => {
  const [displayValue, setDisplayValue] = useState(formatNumber(value.toString()));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatNumber(value.toString()));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    
    const numericValue = parseFormattedNumber(inputValue);
    if (!isNaN(numericValue)) {
      if (min !== undefined && numericValue < min) return;
      if (max !== undefined && numericValue > max) return;
      onChange(numericValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setDisplayValue(formatNumber(value.toString()));
  };

  return (
    <div className="relative group">
      {prefix && (
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium z-10">
          {prefix}
        </span>
      )}
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full ${prefix ? 'pl-12' : 'pl-4'} ${suffix ? 'pr-12' : 'pr-4'} py-4 
                   bg-gradient-to-r from-gray-50 to-blue-50/30 
                   border-2 border-gray-200 hover:border-blue-300 
                   rounded-2xl shadow-sm hover:shadow-md
                   focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 
                   transition-all duration-300 ease-out
                   text-lg font-semibold text-gray-800
                   placeholder:text-gray-400 placeholder:font-normal
                   group-hover:bg-gradient-to-r group-hover:from-blue-50 group-hover:to-indigo-50/30
                   ${isFocused ? 'bg-white shadow-lg scale-[1.02]' : ''}
                   ${className}`}
        min={min}
        max={max}
        step={step}
      />
      {suffix && (
        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium z-10">
          {suffix}
        </span>
      )}
      {/* Focus glow effect */}
      {isFocused && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-emerald-500/10 -z-10 scale-105 blur-sm"></div>
      )}
    </div>
  );
};