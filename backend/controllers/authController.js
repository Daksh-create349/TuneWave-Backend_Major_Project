const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { firebaseAuth } = require("../config/firebase");

const registerUser = async (req, res) => {
    try {
        let { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        email = email.toLowerCase().trim();

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must contain at least 6 characters"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        let firebaseUid;

        if (firebaseAuth) {
            const firebaseUser = await firebaseAuth.createUser({
                email,
                password,
                displayName: name.trim()
            });
            firebaseUid = firebaseUser.uid;
        } else {
            // Fallback to Firebase Identity Toolkit REST API using FIREBASE_API_KEY
            const fbRes = await fetch(
                `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${process.env.FIREBASE_API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email,
                        password,
                        displayName: name.trim(),
                        returnSecureToken: true
                    })
                }
            );

            const fbData = await fbRes.json();

            if (!fbRes.ok) {
                if (fbData.error?.message === "EMAIL_EXISTS") {
                    return res.status(400).json({
                        message: "Email is already registered in Firebase"
                    });
                }
                return res.status(400).json({
                    message: fbData.error?.message || "Registration failed"
                });
            }

            firebaseUid = fbData.localId;
        }

        const user = await User.create({
            firebaseUid,
            name: name.trim(),
            email,
            likedSongs: [],
            followedArtists: []
        });

        const token = jwt.sign(
            {
                userId: user._id,
                firebaseUid
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                _id: user._id,
                firebaseUid,
                name: user.name,
                email: user.email,
                likedSongs: user.likedSongs || [],
                followedArtists: user.followedArtists || []
            }
        });
    } catch (error) {
        if (error.code === "auth/email-already-exists") {
            return res.status(400).json({
                message: "Email is already registered in Firebase"
            });
        }

        res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
};

const loginUser = async (req, res) => {
    try {
        let { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        email = email.toLowerCase().trim();

        const firebaseResponse = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password,
                    returnSecureToken: true
                })
            }
        );

        const firebaseData = await firebaseResponse.json();

        if (!firebaseResponse.ok) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        let firebaseUid = firebaseData.localId;

        if (firebaseAuth && firebaseData.idToken) {
            try {
                const decodedToken = await firebaseAuth.verifyIdToken(
                    firebaseData.idToken
                );
                firebaseUid = decodedToken.uid;
            } catch (err) {
                console.warn("verifyIdToken skipped or failed:", err.message);
            }
        }

        let user = await User.findOne({
            $or: [{ firebaseUid }, { email }]
        });

        if (!user) {
            // Auto-create local MongoDB record for authenticated Firebase user
            user = await User.create({
                firebaseUid,
                name: firebaseData.displayName || email.split("@")[0],
                email,
                likedSongs: [],
                followedArtists: []
            });
        } else if (!user.firebaseUid || user.firebaseUid !== firebaseUid) {
            user.firebaseUid = firebaseUid;
            await user.save();
        }

        const token = jwt.sign(
            {
                userId: user._id,
                firebaseUid
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                _id: user._id,
                firebaseUid,
                name: user.name,
                email: user.email,
                likedSongs: user.likedSongs || [],
                followedArtists: user.followedArtists || []
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            user: {
                id: user._id,
                _id: user._id,
                firebaseUid: user.firebaseUid,
                name: user.name,
                email: user.email,
                likedSongs: user.likedSongs || [],
                followedArtists: user.followedArtists || []
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch user profile",
            error: error.message
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe
};
