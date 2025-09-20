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