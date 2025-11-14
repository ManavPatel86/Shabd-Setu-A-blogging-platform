import React, { useState } from "react";
import { Helmet } from "react-helmet";

const FAQItem = ({ q, a, isOpen, onClick }) => (
  <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
    <button
      onClick={onClick}
      className="w-full px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 flex justify-between items-center transition-all"
    >
      <h3 className="text-lg font-semibold text-gray-800 text-left">{q}</h3>
      <span className={`text-2xl text-indigo-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
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
      a: "Use the Report icon on any blog post or email us at support@shabdsetu.example.",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Helmet>
        <title>Help & FAQs - ShabdSetu</title>
      </Helmet>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Help & FAQs</h1>
          <p className="text-lg text-indigo-100">
            Find answers to common questions and learn how to make the most of ShabdSetu.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center">
            <div className="text-3xl mb-2">✍️</div>
            <h3 className="font-semibold text-gray-800">Creating Blogs</h3>
            <p className="text-sm text-gray-600">Learn to write & publish</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center">
            <div className="text-3xl mb-2">👤</div>
            <h3 className="font-semibold text-gray-800">Profile</h3>
            <p className="text-sm text-gray-600">Manage your account</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center">
            <div className="text-3xl mb-2">🔍</div>
            <h3 className="font-semibold text-gray-800">Discovery</h3>
            <p className="text-sm text-gray-600">Find & follow blogs</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow text-center">
            <div className="text-3xl mb-2">⚙️</div>
            <h3 className="font-semibold text-gray-800">Settings</h3>
            <p className="text-sm text-gray-600">Customize experience</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-2">
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
        </div>

        {/* contact/feedback removed */}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-gray-400 py-8 px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm">Last updated: Nov 2025</p>
        <p className="text-xs mt-2">© 2025 ShabdSetu. All rights reserved.</p>
      </div>
    </div>
  );
}