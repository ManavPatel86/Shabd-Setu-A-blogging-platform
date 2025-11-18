import React, { useEffect } from "react";
import { X, Loader2 } from "lucide-react";

const SummaryModal = ({
    isOpen,
    onClose,
    summary,
    summaryLoading,
    summaryError,
    onRefresh
}) => {

    // Close on ESC
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6 relative animate-popup 
                overflow-y-auto max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    className="absolute top-3 right-3 text-gray-600 hover:text-black"
                    onClick={onClose}
                >
                    <X className="h-5 w-5" />
                </button>

                <h3 className="text-lg font-bold mb-3">AI Summary</h3>

                {/* Refresh button */}
                <button
                    onClick={onRefresh}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-3"
                >
                    {summaryLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {summaryLoading ? "Refreshing..." : "Refresh"}
                </button>

                {/* Summary body */}
                <div className="text-sm text-gray-700 space-y-3">
                    {summaryLoading && !summary ? (
                        <div className="flex items-center gap-2 text-gray-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating summary...
                        </div>
                    ) : summaryError ? (
                        <p className="text-red-600">{summaryError}</p>
                    ) : summary ? (
                        summary
                            .split("\n")
                            .filter((line) => line.trim() !== "")
                            .map((line, i) => <p key={`summary-${i}`}>{line}</p>)
                    ) : (
                        <p className="text-gray-500">Summary will appear here once generated.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SummaryModal;
