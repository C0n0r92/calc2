import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string;
  title?: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showIcon?: boolean;
  iconClassName?: string;
  maxWidth?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  title,
  children,
  position = 'top',
  showIcon = true,
  iconClassName = "w-4 h-4 text-gray-400 hover:text-blue-500 cursor-help ml-1",
  maxWidth = "max-w-lg"
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-white',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-white',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-white',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-white'
  };

  return (
    <div className="relative inline-block">
      {/* Trigger */}
      <div
        className="inline-flex items-center"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)} // For mobile
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        tabIndex={0}
        role="button"
        aria-describedby="tooltip"
        aria-expanded={isVisible}
      >
        {children}
        {showIcon && (
          <Info className={iconClassName} />
        )}
      </div>

      {/* Tooltip */}
      {isVisible && (
        <div
          id="tooltip"
          role="tooltip"
          className={`absolute z-50 ${positionClasses[position]} ${maxWidth} p-5 bg-white text-gray-800 text-base rounded-xl shadow-2xl border-2 border-blue-200 min-w-0`}
        >
          {title && (
            <div className="font-bold text-blue-700 mb-2 text-sm uppercase tracking-wide border-b border-blue-100 pb-1">
              {title}
            </div>
          )}
          <div className="leading-relaxed whitespace-pre-line text-sm">
            {content}
          </div>
          
          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
};

// Specialized component for form field labels
export const LabelWithTooltip: React.FC<{
  label: string;
  tooltip: string;
  title?: string;
  required?: boolean;
  className?: string;
}> = ({ label, tooltip, title, required = false, className = "block text-sm font-medium text-gray-700 mb-2" }) => {
  return (
    <label className={className}>
      <span className="flex items-center">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        <Tooltip content={tooltip} title={title} />
      </span>
    </label>
  );
};
