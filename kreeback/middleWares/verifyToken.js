import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Client from "../models/client.js";
import Agency from "../models/agency.js";

export const verifyToken = async (req, res, next) => {
    try {
        const token_from_cookie = req.cookies?.token;
        let authorizationHeader = null;
        if (!token_from_cookie) {
            if (!req.headers.authorization) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            authorizationHeader = req.headers.authorization.split(" ")[1];
        }
        const decoded = jwt.verify(token_from_cookie || authorizationHeader, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (!user) return res.status(401).json({ message: "User not found" });
        let profile = null;
        if (user.role === "client") {
            profile = await Client.findOne({ user: user._id });
        } else if (user.role === "agency") {
            profile = await Agency.findOne({ user: user._id });
        }
        req.user = user;
        req.profile = profile;
        if (user.role === "client") {
            req.isClient = true;
        } else if (user.role === "agency") {
            req.isAgency = true;
        }
        next();

    } catch (error) {
        console.log("error in verifyToken", error);
        res.status(401).json({ message: "invalid token " });
    }
}

