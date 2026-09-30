# TuneWave Music Streaming Backend

TuneWave is a music streaming backend service built with Node.js, Express, MongoDB, Firebase Authentication, JWT, and Socket.io. It supports audio streaming and image serving via local static storage for prototype demonstration without requiring external paid cloud buckets.

---

## Architecture Overview

- **Runtime & Framework**: Node.js & Express.js
- **Database & ODM**: MongoDB with Mongoose
- **Identity & Authentication**: Firebase Authentication (ID token verification via Firebase Admin SDK) + Backend JWT (issued for session authorization)
- **Real-Time Synchronization**: Socket.io for room-based shared listening sessions
- **Media Storage**: Local disk storage served through Express static routes (`/uploads/...`) via Multer

---

## Directory Structure

```text
backend/
├── config/
│   ├── db.js                     # MongoDB connection
│   ├── firebase.js               # Firebase Admin SDK initialization
│   └── serviceAccountKey.json   # Firebase Admin service account credentials (gitignored)
├── controllers/
│   ├── artistController.js       # Artist details and follow operations
│   ├── authController.js         # Firebase Auth registration, login, and JWT issuance
│   ├── playlistController.js     # Playlist CRUD with ownership checks
│   └── songController.js         # Song CRUD, search, and local media uploads
├── middleware/
│   ├── authMiddleware.js         # JWT verification middleware
│   ├── uploadMiddleware.js       # Multer configuration for audio and images
│   └── validationMiddleware.js   # Request validation middleware
├── models/
│   ├── Artist.js                 # Artist schema
│   ├── Playlist.js               # Playlist schema
│   ├── Song.js                   # Song schema
│   └── User.js                   # User schema
├── routes/
│   ├── artistRoutes.js           # /api/artists
│   ├── authRoutes.js             # /api/auth
│   ├── playlistRoutes.js         # /api/playlists
│   └── songRoutes.js             # /api/songs
├── uploads/
│   ├── album-art/                # Local album artwork (.jpg, .png, etc.)
│   ├── artist-images/            # Local artist portrait images (.jpg, .png, etc.)
│   └── audio/                    # Local audio tracks (.mp3, .wav, etc.)
├── server.js                     # Express app, static serving, Socket.io handlers
└── package.json
```

---

## Local Media Storage

Local files are stored in `backend/uploads/` and served statically:

| Directory | Route Path | Allowed Types | Max Size |
|---|---|---|---|
| `backend/uploads/audio/` | `/uploads/audio/...` | MP3, WAV, OGG, AAC, FLAC, M4A | 50 MB |
| `backend/uploads/album-art/` | `/uploads/album-art/...` | JPEG, PNG, WEBP, GIF | 50 MB |
| `backend/uploads/artist-images/` | `/uploads/artist-images/...` | JPEG, PNG, WEBP, GIF | 50 MB |

Static file streaming supports HTTP `Range` requests (`Accept-Ranges: bytes`) for audio seeking and streaming playback.

### Where to Place Media Files
- Audio files (MP3/WAV): Place into `backend/uploads/audio/`
- Album artwork (JPG/PNG): Place into `backend/uploads/album-art/`
- Artist pictures (JPG/PNG): Place into `backend/uploads/artist-images/`

---

## Environment Variables

Create a `.env` file inside the `backend/` directory with the following variables:

```env
PORT=8000
MONGO_URI=mongodb://127.0.0.1:27017/TuneWave
JWT_SECRET=your_jwt_secret_here
FIREBASE_API_KEY=your_firebase_web_api_key_here
```

> **Note**: Place your Firebase service account private key file at `backend/config/serviceAccountKey.json`. Both `.env` and `serviceAccountKey.json` are excluded via `.gitignore` to prevent credential exposure.

---

## Installation and Startup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start MongoDB**:
   Ensure MongoDB is running locally on port 27017 (e.g. `mongodb://127.0.0.1:27017/TuneWave`).

3. **Start the Server**:
   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

---

## Postman Collection & Testing

Pre-configured Postman files are in `backend/`:
- `TuneWave.postman_collection.json`: Complete collection of 18 requests covering all endpoints and tests
- `TuneWave.postman_environment.json`: Local environment variables (`baseUrl`, `token`, `userId`, `songId`, `artistId`)

### Option A: Run via Postman CLI (Newman)
```bash
cd backend
npx -y newman run TuneWave.postman_collection.json -e TuneWave.postman_environment.json
```

### Option B: Import into Postman App
1. Open **Postman**.
2. Click **Import** (top left).
3. Select both `backend/TuneWave.postman_collection.json` and `backend/TuneWave.postman_environment.json`.
4. Select environment **TuneWave Local Environment** in top-right dropdown.
5. Click **Run collection** to run all tests in sequence.

### Authentication
- `POST /api/auth/register` — Registers user with Firebase Auth, creates local MongoDB user, returns JWT.
- `POST /api/auth/login` — Authenticates with Firebase Identity Toolkit, verifies ID token, returns JWT.

### Songs
- `GET /api/songs` — Retrieves all songs (sorted by latest, populated with artist).
- `GET /api/songs/:id` — Retrieves a specific song by ID.
- `GET /api/songs/search?keyword=:query` — Searches songs by title, album, or genre (case-insensitive, flexible matching).
- `POST /api/songs` — *(Protected)* Creates a song. Accepts `multipart/form-data` with `audio` and `albumArt` files, or URLs.
- `PUT /api/songs/:id` — *(Protected)* Updates song metadata or uploaded media.
- `DELETE /api/songs/:id` — *(Protected)* Deletes a song.

### Playlists
- `POST /api/playlists` — *(Protected)* Creates a new playlist with validated song references.
- `GET /api/playlists/user/:id` — *(Protected)* Retrieves playlists created by the specified user.
- `PUT /api/playlists/:id` — *(Protected)* Updates a playlist (user ownership enforced).

### Artists
- `GET /api/artists/:id` — Retrieves artist profile, bio, image URL, and followers.
- `POST /api/artists/:id/follow` — *(Protected)* Follows an artist and increments follower count.
- `PUT /api/artists/:id` — *(Protected)* Updates artist details or uploads an artist image (`artistImage`).

---

## Socket.io Shared Listening

Connect via WebSocket to `/socket.io/?EIO=4&transport=websocket`:
- **`joinRoom`**: Join a shared listening room by ID.
  ```json
  ["joinRoom", "room-id"]
  ```
- **`nowPlaying`**: Broadcast current track playback state to the room:
  ```json
  ["nowPlaying", { "roomId": "room-id", "songId": "...", "title": "...", "currentTime": 10.5, "isPlaying": true }]
  ```
