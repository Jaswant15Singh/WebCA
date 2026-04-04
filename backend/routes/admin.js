import express from "express";
import adminControllers from "../controllers/admin.js";
import authMiddleware from "../middlewares/auth.js";
const router=express.Router();
router.get("/",authMiddleware,adminControllers.getAdmins);
router.post("/register",adminControllers.registerAdmin);
router.post("/login",adminControllers.adminLogin);
router.get("/info/:admin_id",authMiddleware,adminControllers.adminInfo);
export default router;