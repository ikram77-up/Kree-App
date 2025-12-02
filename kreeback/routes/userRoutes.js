import express from "express";
import multer from "multer";
import path from "path";
import {
    registerUser,
    loginUser,
    me,
    // getUser,
    // logoutUser,
    updateUserProfile,
    updateProfilePicture
} from "../controllers/userControllers.js";
import { verifyToken } from "../middleWares/verifyToken.js";

const routes = express.Router();

// Multer config for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profile_pictures/');
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });


routes.post("/register", registerUser);
routes.post("/user/login", loginUser);
routes.get("/me", verifyToken, me);
// routes.get("/user", verifyToken, getUser);
routes.put("/profile", verifyToken, updateUserProfile);
routes.put("/profile/picture", verifyToken, upload.single('profilePicture'), updateProfilePicture);
// routes.post("/logout", logoutUser);

export default routes;  