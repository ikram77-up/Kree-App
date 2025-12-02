import mongoose from "mongoose";

const carSchema = new mongoose.Schema({
    modelCar: {
        type: String,
        required: true,
    },
    brand: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        // required: true,
    },
    km: {
        type: Number,
        required: true,
    },
    color: {
        type: String,
        required: true,
    },
    fuelType: {
        type: String,
        enum: ["essence", "diesel", "hybride", "électrique"],
        default: "essence",
        required: true,
    },
    gearBox: {
        type: String,
        enum: ["manuelle", "automatique"],
        default: "manuelle",
        required: true,
    },
    seats: {
        type: Number,
        default: 5,
        required: true,
    },
    features: {
        gps: { type: Boolean, default: false },
        bluetooth: { type: Boolean, default: false },
        climatisation: { type: Boolean, default: false },
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
},
    {
        timestamps: true,
    }
);

const Car = mongoose.model("Car", carSchema);

export default Car;