import express from "express";
import adminControllers from "../controllers/admin.js";
const router=express.Router();
// router.get("/",adminControllers.getAdmins);
router.post("/register",adminControllers.registerAdmin);
router.post("/login",adminControllers.adminLogin);
router.get("/info/:admin_id",adminControllers.adminInfo);
export default router;