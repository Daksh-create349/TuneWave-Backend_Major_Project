const mongoose = require("mongoose");

const validateSong = (req, res, next) => {
    const {
        title,
        artist,
        album,
        genre,
        duration
    } = req.body;

    if (!title || !artist || !album || !genre || duration === undefined || duration === null || duration === "") {
        return res.status(400).json({
            message: "Title, artist, album, genre and duration are required"
        });
    }

    if (!mongoose.Types.ObjectId.isValid(artist)) {
        return res.status(400).json({
            message: "Invalid artist ID format"
        });
    }

    const parsedDuration = Number(duration);
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
        return res.status(400).json({
            message: "Duration must be a positive number in seconds"
        });
    }

    next();
};

const validatePlaylist = (req, res, next) => {
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
            message: "Playlist name is required"
        });
    }

    next();
};

module.exports = {
    validateSong,
    validatePlaylist
};
