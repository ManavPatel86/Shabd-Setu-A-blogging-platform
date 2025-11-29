import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { getEnv } from "@/helpers/getEnv";
import { RouteSignIn } from "@/helpers/RouteName";
import { showToast } from "@/helpers/showToast";
import { CiMail } from "react-icons/ci";
import { Eye, EyeOff } from "lucide-react";
import { validatePassword } from "@/helpers/passwordValidation";

const ForgotPassword = () => {
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResendLoading, setIsResendLoading] = useState(false);
  const resendMinutes = Number(getEnv("VITE_OTP_RESEND_INTERVAL_MINUTES")) || 1;
  const RESEND_INTERVAL = resendMinutes * 60;
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const baseUrl = useMemo(() => getEnv("VITE_API_BASE_URL"), []);
  const navigate = useNavigate();

  useEffect(() => {
    if (!resendDisabled || resendTimer <= 0) return;

    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendDisabled, resendTimer]);

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
      setResendTimer(RESEND_INTERVAL);
      setResendDisabled(true);
    } catch (error) {
      showToast("error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email || !otp || !newPassword || !confirmPassword) {
      return showToast("error", "All fields are required.");
    }
    
    if (newPassword !== confirmPassword) {
      return showToast("error", "Passwords do not match.");
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return showToast("error", passwordValidation.message);
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
      sessionStorage.setItem("fromPasswordReset", "true");
      navigate(RouteSignIn, { replace: true });
    } catch (error) {
      showToast("error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      return showToast("error", "Enter the email used for the reset request first.");
    }
    if (resendDisabled) {
      return;
    }

    setIsResendLoading(true);
    try {
      const response = await fetch(`${baseUrl}/auth/password/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        showToast("error", data.message || "Unable to resend code.");
        const waitSeconds = Number(data.message?.match(/(\d+)/)?.[1]);
        if (!Number.isNaN(waitSeconds)) {
          setResendTimer(waitSeconds);
          setResendDisabled(true);
        }
        return;
      }
      showToast("success", data.message || "Reset code resent.");
      setResendTimer(RESEND_INTERVAL);
      setResendDisabled(true);
    } catch (error) {
      showToast("error", error.message);
    } finally {
      setIsResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f0ff] via-[#f5f7ff] to-white px-4 py-12">
      <div className="mx-auto flex max-w-lg flex-col items-center text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#7c6ce6]">Welcome back</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Reset your password</h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter the email tied to your account and we&apos;ll send you a code to set a new password.
        </p>
      </div>

      <div className="mx-auto mt-10 w-full max-w-md rounded-[32px] border border-white/60 bg-white/95 p-8 shadow-[0_40px_80px_-45px_rgba(124,108,230,0.45)]">
        <div className="space-y-5">
          <div className="text-left">
            <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Email address</label>
            <div className="relative mt-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@shabdsetu.com"
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-slate-800 shadow-sm focus:border-[#6c5ce7] focus:ring-2 focus:ring-[#6c5ce7]/20"
              />
              <CiMail className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
            </div>
          </div>

          {step === "verify" && (
            <>
              <div className="text-left">
                <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Verification code</label>
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter the 6-digit code"
                  maxLength={6}
                  className="mt-2 h-12 rounded-2xl border border-slate-200 bg-white px-4 text-slate-800 shadow-sm focus:border-[#6c5ce7] focus:ring-2 focus:ring-[#6c5ce7]/20"
                />
              </div>

              <div className="text-left">
                <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">New password</label>
                <div className="relative mt-2">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-slate-800 shadow-sm focus:border-[#6c5ce7] focus:ring-2 focus:ring-[#6c5ce7]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="text-left">
                <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Confirm password</label>
                <div className="relative mt-2">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-slate-800 shadow-sm focus:border-[#6c5ce7] focus:ring-2 focus:ring-[#6c5ce7]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                disabled={resendDisabled || isResendLoading}
                onClick={handleResend}
                className="w-full rounded-2xl text-sm font-semibold text-[#6c5ce7] hover:bg-[#f4f1ff]"
              >
                {resendDisabled
                  ? `Resend code in ${resendTimer}s`
                  : isResendLoading
                  ? "Sending..."
                  : "Resend code"}
              </Button>
            </>
          )}

          <Button
            type="button"
            onClick={step === "request" ? handleRequest : handleReset}
            disabled={isLoading}
            className="h-12 w-full rounded-2xl bg-linear-to-r from-[#6c5ce7] to-[#8f7cf4] text-base font-semibold text-white shadow-[0_20px_60px_-25px_rgba(108,92,231,0.9)]"
          >
            {isLoading
              ? "Please wait..."
              : step === "request"
              ? "Send reset code"
              : "Update password"}
          </Button>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4 text-center text-sm text-slate-500">
          Remembered your password?{" "}
          <Link to={RouteSignIn} className="font-semibold text-[#6c5ce7] hover:text-[#4f3ec2]">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
