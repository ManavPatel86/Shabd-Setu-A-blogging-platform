# 🛡️ Moderation System - Quick Reference

## What's Blocked? 🚫

### Profanity & Vulgar Language ✨ [NEW]
motherfucker • mother fucker • damn • shit • fuck • hell • crap • bastard • bitch • asshole • dickhead • whore • slut • cunt • twat • goddamn • horseshit • cocksucker • piss • suck • arse • bollocks • sod • ...and 20+ more

### Violence & Threats 💥
kill • murder • harm • hurt • beat • stab • shoot • rape • assault • bomb • explode • torture • violence • threat • attack • ...and more

### Hate Speech 😡
racist slurs • discriminatory terms • "should die" • "subhuman" • "deserve death"

### Sexual Content 🔞
porn • sex • xxx • explicit • nude • horny • orgasm • blowjob • ...and more

### Harassment & Bullying 👊
stupid • idiot • loser • dumb • moron • shame • humiliate • mock • ridicule • insult • ...and more

### Child Safety 🧒
child abuse • harm child • hurt kid • pedophile • exploitation • abuse child • ...and more

### Extreme Content ❌
scat • bestiality • zoophilia • necrophilia • incest • child pornography

### Spam & Scams 🚨
click here • buy now • cryptocurrency • earn money fast • limited offer • ...and more

---

## Where Moderation Happens 🔍

| Location | Protected |
|----------|-----------|
| Comment on Blog | ✅ Yes |
| Reply to Comment | ✅ Yes |
| Blog Title | ✅ Yes |
| Blog Content | ✅ Yes |

---

## How It Works ⚙️

```
1. User Posts Comment/Blog
    ↓
2. System Checks 130+ Keywords Instantly ⚡
    ↓
3. Found Violation?
    ├─ YES → Block + Show Error ❌
    └─ NO → Check AI (if enabled)
    ↓
4. AI Analysis Checks Context
    ├─ Violation Found → Block ❌
    └─ All Clear → Save ✅
```

---

## Error Response Example

```json
{
  "success": false,
  "message": "Comment failed moderation.",
  "badLines": [{
    "line": 1,
    "text": "offensive comment here",
    "issues": ["Offensive language or profanity"],
    "category": "profanity_vulgar",
    "suggestions": "Please revise...",
    "severity": "MODERATE"
  }]
}
```

---

## Testing Commands 🧪

### Test with cURL
```bash
curl -X POST http://localhost:3000/comment/add \
  -H "Content-Type: application/json" \
  -d '{
    "blogid": "blog-id-here",
    "comment": "This is motherfucker content"
  }'
```

### Expected: 400 Error (Blocked) ✅

---

## Severity Levels 📊

| Level | Meaning | Action |
|-------|---------|--------|
| 🔴 CRITICAL | Severe violation | Immediate block |
| 🟠 MODERATE | Notable violation | Block with suggestion |

---

## Configuration ⚙️

### Optional AI Enhancement
```bash
# Add to .env
GOOGLE_API_KEY=your_api_key
```

### Works Without AI
✅ System blocks content using keywords alone  
✅ No API needed for basic protection  
✅ AI is optional enhancement

---

## Statistics 📈

| Metric | Count |
|--------|-------|
| Total Keywords | 130+ |
| Categories | 8 |
| Comment Endpoints | 3 |
| Blog Endpoints | 2 |
| Response Time | <10ms |

---

## Common Test Phrases

### ❌ BLOCKED
- "This is motherfucker content"
- "What the shit is this?"
- "You're a damn idiot"
- "This is complete bullshit"
- "You're such a bitch"

### ✅ ALLOWED
- "Great article!"
- "Thanks for sharing!"
- "Great perspective"
- "I enjoyed this"
- "Interesting points"

---

## Support & Docs 📚

- **Full Implementation**: `IMPLEMENTATION_SUMMARY.md`
- **Test Guide**: `MODERATION_TEST_GUIDE.md`
- **All Keywords**: `BLOCKED_KEYWORDS.md`
- **Updates**: `MODERATION_UPDATES.md`

---

## Key Files 📁

```
api/utils/moderation.js          ← Core logic
api/controllers/Comment.controller.js    ← Comment moderation
api/controllers/blog.controller.js       ← Blog moderation
```

---

## At a Glance 👀

✅ Blocks profanity & vulgar language  
✅ Blocks violence & threats  
✅ Blocks hate speech & discrimination  
✅ Blocks sexual content  
✅ Blocks harassment & bullying  
✅ Blocks child-related content  
✅ Blocks extreme adult content  
✅ Blocks spam & scams  

🚀 **Real-time Detection**  
⚡ **Instant Blocking**  
🤖 **AI-Enhanced (Optional)**  
📝 **Clear Feedback to Users**  

---

**Status**: ✅ ACTIVE AND DEPLOYED  
**Last Updated**: November 16, 2025
