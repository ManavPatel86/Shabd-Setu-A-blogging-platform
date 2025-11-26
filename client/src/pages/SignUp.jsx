import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Eye, EyeOff } from "lucide-react";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";

import { Link, useNavigate } from "react-router-dom";
import { RouteSignIn } from "@/helpers/RouteName";
import { showToast } from "@/helpers/showToast";

import GoogleLogin from "@/components/ui/GoogleLogin";
import { CiMail, CiUser } from "react-icons/ci";


// ---------------------------
// 🔐 FORM VALIDATION SCHEMA
// ---------------------------
const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });


const SignUp = () => {
  const navigate = useNavigate();

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // form step
  const [step, setStep] = useState("register");
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState("");

  // resend otp timer
  const resendMinutes = Number(import.meta.env.VITE_OTP_RESEND_INTERVAL_MINUTES) || 1;
  const RESEND_INTERVAL = resendMinutes * 60;

  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // form setup
  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });


  // ---------------------------
  // ⏳ RESEND OTP TIMER EFFECT
  // ---------------------------
  useEffect(() => {
    if (!resendDisabled || resendTimer <= 0) return;

    const timer = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setResendDisabled(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendDisabled, resendTimer]);

  // ---------------------------
  // 📝 HANDLE REGISTER SUBMIT
  // ---------------------------
  async function onSubmit(values) {
    try {
      setIsLoading(true);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (!response.ok) return showToast("error", data.message);

      // proceed to otp step
      setPendingEmail(values.email.trim().toLowerCase());
      setStep("otp");
      setOtp("");

      // start timer
      setResendTimer(RESEND_INTERVAL);
      setResendDisabled(true);

      showToast("success", "OTP sent to your email.");
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setIsLoading(false);
    }
  }


  // ---------------------------
  // 🔐 VERIFY OTP
  // ---------------------------
  async function handleVerifyOtp(e) {
    e.preventDefault();

    if (otp.length !== 6) return showToast("error", "Enter 6-digit OTP");

    try {
      setIsLoading(true);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: pendingEmail, otp }),
      });

      const data = await response.json();
      if (!response.ok) return showToast("error", data.message);

      showToast("success", "Email verified! You can sign in now.");
      navigate(RouteSignIn);
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setIsLoading(false);
    }
  }


  // ---------------------------
  // 🔁 RESEND OTP
  // ---------------------------
  const handleResendOtp = async () => {
    if (!pendingEmail) return showToast("error", "No email found. Please register again.");
    if (resendDisabled) return;

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/resend-otp`, {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({ email: pendingEmail }),
    });

    const data = await response.json();

    if (!response.ok) {
      showToast("error", data.message);

      // handle rate limit 429
      const sec = Number(data.message?.match(/(\d+)/)?.[1]);
      if (!Number.isNaN(sec)) {
        setResendTimer(sec);
        setResendDisabled(true);
      }
      return;
    }

    // success
    showToast("success", "OTP resent!");
    setResendTimer(RESEND_INTERVAL);
    setResendDisabled(true);
  };


  // ================================================================
  // 🌈 UI + FINAL MERGED RENDER
  // ================================================================
  return (
    <div className="relative min-h-screen bg-[#F7F5FF] overflow-hidden py-10 px-4 sm:px-6 lg:px-12" onContextMenu={(e) => e.preventDefault()}>
    <div className="relative h-screen bg-[#F7F5FF] overflow-hidden px-4 sm:px-6 lg:px-12 flex items-center">

      {/* --------------------- Background Orbs ---------------------- */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-[#e8e1ff] to-transparent" />
      <div className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-full bg-[#C1B1FF]/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-96 w-96 rounded-full bg-[#8e7cf3]/25 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-xl">
        <div className="space-y-4 rounded-4xl border border-white/70 bg-white/95 p-5 shadow-[0_40px_70px_-35px_rgba(108,92,231,0.35)] backdrop-blur-2xl sm:p-7">

          <div className="space-y-1 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6C5CE7]">
              Create your profile
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              Join the ShabdSetu circle
            </h2>
            <p className="text-sm text-slate-600">
              One account unlocks publishing, collaborations, and creator tools.
            </p>
          </div>

          {/* Google Login */}
          {step === "register" && (
            <>
              <GoogleLogin />
              <div className="relative flex items-center gap-3 py-3">
                <span className="flex-1 border-t border-dashed border-slate-200" />
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                  or
                </span>
                <span className="flex-1 border-t border-dashed border-slate-200" />
              </div>
            </>
          )}

          {/* --------------------------- */}
          {/* STEP 1 → REGISTER FORM */}
          {/* --------------------------- */}
          {step === "register" ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                
                {/* NAME */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Full name
                      </FormLabel>
                      <FormControl>
                        <div className="relative mt-1">
                          <Input
                            placeholder="Tell us what to call you"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 pr-12 text-slate-800 shadow-sm transition-all focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/30"
                            {...field}
                          />
                          <CiUser className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-sm text-rose-500" />
                    </FormItem>
                  )}
                />

                {/* EMAIL */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Email address
                      </FormLabel>
                      <FormControl>
                        <div className="relative mt-2">
                          <Input
                            type="email"
                            placeholder="name@shabdsetu.com"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-800 shadow-sm transition-all focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/30"
                            {...field}
                          />
                          <CiMail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        </div>
                      </FormControl>
                      <FormMessage className="text-sm text-rose-500" />
                    </FormItem>
                  )}
                />

                {/* PASSWORD */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative mt-2">
                          <Input
                            placeholder="Create a secure password"
                            type={showPassword ? "text" : "password"}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-800 shadow-sm transition-all focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/30"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-sm text-rose-500" />
                    </FormItem>
                  )}
                />

                {/* CONFIRM PASSWORD */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Confirm password
                      </FormLabel>
                      <FormControl>
                        <div className="relative mt-2">
                          <Input
                            placeholder="Re-enter password"
                            type={showConfirmPassword ? "text" : "password"}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-800 shadow-sm transition-all focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/30"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-sm text-rose-500" />
                    </FormItem>
                  )}
                />

                {/* SUBMIT BUTTON */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-11 w-full rounded-2xl bg-linear-to-r from-[#6C5CE7] to-[#8e7cf3] text-base font-semibold text-white shadow-[0_18px_45px_-20px_rgba(108,92,231,0.9)] transition-all hover:shadow-[0_18px_45px_-14px_rgba(108,92,231,0.95)]"
                >
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </form>
            </Form>
          ) : (
            // ---------------------------
            // STEP 2 → OTP VERIFY FORM
            // ---------------------------
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div className="rounded-2xl bg-[#F6F4FF] px-4 py-3 text-sm text-slate-600">
                Enter the 6-digit code we sent to{" "}
                <span className="font-semibold text-slate-900">{pendingEmail}</span>
              </div>

              <Input
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-2xl tracking-[0.6em] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/30"
                placeholder="000000"
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full rounded-2xl bg-linear-to-r from-[#6C5CE7] to-[#8e7cf3] text-base font-semibold text-white shadow-[0_18px_45px_-20px_rgba(108,92,231,0.9)] transition-all hover:shadow-[0_18px_45px_-14px_rgba(108,92,231,0.95)]"
              >
                {isLoading ? "Verifying..." : "Verify & continue"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                disabled={resendDisabled}
                onClick={handleResendOtp}
                className="w-full rounded-2xl text-sm font-semibold text-[#6C5CE7] hover:bg-[#F6F4FF]"
              >
                {resendDisabled ? `Resend in ${resendTimer}s` : "Resend OTP"}
              </Button>
            </form>
          )}

          {/* SIGN IN LINK */}
          <div className="pt-2 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link to={RouteSignIn} className="font-semibold text-[#6C5CE7] hover:text-[#4c3ebb]">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;