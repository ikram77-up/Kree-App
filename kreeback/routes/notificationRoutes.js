import express from "express";
import {
    sendNotification,
    getNotificationCount
} from "../controllers/notificationController.js"
import { verifyToken } from "../middleWares/verifyToken.js"

const routesNotification = express.Router();

routesNotification.post("/notifications", sendNotification);
routesNotification.get("/notifications/count",verifyToken, getNotificationCount);

export default routesNotification;