import NameYourPrice from "../models/nameyourprice.js";
import Car from "../models/car.js";
import Client from "../models/client.js";
import Agency from "../models/agency.js";
import Reservation from "../models/reservation.js";
import { io } from "../kree.js";


//clent creer leur proposition
export const createPrice = async (req, res) => {
    console.log("Files received:", req.files);
    console.log("req.body =", req.body);
    try {
        if (!req.isClient) {
            return res.status(403).json({ message: "You are not a client" });
        }

        let cinPath = null;
        let picturePath = null;

        if (req.files && req.files['cin']) {
            cinPath = req.files['cin'][0].path;
        }
        if (req.files && req.files['picture']) {
            picturePath = req.files['picture'][0].path;
        }
        const { carId = null, modelofCar, color, gearbox, fuelType, seats,
            priceMin, priceMax, features, startDate, endDate, pickupLocation,
            returnLocation } = req.body;
        console.log(req.body);
        const proposition = await NameYourPrice.create({
            carId,
            userId: req.user._id,
            cinUrl: cinPath,
            pictureUrl: picturePath,
            modelofCar,
            color,
            gearbox,
            fuelType,
            seats,
            priceMin: Number(priceMin),
            priceMax: Number(priceMax),
            features,
            startDate,
            endDate,
            pickupLocation,
            returnLocation
        });
        //  Notifier toutes les agences 
        // On peuple les infos du client pour les agences
        await proposition.populate('userId', 'name');

        // On envoie à la "room" de toutes les agences
        io.to('agencies_room').emit('new_price_request', proposition);

        console.log("New price request sent to agencies:", proposition._id);
        res.status(201).json({
            message: "Price created successfully", proposition,
            client: req.profile
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


//voir tous le propositions par le calient 
export const getAllpropositionPrices = async (req, res) => {
    try {
        if (!req.isClient) {
            return res.status(403).json({ message: "You are not a client" });
        }
        const prices = await NameYourPrice.find({ userId: req.user._id })
            .populate({
                path: "carId",
                select: "modelCar brand color image km fuelType gearBox seats features",
                populate: { path: "userId", select: "name role" },
            });
        const pricesWithProfiles = [];
        for (const price of prices) {
            const priceObj = price.toObject();
            // si voiture de ce agence 
            if (price.carId?.userId?.role === "agency") {
                const agencyProfile = await Agency.findOne({ user: price.carId.userId._id });
                priceObj.agencyProfile = agencyProfile;
            }
            pricesWithProfiles.push(priceObj);
        }
        console.log(pricesWithProfiles);
        res.status(200).json({ message: "your request send success", data: pricesWithProfiles });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
// agenve voir tous les propositions par ses voitures
export const getAllpropositionPricesByCar = async (req, res) => {
    try {
        if (!req.isAgency) {
            return res.status(403).json({ message: "You are not an agence" });
        }


        const cars = await Car.find({ userId: req.user._id }).select("_id");
        const carIds = cars.map(car => car._id);

        const prices = await NameYourPrice.find({ carId: { $in: carIds } })
            .populate("userId", "name email role")
            .populate({
                path: "carId",
                select: "modelCar brand color image km fuelType gearBox seats features",
                populate: { path: "userId", select: "name role" },
            });
        const pricesWithProfiles = [];
        for (const price of prices) {
            const priceObj = price.toObject();

            if (price.userId?.role === "client") {
                const clientProfile = await Client.findOne({ user: price.userId._id });
                priceObj.clientProfile = clientProfile;
            }
            pricesWithProfiles.push(priceObj);
        }
        res.status(200).json(pricesWithProfiles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const acceptpriceByAgence = async (req, res) => {
    try {
        if (!req.isAgency) {
            return res.status(403).json({ message: "You are not an agence" });
        }
        const { propositionId } = req.params;
        const proposition = await NameYourPrice.findById(propositionId)
            .populate("carId")
            .populate("userId");
        if (!proposition) {
            return res.status(404).json({ message: "Proposition not found" });
        }
        if (proposition.status === "accepted") {
            return res.status(400).json({ message: "Proposition already accepted" });
        }
        if (proposition.carId.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You are not the owner of this car" });
        }

        proposition.status = "accepted";
        await proposition.save();
        const reservation = await Reservation.create({
            userId: proposition.userId._id,
            nameYourPriceId: proposition._id,
            offreId: proposition._id,
            agenceId: req.user._id,
            carId: proposition.carId._id,
            startDate: proposition.startDate,
            endDate: proposition.endDate,
            pickupLocation: proposition.pickupLocation,
            returnLocation: proposition.returnLocation,
            totalPrice: proposition.offeredPrice,
            status: "accepted",
            paymentStatus: "pending"
        })
        res.status(200).json({ message: "Price accepted successfully", reservation });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

