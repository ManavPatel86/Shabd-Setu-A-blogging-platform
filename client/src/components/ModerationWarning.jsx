// ModerationWarning.jsx
// Shows a warning message under the comment input if moderation fails
import React from 'react';

export default function ModerationWarning({ badLines = [], suggestions = [], message }) {
  if (!badLines.length && !suggestions.length && !message) return null;
  return (
    <div className="bg-red-50 border border-red-300 rounded p-2 mt-2">
      <div className="text-red-700 font-semibold mb-1">{message || 'Your comment was flagged by moderation.'}</div>
      <ul className="list-disc ml-5 text-red-600 text-sm">
        {badLines.map((line, idx) => (
          <li key={idx}>
            <span className="font-mono bg-red-100 px-1 rounded">Line {line.line}:</span> {line.text}
            {line.suggestion && (
              <span className="ml-2 text-xs text-red-500">Suggestion: {line.suggestion}</span>
            )}
          </li>
        ))}
      </ul>
      {suggestions.length > 0 && (
        <div className="mt-1">
          <div className="font-semibold text-red-700">Suggestions:</div>
          <ul className="list-disc ml-6 text-red-600 text-xs">
            {suggestions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
