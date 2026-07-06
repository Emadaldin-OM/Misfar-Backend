# Misfar Backend API 🌍
> Oman Tourism Platform – Node.js + Express + PostgreSQL

---

## Quick Start

### 1. Install dependencies
```bash
cd misfar-backend
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

### 3. Create the database
```sql
-- In psql or pgAdmin:
CREATE DATABASE misfar_db;
```

### 4. Run migrations (creates all tables)
```bash
node config/migrate.js
```

### 5. Seed initial data
```bash
node config/seed.js
# Creates: admin user, 9 destinations, chatbot config
# Admin login: admin@misfar.om / Admin@123
```

### 6. Start the server
```bash
npm run dev       # development (nodemon)
npm start         # production
```

Server runs at: `http://localhost:5000`

---

## Database Schema

```
users                  – accounts (user / admin roles)
destinations           – tourist attractions
destination_photos     – photos per destination
reviews                – user reviews + sentiment score
bookmarks              – saved destinations per user
trips                  – saved trip plans
trip_stops             – individual stops within a trip
activities             – events & activities
notifications          – admin-sent notifications
notification_reads     – per-user read status
chatbot_config         – key-value chatbot settings
chatbot_conversations  – chatbot sessions
chatbot_messages       – individual messages per session
user_behavior          – view/bookmark/trip/review events (for AI)
refresh_tokens         – JWT refresh token store
```

---

## API Reference

### Authentication `/api/auth`

| Method | Endpoint       | Body                                | Auth  | Description         |
|--------|----------------|-------------------------------------|-------|---------------------|
| POST   | /register      | username, email, password           | —     | Register new user   |
| POST   | /login         | email, password                     | —     | Login               |
| POST   | /refresh       | refreshToken                        | —     | Refresh access token|
| POST   | /logout        | refreshToken                        | —     | Logout              |

**Login response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "username": "Ahmed", "email": "...", "role": "user" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```
> Add `Authorization: Bearer <accessToken>` header to all protected routes.

---

### Users `/api/users`

| Method | Endpoint                          | Auth  | Description                |
|--------|-----------------------------------|-------|----------------------------|
| GET    | /me                               | User  | Get my profile + stats     |
| PUT    | /me                               | User  | Update profile + photo     |
| PUT    | /me/password                      | User  | Change password            |
| GET    | /me/bookmarks                     | User  | Get saved destinations     |
| POST   | /me/bookmarks/:destinationId      | User  | Bookmark a destination     |
| DELETE | /me/bookmarks/:destinationId      | User  | Remove bookmark            |
| GET    | /me/reviews                       | User  | Get my reviews             |
| DELETE | /me/reviews/:id                   | User  | Delete my review           |
| GET    | /me/notifications                 | User  | Get notifications          |
| POST   | /me/notifications/:id/read        | User  | Mark notification as read  |

**Update profile body:**
```json
{
  "username": "Ahmed",
  "email": "ahmed@example.com",
  "location": "Muscat, Oman",
  "interests": "Nature, Beaches",
  "budget": "Low",
  "travel_type": "Solo"
}
```
> Send as `multipart/form-data` with optional `photo` file field.

---

### Destinations `/api/destinations`

| Method | Endpoint                          | Auth        | Description                  |
|--------|-----------------------------------|-------------|------------------------------|
| GET    | /                                 | Optional    | List all (search/filter)     |
| GET    | /:id                              | Optional    | Get destination + photos     |
| POST   | /                                 | Admin       | Create destination           |
| PUT    | /:id                              | Admin       | Update destination           |
| DELETE | /:id                              | Admin       | Deactivate destination       |
| POST   | /:id/photos                       | Admin       | Upload photos                |
| DELETE | /:id/photos/:photoId              | Admin       | Delete a photo               |
| GET    | /:id/reviews                      | Public      | Get approved reviews         |
| POST   | /:id/reviews                      | User        | Submit a review              |

**GET / query params:**
```
?search=nizwa        – search by name/area/region
?region=Al Dakhiliya – filter by region
?category=Nature     – filter by category
?sort=avg_rating     – sort field (avg_rating | visit_count | name)
?page=1&limit=20     – pagination
```

**Create destination body (multipart/form-data):**
```json
{
  "name": "Wadi Shab",
  "area": "South Al Sharqiya",
  "region": "Al Sharqiya",
  "category": "Nature",
  "overview": "Beautiful wadi with turquoise pools...",
  "opening_hours": "Daily 7AM - 5PM",
  "entry_fee": 1.5,
  "map_link": "https://maps.google.com/...",
  "latitude": 22.55,
  "longitude": 59.15
}
```

---

### Reviews
Submitted reviews have status `pending` until admin approves. Sentiment is automatically analyzed.

**Submit review:**
```json
{ "rating": 5, "comment": "Absolutely stunning place!" }
```
**Sentiment response includes:**
```json
{ "sentiment_label": "positive", "sentiment_score": 0.85 }
```

---

### Trips `/api/trips`

| Method | Endpoint       | Auth  | Description                   |
|--------|----------------|-------|-------------------------------|
| GET    | /              | User  | List my trips                 |
| GET    | /:id           | User  | Get trip with stops           |
| POST   | /              | User  | Save a manual trip            |
| PUT    | /:id           | User  | Update trip                   |
| DELETE | /:id           | User  | Delete trip                   |
| POST   | /ai-generate   | User  | AI-generated itinerary        |

**Save trip body:**
```json
{
  "title": "Weekend in Nizwa",
  "trip_date": "2026-03-15",
  "duration_days": 2,
  "budget_level": "Medium",
  "travel_type": "Family",
  "total_cost_omr": 85.5,
  "stops": [
    { "destination_id": "uuid-here", "arrival_time": "08:00", "duration_hours": 2 },
    { "custom_place": "Local Restaurant", "arrival_time": "13:00", "duration_hours": 1 }
  ]
}
```

**AI Generate body:**
```json
{
  "region": "Al Dakhiliya",
  "duration": 2,
  "budget": "Medium",
  "interests": ["Mountains", "Historic"],
  "travel_type": "Family"
}
```

---

### Recommendations `/api/recommendations`

| Method | Endpoint   | Auth     | Description                          |
|--------|------------|----------|--------------------------------------|
| GET    | /          | Optional | Personalized recommendations         |
| GET    | /trending  | Public   | Trending destinations (last 30 days) |

> When authenticated, recommendations are based on user interests + past behavior using a weighted scoring algorithm (rating × 0.4, popularity × 0.3, interest match × 0.3).

---

### Chatbot `/api/chatbot`

| Method | Endpoint  | Auth     | Description           |
|--------|-----------|----------|-----------------------|
| POST   | /message  | Optional | Send message to bot   |

**Request:**
```json
{ "message": "Tell me about Nizwa", "session_id": "optional-session-id" }
```
**Response:**
```json
{ "success": true, "data": { "conversation_id": "uuid", "reply": "Nizwa Souq is open..." } }
```

---

### Activities `/api/activities`

| Method | Endpoint | Auth   | Description        |
|--------|----------|--------|--------------------|
| GET    | /        | Public | List all events    |
| POST   | /        | Admin  | Create event       |
| PUT    | /:id     | Admin  | Update event       |
| DELETE | /:id     | Admin  | Deactivate event   |

---

### Admin `/api/admin`

All admin routes require `Authorization: Bearer <token>` from an **admin** account.

| Method | Endpoint                      | Description                    |
|--------|-------------------------------|--------------------------------|
| GET    | /analytics                    | Dashboard stats + sentiment    |
| GET    | /users                        | List all users                 |
| PUT    | /users/:id/toggle             | Activate / deactivate user     |
| GET    | /reviews                      | All reviews (filter by status) |
| PUT    | /reviews/:id                  | Approve or reject review       |
| GET    | /notifications                | All notifications              |
| POST   | /notifications                | Create notification            |
| POST   | /notifications/:id/send       | Send to all users              |
| DELETE | /notifications/:id            | Delete notification            |
| GET    | /chatbot/config               | View chatbot settings          |
| PUT    | /chatbot/config               | Update chatbot settings        |
| GET    | /chatbot/conversations        | View chatbot sessions          |

**Analytics response structure:**
```json
{
  "users": { "total": 120, "new_this_month": 15, "active_this_week": 40 },
  "destinations": { "total": 9, "platform_avg_rating": 4.7, "total_visits": 2300 },
  "reviews": { "total": 85, "pending": 12, "approved": 68, "rejected": 5 },
  "trips": { "total": 200, "ai_generated": 75 },
  "most_visited": [ { "name": "Suq Nizwa", "view_count": 450 } ],
  "sentiment": [ { "sentiment_label": "positive", "count": 55 } ]
}
```

---

## Connecting the Frontend

In your React app, replace hardcoded data with API calls. Example:

```javascript
// src/api/config.js
const API_BASE = 'http://localhost:5000/api';

