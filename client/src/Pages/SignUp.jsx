import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { data, Link } from "react-router-dom";
import { RouteSingIn } from "@/helpers/RouteName";

const SignUp = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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

    function onSubmit(values) {
        setIsLoading(true);
        {/*set 2 second delays befor it execution */ }
        setTimeout(() => {
            console.log(values);
            setIsLoading(false);
        }, 2000);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative overflow-hidden flex items-center justify-center p-4">
            {/* Background gradient orbs */}
            <div className="absolute -top-32 -left-32 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-r from-indigo-300/10 to-purple-300/10 rounded-full blur-3xl"></div>

            {/* SignUp Card */}
            <div className="relative z-10 w-full max-w-md bg-white/85 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-semibold text-gray-800 mb-2">Create Account</h1>
                    <p className="text-sm text-gray-600">
                        Join <span className="text-indigo-600 font-semibold">Shabd-Setu</span> today
                    </p>
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
                                    <FormLabel className="text-sm font-medium text-gray-700">Full Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            placeholder="Enter your name"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 text-gray-800 transition-all duration-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:shadow-lg"
                                            {...field}
                                        />
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
                                    <FormLabel className="text-sm font-medium text-gray-700">Email Address</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="Enter your email"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 text-gray-800 transition-all duration-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:shadow-lg"
                                            {...field}
                                        />
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
                                    <FormLabel className="text-sm font-medium text-gray-700">Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Create a password"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 text-gray-800 transition-all duration-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:shadow-lg pr-12"
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
                                    <FormLabel className="text-sm font-medium text-gray-700">confirmPassword</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter a password again"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/70 text-gray-800 transition-all duration-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:shadow-lg pr-12"
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

                        {/* Sign Up Button */}
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg"
                        >
                            {isLoading ? "Creating Account..." : "Sign Up"}
                        </Button>
                    </form>
                </Form>

                {/* Divider */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-center text-sm text-gray-600">
                        Already have an account?{" "}
                        <Link
                            to={RouteSingIn}
                            className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors duration-300"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
