// ModerationErrorList.jsx
// Shows line-by-line moderation errors and suggestions for blog/comment content
import React from 'react';

/**
 * @param {Object} props
 * @param {Array<{line: number, text: string, suggestion: string}>} props.badLines
 * @param {Array<string>} [props.suggestions]
 */
export default function ModerationErrorList({ badLines = [], suggestions = [] }) {
  if (!badLines.length && !suggestions.length) return null;
  return (
    <div className="bg-red-50 border border-red-300 rounded p-3 my-2">
      <div className="font-semibold text-red-700 mb-2">Content flagged by moderation:</div>
      <ul className="space-y-2">
        {badLines.map((line, idx) => (
          <li key={idx} className="text-red-600">
            <span className="font-mono bg-red-100 px-1 rounded">Line {line.line}:</span> {line.text}
            {line.suggestion && (
              <div className="text-xs text-red-500 ml-4">Suggestion: {line.suggestion}</div>
            )}
          </li>
        ))}
      </ul>
      {suggestions.length > 0 && (
        <div className="mt-2">
          <div className="font-semibold text-red-700">General Suggestions:</div>
          <ul className="list-disc ml-6 text-red-600">
            {suggestions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
