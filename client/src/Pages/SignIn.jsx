import React, { useState } from "react";
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
import { Link, Route, useNavigate } from "react-router-dom";
import { RouteSignUp, RouteIndex } from "@/helpers/RouteName";
import { CiMail } from "react-icons/ci";
import { showToast } from '@/helpers/showToast'
import { getEnv } from "@/helpers/getEnv";
import { useDispatch } from 'react-redux'
import { setUser } from '@/redux/user/user.slice'


const SignIn = () => {

  const dispath = useDispatch();

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values) {
    try {
        console.log("ENV VALUE = ", import.meta.env.VITE_API_BASE_URL);
        console.log("HELPER VALUE = ", getEnv("VITE_API_BASE_URL"));
        const response = await fetch(`${getEnv('VITE_API_BASE_URL')}/auth/login`, {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            credentials: 'include', // include cookies in the request
            body: JSON.stringify(values)
        })
        const data = await response.json()
        if (!response.ok) {
            return showToast('error', data.message)
        }
        dispath(setUser(data.user))
        navigate(RouteIndex)
        showToast('success', data.message)
    } catch (error) {
        showToast('error', error.message)
    }
  }

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Gradient Background - now integrated into main div */}
      {/* Animated gradient orbs for subtle movement */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 right-20 w-72 h-72 bg-gradient-to-r from-purple-200/30 to-pink-200/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-gradient-to-r from-indigo-200/30 to-blue-200/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-800 mb-2">Welcome Back</h1>
          <p className="text-sm text-gray-600">
            Sign in to your <Link to={RouteIndex} className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors cursor-pointer">ShabdSetu</Link> account
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            {/* Password Field */}
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
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm text-gray-800 transition-all duration-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:shadow-lg pr-12 focus:bg-white"
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

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            {/* Forgot Password */}
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-indigo-600 hover:text-indigo-700 transition-colors duration-300"
              >
                Forgot your password?
              </button>
            </div>
          </form>
        </Form>

        {/* Divider */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              to={RouteSignUp}
              className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-300"
            >
              Sign up
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

export default SignIn;