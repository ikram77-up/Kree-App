import express from "express";
import {
    createOffre,
    getoffresforclient,
    getMyOfrres,
    answeroffrebyclient
} from "../controllers/agenceOffredControllers.js"
import { verifyToken } from "../middleWares/verifyToken.js"

const routesAgenceOffred = express.Router();

routesAgenceOffred.post("/offres", verifyToken, createOffre);
routesAgenceOffred.get("/offres/client", verifyToken, getoffresforclient);
routesAgenceOffred.get("/offres", verifyToken, getMyOfrres);
routesAgenceOffred.put("/offres/answer", verifyToken, answeroffrebyclient);

export default routesAgenceOffred;