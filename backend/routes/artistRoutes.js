const express = require("express");

const {
    getArtists,
    getArtistById,
    followArtist,
    updateArtist
} = require("../controllers/artistController");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", getArtists);
router.get("/:id", getArtistById);

router.post("/:id/follow", protect, followArtist);

router.put(
    "/:id",
    protect,
    upload.single("artistImage"),
    updateArtist
);

module.exports = router;