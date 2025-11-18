// ReportModal.jsx
// Modal for reporting a blog (flagging inappropriate content)
import React, { useState } from 'react';
import { showToast } from '@/helpers/showToast';
import { getEnv } from '@/helpers/getEnv';

const REPORT_TYPES = [
  'Hate speech',
  'Spam',
  'Harassment',
  'NSFW',
  'Fake Info',
  'Other',
];

export default function ReportModal({ blogId, open, onClose }) {
  const [type, setType] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type) {
      showToast('error', 'Please select a report reason.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${getEnv('VITE_API_BASE_URL')}/report/blog`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogId, type, reason }),
      });
      const data = await response.json();
      if (!response.ok) {
        showToast('error', data.error || 'Failed to submit report.');
      } else {
        showToast('success', 'Report submitted. Thank you!');
        onClose();
      }
    } catch (err) {
      showToast('error', err.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  // Prevent modal from closing when clicking inside
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative" onClick={handleModalClick}>
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-lg">&times;</button>
        <h2 className="text-lg font-bold mb-4">Report Blog</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block font-medium mb-1">Reason *</label>
            <select
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={type}
              onChange={e => setType(e.target.value)}
              required
            >
              <option value="">Select reason</option>
              {REPORT_TYPES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1">Details (optional)</label>
            <textarea
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Add more details (optional)"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-red-600 text-white py-2 rounded font-semibold hover:bg-red-700 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
