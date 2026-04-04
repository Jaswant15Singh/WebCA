import express from "express";
const router=express.Router();
import invoiceController from "../controllers/invoice.js";
router.get("/",invoiceController.getAllInvoices);
export default router;