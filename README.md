# Sports Betting Loyalty & Analytics Platform

A premium sports analytics platform with dealer verification, designed to convert free users into verified dealer customers through exclusive access to AI predictions and xG data.

## 🏗️ Tech Stack

- **Backend:** Python FastAPI with async SQLAlchemy
- **Frontend:** Next.js 14 (App Router), Tailwind CSS
- **Database:** PostgreSQL (via Docker or Supabase)
- **External API:** API-Football (API-Sports)

## 📂 Project Structure

```
sports-betting-platform/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── main.py            # FastAPI app entry
│   │   ├── config.py          # Environment config
│   │   ├── database.py        # DB connection
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   └── routers/           # API endpoints
│   ├── requirements.txt
│   └── .env.example
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   ├── components/        # React components
│   │   └── lib/               # Utilities & API client
│   └── package.json
└── docker-compose.yml         # PostgreSQL setup
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker (for PostgreSQL)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your API-Football key and database credentials

# Start PostgreSQL with Docker
cd ..
docker-compose up -d

# Run the backend
cd backend
uvicorn app.main:app --reload
```

Backend will be available at: http://localhost:8000

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at: http://localhost:3000

## 🔑 Key Features

### 1. Dealer Verification ("Paywall")
- Users must verify their Iddaa Member ID to access premium content
- Backend checks against `DealerWhitelist` table
- CSV upload for daily whitelist updates

### 2. Data Ingestion with Caching
- Fetches Turkey Super Lig fixtures from API-Football
- Caches data in PostgreSQL to minimize API calls
- Hourly cache invalidation

### 3. Premium Content
- xG (Expected Goals) data
- AI prediction scores
- Win probability percentages

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/signup` | Register new user |
| POST | `/api/users/token` | Login and get JWT |
| GET | `/api/users/me` | Get current user |
| POST | `/api/users/verify` | Verify dealer member ID |
| GET | `/api/matches/` | Get matches (public) |
| GET | `/api/matches/premium` | Get matches with xG (verified only) |
| POST | `/api/admin/upload-dealer-csv` | Upload dealer whitelist |

## 🎨 UI Pages

- **`/`** - Landing page with blurred premium content
- **`/dashboard`** - Match list with odds
- **`/dashboard/premium`** - Full analytics for verified users

## 📝 Environment Variables

```env
# Backend (.env)
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/betting_platform
API_FOOTBALL_KEY=your_api_key
SECRET_KEY=your-secret-key
```

```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📋 Next Steps

1. **Set up your API-Football account** at [API-Sports](https://www.api-football.com/)
2. **Configure environment variables** with your credentials
3. **Upload initial dealer CSV** via admin endpoint
4. **Deploy to production** (Vercel for frontend, Railway/Render for backend)

## 📜 License

MIT License
