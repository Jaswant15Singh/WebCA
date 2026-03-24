import express from "express";
import { uploadClientImage } from "../middlewares/multer.js";
import clientControllers from "../controllers/clients.js";
const router=express.Router();
router.get("/get-clients", clientControllers.getClients);
router.post("/add-client",uploadClientImage, clientControllers.addClient);
export default router;