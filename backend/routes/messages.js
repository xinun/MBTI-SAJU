const mongoose = require('mongoose');

const GUESTBOOK_DB_ADDR = process.env.GUESTBOOK_DB_ADDR;
const mongoURI = "mongodb://" + GUESTBOOK_DB_ADDR + "/guestbook";

const connectToMongoDB = async () => {
    try {
        await mongoose.connect(mongoURI);
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};

const messageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mbti: { type: String, required: true },
    date: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    memo: { type: String },
    scores: {
        E: Number,
        S: Number,
        T: Number,
        J: Number
    },
    likes: { type: Number, default: 0 },
    tags: [String],
    userAgent: { type: String }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = {
    connectToMongoDB: connectToMongoDB,
    Message: Message
};
