import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BackButton = ({ className = "" }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 hover:-translate-x-1 ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Back</span>
    </button>
  );
};

export default BackButton;
