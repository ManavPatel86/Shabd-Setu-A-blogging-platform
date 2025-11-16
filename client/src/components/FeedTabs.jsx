import React from "react";
import { Clock, Users, Sparkles, ChevronRight } from "lucide-react";

export default function FeedTabs({ activeFeedTab, setActiveFeedTab }) {
  const tabs = [
    { id: "Latest", icon: Clock },
    { id: "Following", icon: Users },
    { id: "Personalized", icon: Sparkles },
  ];

  return (
    <div className="pt-5 pb-6">
      <div className="flex items-center bg-white/80 backdrop-blur-md p-1.5 rounded-full border border-gray-100 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFeedTab(tab.id)}
            className={`
              relative flex items-center gap-2.5 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-[15px] font-semibold transition-all duration-200
              ${
                activeFeedTab === tab.id
                  ? "bg-linear-to-r from-[#6C5CE7] to-[#8e7cf3] text-white shadow-md shadow-indigo-200"
                  : "bg-transparent text-gray-500 hover:text-[#6C5CE7] hover:bg-gray-50"
              }
            `}
          >
            <tab.icon size={18} strokeWidth={2.5} />
            <span>{tab.id}</span>
            {tab.id === "Personalized" && activeFeedTab !== "Personalized" && (
              <span className="absolute top-3 right-3 w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
