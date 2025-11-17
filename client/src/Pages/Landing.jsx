import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { RouteSignIn, RouteSignUp, RouteIndex } from '@/helpers/RouteName'

const Landing = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 text-white">
            <header className="px-6 sm:px-12 py-6 flex items-center justify-between">
                <Link to={RouteIndex} className="text-xl font-semibold tracking-tight">
                    ShabdSetu
                </Link>
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" className="text-slate-200 hover:text-white">
                        <Link to={RouteSignIn}>Sign in</Link>
                    </Button>
                    <Button asChild className="bg-white text-slate-900 hover:bg-slate-100">
                        <Link to={RouteSignUp}>Create account</Link>
                    </Button>
                </div>
            </header>

            <main className="px-6 sm:px-12 lg:px-20 py-12">
                <section className="max-w-4xl">
                    <p className="uppercase tracking-[0.4em] text-sm text-indigo-300">Storytelling for the curious</p>
                    <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-black leading-tight">
                        Build your voice, discover perspectives, and publish with clarity.
                    </h1>
                    <p className="mt-6 text-lg text-slate-200 max-w-2xl">
                        ShabdSetu is the bridge between your ideas and the people who need them. Share essays, curate categories, and grow a loyal readership with tools crafted for modern writers.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        <Button asChild size="lg">
                            <Link to={RouteSignUp}>Start writing</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="border-slate-600 text-slate-200">
                            <Link to={RouteIndex}>Explore the library</Link>
                        </Button>
                    </div>
                </section>

                <section className="mt-16 grid gap-6 md:grid-cols-3">
                    {[{
                        title: 'Curate your space',
                        description: 'Organise posts with rich categories, edit slugs instantly, and keep your library effortless to browse.'
                    }, {
                        title: 'Collaborate with ease',
                        description: 'Invite teammates, manage comments, and follow voices that matter without losing context.'
                    }, {
                        title: 'Grow your readership',
                        description: 'Audience analytics, smart recommendations, and slick sharing links help your stories travel farther.'
                    }].map((feature) => (
                        <article key={feature.title} className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6">
                            <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                            <p className="mt-3 text-sm text-slate-300">{feature.description}</p>
                        </article>
                    ))}
                </section>
            </main>
        </div>
    )
}

export default Landing
