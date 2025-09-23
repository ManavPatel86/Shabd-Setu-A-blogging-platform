# EPICs

---

## **Epic 1: User Authentication & Profile Management**

**As a user**, I want to sign up, sign in, and manage my profile so that I can securely access my account and present my author identity to readers.

- Reader signup/login/logout  
- Secure password storage  
- Profile page (basic info, bio, picture)

---

## **Epic 2: Blog Content Creation & Management**

**As a blogger**, I want to create, format, save drafts, schedule, edit, and delete posts (including image uploads) so that I can publish professional content and manage my writing workflow.

- Blog creation with editor  
- Upload images/media  
- Categories/tags  
- Edit/delete posts  
- Draft saving  
- Blogger dashboard

---

## **Epic 3: Reader Engagement & Content Interaction**

**As a reader**, I want to search, like, comment, follow authors, and bookmark posts so that I can discover, engage with, and keep track of content I care about.

- Blog search  
- Like/unlike  
- Commenting  
- Follow/unfollow authors  
- Bookmark/save posts  
- Personalized feed

---

## **Epic 4: Moderation & Administration**

**As an admin**, I want to review reports, remove abusive content, and manage user accounts so that the platform remains safe and trustworthy.

- Report/flag content  
- Admin review  
- User account management

---

## **Epic 5: AI-Powered Features**

**As a blogger/reader**, I want AI to suggest tags/categories, produce summaries, and recommend relevant posts so that content is easier to create, discover, and consume.

- AI-generated tags & categories  
- AI-generated summaries  
- Personalized AI recommendations  
- Auto-flag inappropriate content

---

## **Epic 6: User Experience & Accessibility**

**As any user**, I want a fast, clean, accessible UI with dark/light mode so that I can comfortably read and write on any device.

- Dark/light mode  
- Smooth navigation  
- Minimal ads, clean UI

---

## **Epic 7: Notifications & Updates**

**As a user**, I want timely notifications for new posts, comments, and admin alerts so that I stay informed about activity relevant to me.

- Reader notifications on new posts  
- Blogger notifications on publishing/engagement  
- Admin alerts for flagged content/system issues

---

## **Epic 8: Security, Performance & Scalability (Cross-Cutting)**

**As a platform owner**, I want secure authentication, safe APIs, performance benchmarks, and a scalable architecture so that the service is reliable under growth and safe from attacks.

- HTTPS, password hashing, secure sessions  
- XSS/CSRF/SQLi prevention  
- Uptime monitoring  
- Scalability improvements





# Conflicts Between EPICs

---

## ⚔️ Conflict: Rich Features vs Performance

**Issue:**  
Adding a rich editor, image uploads, and synchronous AI calls can bloat the frontend and overload the server, causing slow page loads and timeouts.

**Resolution:**

- Load the editor **only when the user opens it**
- Store and serve images from a **cloud service** like S3 or Cloudinary instead of your app server
- Run **AI tasks in the background** so users don’t wait
- **Paginate** list views and add simple **DB indexes** to speed up searches
- **Cache** frequently used data
- Monitor **page load times** and **API response times** to detect and fix slow areas

---

## ⚔️ Conflict: Teamwide Live AI Calls

**Issue:**  
Live AI API calls during development can quickly hit usage quotas or generate high costs, causing:

- Flaky tests
- Blocked developers
- Slowed team velocity

**Resolution:**

- Use **mocked AI response examples** during development and testing
- Allow only **1–2 environments** (e.g., staging/production) to make real API calls
- Use **monitored API keys** with strict quotas
- **Cache** common AI responses
- Set up **cost/usage alerts** to prevent surprise overages

---

## ⚔️ Conflict: Security vs Fast Prototyping

**Issue:**  
Rapid prototyping can introduce serious security risks like:

- Exposing secrets in code
- Unrestricted database access
- Direct third-party API calls from the client

**Resolution:**

- Keep secrets in **`.env` files or GitHub Secrets** — never commit them
- Call external APIs **only from the server**, never the frontend
- Restrict **direct DB access**
- Set up **automated linting or scanning** for secrets in codebase

---

