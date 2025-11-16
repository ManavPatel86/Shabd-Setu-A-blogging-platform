import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { getEnv } from "@/helpers/getEnv";
import { RouteSignIn } from "@/helpers/RouteName";
import { showToast } from "@/helpers/showToast";
import { CiMail } from "react-icons/ci";
import { Eye, EyeOff } from "lucide-react";

const ForgotPassword = () => {
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const baseUrl = useMemo(() => getEnv("VITE_API_BASE_URL"), []);
  const navigate = useNavigate();

  const handleRequest = async () => {
    if (!email) {
      return showToast("error", "Please enter your account email.");
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/auth/password/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        return showToast("error", data.message || "Unable to send code.");
      }
      showToast("success", data.message);
      setStep("verify");
    } catch (error) {
      showToast("error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email || !otp || !newPassword) {
      return showToast("error", "Email, code, and new password are required.");
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/auth/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        return showToast("error", data.message || "Unable to reset password.");
      }
      showToast("success", data.message);
      navigate(RouteSignIn, { replace: true });
    } catch (error) {
      showToast("error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 right-20 w-72 h-72 bg-gradient-to-r from-purple-200/30 to-pink-200/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-gradient-to-r from-indigo-200/30 to-blue-200/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-md bg-white/85 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-gray-800 mb-2">Reset your password</h1>
          <p className="text-sm text-gray-600">
            Enter the email tied to your account and we will send a verification code.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <div className="relative">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-white/80"
              />
              <CiMail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {step === "verify" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Verification Code</label>
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter the 6-digit code"
                  maxLength={6}
                  className="px-4 py-3 rounded-xl border border-gray-200 bg-white/80"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">New Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Create a new password"
                    className="px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-white/80"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </>
          )}

          <Button
            type="button"
            onClick={step === "request" ? handleRequest : handleReset}
            disabled={isLoading}
            className="w-full h-12 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold rounded-xl shadow-lg"
          >
            {isLoading
              ? "Please wait..."
              : step === "request"
              ? "Send reset code"
              : "Update password"}
          </Button>
        </div>

        <div className="text-center text-sm text-gray-600 pt-4 border-t border-gray-200">
          Remembered your password?{" "}
          <Link to={RouteSignIn} className="text-indigo-600 hover:text-indigo-700 font-medium">
            Back to sign in
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
