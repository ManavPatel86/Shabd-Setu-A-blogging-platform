const blogs = [
  {
    id: "1",
    author: 'Gaurav Patel',
    title: "Exploring the Future of AI in Education",
    subTitle: "AI is revolutionizing education by personalizing learning paths, automating tasks, and creating smarter classrooms. But what does the future look like?",
    description: `<p className="text-lg mb-6">
      Blogging has become one of the most powerful ways to share ideas, build
      communities, and establish authority online. Whether you are writing about
      technology, lifestyle, travel, or personal growth, a well-structured blog
      post can make a lasting impact on your readers.
    </p>
    <p className="mb-6">
      In this article, we’ll explore the essentials of writing an engaging blog,
      including how to structure your content, keep readers hooked, and provide
      real value. Let’s dive in!
    </p>
    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Why Structure Matters</h2>
    <p className="mb-6">
      A blog without structure often feels overwhelming and difficult to read.
      Readers prefer content that flows naturally, with clear divisions between
      ideas. Headings, subheadings, and short paragraphs make the text easier to
      scan, which is crucial since most online readers skim before they commit to
      reading in depth.
    </p>
    <p className="mb-6">
      Think of your blog like a story. It should have a beginning that captures
      attention, a middle that delivers the main content, and an ending that ties
      everything together.
    </p>
    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Writing Engaging Introductions</h2>
    <p className="mb-6">
      The introduction sets the tone for the entire blog. Start with a hook —
      something that sparks curiosity or relates to the reader’s problem. A good
      introduction makes the reader feel like, “Yes, this post is for me.”
    </p>
    <blockquote className="border-l-4 border-blue-500 bg-blue-100 rounded-md pl-4 italic mb-6">
      “The first 100 words of your blog determine whether a reader stays or
      leaves.”
    </blockquote>
    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Adding Depth With Subheadings</h2>
    <p className="mb-6">
      Subheadings not only organize your content but also make it easier to skim.
      They act like road signs that guide the reader through your post. For
      example:
    </p>
    <ul className="list-disc list-inside mb-6">
      <li>Use H2 for main sections</li>
      <li>Use H3 for supporting points</li>
      <li>Keep headings clear and descriptive</li>
    </ul>
    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Visuals, Quotes, and Examples</h2>
    <p className="mb-6">
      Large blocks of text can be intimidating. Breaking them up with images,
      quotes, or examples makes your blog more reader-friendly. Visuals help
      reinforce your ideas, while quotes provide credibility and variety.
    </p>
    <pre className="bg-gray-100 p-4 rounded-lg mb-6 no-scrollbar overflow-x-auto">
      <code>\ return "Hello, " + name + "!";</code>
    </pre>
    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Crafting a Strong Conclusion</h2>
    <p className="mb-6">
      A blog without a conclusion feels unfinished. Use the ending to summarize
      your main points, reinforce the key takeaway, and invite readers to engage —
      whether by leaving a comment, sharing the post, or taking action.
    </p>
    <p className="mb-6 font-semibold">
      Remember: A great blog doesn’t just share information; it leaves the reader
      with a clear sense of value.
    </p>`,
    filter: "Technology",
    createdAt: "Sep 7, 2025",
    updatedAt: "Sep 7, 2025",
    isPublished: true,
    profile: "https://i.pinimg.com/736x/78/be/4d/78be4dda1c395eb09e9b493112ab4a44.jpg",
    thumbnail: "https://i.pinimg.com/1200x/c1/7a/92/c17a92cfcd8108005d42aa63d825bc16.jpg"
  },
  {
  id: "2",
  author: "Hannah Thompson",
  title: "10 Best Travel Destinations for 2025",
  subTitle: "From hidden gems to popular cities, here’s our curated list of must-visit travel destinations that will inspire your next adventure.",
  description: `<p className="text-lg mb-6">
      Blogging has become one of the most powerful ways to share ideas, build
      communities, and establish authority online. Whether you are writing about
      technology, lifestyle, travel, or personal growth, a well-structured blog
      post can make a lasting impact on your readers.
    </p>

    <p className="mb-6">
      In this article, we’ll explore the essentials of writing an engaging blog,
      including how to structure your content, keep readers hooked, and provide
      real value. Let’s dive in!
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Why Structure Matters</h2>
    <p className="mb-6">
      A blog without structure often feels overwhelming and difficult to read.
      Readers prefer content that flows naturally, with clear divisions between
      ideas. Headings, subheadings, and short paragraphs make the text easier to
      scan, which is crucial since most online readers skim before they commit to
      reading in depth.
    </p>

    <p className="mb-6">
      Think of your blog like a story. It should have a beginning that captures
      attention, a middle that delivers the main content, and an ending that ties
      everything together.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Writing Engaging Introductions</h2>
    <p className="mb-6">
      The introduction sets the tone for the entire blog. Start with a hook —
      something that sparks curiosity or relates to the reader’s problem. A good
      introduction makes the reader feel like, “Yes, this post is for me.”
    </p>

    <blockquote className="border-l-4 border-blue-500 bg-blue-100 rounded-md pl-4 italic mb-6">
      “The first 100 words of your blog determine whether a reader stays or
      leaves.”
    </blockquote>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Adding Depth With Subheadings</h2>
    <p className="mb-6">
      Subheadings not only organize your content but also make it easier to skim.
      They act like road signs that guide the reader through your post. For
      example:
    </p>
    <ul className="list-disc list-inside mb-6">
      <li>Use H2 for main sections</li>
      <li>Use H3 for supporting points</li>
      <li>Keep headings clear and descriptive</li>
    </ul>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Visuals, Quotes, and Examples</h2>
    <p className="mb-6">
      Large blocks of text can be intimidating. Breaking them up with images,
      quotes, or examples makes your blog more reader-friendly. Visuals help
      reinforce your ideas, while quotes provide credibility and variety.
    </p>

    <pre className="bg-gray-100 p-4 rounded-lg mb-6 no-scrollbar overflow-x-auto">
      <code>\ return "Hello, " + name + "!";</code>
    </pre>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Crafting a Strong Conclusion</h2>
    <p className="mb-6">
      A blog without a conclusion feels unfinished. Use the ending to summarize
      your main points, reinforce the key takeaway, and invite readers to engage —
      whether by leaving a comment, sharing the post, or taking action.
    </p>

    <p className="mb-6 font-semibold">
      Remember: A great blog doesn’t just share information; it leaves the reader
      with a clear sense of value.
    </p>`,
  filter: "Travel",
  createdAt: "Sep 5, 2025",
  updatedAt: "Sep 5, 2025",
  isPublished: true,
  profile: "https://i.pinimg.com/736x/5f/d2/55/5fd255b2cc801856ca609f0548eb4d08.jpg",
  thumbnail: "https://i.pinimg.com/736x/98/bb/07/98bb0708dab4b343154d77cce3b3d3e9.jpg"
},
{
  id: "3",
  author: "Daniel Lee",
  title: "How to Start a Successful Online Business",
  subTitle: "Practical steps, tools, and strategies to build and scale an online business in 2025.",
  description: `<p className="text-lg mb-6">
      Starting an online business has never been more accessible, but success
      requires planning, execution, and adaptability. Whether you’re launching an
      e-commerce store, digital service, or content platform, the fundamentals
      remain the same.
    </p>

    <p className="mb-6">
      In this guide, we’ll explore the key steps to starting and growing a
      profitable online business — from ideation to execution.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Identify a Profitable Niche</h2>
    <p className="mb-6">
      The first step is choosing the right niche. A profitable niche balances
      passion, demand, and monetization potential. Research your market, study
      competitors, and validate demand before committing.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Build Your Online Presence</h2>
    <p className="mb-6">
      A website is your digital storefront. Invest in a clean, fast, and
      mobile-friendly website. Use platforms like Shopify, WordPress, or custom
      solutions depending on your business model.
    </p>

    <blockquote className="border-l-4 border-green-500 bg-green-100 rounded-md pl-4 italic mb-6">
      “Your website is often the first impression — make it count.”
    </blockquote>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Create Valuable Content</h2>
    <p className="mb-6">
      Content marketing is one of the most effective ways to attract and retain
      customers. Blog posts, videos, podcasts, and social media content help build
      trust and authority.
    </p>

    <ul className="list-disc list-inside mb-6">
      <li>Provide solutions to your audience’s problems</li>
      <li>Use SEO to increase visibility</li>
      <li>Repurpose content across platforms</li>
    </ul>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Set Up Payment & Sales Systems</h2>
    <p className="mb-6">
      Make it easy for customers to pay. Offer multiple payment options, secure
      checkout, and clear refund policies. Automation tools can streamline order
      management and delivery.
    </p>

    <pre className="bg-gray-100 p-4 rounded-lg mb-6 no-scrollbar overflow-x-auto">
      <code>{\`// Example of simple pricing logic
function calculateTotal(price, tax) {
  return price + (price * tax);
}\`}</code>
    </pre>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Market & Scale</h2>
    <p className="mb-6">
      Use a mix of organic and paid strategies: social media, SEO, email
      marketing, and ads. Scaling requires analyzing data, optimizing campaigns,
      and reinvesting profits wisely.
    </p>

    <p className="mb-6 font-semibold">
      Remember: Online business success is not overnight. It’s about consistent
      effort, testing, and continuous improvement.
    </p>`,
  filter: "Business",
  createdAt: "Sep 6, 2025",
  updatedAt: "Sep 6, 2025",
  isPublished: true,
  profile: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=64&h=64&facepad=2",
  thumbnail: "https://i.pinimg.com/1200x/1c/3a/36/1c3a36ecb26e7bba5e3a439535138c94.jpg"
},
{
  id: "4",
  author: "Olivia Brown",
  title: "How to Start a Successful Online Business",
  subTitle: "Practical steps, tools, and strategies to build and scale an online business in 2025.",
  description: `<p className="text-lg mb-6">
      Starting an online business has never been more accessible, but success
      requires planning, execution, and adaptability. Whether you’re launching an
      e-commerce store, digital service, or content platform, the fundamentals
      remain the same.
    </p>

    <p className="mb-6">
      In this guide, we’ll explore the key steps to starting and growing a
      profitable online business — from ideation to execution.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Identify a Profitable Niche</h2>
    <p className="mb-6">
      The first step is choosing the right niche. A profitable niche balances
      passion, demand, and monetization potential. Research your market, study
      competitors, and validate demand before committing.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Build Your Online Presence</h2>
    <p className="mb-6">
      A website is your digital storefront. Invest in a clean, fast, and
      mobile-friendly website. Use platforms like Shopify, WordPress, or custom
      solutions depending on your business model.
    </p>

    <blockquote className="border-l-4 border-green-500 bg-green-100 rounded-md pl-4 italic mb-6">
      “Your website is often the first impression — make it count.”
    </blockquote>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Create Valuable Content</h2>
    <p className="mb-6">
      Content marketing is one of the most effective ways to attract and retain
      customers. Blog posts, videos, podcasts, and social media content help build
      trust and authority.
    </p>

    <ul className="list-disc list-inside mb-6">
      <li>Provide solutions to your audience’s problems</li>
      <li>Use SEO to increase visibility</li>
      <li>Repurpose content across platforms</li>
    </ul>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Set Up Payment & Sales Systems</h2>
    <p className="mb-6">
      Make it easy for customers to pay. Offer multiple payment options, secure
      checkout, and clear refund policies. Automation tools can streamline order
      management and delivery.
    </p>

    <pre className="bg-gray-100 p-4 rounded-lg mb-6 no-scrollbar overflow-x-auto">
      <code>{\`// Example of simple pricing logic
function calculateTotal(price, tax) {
  return price + (price * tax);
}\`}</code>
    </pre>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Market & Scale</h2>
    <p className="mb-6">
      Use a mix of organic and paid strategies: social media, SEO, email
      marketing, and ads. Scaling requires analyzing data, optimizing campaigns,
      and reinvesting profits wisely.
    </p>

    <p className="mb-6 font-semibold">
      Remember: Online business success is not overnight. It’s about consistent
      effort, testing, and continuous improvement.
    </p>`,
  filter: "Business",
  createdAt: "Sep 6, 2025",
  updatedAt: "Sep 6, 2025",
  isPublished: true,
  profile: "https://i.pinimg.com/736x/c8/4f/21/c84f2152c7882c79dc344bd7777c2965.jpg",
  thumbnail: "https://i.pinimg.com/736x/53/5f/e5/535fe511d50b53c81d2f1480ee41b0aa.jpg"
},
{
  id: "5",
  author: "James Williams",
  title: "Top 10 Healthy Lifestyle Habits",
  subTitle: "Simple daily habits to improve your health, boost energy, and live longer.",
  description: `<p className="text-lg mb-6">
      A healthy lifestyle is not about drastic changes — it’s about small, daily
      habits that add up over time. These habits improve not just physical health,
      but also mental and emotional well-being.
    </p>

    <p className="mb-6">
      Let’s look at the top 10 lifestyle habits that can transform your overall
      quality of life.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Balanced Diet</h2>
    <p className="mb-6">
      Eat whole foods, minimize processed items, and maintain a balance of carbs,
      proteins, and fats. Hydration is equally important.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Regular Exercise</h2>
    <p className="mb-6">
      Aim for at least 30 minutes of physical activity daily. Mix cardio, strength
      training, and flexibility exercises for best results.
    </p>

    <blockquote className="border-l-4 border-red-500 bg-red-100 rounded-md pl-4 italic mb-6">
      “Consistency beats intensity when it comes to fitness.”
    </blockquote>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Quality Sleep</h2>
    <p className="mb-6">
      Sleep is the body’s repair system. Aim for 7–9 hours of quality sleep each
      night. Create a relaxing bedtime routine to improve rest.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Stress Management</h2>
    <p className="mb-6">
      Chronic stress harms both body and mind. Practice meditation, deep breathing,
      or hobbies to stay grounded.
    </p>

    <ul className="list-disc list-inside mb-6">
      <li>Meditation & yoga</li>
      <li>Journaling</li>
      <li>Nature walks</li>
    </ul>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Avoid Harmful Substances</h2>
    <p className="mb-6">
      Limit alcohol, quit smoking, and reduce caffeine intake. Your body and mind
      will thank you in the long run.
    </p>

    <pre className="bg-gray-100 p-4 rounded-lg mb-6 no-scrollbar overflow-x-auto">
      <code>{\`// Example: Daily water intake calculator
function waterIntake(weightKg) {
  return weightKg * 0.033; // liters per day
}\`}</code>
    </pre>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Build Strong Relationships</h2>
    <p className="mb-6">
      Healthy social connections improve emotional well-being and even extend
      lifespan. Nurture positive relationships and spend time with loved ones.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Continuous Learning</h2>
    <p className="mb-6">
      Keeping the mind active through reading, learning new skills, or pursuing
      hobbies contributes to long-term brain health.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Practice Gratitude</h2>
    <p className="mb-6">
      Gratitude shifts focus from what’s lacking to what’s abundant. Keep a
      gratitude journal and appreciate small joys.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Limit Screen Time</h2>
    <p className="mb-6">
      Excessive screen time affects sleep, posture, and focus. Use apps to monitor
      digital usage and take frequent breaks.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Regular Health Checkups</h2>
    <p className="mb-6">
      Prevention is better than cure. Regular checkups can detect health issues
      early, making them easier to treat.
    </p>

    <p className="mb-6 font-semibold">
      Building healthy habits is a journey. Start small, stay consistent, and
      results will follow.
    </p>`,
  filter: "Health",
  createdAt: "Sep 8, 2025",
  updatedAt: "Sep 8, 2025",
  isPublished: true,
  profile: "https://i.pinimg.com/736x/e6/40/c3/e640c3d3bf50a0c8be42b7ea1c443d1b.jpg",
  thumbnail: "https://i.pinimg.com/736x/42/d9/f5/42d9f55012b192fdd413f8ff30953cbc.jpg"
},
{
  id: "6",
  author: "Emily Carter",
  title: "Beginner’s Guide to Investing in 2025",
  subTitle: "Smart investment strategies for beginners to grow wealth and achieve financial freedom.",
  description: `<p className="text-lg mb-6">
      Investing can seem intimidating at first, but with the right mindset and
      strategy, anyone can build wealth over time. The key is starting early,
      staying consistent, and avoiding emotional decisions.
    </p>

    <p className="mb-6">
      This guide covers the basics every beginner should know before making their
      first investment.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Understand the Basics</h2>
    <p className="mb-6">
      Investing is putting money to work so it grows over time. Common vehicles
      include stocks, bonds, mutual funds, ETFs, and real estate.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Set Clear Goals</h2>
    <p className="mb-6">
      Define why you’re investing: retirement, a house, education, or passive
      income. Goals determine your risk tolerance and strategy.
    </p>

    <blockquote className="border-l-4 border-yellow-500 bg-yellow-100 rounded-md pl-4 italic mb-6">
      “A goal without a plan is just a wish.”
    </blockquote>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Build an Emergency Fund</h2>
    <p className="mb-6">
      Before investing, save 3–6 months of living expenses. This safety net
      prevents you from selling investments in an emergency.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Diversify Your Portfolio</h2>
    <p className="mb-6">
      Don’t put all your money in one asset. Spread investments across sectors,
      geographies, and asset classes to reduce risk.
    </p>

    <ul className="list-disc list-inside mb-6">
      <li>Stocks for growth</li>
      <li>Bonds for stability</li>
      <li>Real estate for long-term wealth</li>
    </ul>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Avoid Common Mistakes</h2>
    <p className="mb-6">
      Beginners often panic during downturns or chase quick profits. Stay calm,
      focus on long-term growth, and avoid timing the market.
    </p>

    <pre className="bg-gray-100 p-4 rounded-lg mb-6 no-scrollbar overflow-x-auto">
      <code>{\`// Example: Compound interest calculation
function compoundInterest(principal, rate, years) {
  return principal * Math.pow((1 + rate), years);
}\`}</code>
    </pre>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Keep Learning</h2>
    <p className="mb-6">
      The investment world is constantly changing. Stay informed through books,
      podcasts, courses, and financial news.
    </p>

    <p className="mb-6 font-semibold">
      Investing is not about getting rich quickly; it’s about building wealth
      steadily and securely over time.
    </p>`,
  filter: "Finance",
  createdAt: "Sep 9, 2025",
  updatedAt: "Sep 9, 2025",
  isPublished: true,
  profile: "https://i.pinimg.com/1200x/4d/50/51/4d505168d01cb6e189499baf18218b6f.jpg",
  thumbnail: "https://i.pinimg.com/736x/c0/c4/e6/c0c4e66da995874030ff26fa51b59460.jpg"
},
{
  id: "7",
  author: "David Johnson",
  title: "Mindfulness Practices for Daily Life",
  subTitle: "Simple and effective mindfulness techniques to reduce stress and improve well-being.",
  description: `<p className="text-lg mb-6">
      In today’s fast-paced world, mindfulness has become more important than
      ever. It helps us stay present, reduce stress, and improve our overall
      sense of happiness.
    </p>

    <p className="mb-6">
      The good news? You don’t need hours of meditation to practice mindfulness.
      Just a few minutes a day can make a noticeable difference.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Mindful Breathing</h2>
    <p className="mb-6">
      Take a few minutes to focus only on your breath. Notice the rhythm as you
      inhale and exhale. This simple practice can instantly calm your mind.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Gratitude Journaling</h2>
    <p className="mb-6">
      Write down three things you’re grateful for each day. This shifts your
      focus from what’s missing to what’s abundant in your life.
    </p>

    <blockquote className="border-l-4 border-green-500 bg-green-100 rounded-md pl-4 italic mb-6">
      “Gratitude turns what we have into enough.”
    </blockquote>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Mindful Eating</h2>
    <p className="mb-6">
      Slow down and savor your meals. Notice the flavors, textures, and aromas.
      Mindful eating helps you connect with your food and prevents overeating.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Walking Meditation</h2>
    <p className="mb-6">
      Instead of rushing, walk slowly and notice each step. Pay attention to the
      ground beneath your feet, your breathing, and the environment around you.
    </p>

    <ul className="list-disc list-inside mb-6">
      <li>Start with 5 minutes daily</li>
      <li>Gradually extend as it feels natural</li>
      <li>Combine with breathing for deeper impact</li>
    </ul>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Digital Detox</h2>
    <p className="mb-6">
      Take breaks from screens and social media. Constant notifications can
      overwhelm your mind — disconnect to reconnect with yourself.
    </p>

    <pre className="bg-gray-100 p-4 rounded-lg mb-6 no-scrollbar overflow-x-auto">
      <code>{\`// Example: Simple daily reminder
function remindMindfulness() {
  return "Pause. Breathe. Be present.";
}\`}</code>
    </pre>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Ending the Day with Reflection</h2>
    <p className="mb-6">
      Before sleeping, reflect on your day. Ask yourself: “What went well? What
      can I improve tomorrow?” This keeps your mind at peace.
    </p>

    <p className="mb-6 font-semibold">
      Mindfulness is not about perfection — it’s about being present in the
      moment, one breath at a time.
    </p>`,
  filter: "Lifestyle",
  createdAt: "Aug 22, 2025",
  updatedAt: "Aug 22, 2025",
  isPublished: true,
  profile: "https://i.pinimg.com/736x/e6/40/c3/e640c3d3bf50a0c8be42b7ea1c443d1b.jpg",
  thumbnail: "https://i.pinimg.com/736x/e6/40/c3/e640c3d3bf50a0c8be42b7ea1c443d1b.jpg"
},
{
  id: "8",
  author: "Sophia Rodriguez",
  title: "A Beginner’s Guide to Investing",
  subTitle: "Learn the basics of investing and how to grow wealth step by step.",
  description: `<p className="text-lg mb-6">
      Investing may seem complicated, but with the right knowledge, anyone can
      start building wealth. The earlier you begin, the greater the rewards over
      time thanks to compound interest.
    </p>

    <p className="mb-6">
      This beginner’s guide will help you understand the essentials of investing
      so you can make confident decisions about your money.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Start with Clear Goals</h2>
    <p className="mb-6">
      Define why you want to invest. Whether it’s retirement, education, buying a
      home, or simply financial independence, clear goals shape your strategy.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Understand Risk & Reward</h2>
    <p className="mb-6">
      Higher returns often come with higher risks. Learn your risk tolerance so
      you don’t panic when markets fluctuate.
    </p>

    <blockquote className="border-l-4 border-blue-500 bg-blue-100 rounded-md pl-4 italic mb-6">
      “Don’t put all your eggs in one basket — diversification is key.”
    </blockquote>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Choose the Right Investment Types</h2>
    <p className="mb-6">
      Beginners should focus on simple and proven investments like index funds,
      ETFs, or blue-chip stocks. These are easier to understand and carry lower
      risks compared to speculative options.
    </p>

    <ul className="list-disc list-inside mb-6">
      <li>Stocks for long-term growth</li>
      <li>Bonds for stability</li>
      <li>Mutual funds/ETFs for diversification</li>
    </ul>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Build Good Habits</h2>
    <p className="mb-6">
      Set up automatic investments, track your spending, and avoid emotional
      decisions. The best investors are patient and disciplined.
    </p>

    <pre className="bg-gray-100 p-4 rounded-lg mb-6 no-scrollbar overflow-x-auto">
      <code>{\`// Example: Simple monthly investment calculation
function investMonthly(amount, months) {
  return amount * months;
}\`}</code>
    </pre>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Keep Learning</h2>
    <p className="mb-6">
      Read books, follow financial experts, and stay updated with market trends.
      The more you learn, the better decisions you’ll make.
    </p>

    <p className="mb-6 font-semibold">
      Investing is not about timing the market, but about time in the market.
      Start now, stay consistent, and let your money grow.
    </p>`,
  filter: "Finance",
  createdAt: "Aug 20, 2025",
  updatedAt: "Aug 20, 2025",
  isPublished: true,
  profile: "https://i.pinimg.com/736x/c8/4f/21/c84f2152c7882c79dc344bd7777c2965.jpg",
  thumbnail: "https://i.pinimg.com/1200x/c8/2d/a1/c82da1f5a89223d9d077cbb9eba3638a.jpg"
},
{
  id: "9",
  author: "Laura Kim",
  title: "How to Stay Motivated While Learning to Code",
  subTitle: "Overcome challenges, stay consistent, and enjoy the journey of coding.",
  description: `<p className="text-lg mb-6">
      Learning to code is exciting, but it can also feel overwhelming. Many
      beginners struggle with motivation when concepts get tough or progress
      feels slow.
    </p>

    <p className="mb-6">
      The good news is, with the right mindset and strategies, you can stay on
      track and actually enjoy the process of becoming a programmer.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Set Realistic Goals</h2>
    <p className="mb-6">
      Break big learning goals into smaller, achievable milestones. Instead of
      “mastering Python,” start with “write a basic calculator app.”
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Practice Consistently</h2>
    <p className="mb-6">
      Consistency beats intensity. Coding 30 minutes every day is more effective
      than cramming for 5 hours once a week.
    </p>

    <blockquote className="border-l-4 border-green-500 bg-green-100 rounded-md pl-4 italic mb-6">
      “Motivation will get you started, but discipline keeps you going.”
    </blockquote>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Build Real Projects</h2>
    <p className="mb-6">
      Apply what you learn by creating small projects. A to-do app, a portfolio
      website, or even automating simple tasks can make coding feel fun and
      rewarding.
    </p>

    <ul className="list-disc list-inside mb-6">
      <li>Start with beginner-friendly projects</li>
      <li>Gradually increase complexity</li>
      <li>Share your projects online for feedback</li>
    </ul>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Join a Community</h2>
    <p className="mb-6">
      Being part of coding communities like GitHub, Reddit, or Discord groups
      helps you stay motivated, get feedback, and learn from others.
    </p>

    <pre className="bg-gray-100 p-4 rounded-lg mb-6 no-scrollbar overflow-x-auto">
      <code>{\`// Example: Daily practice tracker
let daysPracticed = 0;
function practiceCoding() {
  daysPracticed++;
  console.log(\`You’ve coded for \${daysPracticed} days in a row!\`);
}\`}</code>
    </pre>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Embrace the Struggle</h2>
    <p className="mb-6">
      Coding is problem-solving. Bugs and errors are part of the process, not
      failures. Each challenge you overcome makes you a better developer.
    </p>

    <p className="mb-6 font-semibold">
      Stay patient, celebrate small wins, and remember — every expert was once a
      beginner just like you.
    </p>`,
  filter: "Coding",
  createdAt: "Aug 22, 2025",
  updatedAt: "Aug 22, 2025",
  isPublished: true,
  profile: "https://i.pinimg.com/736x/1c/da/7c/1cda7c8d1feb83dae0a8effbe80ccb52.jpg",
  thumbnail: "https://i.pinimg.com/736x/e4/64/ab/e464abc2f7762f59ad66e86f6bac53b5.jpg"
},
{
  id: "10",
  author: "Mark Chen",
  title: "The Future of Artificial Intelligence",
  subTitle: "How AI is shaping industries, daily life, and the future of humanity.",
  description: `<p className="text-lg mb-6">
      Artificial Intelligence (AI) is no longer just a concept in sci-fi movies —
      it’s transforming how we live, work, and interact with technology. From
      self-driving cars to advanced chatbots, AI is everywhere.
    </p>

    <p className="mb-6">
      As AI continues to evolve, it brings both incredible opportunities and
      serious challenges that society must address.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. AI in Daily Life</h2>
    <p className="mb-6">
      Virtual assistants, recommendation systems, and smart home devices are
      powered by AI, making everyday tasks easier and more personalized.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. AI in Business</h2>
    <p className="mb-6">
      Industries like healthcare, finance, and retail are adopting AI to improve
      efficiency, reduce costs, and provide better customer experiences.
    </p>

    <ul className="list-disc list-inside mb-6">
      <li>AI in healthcare: faster diagnoses, drug discovery</li>
      <li>AI in finance: fraud detection, automated trading</li>
      <li>AI in retail: personalized shopping experiences</li>
    </ul>

    <blockquote className="border-l-4 border-purple-500 bg-purple-100 rounded-md pl-4 italic mb-6">
      “AI will not replace humans, but humans using AI will replace those who don’t.”
    </blockquote>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. The Ethical Concerns</h2>
    <p className="mb-6">
      With great power comes great responsibility. AI raises concerns about job
      displacement, data privacy, and even bias in decision-making algorithms.
    </p>

    <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. The Future Outlook</h2>
    <p className="mb-6">
      Experts predict AI will continue to advance in areas like natural language
      processing, robotics, and creative fields. The key will be balancing
      innovation with ethical safeguards.
    </p>

    <pre className="bg-gray-100 p-4 rounded-lg mb-6 no-scrollbar overflow-x-auto">
      <code>{\`// Example: Simple AI-like function
function recommendMovie(userPreference) {
  const movies = ["Inception", "The Matrix", "Interstellar"];
  return movies.find(movie => movie.includes(userPreference)) || "No match found";
}\`}</code>
    </pre>

    <p className="mb-6 font-semibold">
      The future of AI depends on how we develop, regulate, and use it. If guided
      responsibly, AI has the potential to improve lives worldwide.
    </p>`,
  filter: "Technology",
  createdAt: "Aug 25, 2025",
  updatedAt: "Aug 25, 2025",
  isPublished: true,
  profile: "https://i.pinimg.com/736x/5f/d2/55/5fd255b2cc801856ca609f0548eb4d08.jpg",
  thumbnail: "https://i.pinimg.com/736x/bf/df/34/bfdf347941e0c16abe5a72fdbdd46075.jpg"
}

 
];

export default blogs;
