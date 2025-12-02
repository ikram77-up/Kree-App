import AgenceOffred from "../models/agenceOffred.js";
import Client from "../models/client.js";
import Car from "../models/car.js";
import Agency from "../models/agency.js";
import Reservation from "../models/reservation.js";
import NameYourPrice from "../models/nameyourprice.js";
import { sendNotification } from "../controllers/notificationController.js";


//agence creer une offre 
export const createOffre = async (req, res) => {
    try {
        if (!req.isAgency) {
            return res.status(403).json({ message: "you are not agency" });
        }
        const { carId, nameyourpriceId, offrePrice, message } = req.body;
        if (!carId || !nameyourpriceId || !offrePrice || !message) {
            return res.status(400).json({ message: "all fields are required" });
        }
        const car = await Car.findOne({ _id: carId, userId: req.user._id });
        if (!car) {
            return res.status(403).json({ message: "This car does not belong to your agency" });
        }

        const demandeClient = await NameYourPrice.findById(nameyourpriceId);

        if (!demandeClient) {
            return res.status(404).json({ message: "This request no longer exists." });
        }

        const offre = await AgenceOffred.create({
            agenceId: req.user._id,
            carId,
            nameyourpriceId,
            offrePrice,
            message,
        });

        //envoi de notification au client qui a fait la demande de offre 
        await sendNotification(
            demandeClient.userId,
            "New offer received!",
            `The agency ${req.user.name} offers you ${offrePrice} MAD for your trip.`,
            "offre"
        );
        res.status(201).json({ message: "offre created successfully", offre });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
//le client va voir tous les offres qui lui sont envoyees
export const getoffresforclient = async (req, res) => {
    try {
        if (!req.isClient) {
            return res.status(403).json({ message: "you are not client" });
        }
        const offres = await AgenceOffred.find()
            .populate({
                path: "nameyourpriceId",
                match: { userId: req.user._id },
                populate: { path: "userId", select: "name email" },
            })
            .populate("agenceId", "name email")
            .populate({
                path: "carId",
                select: "modelCar brand color image km fuelType gearBox seats features",
                populate: { path: "userId", select: "name role" },
            });
        const filteredOffres = offres.filter(o => o.nameyourpriceId);
        const offresWithProfiles = [];
        for (const offre of filteredOffres) {
            const offreObj = offre.toObject();
            if (offre.agenceId?.role === "agency") {
                const agencyProfile = await Agency.findOne({ user: offre.agenceId._id });
                offreObj.agencyProfile = agencyProfile;
            }
            offresWithProfiles.push(offreObj);
        }
        res.status(200).json(offresWithProfiles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
//agence repond au demande de client
export const answeroffrebyclient = async (req, res) => {
    try {
        const { offreId, status } = req.body;

        const offre = await AgenceOffred.findById(offreId)
            .populate("nameyourpriceId")
            .populate("carId")
            .populate("agenceId");

        if (!offre) return res.status(404).json({ message: "offre not found" });

        if (offre.nameyourpriceId.userId._id.toString() !== req.user._id.toString())
            return res.status(403).json({ message: "you are not the owner of this offre" });

        offre.status = status;
        await offre.save();

        if (status === "accepted") {
            const reservation = await Reservation.create({
                userId: req.user._id,
                carId: offre.carId._id,
                offreId: offre._id,
                agenceId: offre.agenceId._id,
                nameYourPriceId: offre.nameyourpriceId._id,
                startDate: offre.nameyourpriceId.startDate,
                endDate: offre.nameyourpriceId.endDate,
                pickupLocation: offre.nameyourpriceId.pickupLocation,
                returnLocation: offre.nameyourpriceId.returnLocation,
                totalPrice: offre.offrePrice,
                status: "accepted",
                paymentStatus: "pending",
            });
            await NameYourPrice.findByIdAndUpdate(offre.nameyourpriceId._id, {
                status: "accepted"
            });

            const notificationMessage = `The client ${req.user.name} has accepted your offer of ${offre.offrePrice} DHS for the ${offre.carId.modelCar}. A reservation has been created.`;

            await sendNotification(
                offre.agenceId._id,
                "Offer Accepted and Reservation Created",
                notificationMessage,
                "reservation"
            );

            return res.status(200).json({ message: "offre accepted", offre, reservation });

        } else { // status === 'rejected'
            const notificationMessage = `Your offer for ${offre.carId.brand} has been REFUSED by the client.`;

            await sendNotification(
                offre.agenceId._id,
                "Offer Rejected",
                notificationMessage,
                "offre"
            );
            return res.status(200).json({ message: "Offer updated", offre });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


//agence voit tous ses offres
export const getMyOfrres = async (req, res) => {
    try {
        if (!req.isAgency) {
            return res.status(403).json({ message: "you are not agency" });
        }
        const offres = await AgenceOffred.find({ agenceId: req.user._id })
            .populate({
                path: "carId",
                select: "modelCar brand color image km fuelType gearBox seats features",
                populate: { path: "userId", select: "name role" },
            })
            .populate({
                path: "nameyourpriceId",
                populate: { path: "userId", select: "name email" },
            });
        const offresWithProfiles = [];
        for (const o of offres) {
            const offreObj = {
                _id: o._id,
                carId: o.carId,
                nameyourpriceId: o.nameyourpriceId,
                message: o.message,
                status: o.status
            };
            if (o.nameyourpriceId?.userId?.role === "client") {
                const clientProfile = await Client.findOne({ user: o.nameyourpriceId.userId._id });
                offreObj.clientProfile = clientProfile;
            }
            offresWithProfiles.push(offreObj);
        }
        res.status(200).json(offresWithProfiles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
