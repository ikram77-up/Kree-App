import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String
    },
    message: {
        type: String
    },
    type: {
        type: String,
        enum: ["info", "offre", "reservation"],
        default: "info"
    },
    isRead: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
