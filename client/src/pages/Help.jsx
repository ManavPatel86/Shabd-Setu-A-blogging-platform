import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import {
  Sparkles,
  BookOpen,
  ShieldCheck,
  Mail,
} from "lucide-react";

const FAQItem = ({ q, a, isOpen, onClick }) => (
  <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
    <button
      onClick={onClick}
      className="w-full px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 flex justify-between items-center transition-all"
    >
      <h3 className="text-lg font-semibold text-gray-800 text-left">{q}</h3>
      <span
        className={`text-2xl text-indigo-600 transition-transform ${
          isOpen ? "rotate-180" : ""
        }`}
      >
        ▼
      </span>
    </button>
    {isOpen && (
      <div className="px-6 py-4 bg-white border-t border-gray-200">
        <p className="text-gray-700 leading-relaxed">{a}</p>
      </div>
    )}
  </div>
);

export default function Help() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "How do I create a blog?",
      a: "Click 'Write Blog' in the top-right corner, compose your content, choose a category, and hit Publish. Drafts are auto-saved if you're logged in.",
    },
    {
      q: "How can I edit or delete a blog?",
      a: "Go to 'My Blogs' from the sidebar, open the blog, and choose Edit or Delete.",
    },
    {
      q: "How do I change my profile details?",
      a: "Click your profile avatar → Profile → Edit Profile.",
    },
    {
      q: "How can I report inappropriate content?",
      a: "Use the Report icon on any blog post or email us at shabd.setu.blogsite@gmail.com.",
    },
    {
      q: "What file formats can I use for blog images?",
      a: "We support JPG, PNG, GIF, and WebP formats. Maximum file size is 5MB per image.",
    },
    {
      q: "How do I search for blogs?",
      a: "Use the search bar at the top of the homepage. You can search by keywords, author names, or blog titles.",
    },
    {
      q: "Can I schedule my blog for later publication?",
      a: "Yes, when writing a blog, click on 'Schedule' and choose your desired publication date and time.",
    },
    {
      q: "How do I follow other bloggers?",
      a: "Visit any blogger's profile and click the 'Follow' button. You'll see their posts in your feed.",
    },
    {
      q: "What should I do if I forget my password?",
      a: "Click 'Forgot Password' on the login page, enter your email, and follow the reset instructions sent to your inbox.",
    },
    {
      q: "Can I export my blogs?",
      a: "Yes, go to 'My Blogs' → select a blog → click the three dots menu → 'Export' to download as PDF or Word document.",
    },
    {
      q: "How do I add tags to my blog posts?",
      a: "While writing or editing a blog, scroll to the 'Tags' section and add relevant keywords separated by commas to improve discoverability.",
    },
    {
      q: "Can I make my blog private?",
      a: "Yes, in the blog settings, toggle 'Private' to make it visible only to you. You can change this anytime.",
    },
    {
      q: "How do I comment on other blogs?",
      a: "Scroll to the comments section at the bottom of any blog post and type your comment. You must be logged in to comment.",
    },
    {
      q: "What is the character limit for blog titles?",
      a: "Blog titles can be up to 200 characters long. Keep titles concise and descriptive for better readability.",
    },
    {
      q: "How can I see my blog statistics?",
      a: "Go to 'My Blogs' and click on any blog to view detailed analytics including views, likes, and comments.",
    },
  ];

  const supportChannels = useMemo(
    () => [
      {
        label: "Email support",
        detail: "Drop us a note and we will respond within 24 hours.",
        icon: <Mail className="h-5 w-5" />,
        action: "Send email",
        href: "mailto:shabd.setu.blogsite@gmail.com",
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Help & FAQs - ShabdSetu</title>
      </Helmet>

      <div className="max-w-8xl mx-auto px-4 sm:px-8 lg:px-12 py-10 space-y-10">
        <section className="relative overflow-hidden rounded-[40px] bg-[#6C5CE7] text-white px-6 sm:px-10 py-12 shadow-[0_35px_90px_-45px_rgba(15,23,42,0.9)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-12 w-56 h-56 bg-purple-300/40 rounded-full blur-3xl translate-y-1/2" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4 max-w-3xl">
              <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.4em] text-white/70">
                <Sparkles className="h-4 w-4" />
                Help center
              </p>
              <h1 className="text-3xl sm:text-4xl font-black leading-tight">
                How can we help you today?
              </h1>
              <p className="text-base text-white/85">
                Explore quick guides, browse popular questions, or reach out to our support crew directly from here.
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-white/80">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 backdrop-blur">
                  <BookOpen className="h-4 w-4" />
                  100+ articles
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 backdrop-blur">
                  <ShieldCheck className="h-4 w-4" />
                  24/7 moderation
                </span>
              </div>
            </div>
            <div className="rounded-4xl border border-white/30 bg-white/10 px-6 py-6 shadow-[0_25px_60px_-45px_rgba(15,23,42,0.8)]">
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/70">
                Need priority help?
              </p>
              <p className="text-4xl font-black text-white">
                shabd.setu.blogsite@gmail.com
              </p>
              <p className="text-xs text-white/65 mt-2">
                Average response time: under 4 hours.
              </p>
              <a
                href="mailto:shabd.setu.blogsite@gmail.com"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/80 backdrop-blur transition-colors hover:border-white/60 hover:text-white"
              >
                Contact support
              </a>
            </div>
          </div>
        </section>

        <section className="rounded-4xl border border-slate-100 bg-white/95 px-6 py-8 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.7)]">
          <div className="flex flex-col gap-3">
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">
              FAQs
            </p>
            <h2 className="text-2xl font-bold text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-500">
              We collected the answers to the requests we encounter most.
            </p>
          </div>
          <div className="mt-8 space-y-2">
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                q={faq.q}
                a={faq.a}
                isOpen={openIndex === i}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {supportChannels.map((channel) => (
            <div
              key={channel.label}
              className="rounded-3xl border border-slate-100 bg-white/95 p-6 shadow-[0_25px_70px_-55px_rgba(15,23,42,0.7)] flex flex-col gap-3"
            >
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                {channel.icon}
                {channel.label}
              </span>
              <p className="text-base text-slate-900 font-semibold">
                {channel.detail}
              </p>
              <a
                href={channel.href}
                className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-700"
              >
                {channel.action}
              </a>
            </div>
          ))}
        </section>

        <section className="rounded-4xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center text-slate-600">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">
            Still stuck?
          </p>
          <p className="text-2xl font-semibold text-slate-900 mt-2">
            Tell us what to improve next.
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Share feedback directly from your dashboard or email us anytime.
          </p>
        </section>
      </div>

      <footer className="bg-slate-900 text-slate-400 py-8 px-4 text-center">
        <p className="text-sm">Last updated: Nov 2025</p>
        <p className="text-xs mt-2">© 2025 ShabdSetu. All rights reserved.</p>
      </footer>
    </div>
  );
}