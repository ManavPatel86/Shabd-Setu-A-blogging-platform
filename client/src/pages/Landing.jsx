import React from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '@/assets/images/logo.png'
import bg from '@/assets/images/bg.jpg'
import { Button } from '@/components/ui/button'
import { RouteIndex } from '@/helpers/RouteName'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div
      className="relative min-h-screen w-full bg-cover bg-center bg-no-repeat flex items-center justify-center px-4 py-8"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      {/* Content Container */}
      <div className="relative z-10 bg-white/10 backdrop-blur-2xl p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl text-center max-w-sm sm:max-w-md w-full border border-white/20">
        {/* Logo and Title */}
        <div className="flex justify-center items-center gap-3 mb-4">
          <img
            src={logo}
            alt="ShabdSetu logo"
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
          />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
            ShabdSetu
          </h1>
        </div>

        {/* Description */}
        <p className="text-white/90 text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed px-2">
          A simple blogging platform to share thoughts and connect.
        </p>

        {/* CTA Button */}
        <Button
          onClick={() => navigate(RouteIndex)}
          className="w-full sm:w-auto bg-transparent hover:bg-purple-600 text-white border-2 border-white/50 hover:border-purple-600 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-all duration-300 shadow-lg hover:shadow-purple-500/50"
        >
          Get Started
        </Button>
      </div>
    </div>
  )
}
