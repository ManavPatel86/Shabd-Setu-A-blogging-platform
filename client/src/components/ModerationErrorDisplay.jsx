// ModerationErrorDisplay.jsx
// Display moderation errors with line numbers and suggestions
import React from 'react';
import { AlertCircle, X, AlertTriangle } from 'lucide-react';

export default function ModerationErrorDisplay({ errors, suggestions, summary, onClose, onFixLine }) {
  if (!errors || errors.length === 0) return null;

  // Check if any error is CRITICAL
  const hasCritical = errors.some(e => e.severity === 'CRITICAL');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-hidden flex flex-col ${
        hasCritical ? 'border-4 border-red-600' : ''
      }`}>
        {/* Header */}
        <div className={`${hasCritical ? 'bg-red-700' : 'bg-red-50'} ${hasCritical ? 'border-b-4 border-red-900' : 'border-b-2 border-red-200'} px-6 py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            {hasCritical ? (
              <AlertTriangle className="w-8 h-8 text-white animate-pulse" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600" />
            )}
            <h2 className={`text-xl font-bold ${hasCritical ? 'text-white' : 'text-red-900'}`}>
              {hasCritical ? '🚫 CONTENT BLOCKED' : 'Content Moderation Failed'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`${hasCritical ? 'text-white hover:text-red-200' : 'text-red-600 hover:text-red-800'} transition-colors`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {summary && (
            <div className={`${hasCritical ? 'bg-red-100 border-l-4 border-red-600 text-red-900' : 'bg-blue-50 border-l-4 border-blue-400 text-blue-900'} p-4 rounded`}> 
              <p className="text-sm leading-relaxed whitespace-pre-line">{summary}</p>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              ❌ Found {errors.length} policy violation{errors.length !== 1 ? 's' : ''}
              {hasCritical && ' - This content cannot be published'}
            </h3>
            <div className="space-y-3">
              {errors.map((error, idx) => (
                <div
                  key={idx}
                  className={`${error.severity === 'CRITICAL' ? 'bg-red-100 border-l-4 border-red-700' : 'bg-yellow-50 border-l-4 border-yellow-500'} p-4 rounded`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={`inline-block ${error.severity === 'CRITICAL' ? 'bg-red-700 text-white' : 'bg-yellow-600 text-white'} px-2 py-1 rounded text-sm font-bold mr-2`}>
                        Line {error.line} {error.severity === 'CRITICAL' ? '⚠️' : ''}
                      </span>
                      <span className={`text-sm font-semibold ${error.severity === 'CRITICAL' ? 'text-red-800' : 'text-yellow-700'}`}>
                        {error.issues?.join(', ')}
                      </span>
                    </div>
                    <button
                      onClick={() => onFixLine?.(error.line)}
                      className={`text-sm font-medium ${error.severity === 'CRITICAL' ? 'text-red-700 hover:text-red-900' : 'text-blue-600 hover:text-blue-800'}`}
                      title="Jump to line in editor"
                    >
                      Go to Line →
                    </button>
                  </div>
                  <p className={`${error.severity === 'CRITICAL' ? 'text-red-900' : 'text-gray-800'} font-mono text-sm bg-white p-2 rounded my-2 break-words`}>
                    "{error.text}"
                  </p>
                  {error.suggestions && (
                    <p className={`text-sm ${error.severity === 'CRITICAL' ? 'text-red-800 font-semibold' : 'text-gray-700'} mt-2`}>
                      <strong>💡 Action Required:</strong> {error.suggestions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {suggestions && suggestions.length > 0 && (
            <div className={`${hasCritical ? 'bg-red-50 border-l-4 border-red-500' : 'bg-blue-50 border-l-4 border-blue-500'} p-4 rounded`}>
              <h4 className={`font-semibold ${hasCritical ? 'text-red-900' : 'text-blue-900'} mb-2`}>📝 Required Changes:</h4>
              <ul className="list-disc list-inside space-y-1">
                {suggestions.map((suggestion, idx) => (
                  <li key={idx} className={`text-sm ${hasCritical ? 'text-red-800' : 'text-blue-800'}`}>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`${hasCritical ? 'bg-red-50 border-t-2 border-red-200' : 'bg-gray-50 border-t'} px-6 py-4 flex justify-end gap-3`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              hasCritical 
                ? 'bg-red-700 text-white hover:bg-red-800' 
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {hasCritical ? 'Close & Edit' : 'Close & Edit'}
          </button>
        </div>
      </div>
    </div>
  );
}
