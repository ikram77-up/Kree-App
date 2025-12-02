import Notification from "../models/notification.js";
import { io, onlineUsers } from "../kree.js"

export const sendNotification = async (userId, title, message, type = "info", relatedEntityId = null) => {

    const notification = await Notification.create({ userId, title, message, type, relatedEntityId });

    // Envoi temps réel si user connecté
    const socketId = onlineUsers.get(userId.toString());
    if (socketId) {
        io.to(socketId).emit("notification", notification);
    }
    return notification;
};

export const getNotificationCount = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: "Authentication required." });
        }
        // Compter les notifications non lues pour l'utilisateur connecté
        const count = await Notification.countDocuments({
            userId: req.user._id,
            isRead: false
        });

        res.status(200).json({ count });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
