const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        firebaseUid: {
            type: String,
            required: true,
            unique: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        password: {
            type: String,
            required: false
        },

        likedSongs: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Song"
            }
        ],

        followedArtists: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Artist"
            }
        ],

        listeningHistory: [
            {
                song: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Song"
                },
                playedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);