// Login
export const login = async (email, password) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
};

// Get destinations
export const getDestinations = async (search = '', token = null) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE}/destinations?search=${search}`, { headers });
  return res.json();
};

// Save trip
export const saveTrip = async (tripData, token) => {
  const res = await fetch(`${API_BASE}/trips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(tripData)
  });
  return res.json();
};

// AI generate trip
export const generateTrip = async (params, token) => {
  const res = await fetch(`${API_BASE}/trips/ai-generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(params)
  });
  return res.json();
};

// Chatbot
export const sendChatMessage = async (message, conversationId = null) => {
  const res = await fetch(`${API_BASE}/chatbot/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversation_id: conversationId })
  });
  return res.json();
};
```

---

## Project Structure

```
misfar-backend/
├── server.js              ← Entry point
├── package.json
├── .env.example
├── config/
│   ├── db.js              ← PostgreSQL pool
│   ├── migrate.js         ← Creates all tables
│   └── seed.js            ← Seeds initial data
├── middleware/
│   ├── auth.js            ← JWT guards (protect, adminOnly)
│   ├── errorHandler.js    ← Global error handler
│   └── upload.js          ← Multer photo uploads
├── controllers/
│   ├── authController.js           ← Register / Login
│   ├── userController.js           ← Profile / Bookmarks
│   ├── destinationsController.js   ← CRUD destinations
│   ├── reviewController.js         ← Reviews + sentiment
│   ├── tripController.js           ← Trips + AI generator
│   ├── recommendationController.js ← AI recommendations + analytics
│   ├── notificationController.js   ← Push notifications
│   └── chatbotController.js        ← Chatbot + activities
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── destinationRoutes.js
│   ├── tripRoutes.js
│   ├── adminRoutes.js
│   ├── recommendationRoutes.js
│   └── otherRoutes.js
└── uploads/
    ├── destinations/
    └── profiles/
```
