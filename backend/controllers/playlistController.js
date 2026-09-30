const mongoose = require("mongoose");
const Playlist = require("../models/Playlist");
const Song = require("../models/Song");

// Create playlist
const createPlaylist = async (req, res) => {
    try {
        const { name, songs = [] } = req.body;

        if (!name || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                message: "Playlist name is required"
            });
        }

        const trimmedName = name.trim();
        const existingPlaylist = await Playlist.findOne({
            user: req.user.userId,
            name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
        });

        if (existingPlaylist) {
            return res.status(400).json({
                message: `A playlist named "${trimmedName}" already exists. Please choose a different name.`
            });
        }

        if (songs && !Array.isArray(songs)) {
            return res.status(400).json({
                message: "Songs must be an array of song IDs"
            });
        }

        if (Array.isArray(songs) && songs.length > 0) {
            for (const songId of songs) {
                if (!mongoose.Types.ObjectId.isValid(songId)) {
                    return res.status(400).json({
                        message: `Invalid song ID format: ${songId}`
                    });
                }
            }

            const uniqueSongs = [...new Set(songs.map((s) => s.toString()))];
            const validSongs = await Song.find({
                _id: { $in: uniqueSongs }
            });

            if (uniqueSongs.length !== validSongs.length) {
                return res.status(400).json({
                    message: "One or more songs do not exist"
                });
            }
        }

        const playlist = await Playlist.create({
            name: name.trim(),
            user: req.user.userId,
            songs: songs || []
        });

        const populatedPlaylist = await Playlist.findById(playlist._id)
            .populate("user", "name email")
            .populate({
                path: "songs",
                populate: { path: "artist", select: "name bio imageUrl" }
            });

        res.status(201).json({
            message: "Playlist created successfully",
            playlist: populatedPlaylist
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create playlist",
            error: error.message
        });
    }
};

// Get playlists of user
const getUserPlaylists = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid user ID format"
            });
        }

        const playlists = await Playlist.find({
            user: req.params.id
        })
            .populate("user", "name email")
            .populate({
                path: "songs",
                populate: { path: "artist", select: "name bio imageUrl" }
            })
            .sort({ createdAt: -1 });

        res.status(200).json(playlists);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch playlists",
            error: error.message
        });
    }
};

// Update playlist
const updatePlaylist = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid playlist ID format"
            });
        }

        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return res.status(404).json({
                message: "Playlist not found"
            });
        }

        if (playlist.user.toString() !== req.user.userId.toString()) {
            return res.status(403).json({
                message: "You can only update your own playlist"
            });
        }

        const { name, songs } = req.body;

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({
                    message: "Playlist name cannot be empty"
                });
            }
            const trimmedName = name.trim();
            const existingPlaylist = await Playlist.findOne({
                user: req.user.userId,
                name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") },
                _id: { $ne: playlist._id }
            });
            if (existingPlaylist) {
                return res.status(400).json({
                    message: `A playlist named "${trimmedName}" already exists. Please choose a different name.`
                });
            }
            playlist.name = trimmedName;
        }

        if (songs !== undefined) {
            if (!Array.isArray(songs)) {
                return res.status(400).json({
                    message: "Songs must be an array of song IDs"
                });
            }

            if (songs.length > 0) {
                for (const songId of songs) {
                    if (!mongoose.Types.ObjectId.isValid(songId)) {
                        return res.status(400).json({
                            message: `Invalid song ID format: ${songId}`
                        });
                    }
                }

                const uniqueSongs = [...new Set(songs.map((s) => s.toString()))];
                const validSongs = await Song.find({
                    _id: { $in: uniqueSongs }
                });

                if (uniqueSongs.length !== validSongs.length) {
                    return res.status(400).json({
                        message: "One or more songs do not exist"
                    });
                }
            }

            playlist.songs = songs;
        }

        await playlist.save();

        const updatedPlaylist = await Playlist.findById(playlist._id)
            .populate("user", "name email")
            .populate({
                path: "songs",
                populate: { path: "artist", select: "name bio imageUrl" }
            });

        res.status(200).json({
            message: "Playlist updated successfully",
            playlist: updatedPlaylist
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update playlist",
            error: error.message
        });
    }
};

// Delete playlist
const deletePlaylist = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid playlist ID format"
            });
        }

        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return res.status(404).json({
                message: "Playlist not found"
            });
        }

        if (playlist.user.toString() !== req.user.userId.toString()) {
            return res.status(403).json({
                message: "You can only delete your own playlist"
            });
        }

        await Playlist.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Playlist deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete playlist",
            error: error.message
        });
    }
};

module.exports = {
    createPlaylist,
    getUserPlaylists,
    updatePlaylist,
    deletePlaylist
};

