const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const path = require("path");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const songRoutes = require("./routes/songRoutes");
const playlistRoutes = require("./routes/playlistRoutes");
const artistRoutes = require("./routes/artistRoutes");

require("./config/firebase");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local media uploads statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB();

app.get("/", (req, res) => {
    res.json({
        message: "TuneWave API is running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/artists", artistRoutes);

// In-Memory Shared Room States for Real-Time Sync
const roomStates = new Map();

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinRoom", (rawRoomId) => {
        if (!rawRoomId || typeof rawRoomId !== "string") return;
        const roomId = rawRoomId.trim().toLowerCase();

        // Leave previous room if any
        if (socket.currentRoom && socket.currentRoom !== roomId) {
            socket.leave(socket.currentRoom);
            const prevCount = io.sockets.adapter.rooms.get(socket.currentRoom)?.size || 0;
            io.to(socket.currentRoom).emit("roomMembers", { roomId: socket.currentRoom, count: prevCount });
        }

        socket.join(roomId);
        socket.currentRoom = roomId;

        const count = io.sockets.adapter.rooms.get(roomId)?.size || 1;
        io.to(roomId).emit("roomMembers", { roomId, count });

        // If room already has playing track, immediately sync the newly joined listener
        if (roomStates.has(roomId)) {
            const state = roomStates.get(roomId);
            const elapsed = state.isPlaying ? (Date.now() - state.timestamp) / 1000 : 0;
            socket.emit("roomState", {
                ...state,
                currentTime: Math.max(0, (state.currentTime || 0) + elapsed)
            });
        }
    });

    socket.on("leaveRoom", (rawRoomId) => {
        const roomId = rawRoomId ? rawRoomId.trim().toLowerCase() : socket.currentRoom;
        if (!roomId) return;

        socket.leave(roomId);
        socket.currentRoom = null;

        const count = io.sockets.adapter.rooms.get(roomId)?.size || 0;
        io.to(roomId).emit("roomMembers", { roomId, count });
    });

    socket.on("nowPlaying", (data) => {
        if (!data || !data.roomId) return;
        const roomId = data.roomId.trim().toLowerCase();

        const state = {
            roomId,
            songId: data.songId,
            title: data.title,
            artist: data.artist,
            albumArtUrl: data.albumArtUrl,
            currentTime: typeof data.currentTime === "number" ? data.currentTime : 0,
            isPlaying: Boolean(data.isPlaying),
            timestamp: Date.now(),
            senderId: socket.id
        };

        roomStates.set(roomId, state);

        // Broadcast to all sockets in room
        io.to(roomId).emit("nowPlaying", state);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        if (socket.currentRoom) {
            const count = io.sockets.adapter.rooms.get(socket.currentRoom)?.size || 0;
            io.to(socket.currentRoom).emit("roomMembers", { roomId: socket.currentRoom, count });
            if (count === 0) {
                // Clean up room state if completely empty
                roomStates.delete(socket.currentRoom);
            }
        }
    });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
    console.log(`TuneWave server running on port ${PORT}`);
});
