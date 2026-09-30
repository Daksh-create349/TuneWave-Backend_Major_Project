const express = require("express");

const {
    getSongs,
    getSongById,
    createSong,
    updateSong,
    deleteSong,
    searchSongs,
    likeSong,
    recordSongPlay,
    getListeningHistory,
    getRecommendations
} = require("../controllers/songController");

const protect = require("../middleware/authMiddleware");
const optionalProtect = protect.optionalProtect;
const upload = require("../middleware/uploadMiddleware");
const { validateSong } = require("../middleware/validationMiddleware");

const router = express.Router();

router.get("/search", searchSongs);
router.get("/history", protect, getListeningHistory);
router.get("/recommendations", optionalProtect, getRecommendations);
router.post("/:id/play", optionalProtect, recordSongPlay);
router.get("/", getSongs);
router.get("/:id", getSongById);

router.post(
    "/",
    protect,
    upload.fields([
        {
            name: "audio",
            maxCount: 1
        },
        {
            name: "albumArt",
            maxCount: 1
        }
    ]),
    validateSong,
    createSong
);

router.put(
    "/:id",
    protect,
    upload.fields([
        {
            name: "audio",
            maxCount: 1
        },
        {
            name: "albumArt",
            maxCount: 1
        }
    ]),
    updateSong
);

router.delete("/:id", protect, deleteSong);

router.post("/:id/like", protect, likeSong);

module.exports = router;
