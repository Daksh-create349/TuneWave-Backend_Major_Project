const mongoose = require("mongoose");
const Song = require("../models/Song");
const Artist = require("../models/Artist");
const User = require("../models/User");

const isValidMediaUrl = (url, type) => {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    if (!trimmed) return false;

    // Reject example.com placeholder
    if (trimmed.includes("example.com")) return false;

    // Allow relative local uploads
    if (type === "audio" && trimmed.startsWith("/uploads/audio/")) return true;
    if (type === "image" && (trimmed.startsWith("/uploads/album-art/") || trimmed.startsWith("/uploads/artist-images/"))) return true;

    // Allow valid http / https URLs
    try {
        const parsed = new URL(trimmed);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
};

// Get all songs
const getSongs = async (req, res) => {
    try {
        const songs = await Song.find()
            .populate("artist", "name bio imageUrl followers")
            .sort({ createdAt: -1 });

        res.status(200).json(songs);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch songs",
            error: error.message
        });
    }
};

// Get single song
const getSongById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({
                message: "Song not found"
            });
        }

        const song = await Song.findById(req.params.id)
            .populate("artist", "name bio imageUrl followers");

        if (!song) {
            return res.status(404).json({
                message: "Song not found"
            });
        }

        res.status(200).json(song);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch song",
            error: error.message
        });
    }
};

// Create song
const createSong = async (req, res) => {
    try {
        const {
            title,
            artist,
            album,
            genre,
            duration,
            audioUrl,
            albumArtUrl
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(artist)) {
            return res.status(400).json({
                message: "Invalid artist ID format"
            });
        }

        const artistExists = await Artist.findById(artist);
        if (!artistExists) {
            return res.status(404).json({
                message: "Artist not found"
            });
        }

        let finalAudioUrl = null;
        let finalAlbumArtUrl = null;

        // Process audio file if uploaded
        if (req.files && req.files.audio && req.files.audio.length > 0) {
            finalAudioUrl = `/uploads/audio/${req.files.audio[0].filename}`;
        } else if (audioUrl && isValidMediaUrl(audioUrl, "audio")) {
            finalAudioUrl = audioUrl.trim();
        }

        // Process album art file if uploaded
        if (req.files && req.files.albumArt && req.files.albumArt.length > 0) {
            finalAlbumArtUrl = `/uploads/album-art/${req.files.albumArt[0].filename}`;
        } else if (albumArtUrl && isValidMediaUrl(albumArtUrl, "image")) {
            finalAlbumArtUrl = albumArtUrl.trim();
        }

        if (!finalAudioUrl) {
            return res.status(400).json({
                message: "A valid audio file or accessible audioUrl is required (example.com placeholders not allowed)"
            });
        }

        if (!finalAlbumArtUrl) {
            return res.status(400).json({
                message: "A valid album art file or accessible albumArtUrl is required (example.com placeholders not allowed)"
            });
        }

        const song = await Song.create({
            title: title.trim(),
            artist,
            album: album.trim(),
            genre: genre.trim(),
            duration: Number(duration),
            audioUrl: finalAudioUrl,
            albumArtUrl: finalAlbumArtUrl,
            likes: 0
        });

        const populatedSong = await Song.findById(song._id).populate("artist", "name bio imageUrl followers");

        res.status(201).json({
            message: "Song created successfully",
            song: populatedSong
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to create song",
            error: error.message
        });
    }
};

