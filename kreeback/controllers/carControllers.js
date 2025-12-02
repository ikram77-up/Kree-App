import Car from "../models/car.js";
import Agency from "../models/agency.js";


const toBoolean = (value) => String(value) === 'true';
export const createCar = async (req, res) => {
    console.log("Body received:", req.body);
    console.log("Files received:", req.files);
    const {
        modelCar, brand, km, color, fuelType, gearBox, seats,
        gps, bluetooth, climatisation 
    } = req.body;
    try {
        if (!req.isAgency) {
            return res.status(403).json({ message: "You are not an agency" });
        }
        let imagePath = req.file ? req.file.path : null;
        if (!imagePath) {
            return res.status(400).json({ message: "The car image is mandatory." });
        }
        const car = await Car.create({
            userId: req.user._id,
            modelCar,
            brand,
            km: Number(km),
            color,
            fuelType,
            gearBox,
            seats: Number(seats),
            image: imagePath,
            features: {
                gps: toBoolean(gps), 
                bluetooth: toBoolean(bluetooth),
                climatisation: toBoolean(climatisation),
            },
        });
        await car.populate("userId", "name role");
        res.status(201).json({ message: "Car created successfully", car });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

export const getAllCars = async (req, res) => {
    try {
        const cars = await Car.find().populate("userId", "name role");
        const carsWithProfiles = [];
        for (const car of cars) {
            const carObj = car.toObject();
            if (car.userId?.role === "agency") {
                const agencyProfile = await Agency.findOne({ user: car.userId._id });
                carObj.agencyProfile = agencyProfile;
            }
            carsWithProfiles.push(carObj);
        }
        res.status(200).json(carsWithProfiles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getCarbyId = async (req, res) => {
    try {
        const car = await Car.findById(req.params.id).populate("userId", "name role");
        if (!car) return res.status(404).json({ message: "Car not found" });
        const carObj = car.toObject();
        if (car.userId?.role === "agency") {
            const agencyProfile = await Agency.findOne({ user: car.userId._id });
            carObj.agencyProfile = agencyProfile;
        }
        res.status(200).json(carObj);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const updateCar = async (req, res) => {
   
        const {
            modelCar, brand, km, color, fuelType, gearBox, seats,
            gps, bluetooth, climatisation
    } = req.body;
    try {
        if (!req.isAgency) {
            return res.status(403).json({ message: "You are not an agency" });
        }
        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ message: "Car not found" });
        if (car.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You are not an agency" });
        }
    
        const newImagePath = req.file ? req.file.path : car.image
        car.modelCar = modelCar || car.modelCar;
        car.brand = brand || car.brand;
        car.color = color || car.color;
        car.fuelType = fuelType || car.fuelType;
        car.gearBox = gearBox || car.gearBox;
        car.image = newImagePath;
        car.km = km ? Number(km) : car.km;
        car.seats = seats ? Number(seats) : car.seats;
        car.features.gps = toBoolean(gps);
        car.features.bluetooth = toBoolean(bluetooth);
        car.features.climatisation = toBoolean(climatisation);
        
        await car.save();
        await car.populate("userId", "name role");
        const carObj = car.toObject();
        if (car.userId?.role === "agency") {
            const agencyProfile = await Agency.findOne({ user: car.userId._id });
            carObj.agencyProfile = agencyProfile;
        }
        res.status(200).json({ message: "Car updated successfully", car: carObj });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const deleteCar = async (req, res) => {
    try {
        if (!req.isAgency) {
            return res.status(403).json({ message: "You are not an agency " });
        }
        const car = await Car.findById(req.params.id);
        if (!car) return res.status(404).json({ message: "Car not found" });
        if (car.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You are not an agency " });
        }
        await car.deleteOne();
        res.status(200).json({ message: "Car deleted successfully ", car });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
