import mongoose from "mongoose";

const nameYourPriceSchema = new mongoose.Schema({
    carId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Car", // Référence au modèle Car
        default: null, // client n'a pas rencontré de voiture de l'agence 
    },
    cinUrl: {
        type: String,
        default: null
    },
    pictureUrl: {
        type: String,
        default: null
    },
    modelofCar: {
        type: String
    },
    color: {
        type: String
    },
    gearbox: {
        type: String
    },
    fuelType: {
        type: String
    },
    seats: {
        type: String
    },
    priceMin: { // prix MIN par client
        type: Number
    },
    priceMax: { // prix Max par client
        type: Number
    },
    features: [{ type: String }],
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 5 * 60 * 1000)
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // le client qui va propose le prix 
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
    pickupLocation: {
        type: String,
        required: true,
    },
    returnLocation: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },

},
    {
        timestamps: true,
    }
);
const NameYourPrice = mongoose.model("NameYourPrice", nameYourPriceSchema);

export default NameYourPrice;