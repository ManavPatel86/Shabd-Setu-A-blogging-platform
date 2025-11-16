import React from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '@/assets/images/logo.svg'
import { Button } from '@/components/ui/button'
import { RouteIndex } from '@/helpers/RouteName'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border p-10 w-full max-w-lg text-center">
        <img src={logo} alt="Shabd Setu" className="mx-auto w-28 h-28 mb-6" />
        <h1 className="text-4xl font-extrabold mb-2">Shabd Setu</h1>
        <p className="text-gray-600 mb-6">A simple blogging platform to share thoughts and connect.</p>
        <div>
          <Button onClick={() => navigate(RouteIndex)} className="px-8 py-3 text-lg">Get Started</Button>
        </div>
      </div>
    </div>
  )
}
