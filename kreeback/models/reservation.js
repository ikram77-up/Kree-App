import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    nameYourPriceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NameYourPrice",
        required: true,
    },
    offreId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AgenceOffred",
        required: true,
    },
    agenceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        required: true,
    },
    carId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Car",
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    pickupLocation: { // le client choisir la localisation de départ
        type: String,
        required: true,
    },
    returnLocation: { // le client choisir la localisation de retour
        type: String,
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid"],
        default: "pending",
    },
},
    {
        timestamps: true,
    }
);
const Reservation = mongoose.model("Reservation", reservationSchema);

export default Reservation;