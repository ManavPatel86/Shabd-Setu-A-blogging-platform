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
- AI moderation

### User Experience
- Responsive UI with TailwindCSS
- Dark/light mode toggle
- Notifications for new posts & interactions
- Blogger dashboard (analytics)

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
