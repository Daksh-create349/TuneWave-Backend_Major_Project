const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const fs = require("fs");
const path = require("path");

let firebaseInitialized = false;
let firebaseAuth = null;

try {
    let serviceAccount = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } catch {
            const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
            serviceAccount = JSON.parse(decoded);
        }
    } else {
        const keyPath = path.join(__dirname, "serviceAccountKey.json");
        if (fs.existsSync(keyPath)) {
            serviceAccount = require(keyPath);
        }
    }

    if (serviceAccount) {
        const app = initializeApp({
            credential: cert(serviceAccount)
        });
        firebaseAuth = getAuth(app);
        firebaseInitialized = true;
        console.log("Firebase Admin initialized successfully");
    } else {
        console.warn("No Firebase service account key provided. Firebase Admin disabled.");
    }
} catch (error) {
    console.error(
        "Firebase Admin initialization failed:",
        error.message
    );
}

module.exports = {
    firebaseInitialized,
    firebaseAuth
};
