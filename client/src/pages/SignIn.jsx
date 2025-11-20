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
import { Link, useNavigate } from "react-router-dom";
import { RouteSignUp, RouteIndex, RouteForgotPassword } from "@/helpers/RouteName";
import { CiMail } from "react-icons/ci";
import { showToast } from "@/helpers/showToast";
import { getEnv } from "@/helpers/getEnv";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/user/user.slice";
import GoogleLogin from "@/components/ui/GoogleLogin";

/* -----------------------------
   Combined MAIN schema + UI UX
------------------------------ */

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

/* -----------------------------
            MAIN COMPONENT
------------------------------ */

const SignIn = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /* -----------------------------
        React Hook Form + Zod
  ------------------------------ */
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  /* -----------------------------
       FINAL MERGED LOGIN API
  ------------------------------ */
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

  /* -----------------------------
              JSX
  ------------------------------ */
  return (
    <div className="relative h-screen bg-[#F6F4FF] overflow-hidden px-4 sm:px-6 lg:px-12 flex items-center">
      {/* Background Decorations */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-[#dcd2ff]/70 to-transparent" />
      <div className="pointer-events-none absolute -left-16 top-32 h-72 w-72 rounded-full bg-[#6C5CE7]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-10 h-80 w-80 rounded-full bg-[#A18BFF]/25 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-xl">
        <div className="space-y-4 rounded-4xl border border-white/70 bg-white/95 p-5 shadow-[0_35px_60px_-30px_rgba(108,92,231,0.35)] backdrop-blur-2xl sm:p-7">
          <div className="space-y-1 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6C5CE7]">
              Welcome back
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Sign in &amp; step back into your creative flow
            </h1>
            <p className="text-sm text-slate-600">
              Access drafts, saved reads, and analytics on{" "}
              <Link to={RouteIndex} className="font-semibold text-[#6C5CE7]">
                ShabdSetu
              </Link>
              .
            </p>
          </div>

          <div>
            <GoogleLogin />
            <div className="relative flex items-center gap-3 py-3">
              <span className="flex-1 border-t border-dashed border-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                or
              </span>
              <span className="flex-1 border-t border-dashed border-slate-200" />
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Email address
                    </FormLabel>

                    <FormControl>
                      <div className="relative mt-1">
                        <Input
                          type="email"
                          placeholder="name@shabdsetu.com"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 pr-12 text-slate-800 shadow-sm placeholder:text-slate-400 transition-all focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/30"
                          {...field}
                        />
                        <CiMail className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
                      </div>
                    </FormControl>

                    <FormMessage className="text-sm text-rose-500" />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Password
                    </FormLabel>

                    <FormControl>
                      <div className="relative mt-1">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 pr-12 text-slate-800 shadow-sm placeholder:text-slate-400 transition-all focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/30"
                          {...field}
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>

                    <FormMessage className="text-sm text-rose-500" />
                  </FormItem>
                )}
              />

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full rounded-2xl bg-linear-to-r from-[#6C5CE7] to-[#8e7cf3] text-base font-semibold text-white shadow-[0_18px_45px_-20px_rgba(108,92,231,0.9)] transition-all hover:shadow-[0_18px_45px_-14px_rgba(108,92,231,0.95)]"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="text-center">
                <Link
                  to={RouteForgotPassword}
                  className="text-sm font-semibold text-[#6C5CE7] hover:text-[#4c3ebb] transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </form>
          </Form>

          {/* Sign Up Link */}
          <div className="pt-2 text-center text-sm text-slate-600">
            Don't have an account?{" "}
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