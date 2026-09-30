const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const serviceAccount = require("./serviceAccountKey.json");

let firebaseInitialized = false;
let firebaseAuth = null;

try {
    const app = initializeApp({
        credential: cert(serviceAccount)
    });

    firebaseAuth = getAuth(app);
    firebaseInitialized = true;

    console.log("Firebase Admin initialized successfully");
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
