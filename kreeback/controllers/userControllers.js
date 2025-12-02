import User from "../models/user.js";
import Client from "../models/client.js";
import Agency from "../models/agency.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export const registerUser = async (req, res) => {
    try {


        if (!req.body)
            return res.status(400).json({ message: "Invalid or missing JSON body" });


        const { name, email, password, role } = req.body;


        const exist = await User.findOne({ email });


        if (exist) return res.status(400).json({ message: "Email already used" });

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);

        const newUser = new User({ name, email, password: hashedPassword, role });
        await newUser.save();

        let profile = null;
        if (role === "client") {
            const { cin, pictureUrl, phoneNumber } = req.body;
            profile = await Client.create({
                user: newUser._id,
                cin,
                pictureUrl: pictureUrl || null,
                phoneNumber,
            });
        } else if (role === "agency") {
            const { address, city, phoneNumber } = req.body;
            profile = await Agency.create({
                user: newUser._id,
                address,
                city,
                phoneNumber,
            });
        }

        res.status(201).json({ message: "User created successfully", user: newUser, profile });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials " });
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Invalid credentials " });
        }
        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET);
        res.cookie("token", token, { httpOnly: true, secure: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
        let profile = null;
        if (user.role === "client") {
            profile = await Client.findOne({ user: user._id });
        } else if (user.role === "agency") {
            profile = await Agency.findOne({ user: user._id });
        }
        res.status(200).json({ message: "Login successful ", token, user, profile });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getprofile = async (req, res) => {
    try {
        if (!req.user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ user: req.user, profile: req.profile });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const me = async (req, res) => {
    try {
        const token_from_cookie = req.cookies?.token;
        let autorizationHeader = null;
        if (!token_from_cookie) {
            autorizationHeader = req.headers.authorization.split(" ")[1];
        }
        const decoded = jwt.verify(token_from_cookie || autorizationHeader, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        let profile = null;
        if (user.role === "client") {
            profile = await Client.findOne({ user: user._id });
        } else if (user.role === "agency") {
            profile = await Agency.findOne({ user: user._id });
        }
        res.status(200).json({ message: "User found", user, profile });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const logout = async (req, res) => {
    try {
        res.clearCookie("token");
        res.status(200).json({ message: "Logout successful " });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const firebaselogin = async (req, res) => {
    try {
        const { uid, email, name, role } = req.body;
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({
                email,
                name,
                firebaseId: uid,
                role: role === "client" ? "client" : "agency",
            });
        }
        res.status(200).json({ message: "Login successful ", user });
    } catch (error) {
        console.log("error in firebase", error);
        res.status(500).json({ message: "Login failed" });
    }
}

export const updateUserProfile = async (req, res) => {
    try {
        const { name, phoneNumber } = req.body;
        const user = await User.findById(req.user._id);

        if (name) {
            user.name = name;
            await user.save();
        }

        let profile;
        if (req.user.role === 'client') {
            profile = await Client.findOne({ user: req.user._id });
        } else if (req.user.role === 'agency') {
            profile = await Agency.findOne({ user: req.user._id });
        }

        if (profile && phoneNumber) {
            profile.phoneNumber = phoneNumber;
            await profile.save();
        }

        res.status(200).json({ message: "Profile updated successfully", user, profile });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

}

export const updateProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        let profile;
        if (req.user.role === 'client') {
            profile = await Client.findOne({ user: req.user._id });
        } else if (req.user.role === 'agency') {
            profile = await Agency.findOne({ user: req.user._id });
        }

        if (profile) {
            profile.picture = req.file.path;
            await profile.save();
        }

        const user = await User.findById(req.user._id);

        res.status(200).json({ message: 'Profile picture updated successfully.', user, profile });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};