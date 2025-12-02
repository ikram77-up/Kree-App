import express from "express";
import {
    createPrice,
    getAllpropositionPrices,
    getAllpropositionPricesByCar,
    acceptpriceByAgence

} from "../controllers/nameYourPriceControllers.js"
import { verifyToken } from "../middleWares/verifyToken.js"
import multer from "multer";
import path from "path";


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nom unique
    }
});
const upload = multer({ storage: storage });

//  Configuration des champs à recevoir (cin et picture)
const uploadFields = upload.fields([
    { name: 'cin', maxCount: 1 },
    { name: 'picture', maxCount: 1 }
]);

const routesNameYourPrice = express.Router();

routesNameYourPrice.post("/price", verifyToken,uploadFields, createPrice);
routesNameYourPrice.get("/price", verifyToken, getAllpropositionPrices);
routesNameYourPrice.get("/price/client", verifyToken, getAllpropositionPricesByCar);
routesNameYourPrice.put("/price/accept/:id", verifyToken, acceptpriceByAgence);

export default routesNameYourPrice;