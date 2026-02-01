# Stylcop - Gen Z AI Fashion Platform

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Expo CLI

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Start MongoDB (if using local):**
```bash
mongod
```

3. **Update environment variables:**
Create `backend/.env` file:
```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
```

4. **MongoDB Atlas – allow your IP (if using Atlas):**  
   If you see "Could not connect to any servers" or "Database not available":
   - Go to [MongoDB Atlas](https://cloud.mongodb.com) → your project → **Network Access**.
   - Click **Add IP Address**.
   - Either add your current IP, or for development use **Allow Access from Anywhere** (`0.0.0.0/0`).
   - Save and wait a minute, then restart the backend.

5. **Start the backend server:**
```bash
cd backend
node server.js
```

6. **Start the frontend:**
```bash
npm start
```

### Features Implemented

#### ✅ Authentication System
- User signup with email, password, name, college, and age
- Profile picture upload during signup
- JWT-based authentication
- Protected routes and API endpoints

#### ✅ Image Uploading with AI Analysis
- Expo ImagePicker integration for camera/gallery access
- Client-side image cropping (3:4 portrait ratio)
- Gemini AI clothing analysis (category, style, colors)
- Image upload to backend with metadata
- User avatar display

#### ✅ Closet Management
- Real user images stored in database
- Image categorization (TOP, BOTTOM, SHOES, ACCESSORY, OUTERWEAR)
- Long press to delete items
- Loading and empty states

#### ✅ UI/UX Improvements
- Fixed navigation tab positioning
- Centered add button with proper z-index
- Mobile-responsive layout
- Dark theme consistent styling
- Loading states and error handling

### API Endpoints

**Authentication:**
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

**Closet Items:**
- `POST /api/closet/add` - Add item to closet (authenticated)
- `GET /api/closet/items` - Get user's closet items (authenticated)
- `DELETE /api/closet/items/:id` - Delete closet item (authenticated)

**User Profile:**
- `GET /api/users/profile` - Get user profile (authenticated)

### Project Structure
```
stylcop-ai-fashion-platform/
├── components/
│   ├── AddItemModal.tsx
│   ├── AuthScreen.tsx
│   ├── ImagePicker.tsx
│   ├── Wardrobe.tsx
│   └── Profile.tsx
├── services/
│   └── geminiService.ts
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   └── ClosetItem.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   └── closet.js
│   ├── uploads/
│   │   ├── avatars/
│   │   └── closet/
│   ├── server.js
│   └── .env
├── App.tsx
└── styles.ts
```

### Development Commands
```bash
# Start frontend only
npm start

# Start backend only
npm run backend

# Start both frontend and backend
npm run dev
```

### Notes
- The app uses localStorage for token persistence
- Images are stored in `backend/uploads/` directory
- MongoDB is required for full functionality
- Gemini API key should be set in environment variables