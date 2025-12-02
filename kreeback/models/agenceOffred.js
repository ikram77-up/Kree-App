import mongoose from "mongoose";

const agenceOffredSchema = new mongoose.Schema({
    agenceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // agence va repomdre 
        required: true,
    },
    carId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Car",
        required: true,
    },
    offrePrice: {
        type: Number,
        required: true,
    },
    nameyourpriceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NameYourPrice",
        required: true,
    },
    message: {
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

const AgenceOffred = mongoose.model("AgenceOffred", agenceOffredSchema);

export default AgenceOffred;
