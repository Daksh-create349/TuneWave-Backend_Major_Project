const mongoose = require("mongoose");
const Artist = require("../models/Artist");
const User = require("../models/User");

// Get all artists
const getArtists = async (req, res) => {
    try {
        const artists = await Artist.find().sort({ followers: -1 });
        res.status(200).json(artists);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch artists",
            error: error.message
        });
    }
};

// Get artist
const getArtistById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({
                message: "Artist not found"
            });
        }

        const artist = await Artist.findById(req.params.id);

        if (!artist) {
            return res.status(404).json({
                message: "Artist not found"
            });
        }

        res.status(200).json(artist);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch artist",
            error: error.message
        });
    }
};

// Follow artist
const followArtist = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({
                message: "Artist not found"
            });
        }

        const artist = await Artist.findById(req.params.id);

        if (!artist) {
            return res.status(404).json({
                message: "Artist not found"
            });
        }

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const alreadyFollowing = user.followedArtists.some(
            (artistId) => artistId.toString() === artist._id.toString()
        );

        if (alreadyFollowing) {
            return res.status(400).json({
                message: "Already following this artist"
            });
        }

        user.followedArtists.push(artist._id);
        artist.followers += 1;

        await user.save();
        await artist.save();

        res.status(200).json({
            message: "Artist followed successfully",
            artist: {
                id: artist._id,
                name: artist.name,
                followers: artist.followers
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to follow artist",
            error: error.message
        });
    }
};

// Update artist (including local image upload)
const updateArtist = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({
                message: "Artist not found"
            });
        }

        const artist = await Artist.findById(req.params.id);
        if (!artist) {
            return res.status(404).json({
                message: "Artist not found"
            });
        }

        const { name, bio, imageUrl } = req.body;

        if (name !== undefined) artist.name = name.trim();
        if (bio !== undefined) artist.bio = bio.trim();

        if (req.file) {
            artist.imageUrl = `/uploads/artist-images/${req.file.filename}`;
        } else if (imageUrl !== undefined) {
            const trimmed = imageUrl.trim();
            if (trimmed.includes("example.com")) {
                return res.status(400).json({
                    message: "example.com placeholder URLs are not allowed"
                });
            }
            artist.imageUrl = trimmed;
        }

        await artist.save();

        res.status(200).json({
            message: "Artist updated successfully",
            artist
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update artist",
            error: error.message
        });
    }
};

module.exports = {
    getArtists,
    getArtistById,
    followArtist,
    updateArtist
};
