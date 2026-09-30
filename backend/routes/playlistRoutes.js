const express = require("express");

const {
    createPlaylist,
    getUserPlaylists,
    updatePlaylist,
    deletePlaylist
} = require("../controllers/playlistController");

const protect = require("../middleware/authMiddleware");
const { validatePlaylist } = require("../middleware/validationMiddleware");

const router = express.Router();

router.post("/", protect, validatePlaylist, createPlaylist);

router.get("/user/:id", protect, getUserPlaylists);

router.put("/:id", protect, updatePlaylist);

router.delete("/:id", protect, deletePlaylist);

module.exports = router;

