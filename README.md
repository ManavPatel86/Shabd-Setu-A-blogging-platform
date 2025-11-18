# 📝 Shabd Setu - A Blogging Platform (MERN + AI)

Shabd Setu is a modern blogging platform built using the *MERN stack (MongoDB, Express, React, Node.js)*.  
It allows bloggers to create and share content with rich tools, while readers enjoy a personalized, engaging feed.  
We also integrate **AI features (LangChain)** for smarter categorization, summarization, and moderation.

---

## 🚀 Features

### Core
- User authentication (Sign up, Login, Logout, Profile)
- Create, edit, delete, and view blogs
- Rich text editor with image uploads
- Draft saving 
- Categories & tags
- Like, comment, follow, and bookmark blogs
- Personalized feed (Latest / Following)
- Reporting inappropriate content
- Admin tool for content management

### Advanced (AI-Powered)
- Auto-categorization for blogs
- AI-generated blog summaries
- Personalized blog recommendations
- **AI Content Moderation** - Detects abuse, hate speech, violence, spam, misinformation
- **Report System** - Users can report inappropriate content with reasons
- **Admin Dashboard** - Manage reports and monitor content

### User Experience
- Responsive UI with TailwindCSS
- Dark/light mode toggle
- Notifications for new posts & interactions
- Blogger dashboard (analytics)
- Report moderation warnings on flagged content

---

## 🛠️ Tech Stack

- **Frontend:** React + Vite, TailwindCSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas (Mongoose ORM)
- **Authentication:** JWT-based auth, bcrypt password hashing
- **AI Integration:** LangChain + external LLM APIs
- **Other Tools:**  media tool, Redis (caching), GitHub Actions 

---

## 📂 Project Structure

```
project-root/
│
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── redux/          # Redux store and slices
│   │   ├── helpers/        # Utility functions and route names
│   │   ├── assets/         # Images, logos, and static files
│   │   └── main.jsx        # React entry point
│   ├── public/             # Public assets
│   ├── index.html          # HTML template
│   ├── package.json        # Frontend dependencies
│   ├── vite.config.js      # Vite configuration
│   └── .env                # Frontend environment variables
│
├── api/                    # Backend server
│   ├── routes/             # API route definitions
│   ├── controllers/        # Request handlers
│   ├── models/             # Database models
│   ├── middleware/         # Custom middleware
│   ├── config/             # Database and server configuration
│   ├── package.json        # Backend dependencies
│   └── .env                # Backend environment variables
│
└── README.md               # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js 14+
- MongoDB Atlas account
- Google Generative AI (Gemini) API key

### Frontend (Client)
```bash
cd client
npm install
npm run dev
```

### Backend (API)
```bash
cd api
npm install
npm start
```

### Environment Setup

**Backend `.env`**
```bash
MONGODB_CONN=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
PORT=5000
FRONTEND_URL=http://localhost:5173
```

**Frontend `.env.local`**
```bash
VITE_API_URL=http://localhost:5000/api
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 📚 AI Moderation & Reporting System

This project includes a comprehensive **AI-powered content moderation system** with user reporting capabilities.

### Quick Start
1. Set `GEMINI_API_KEY` in backend `.env`
2. Start the backend and frontend
3. Go to any blog and click the **Report button** (flag icon)
4. Admin can manage reports at `/admin/reports`

### Key Features
- ✅ Automatic content moderation on blog/comment creation
- ✅ User reporting with categorized reasons
- ✅ Admin dashboard for report management
- ✅ Moderation warnings displayed on flagged content
- ✅ Detects: abuse, hate speech, violence, spam, misinformation, etc.

### Documentation
- 📖 [MODERATION_SYSTEM.md](./MODERATION_SYSTEM.md) - Complete API & feature docs
- 📖 [MODERATION_INTEGRATION_GUIDE.md](./MODERATION_INTEGRATION_GUIDE.md) - Integration steps
- 📖 [MODERATION_QUICK_START.md](./MODERATION_QUICK_START.md) - Quick reference
- ✅ [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) - Verification checklist

---