// Update song
const updateSong = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({
                message: "Song not found"
            });
        }

        const song = await Song.findById(req.params.id);
        if (!song) {
            return res.status(404).json({
                message: "Song not found"
            });
        }

        const {
            title,
            artist,
            album,
            genre,
            duration,
            audioUrl,
            albumArtUrl
        } = req.body;

        if (artist !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(artist)) {
                return res.status(400).json({
                    message: "Invalid artist ID format"
                });
            }
            const artistExists = await Artist.findById(artist);
            if (!artistExists) {
                return res.status(404).json({
                    message: "Artist not found"
                });
            }
            song.artist = artist;
        }

        if (title !== undefined) song.title = title.trim();
        if (album !== undefined) song.album = album.trim();
        if (genre !== undefined) song.genre = genre.trim();
        if (duration !== undefined) {
            const parsedDuration = Number(duration);
            if (isNaN(parsedDuration) || parsedDuration <= 0) {
                return res.status(400).json({
                    message: "Duration must be a positive number in seconds"
                });
            }
            song.duration = parsedDuration;
        }

        // Check if new audio file uploaded
        if (req.files && req.files.audio && req.files.audio.length > 0) {
            song.audioUrl = `/uploads/audio/${req.files.audio[0].filename}`;
        } else if (audioUrl !== undefined) {
            if (!isValidMediaUrl(audioUrl, "audio")) {
                return res.status(400).json({
                    message: "Invalid audioUrl format (example.com placeholders not allowed)"
                });
            }
            song.audioUrl = audioUrl.trim();
        }

        // Check if new album art uploaded
        if (req.files && req.files.albumArt && req.files.albumArt.length > 0) {
            song.albumArtUrl = `/uploads/album-art/${req.files.albumArt[0].filename}`;
        } else if (albumArtUrl !== undefined) {
            if (!isValidMediaUrl(albumArtUrl, "image")) {
                return res.status(400).json({
                    message: "Invalid albumArtUrl format (example.com placeholders not allowed)"
                });
            }
            song.albumArtUrl = albumArtUrl.trim();
        }

        await song.save();

        const updatedSong = await Song.findById(song._id).populate("artist", "name bio imageUrl followers");

        res.status(200).json({
            message: "Song updated successfully",
            song: updatedSong
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update song",
            error: error.message
        });
    }
};

// Delete song
const deleteSong = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({
                message: "Song not found"
            });
        }

        const song = await Song.findByIdAndDelete(req.params.id);
        if (!song) {
            return res.status(404).json({
                message: "Song not found"
            });
        }

        res.status(200).json({
            message: "Song deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete song",
            error: error.message
        });
    }
};

// Search songs
const searchSongs = async (req, res) => {
    try {
        const { keyword } = req.query;

        if (!keyword || !keyword.trim()) {
            return res.status(400).json({
                message: "Keyword is required"
            });
        }

        const safeKeyword = keyword.trim();
        // Allow flexible matching for common variations like lofi / lo-fi
        const flexiblePattern = safeKeyword
            .replace(/[-_]/g, "[-_ ]?")
            .replace(/lofi/gi, "lo[-_ ]?fi");
        const regex = new RegExp(flexiblePattern, "i");

        // Also match songs by artist name
        const matchingArtists = await Artist.find({ name: { $regex: regex } }).select("_id");
        const artistIds = matchingArtists.map((a) => a._id);

        const songs = await Song.find({
            $or: [
                {
                    title: {
                        $regex: regex
                    }
                },
                {
                    album: {
                        $regex: regex
                    }
                },
                {
                    genre: {
                        $regex: regex
                    }
                },
                {
                    artist: {
                        $in: artistIds
                    }
                }
            ]
        }).populate("artist", "name bio imageUrl followers");

        res.status(200).json(songs);
    } catch (error) {
        res.status(500).json({
            message: "Search failed",
            error: error.message
        });
    }
};

// Toggle like on song
const likeSong = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ message: "Song not found" });
        const song = await Song.findById(req.params.id);
        const user = await User.findById(req.user.userId);
        if (!song || !user) return res.status(404).json({ message: "Song or user not found" });

        const isLiked = user.likedSongs.some(id => id.toString() === song._id.toString());
        if (isLiked) {
            user.likedSongs = user.likedSongs.filter(id => id.toString() !== song._id.toString());
            song.likes = Math.max(0, song.likes - 1);
        } else {
            user.likedSongs.push(song._id);
            song.likes += 1;
        }

        await Promise.all([user.save(), song.save()]);
        res.status(200).json({ message: isLiked ? "Song unliked" : "Song liked", isLiked: !isLiked, likes: song.likes });
    } catch (error) {
        res.status(500).json({ message: "Failed to update like status", error: error.message });
    }
};

