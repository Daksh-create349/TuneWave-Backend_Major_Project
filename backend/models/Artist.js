const mongoose = require("mongoose");

const artistSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        bio: {
            type: String,
            default: ""
        },

        imageUrl: {
            type: String,
            default: ""
        },

        followers: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Artist", artistSchema);
