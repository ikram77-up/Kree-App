import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import connectDB from "./config/connect_db.js";
import routes from "./routes/userRoutes.js";
import routesCar from "./routes/carRoutes.js";
import routesReservation from "./routes/reservationRoutes.js";
import routesAgenceOffred from "./routes/agenceOffredRoutes.js";
import routesNameYourPrice from "./routes/nameYourPriceRoutes.js";
import routesNotification from "./routes/notificationRoutes.js";
import { sendNotification } from "./controllers/notificationController.js";

dotenv.config();

connectDB();
const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors({
    origin: "*",
    credentials: true,
}));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(routes);
app.use(routesCar);
app.use(routesReservation);
app.use(routesAgenceOffred);
app.use(routesNameYourPrice);
app.use(routesNotification);

const server = http.createServer(app);
export const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
});

//Gestion des connexions en temps réel 
export const onlineUsers = new Map();

io.on("connection", (socket) => {
    console.log(" New user connected:", socket.id);

    // When a Client identifies himself after connection
    socket.on("registerClient", (userId) => {
        onlineUsers.set(userId.toString(), socket.id);
        // The client joins his own private "room" (to receive offers)
        socket.join(userId.toString());
        console.log(` Client ${userId} connected and joined room ${userId}`);
    });

    // When an Agency identifies itself
    socket.on("registerAgency", (agencyId) => {
        onlineUsers.set(agencyId.toString(), socket.id);
        // The agency joins its own private "room" (to receive acceptances)
        socket.join(agencyId.toString());
        // AND the agency joins the GLOBAL "room" (to receive new requests)
        socket.join('agencies_room');
        console.log(` Agency ${agencyId} joined 'agencies_room'`);
    });

    // When the user leaves
    socket.on("disconnect", () => {
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                console.log(` User ${userId} disconnected`);
                break;
            }
        }
    });

    socket.on('send_delivery_update', async ({ clientId, offerId, carModel, message }) => {
        try {
            // Find the client's socket ID
            const clientSocketId = onlineUsers.get(clientId);

            // Save notification to DB
            const notification = await sendNotification(clientId, "Delivery Update", message, "delivery", offerId);

            // Emit notification to specific client
            if (clientSocketId) {
                io.to(clientSocketId).emit('notification', notification); // Send the full notification object
            } else {
                console.log(`Client ${clientId} is not online.`);
            }
        } catch (error) {
            console.error("Error sending delivery update notification:", error);
        }
    });

    socket.on('confirm_delivery_arrival', async ({ clientId, offerId, carModel, message }) => {
        try {
            // Save final arrival notification to DB
            await sendNotification(clientId, "Car Arrived", message, "delivery-final", offerId);
            console.log(`Final arrival notification sent to client ${clientId}`);
        } catch (error) {
            console.error("Error sending final delivery arrival notification:", error);
        }
    });
});


server.listen(process.env.PORT, () => {
    console.log(`Server is running on port http://localhost:${process.env.PORT}`);
});
