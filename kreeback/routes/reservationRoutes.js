import express from "express";
import {

    getAllreservations,
    getreservationsbyId,
    updateStatus,
    updatePayment,
    updateReservation,
    deleteReservation

} from "../controllers/reservationControllers.js"
import { verifyToken } from "../middleWares/verifyToken.js"

const routesReservation = express.Router();

routesReservation.get("/reservation", getAllreservations);
routesReservation.get("/reservation/:id", getreservationsbyId);
routesReservation.put("/reservation/status/:id", verifyToken, updateStatus);
routesReservation.put("/reservation/payment/:id", verifyToken, updatePayment);
routesReservation.put("/reservation/update/:id", verifyToken, updateReservation);
routesReservation.delete("/reservation/delete/:id", verifyToken, deleteReservation);


export default routesReservation;