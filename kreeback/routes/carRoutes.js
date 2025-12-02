import express from "express";
import {
    createCar,
    getAllCars,
    getCarbyId,
    updateCar,
    deleteCar
} from "../controllers/carControllers.js"
import { verifyToken } from "../middleWares/verifyToken.js"
import path from "path";
import multer from "multer";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const routesCar = express.Router();

routesCar.post("/car", verifyToken, upload.single('image'), createCar);
routesCar.get("/car", getAllCars);
routesCar.get("/car/:id", getCarbyId);
routesCar.put("/car/update/:id", verifyToken, upload.single('image'), updateCar);
routesCar.delete("/car/delete/:id", verifyToken, deleteCar);

export default routesCar;
