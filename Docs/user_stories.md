# USER STORIES

## Readers (Content Consumers):
### CARD1:
    FOC
    - As a reader, I want to create my account so that I can track my activities and personalize my experience.
    
    BOC
    SUCCESS
    - Reader can sign up using email/password.
    - Account is created and saved in the database.
    - Reader can log in immediately after registration.
    - System shows a confirmation message/email.

    FAILURE
    - Signup form fails to submit or shows errors incorrectly.
    - Account is not saved or duplicated.
    - Reader cannot log in after signing up.
    - No confirmation or verification is sent.

### CARD2:

    FOC
    - As a reader, I want to search blogs by keyword, tags, categories, or authors so that I can find content quickly.

    BOC
    SUCCESS
    - Search returns relevant results based on keyword, tag, category, or author.
    - Search results load within 2–3 seconds.
    - Users can filter or sort results by relevance or date.

    FAILURE
    - Search returns no results for valid queries.
    - Irrelevant results dominate the page.
    - Search results load very slowly (>5 seconds).

### CARD3:

    FOC
    - As a reader, I want to like/unlike posts so that I can engage with authors.

    BOC
    SUCCESS
    - Reader can like or unlike any post.
    - Like/unlike counts update immediately.
    - Each reader can only like a post once.

    FAILURE
    - Like/unlike buttons are unresponsive.
    - Counts do not update correctly.
    - Multiple likes from the same reader are recorded incorrectly.

### CARD4:

    FOC
    - As a reader, I want to comment on posts so that I can share my feedback.

    BOC
    SUCCESS
    - Reader can submit comments successfully.
    - Comments appear immediately under the post with correct username and timestamp.
    - Offensive or spam comments are filtered o tagged.

    FAILURE
    - Comments fail to save.
    - Wrong username or timestamp is displayed.
    - Spam/offensive comments bypass filters.

### CARD5:

    FOC
    - As a reader, I want to follow/unfollow authors so that I can get updates from my favorite content creators.

    BOC
    SUCCESS
    - Reader can follow or unfollow authors easily.
    - Followed authors’ posts appear in the personalized feed.
    - Unfollowed authors’ posts no longer appear in the feed.

    FAILURE
    - Follow/unfollow buttons do not work.
    - Feed does not update based on followed authors.
    - Duplicate follows or unfollows occur.

### CARD6:

    FOC
    - As a reader, I want to bookmark posts so that I can read them later.

    BOC
    SUCCESS
    - Reader can bookmark posts.
    - Bookmarked posts appear in a dedicated “Saved” section.
    - Bookmarks are persistent across sessions.

    FAILURE
    - Bookmarks fail to save.
    - Saved posts disappear after logout.
    - Bookmark button unresponsive.

### CARD7:

    FOC
    - As a reader, I want relevant content to be easy to find so that I don’t waste time scrolling through unrelated posts.

    BOC
    SUCCESS
    - Search and feed algorithms prioritize content that matches the reader’s interests.
    - Categories and tags help filter content efficiently.
    - Reader finds desired content within a few scrolls or clicks.

    FAILURE
    - Reader cannot find content matching their interests.
    - Search returns irrelevant results.
    - Reader gives up due to difficulty navigating content.

### CARD8:

    FOC
    - As a reader, I want a dark mode option so that I can reduce eye strain during night reading.

    BOC
    SUCCESS
    - Reader can toggle between light and dark mode.
    - UI switches immediately when toggled.
    - Preference is saved and applied on future sessions.

    FAILURE
    - Toggle does not work.
    - Some UI elements remain incorrectly styled.
    - Preference resets after logout/login.

    As a reader, I want minimal ads and clutter so that I can focus on reading content.

### CARD9

    FOC
    - As a reader, I want minimal ads and clutter so that I can focus on reading content.


    BOC
    SUCCESS
    - Ads are placed unobtrusively and do not interrupt reading.
    - UI remains clean, with a clear distinction between content and ads.
    - Reader can scroll and read without accidental ad clicks.

    FAILURE
    - Ads block content or interrupt reading flow.
    - UI feels cluttered and overwhelming.
    - Reader cannot distinguish between ads and real content.

