const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const AUDIO_DIR = path.join(__dirname, "../uploads/audio");
const ALBUM_ART_DIR = path.join(__dirname, "../uploads/album-art");
const ARTIST_IMAGES_DIR = path.join(__dirname, "../uploads/artist-images");

// Ensure directories exist
[AUDIO_DIR, ALBUM_ART_DIR, ARTIST_IMAGES_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const ALLOWED_AUDIO_TYPES = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
    "audio/ogg",
    "audio/aac",
    "audio/flac",
    "audio/m4a",
    "audio/x-m4a",
    "audio/mp4"
];

const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif"
];

const ALLOWED_AUDIO_EXTS = [".mp3", ".wav", ".ogg", ".aac", ".flac", ".m4a"];
const ALLOWED_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "audio" || file.mimetype.startsWith("audio/")) {
            cb(null, AUDIO_DIR);
        } else if (file.fieldname === "artistImage") {
            cb(null, ARTIST_IMAGES_DIR);
        } else {
            // Default images (albumArt, etc.)
            cb(null, ALBUM_ART_DIR);
        }
    },
    filename: (req, file, cb) => {
        const rawExt = path.extname(file.originalname).toLowerCase();
        let ext = rawExt.replace(/[^a-z0-9.]/g, "");

        if (!ext) {
            if (file.mimetype.includes("mpeg") || file.mimetype.includes("mp3")) ext = ".mp3";
            else if (file.mimetype.includes("wav")) ext = ".wav";
            else if (file.mimetype.includes("png")) ext = ".png";
            else if (file.mimetype.includes("jpeg") || file.mimetype.includes("jpg")) ext = ".jpg";
            else ext = ".bin";
        }

        const safePrefix = path
            .basename(file.originalname, rawExt)
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .slice(0, 30);

        const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
        cb(null, `${safePrefix ? `${safePrefix}-` : ""}${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (file.fieldname === "audio") {
        if (ALLOWED_AUDIO_TYPES.includes(file.mimetype) || ALLOWED_AUDIO_EXTS.includes(ext)) {
            return cb(null, true);
        }
        return cb(new Error("Invalid audio file format. Allowed: MP3, WAV, OGG, AAC, FLAC, M4A"), false);
    }

    if (file.fieldname === "albumArt" || file.fieldname === "artistImage" || file.fieldname === "image") {
        if (ALLOWED_IMAGE_TYPES.includes(file.mimetype) || ALLOWED_IMAGE_EXTS.includes(ext)) {
            return cb(null, true);
        }
        return cb(new Error("Invalid image format. Allowed: JPG, PNG, WEBP, GIF"), false);
    }

    // Generic fallback based on mime
    if (ALLOWED_AUDIO_TYPES.includes(file.mimetype) || ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only valid audio and image files are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max file size
    }
});

module.exports = upload;
