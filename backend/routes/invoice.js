import express from "express";
const router=express.Router();
import invoiceController from "../controllers/invoice.js";
import authMiddleware from "../middlewares/auth.js";
router.get("/all-invoices", authMiddleware, invoiceController.getAllInvoices);
router.get("/invoice-by-project/:id", authMiddleware, invoiceController.getInvoiceByProjects);
router.get("/invoice-by-id/:id", authMiddleware, invoiceController.getInvoiceById);
export default router;
