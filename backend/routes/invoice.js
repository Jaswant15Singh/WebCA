import express from "express";
const router=express.Router();
import invoiceController from "../controllers/invoice.js";
router.get("/all-invoices",invoiceController.getAllInvoices);
router.get("/invoice-by-project/:id", invoiceController.getInvoiceByProjects);
router.get("/invoice-by-id/:id", invoiceController.getInvoiceById);
export default router;