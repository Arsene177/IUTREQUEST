# JANNGO — Quick Start Guide

## Project Status
✅ **Fully Functional** — Backend and frontend are ready to run.

The project is a student request management system with an integrated chatbot assistant.

---

## 1. Prerequisites

- **Node.js** 20+ (check: `node --version`)
- **MySQL** 8+ running locally (check: `mysql --version`)
- **npm** or yarn

---

## 2. Quick Start

### 2.1 Backend Setup

```bash
cd backend
npm install
npm run dev
```

**Expected output:**
```
✓ Connexion MySQL établie
✓ Serveur JANNGO démarré sur http://localhost:3001
```

### 2.2 Frontend Setup (in a new terminal)

```bash
npm install
npm run dev
```

**Expected output:**
```
✓ ready started server on 0.0.0.0:3000
```

### 2.3 Access the Application

- **Student dashboard:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **API docs:** http://localhost:3001/

---

## 3. Test Accounts

All accounts use password: **`password123`**

### Students
- matricule `IUT2024001` — BOBDA Dylane
- matricule `IUT2024002` — DEUTOU Austin
- matricule `IUT2024003` — OUMAR Ismael

### Staff
- `paul.essomba@iut.cm` — Secrétariat
- `henri.biya@iut.cm` — Directeur Adjoint
- `pierre.mvondo@iut.cm` — Directeur
- `marc.ngono@iut.cm` — Département
- `serge.mbia@iut.cm` — Cellule Informatique
- `jules.abega@iut.cm` — Scolarité

---

## 4. Chatbot

The chatbot is embedded in the app (bottom-right corner). It can:
- Answer FAQs about procedures
- Guide students to request forms
- Provide processing timelines

**Current behavior:** Rule-based (local FAQ engine)

---

## 5. Groq Integration (Optional)

To add AI-powered responses using Groq's free API:

### Step 1: Get a Groq API key
1. Go to https://console.groq.com
2. Sign up (free)
3. Create an API key

### Step 2: Add to `.env`
```env
GROQ_API_KEY=gsk_your_api_key_here
GROQ_MODEL=mixtral-8x7b-32768
```

### Step 3: Update backend chatbot logic

In `backend/src/chatbot/chatbot-engine.ts`, import and call Groq:

```typescript
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function getGroqResponse(message: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: message }],
    model: process.env.GROQ_MODEL || "mixtral-8x7b-32768",
  });
  return completion.choices[0].message.content || "Unable to respond";
}
```

Then use it as a fallback in the state machine.

---

## 6. Troubleshooting

### Backend won't start

**Error:** `Unable to connect to MySQL`
- Ensure MySQL is running: `mysql -u root -p`
- Check `.env` credentials: `DB_HOST`, `DB_USER`, `DB_PASSWORD`
- Verify database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Frontend won't load

**Error:** `Failed to fetch from /api/...`
- Check backend is running on port 3001
- Clear browser cache
- Check browser console for CORS issues

### Chatbot not responding

**Error:** `Cannot reach http://localhost:3001/chatbot/message`
- Backend server must be running
- Check network tab in browser dev tools

---

## 7. Project Structure

```
iut-request/
├── backend/              # Express API
│   ├── src/
│   │   ├── chatbot/      # Chatbot engine + FAQ
│   │   ├── controllers/  # Route handlers
│   │   ├── routes/       # API routes
│   │   ├── config/       # Database + env
│   │   └── seed.ts       # Test data
│   └── .env              # Environment
├── src/                  # Next.js frontend
│   ├── app/              # Pages
│   ├── components/       # React components
│   └── lib/              # Utilities
└── README.md             # Project overview
```

---

## 8. Next Steps

- ✅ Backend fixed and running
- ✅ Frontend builds successfully
- ✅ Chatbot integrated
- 🔄 **Optional:** Add Groq for AI responses
- 🔄 **Optional:** Deploy to production (Vercel + Railway)

---

## Support

For issues or questions, check:
- `backend/API.md` — API endpoint documentation
- `SETUP.md` — Detailed setup instructions
- Test workflows in `e2e/` folder for expected behavior
