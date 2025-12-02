import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        cin: {
            type: String,
            required: true,
            trim: true,
        },
        pictureUrl: {
            type: String,
            default: null,
        },
        phoneNumber: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: true }
);

const Client = mongoose.model("Client", clientSchema);

export default Client;


