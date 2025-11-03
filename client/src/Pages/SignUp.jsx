import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { Link, useNavigate } from "react-router-dom";

import { RouteSignIn, RouteIndex } from "@/helpers/RouteName";
import { showToast } from "@/helpers/showToast";   
import { getEnv } from "@/helpers/getEnv";

import GoogleLogin from '@/components/ui/GoogleLogin';
import { CiMail } from "react-icons/ci";
import { CiUser } from "react-icons/ci";

const SignUp = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState('register');
    const [pendingEmail, setPendingEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [resendDisabled, setResendDisabled] = useState(false);
    const [resendTimer, setResendTimer] = useState(30);

    const formSchema = z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters long"),
        confirmPassword: z.string(),
    }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"], // show error under confirmPassword field
    });

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    async function onSubmit(values) {
        setIsLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify(values)
        })
        const data = await response.json();
        setIsLoading(false);
        if (!response.ok) return showToast('error', data.message);
        setPendingEmail(values.email);
        setStep('otp');
        showToast('success', 'OTP sent to your email. Enter it below.');
    }

    async function handleVerifyOtp(e) {
        e.preventDefault();
        if (otp.length !== 6) return showToast('error', 'Enter 6-digit OTP');
        setIsLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email: pendingEmail, otp })
        });
        const data = await response.json();
        setIsLoading(false);
        if (!response.ok) return showToast('error', data.message);
        showToast('success', 'Email verified. You can sign in now.');
        navigate(RouteSignIn);
    }

    const handleResendOtp = async () => {
        setResendDisabled(true);
        setResendTimer(30);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/resend-otp`, {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify({ email: pendingEmail })
        })
        const data = await response.json();
        if (response.ok) {
            showToast('success', 'OTP resent to your email.');
        } else {
            showToast('error', data.message);
        }

        const timer = setInterval(() => {
            setResendTimer((prev) => {
                if (prev === 1) {
                    clearInterval(timer);
                    setResendDisabled(false);
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);
    }

    return (
        <div className="fixed inset-0 w-screen h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Gradient Background - now integrated into main div */}
            {/* Animated gradient orbs for subtle movement */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-40 right-20 w-72 h-72 bg-gradient-to-r from-purple-200/30 to-pink-200/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-gradient-to-r from-indigo-200/30 to-blue-200/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

            {/* SignUp Card */}
            <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-semibold text-gray-800 mb-2">Create Account</h1>
                    <p className="text-sm text-gray-600">
                        Join <Link to={RouteIndex} className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors cursor-pointer">ShabdSetu</Link> today
                    </p>
                </div>
                
                <div className=''>
                    <GoogleLogin />
                    <div className='border my-5 flex justify-center items-center'>
                        <span className='absolute bg-white text-sm'>Or</span>
                    </div>

                </div>

                {/* Form */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Name Field */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700 text-left block mb-2">Full Name</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                        <Input
                                            type="text"
                                            placeholder="Enter your name"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 transition-all duration-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:shadow-lg"
                                            {...field}
                                        />
                                        <CiUser className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-red-500 text-sm" />
                                </FormItem>
                            )}
                        />

                        {/* Email Field */}
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700 text-left block mb-2">Email Address</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type="email"
                                                placeholder="Enter your email"
                                                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm text-gray-800 transition-all duration-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:shadow-lg focus:bg-white"
                                                {...field}
                                            />
                                            <CiMail className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-red-500 text-sm" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700 text-left block mb-2">Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Create a password"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 transition-all duration-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:shadow-lg pr-12"
                                                {...field}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-red-500 text-sm" />
                                </FormItem>
                            )}
                        />
                        {/* Confirm Password Field */}
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700 text-left block mb-2">Confirm Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Enter a password again"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 transition-all duration-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:shadow-lg pr-12"
                                                {...field}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-red-500 text-sm" />
                                </FormItem>
                            )}
                        />

                        {/* Sign Up Button */}
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold rounded-xl shadow-lg"
                        >
                            {isLoading ? "Creating Account..." : "Sign Up"}
                        </Button>
                    </form>
                </Form>

                {/* OTP Verification Form - Step 2 */}
                {step === 'otp' && (
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <p className="text-sm text-gray-600">Enter the 6-digit code sent to {pendingEmail}</p>
                        <Input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={6}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 transition-all duration-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:shadow-lg"
                            placeholder="Enter OTP"
                        />
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold rounded-xl shadow-lg"
                        >
                            {isLoading ? 'Verifying...' : 'Verify OTP'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleResendOtp}
                            disabled={resendDisabled}
                            className="w-full h-14 text-[#2563EB] font-semibold rounded-xl shadow-lg"
                        >
                            {resendDisabled ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                        </Button>
                    </form>
                )}

                {/* Divider */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-center text-sm text-gray-600">
                        Already have an account?{" "}
                        <Link
                            to={RouteSignIn}
                            className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-300"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>

        <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
        </div>
    );
};

export default SignUp;