// Record song play and append to user's listening history
const recordSongPlay = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: "Song not found" });
        }

        const song = await Song.findById(req.params.id);
        if (!song) {
            return res.status(404).json({ message: "Song not found" });
        }

        song.plays = (song.plays || 0) + 1;
        await song.save();

        if (req.user?.userId) {
            const user = await User.findById(req.user.userId);
            if (user) {
                if (!user.listeningHistory) {
                    user.listeningHistory = [];
                }
                user.listeningHistory.unshift({
                    song: song._id,
                    playedAt: new Date()
                });
                if (user.listeningHistory.length > 60) {
                    user.listeningHistory = user.listeningHistory.slice(0, 60);
                }
                await user.save();
            }
        }

        res.status(200).json({
            message: "Play recorded",
            songId: song._id,
            plays: song.plays
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to record play",
            error: error.message
        });
    }
};

// Get user's listening history (most recent first)
const getListeningHistory = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .populate({
                path: "listeningHistory.song",
                populate: {
                    path: "artist",
                    select: "name bio imageUrl followers"
                }
            });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const history = (user.listeningHistory || [])
            .filter(item => item.song)
            .slice(0, 30);

        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch listening history",
            error: error.message
        });
    }
};

// Recommendation engine based on user's listening history, liked songs, and genre/artist affinity
const getRecommendations = async (req, res) => {
    try {
        let preferredGenres = [];
        let preferredArtistIds = [];
        let playedSongIds = [];

        if (req.user?.userId) {
            const user = await User.findById(req.user.userId)
                .populate("listeningHistory.song")
                .populate("likedSongs");

            if (user) {
                (user.listeningHistory || []).forEach(item => {
                    if (item.song) {
                        playedSongIds.push(item.song._id.toString());
                        if (item.song.genre) preferredGenres.push(item.song.genre);
                        if (item.song.artist) preferredArtistIds.push(item.song.artist.toString());
                    }
                });

                (user.likedSongs || []).forEach(song => {
                    if (song) {
                        if (song.genre) preferredGenres.push(song.genre);
                        if (song.artist) preferredArtistIds.push(song.artist.toString());
                    }
                });
            }
        }

        preferredGenres = [...new Set(preferredGenres.filter(Boolean))];
        preferredArtistIds = [...new Set(preferredArtistIds.filter(Boolean))];
        playedSongIds = [...new Set(playedSongIds)];

        let recommendations = [];

        if (preferredGenres.length > 0 || preferredArtistIds.length > 0) {
            const matchCriteria = [];
            if (preferredGenres.length > 0) {
                matchCriteria.push({ genre: { $in: preferredGenres } });
            }
            if (preferredArtistIds.length > 0) {
                matchCriteria.push({ artist: { $in: preferredArtistIds } });
            }

            recommendations = await Song.find({
                $and: [
                    { _id: { $nin: playedSongIds.slice(0, 10) } },
                    { $or: matchCriteria }
                ]
            })
                .populate("artist", "name bio imageUrl followers")
                .sort({ plays: -1, likes: -1 })
                .limit(12);
        }

        if (recommendations.length < 8) {
            const existingIds = recommendations.map(r => r._id.toString());
            const backfill = await Song.find({
                _id: { $nin: existingIds }
            })
                .populate("artist", "name bio imageUrl followers")
                .sort({ plays: -1, likes: -1, createdAt: -1 })
                .limit(8 - recommendations.length);

            recommendations = [...recommendations, ...backfill];
        }

        res.status(200).json(recommendations);
    } catch (error) {
        res.status(500).json({
            message: "Failed to generate recommendations",
            error: error.message
        });
    }
};

module.exports = {
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
};
