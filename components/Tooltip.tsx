
import React from 'react';
import { camelCaseToTitle } from '../utils';

interface TooltipProps {
  content: Record<string, any>;
  position: { x: number; y: number };
}

const Tooltip: React.FC<TooltipProps> = ({ content, position }) => {
  // Filter out any fields that are empty, just whitespace, false, or internal fields
  const internalFields = new Set(['images', 'interior_perimeter']);
  const validContent = Object.entries(content).filter(([key, value]) =>
    !internalFields.has(key) &&
    value !== false &&
    value !== null &&
    value !== undefined &&
    String(value).trim() !== '' &&
    !(Array.isArray(value) && value.length === 0)
  );

  if (validContent.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed z-[200] p-3 bg-gray-900 border border-gray-700 text-white rounded-lg shadow-2xl pointer-events-none transition-opacity duration-150"
      style={{
        left: position.x + 15,
        top: position.y + 15,
        maxWidth: '300px',
      }}
    >
      <div className="grid grid-cols-[max-content,1fr] gap-x-3 gap-y-1 text-sm">
        {validContent.map(([key, value]) => (
          <React.Fragment key={key}>
            <div className="font-semibold text-gray-400 capitalize">{camelCaseToTitle(key.replace(/_/g, ' '))}:</div>
            <div className="text-gray-200 break-words">{String(value)}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Tooltip;