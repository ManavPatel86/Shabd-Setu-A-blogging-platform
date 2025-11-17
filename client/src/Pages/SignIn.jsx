import React, { useState } from "react";
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
import { RouteSignUp, RouteIndex } from "@/helpers/RouteName";
import { CiMail } from "react-icons/ci";
import { showToast } from "@/helpers/showToast";
import { getEnv } from "@/helpers/getEnv";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/user/user.slice";
import GoogleLogin from "@/components/ui/GoogleLogin";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

const highlightStats = [
  { label: "Monthly readers", value: "2.4M+" },
  { label: "Writers", value: "85k" },
  { label: "Avg. reads", value: "6 min" },
];

const featurePills = [
  { icon: Sparkles, text: "Curated insights" },
  { icon: PenTool, text: "Create fast" },
  { icon: Users, text: "Grow community" },
];

const SignIn = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values) {
    try {
      setIsLoading(true);
      const response = await fetch(`${getEnv("VITE_API_BASE_URL")}/auth/login`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        return showToast("error", data.message);
      }
      dispatch(setUser(data.user));
      navigate(RouteIndex);
      showToast("success", data.message);
    } catch (error) {
      showToast("error", error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-[#F6F4FF] overflow-hidden py-10 px-4 sm:px-6 lg:px-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-[#dcd2ff]/70 to-transparent" />
      <div className="pointer-events-none absolute -left-16 top-32 h-72 w-72 rounded-full bg-[#6C5CE7]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-10 h-80 w-80 rounded-full bg-[#A18BFF]/25 blur-3xl" />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex min-h-[420px] flex-col justify-between rounded-4xl bg-linear-to-br from-[#6C5CE7] via-[#7b6ef6] to-[#a18bff] p-10 text-white shadow-[0_35px_60px_-30px_rgba(108,92,231,0.7)]">
          <div>
            <div className="flex items-center justify-between text-sm uppercase tracking-[0.35em] text-white/70">
              <span>ShabdSetu</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide text-white/80">Stories</span>
            </div>
            <h1 className="mt-10 text-4xl font-semibold leading-tight">
              Sign in &amp; step back into your creative flow.
            </h1>
            <p className="mt-4 text-lg text-white/85">
              Your dashboard, audience analytics, and saved drafts are waiting. Continue publishing with our refreshed interface built for focus.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {highlightStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/15 p-4 text-center backdrop-blur-md">
                <p className="text-2xl font-semibold">{stat.value}</p>
                <p className="text-xs uppercase tracking-wide text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {featurePills.map(({ icon: Icon, text }) => (
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
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6C5CE7]">Welcome back</p>
            <h2 className="text-3xl font-semibold text-slate-900">Sign in to continue</h2>
            <p className="text-sm text-slate-600">
              Access drafts, saved reads, and analytics on <Link to={RouteIndex} className="font-semibold text-[#6C5CE7]">ShabdSetu</Link>.
            </p>
          </div>

          <div>
            <GoogleLogin />
            <div className="relative flex items-center gap-3 py-4">
              <span className="flex-1 border-t border-dashed border-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">or</span>
              <span className="flex-1 border-t border-dashed border-slate-200" />
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/30"
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
                          placeholder="Enter your password"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/30"
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

              <Button
                type="submit"
                disabled={isLoading}
                className="h-14 w-full rounded-2xl bg-linear-to-r from-[#6C5CE7] to-[#8e7cf3] text-base font-semibold text-white shadow-[0_18px_45px_-20px_rgba(108,92,231,0.9)] transition-all hover:shadow-[0_18px_45px_-14px_rgba(108,92,231,0.95)]"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="text-center">
                <button type="button" className="text-sm font-semibold text-[#6C5CE7] hover:text-[#4c3ebb] transition-colors">
                  Forgot your password?
                </button>
              </div>
            </form>
          </Form>

          <div className="pt-4 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link to={RouteSignUp} className="font-semibold text-[#6C5CE7] hover:text-[#4c3ebb]">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
