import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, PenTool, Sparkles, Users } from "lucide-react";

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

import { RouteSignIn, RouteIndex } from "@/helpers/RouteName";
import { showToast } from "@/helpers/showToast";

import GoogleLogin from "@/components/ui/GoogleLogin";
import { CiMail, CiUser } from "react-icons/ci";

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

const onboardingHighlights = [
    { label: "Stories published", value: "180k+" },
    { label: "Collaborations", value: "12k" },
    { label: "Avg. feedback", value: "4.8/5" },
];

const onboardingPills = [
    { icon: PenTool, text: "Draft with AI co-writer" },
    { icon: Sparkles, text: "Launch curated series" },
    { icon: Users, text: "Grow superfans" },
];

const SignUp = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState("register");
    const [pendingEmail, setPendingEmail] = useState("");
    const [otp, setOtp] = useState("");
    const rawResendInterval = Number(import.meta.env.VITE_OTP_RESEND_INTERVAL_MINUTES || 5);
    const RESEND_INTERVAL_SECONDS = 60 * (Number.isNaN(rawResendInterval) ? 5 : rawResendInterval);
    const [resendDisabled, setResendDisabled] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    const form = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    useEffect(() => {
        if (!resendDisabled) return;
        if (resendTimer <= 0) {
            setResendDisabled(false);
            return;
        }

        const timer = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [resendDisabled, resendTimer]);

    async function onSubmit(values) {
        setIsLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify(values),
        });
        const data = await response.json();
        setIsLoading(false);
        if (!response.ok) return showToast("error", data.message);
        setPendingEmail(values.email.trim().toLowerCase());
        setStep("otp");
        setOtp("");
        setResendTimer(RESEND_INTERVAL_SECONDS);
        setResendDisabled(true);
        showToast("success", "OTP sent to your email. Enter it below.");
    }

    async function handleVerifyOtp(e) {
        e.preventDefault();
        if (otp.length !== 6) return showToast("error", "Enter 6-digit OTP");
        setIsLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email: pendingEmail, otp }),
        });
        const data = await response.json();
        setIsLoading(false);
        if (!response.ok) return showToast("error", data.message);
        showToast("success", "Email verified. You can sign in now.");
        navigate(RouteSignIn);
    }

    const handleResendOtp = async () => {
        if (!pendingEmail) {
            return showToast("error", "No email found. Please register again.");
        }
        if (resendDisabled) return;
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/resend-otp`, {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({ email: pendingEmail }),
        });
        const data = await response.json();
        if (response.ok) {
            showToast("success", "OTP resent to your email.");
            setResendTimer(RESEND_INTERVAL_SECONDS);
            setResendDisabled(true);
        } else {
            showToast("error", data.message);
            if (response.status === 429) {
                const secondsMatch = data.message?.match(/(\d+)/);
                if (secondsMatch) {
                    const seconds = Number(secondsMatch[1]);
                    if (!Number.isNaN(seconds)) {
                        setResendTimer(seconds);
                        setResendDisabled(true);
                    }
                }
            }
        }
    };

    return (
        <div className="relative min-h-screen bg-[#F7F5FF] overflow-hidden py-10 px-4 sm:px-6 lg:px-12">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-[#e8e1ff] to-transparent" />
            <div className="pointer-events-none absolute -left-20 top-24 h-80 w-80 rounded-full bg-[#C1B1FF]/30 blur-3xl" />
            <div className="pointer-events-none absolute -right-10 bottom-0 h-96 w-96 rounded-full bg-[#8e7cf3]/25 blur-3xl" />

            <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="flex min-h-[460px] flex-col justify-between rounded-4xl bg-linear-to-br from-[#6C5CE7] via-[#7b6ef6] to-[#a18bff] p-10 text-white shadow-[0_40px_70px_-35px_rgba(108,92,231,0.75)]">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">Start creating</p>
                        <h1 className="mt-8 text-[2.6rem] font-semibold leading-[1.15]">
                            Your next essay, newsletter, or series starts here.
                        </h1>
                        <p className="mt-4 text-lg text-white/85">
                            Design beautiful stories, grow subscribers, and co-create with our editorial tools built for modern writers.
                        </p>
                    </div>

                    <div className="mt-10 grid grid-cols-3 gap-4">
                        {onboardingHighlights.map((stat) => (
                            <div key={stat.label} className="rounded-2xl bg-white/15 p-4 text-center backdrop-blur">
                                <p className="text-2xl font-semibold">{stat.value}</p>
                                <p className="text-xs uppercase tracking-wide text-white/75">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 grid gap-3 sm:grid-cols-3">
                        {onboardingPills.map(({ icon: Icon, text }) => (
                            <div key={text} className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/90">
                                <span className="rounded-xl bg-white/15 p-2">
                                    <Icon className="h-4 w-4" />
                                </span>
                                {text}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-8 rounded-4xl border border-white/70 bg-white/90 p-8 shadow-2xl backdrop-blur-2xl sm:p-10">
                    <div className="space-y-2 text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6C5CE7]">Create your profile</p>
                        <h2 className="text-3xl font-semibold text-slate-900">Join the ShabdSetu circle</h2>
                        <p className="text-sm text-slate-600">
                            One account unlocks publishing, collaborations, and creator tools.
                        </p>
                    </div>

                    {step === "register" && (
                        <>
                            <GoogleLogin />
                            <div className="relative flex items-center gap-3 py-4">
                                <span className="flex-1 border-t border-dashed border-slate-200" />
                                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">or</span>
                                <span className="flex-1 border-t border-dashed border-slate-200" />
                            </div>
                        </>
                    )}

                    {step === "register" ? (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-slate-500">Full name</FormLabel>
                                            <FormControl>
                                                <div className="relative mt-2">
                                                    <Input
                                                        type="text"
                                                        placeholder="Tell us what to call you"
                                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-800 shadow-sm transition-all focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/30"
                                                        {...field}
                                                    />
                                                    <CiUser className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-sm text-rose-500" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email address</FormLabel>
                                            <FormControl>
                                                <div className="relative mt-2">
                                                    <Input
                                                        type="email"
                                                        placeholder="name@shabdsetu.com"
                                                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-800 shadow-sm transition-all focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/30"
                                                        {...field}
                                                    />
                                                    <CiMail className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-sm text-rose-500" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-slate-500">Password</FormLabel>
                                            <FormControl>
                                                <div className="relative mt-2">
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Create a secure password"
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

                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confirm password</FormLabel>
                                            <FormControl>
                                                <div className="relative mt-2">
                                                    <Input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        placeholder="Re-enter password"
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

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="h-14 w-full rounded-2xl bg-linear-to-r from-[#6C5CE7] to-[#8e7cf3] text-base font-semibold text-white shadow-[0_18px_45px_-20px_rgba(108,92,231,0.9)] transition-all hover:shadow-[0_18px_45px_-14px_rgba(108,92,231,0.95)]"
                                >
                                    {isLoading ? "Creating account..." : "Create account"}
                                </Button>
                            </form>
                        </Form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="rounded-2xl bg-[#F6F4FF] px-4 py-3 text-sm text-slate-600">
                                Enter the 6-digit code we sent to <span className="font-semibold text-slate-900">{pendingEmail}</span>
                            </div>
                            <Input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-2xl tracking-[0.6em] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/30"
                                placeholder="000000"
                            />
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="h-14 w-full rounded-2xl bg-linear-to-r from-[#6C5CE7] to-[#8e7cf3] text-base font-semibold text-white shadow-[0_18px_45px_-20px_rgba(108,92,231,0.9)] transition-all hover:shadow-[0_18px_45px_-14px_rgba(108,92,231,0.95)]"
                            >
                                {isLoading ? "Verifying..." : "Verify & continue"}
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleResendOtp}
                                disabled={resendDisabled}
                                className="w-full rounded-2xl border border-transparent text-sm font-semibold text-[#6C5CE7] hover:bg-[#F6F4FF]"
                            >
                                {resendDisabled ? `Resend in ${resendTimer}s` : "Resend OTP"}
                            </Button>
                        </form>
                    )}

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