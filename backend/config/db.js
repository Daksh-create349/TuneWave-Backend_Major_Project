const mongoose = require("mongoose");

const connectDB = async (retries = 5, delay = 3000) => {
    while (retries > 0) {
        try {
            await mongoose.connect(process.env.MONGO_URI);
            console.log("MongoDB connected successfully");
            return;
        } catch (error) {
            console.error(`MongoDB connection attempt failed (${error.message}). Retries left: ${retries - 1}`);
            retries -= 1;
            if (retries === 0) {
                console.error("MongoDB connection attempts exhausted. Server will keep running.");
                return;
            }
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
};

module.exports = connectDB;