### CARD10:

    FOC
    - As a reader, I want a smooth and intuitive UI/UX so that navigating the platform is easy and enjoyable.

    BOC
    SUCCESS
    - Navigation menus are clear and accessible.
    - Pages load quickly and elements behave as expected.
    - Reader can easily switch between posts, categories, and bookmarks.

    FAILURE
    - Navigation is confusing or hidden.
    - Buttons/links are unresponsive or inconsistent.
    - Reader struggles to perform basic actions like reading, searching, or bookmarking.

### CARD11

    FOC
    - As a reader, I want a “Summarize This Post” feature so that I can quickly understand the main points of a blog.

    BOC
    SUCCESS
    - Clicking “Summarize this" generates a short, accurate summary of the blog.
    - Summary highlights key points without losing context.

    FAILURE
    - Summary is incomplete, misleading, or incorrect.
    - Feature does not generate a summary.

### CARD12:

    FOC
    - As a reader, I want a clean, mobile-friendly interface so that I can read comfortably on any device.

    BOC
    SUCCESS
    - UI adapts responsively to all screen sizes (desktop, tablet, mobile).
    - Navigation, buttons, and content are easy to use and read.
    - Text, images, and multimedia scale correctly without distortion.
    - Layout remains consistent across devices and orientations.

    FAILURE
    - UI elements overlap or break on smaller screens.
    - Text/images are too small or clipped.
    - Navigation becomes confusing on mobile.
    - User cannot interact with content comfortably.

### CARD13:

    FOC
    - As a reader, I want my personal data to be secure so that my privacy is protected.

    BOC
    SUCCESS
    - Passwords are stored securely using hashing and salting.
    - Communication between client and server uses HTTPS encryption.
    - User sessions are managed securely (auto-logout on inactivity).
    - Reader can report suspicious activity and change passwords safely.

    FAILURE
    - Passwords are stored in plain text or insecurely.
    - Data is transmitted unencrypted.
    - Sessions can be hijacked or user remains logged in indefinitely.
    - Reader’s account or activity is exposed to unauthorized users.

### CARD14:

    FOC
    - As a reader, I want to receive notifications about new posts or updates in my interests so that I stay up-to-date without constantly checking the platform.

    BOC
    SUCCESS
    - Reader receives timely notifications for new posts in their selected categories or tags.
    - Notifications include the post title, a short snippet, and a link to the post.
    - Reader can mark notifications as read or dismiss them.
    - Notifications are delivered across devices (desktop or mobile).

    FAILURE
    - Notifications are delayed or not delivered.
    - Reader receives irrelevant notifications outside their interests.
    - Notifications are unclear or missing key information.
    - Reader cannot dismiss or manage notifications.

## BLOG WRITERS
### CARD1

    FOC
    - As a blogger, I want to create and format blog posts using a rich text editor so that I can share content easily.

    BOC
    SUCCESS
    - Blogger can open the editor and type content.
    - Text formatting options (bold, italic, headings, lists) work correctly.
    - Blogger can save, preview, or publish posts successfully.

    FAILURE
    - Editor crashes or does not load.
    - Formatting buttons are unresponsive.
    - Posts cannot be saved or published.

### CARD2:

    FOC
    - As a blogger, I want to upload images to my posts so that my blogs are visually engaging.

    BOC
    SUCCESS
    - Blogger can select and upload images successfully.
    - Images display correctly in the post preview and final published blog.
    - Supported formats (PNG, JPG, GIF) work without errors.

    FAILURE
    - Image upload fails or times out.
    - Uploaded images do not appear in the post.
    - Unsupported formats crash the editor or block post publishing.

### CARD3:

    FOC
    - As a blogger, I want to assign categories and tags to my posts so that readers can discover them easily.

    BOC
    SUCCESS
    - Blogger can select or create categories and tags.
    - Tags/categories are saved and displayed with the post.
    - Readers can search and filter posts by these categories/tags.

    FAILURE
    - Categories or tags fail to save.
    - Tags/categories are not displayed on the blog.
    - Search/filter does not work with the assigned tags/categories.

### CARD4:

    FOC
    - As a blogger, I want to save posts as drafts and schedule them for future publishing so that I can manage my content workflow.

    BOC
    SUCCESS
    - Blogger can save posts as draft without publishing.
    - Scheduled posts are published automatically at the specified time.
    - Drafts can be edited multiple times before publishing.

    FAILURE
    - Drafts are not saved or lost.
    - Scheduled posts fail to publish or publish at the wrong time.
    - Draft edits overwrite or disappear unexpectedly.

