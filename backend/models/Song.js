const mongoose = require("mongoose");

const songSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        artist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Artist",
            required: true
        },

        album: {
            type: String,
            required: true,
            trim: true
        },

        genre: {
            type: String,
            required: true,
            trim: true
        },

        duration: {
            type: Number,
            required: true
        },

        audioUrl: {
            type: String,
            required: true
        },

        albumArtUrl: {
            type: String,
            required: true
        },

        likes: {
            type: Number,
            default: 0
        },

        plays: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Song", songSchema);
