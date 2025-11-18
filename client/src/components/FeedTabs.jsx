import React from "react";
import { Clock, Users, Sparkles, ChevronRight } from "lucide-react";

export default function FeedTabs({ activeFeedTab, setActiveFeedTab }) {
  const tabs = [
    { id: "Latest", icon: Clock },
    { id: "Following", icon: Users },
    { id: "Personalized", icon: Sparkles },
  ];

  return (
    <div className="pt-4 pb-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white/80 backdrop-blur-md p-2 sm:p-1.5 rounded-2xl sm:rounded-full border border-gray-100 shadow-sm gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFeedTab(tab.id)}
            className={`
              relative flex items-center justify-center gap-2.5 px-4 sm:px-6 py-2 rounded-xl sm:rounded-full text-sm sm:text-[15px] font-semibold transition-all duration-200 w-full sm:w-auto
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
              <span className="absolute w-2 h-2 bg-indigo-400 rounded-full top-3 right-3 animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