### CARD5:

    FOC
    - As a blogger, I want to edit or delete my published posts so that I can maintain and update my content.

    BOC
    SUCCESS
    - Blogger can open a published post for editing.
    - Changes are saved and reflected immediately.
    - Blogger can delete posts, which are removed from public view.

    FAILURE
    - Edit option does not work or changes are not saved.
    - Deleted posts remain visible.
    - Publishing history or analytics is inconsistent after edits/deletions.

### CARD6:

    FOC
    - As a blogger, I want to see analytics (views, likes, comments) for my blogs so that I can measure engagement.

    BOC
    SUCCESS
    - Analytics dashboard displays accurate, real-time stats for all posts.
    - Blogger can filter analytics by post or date.
    - Graphs and counts update as users interact with posts.

    FAILURE
    - Analytics data is missing or outdated.
    - Filtering options do not work.
    - Engagement metrics are incorrect or inconsistent.

### CARD7:

    FOC
    - As a blogger, I want AI suggestions for tags/categories and summaries so that I can save time and improve post discoverability.

    BOC
    SUCCESS
    - AI suggests relevant tags/categories for new posts.
    - AI can generate a concise, accurate summary of the post.
    - Blogger can edit or accept AI suggestions.

    FAILURE
    - AI suggestions are irrelevant or missing.
    - Summary is inaccurate or misleading.
    - System errors prevent AI suggestions from being applied.

### CARD8

    FOC
    - As a blogger, I want to see all my posts in one place so that I can easily manage and review them.

    BOC
    SUCCESS
    - Blogger can view a dashboard listing all posts (drafts, published, scheduled).
    - Posts are shown with key details (title, status, date).
    - Sorting and filtering options (by date, title) work properly.

    FAILURE
    - Posts list does not load.
    - Some posts are missing or duplicated.
    - Sorting/filtering does not work or shows incorrect results.

### CARD10:

    FOC
    - As a blogger, I want to see my most liked posts so that I can understand what content resonates most with readers.

    BOC
    SUCCESS
    - Blogger can view a ranked list of posts by likes.
    - Data updates accurately as readers like/unlike posts.
    - Blogger can filter by time range (e.g., weekly, monthly).

    FAILURE
    - Likes count is incorrect or outdated.
    - Most liked posts view does not load.
    - Posts are not ranked properly.

### CARD11:

    FOC
    - As a blogger, I want to schedule my posts so that they get published automatically at a chosen time.

    BOC
    SUCCESS
    - Blogger can select a date/time while creating/editing a post.
    - Scheduled posts are published automatically at the chosen time.
    - Blogger receives a notification when a post is successfully published.

    FAILURE
    - Post is not saved with the scheduled time.
    - Scheduled post fails to publish or publishes late.
    - Wrong timezone/date is applied.


## ADMIN
### CARD1

    FOC
    - As an administrator, I want to manage user accounts so that I can ensure only authentic users have access.

    BOC
    SUCCESS
    - Admin can add, remove, or suspend user accounts.
    - Admin can reset user roles (reader, blogger, moderator).
    - Changes reflect instantly in the system.

    FAILURE
    - Account changes do not save or take effect.
    - Unauthorized users remain active.
    - Wrong roles are assigned.

### CARD2:

    FOC
    - As an admin, I want to review and remove inappropriate content so that the platform remains safe and clean.

    BOC
    SUCCESS
    - Administrator can flag or remove reported posts/comments.
    - System records the reason for removal.
    - Removed content is hidden immediately from public view.

    FAILURE
    - Inappropriate content remains visible.
    - Safe content is removed mistakenly.
    - No audit trail of moderator actions exists.

### CARD3:

    FOC
    - As an admin, I want to handle user reports so that complaints are addressed quickly.

    BOC
    SUCCESS
    - Reports are visible in a dashboard.
    - Admin can review and take action (warn, suspend, remove).
    - Users receive notification about report resolution.

    FAILURE
    - Reports do not appear in the system.
    - Action cannot be taken or does not apply correctly.
    - No feedback goes back to users.

### CARD4:

    FOC
    - As an administrator, I want to monitor system performance so that the platform runs smoothly.

    BOC
    SUCCESS
     - Admin can view system health metrics (uptime, traffic, errors).
    - Alerts are triggered if system load is high.
    - Logs are stored securely for future analysis.

    FAILURE
    - Performance dashboard fails to load.
    - No alerts for downtime/errors.
    - Logs are missing or incomplete.