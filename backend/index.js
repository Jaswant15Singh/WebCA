import express from "express";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();
import DatabaseClass from "./db/db.js";
import adminRoutes from "./routes/admin.js";
import clientRoutes from "./routes/clients.js";
import projectRoutes from "./routes/projects.js";
import invoiceRoutes from "./routes/invoice.js";        
import notificationRoutes from "./routes/notifications.js";
import morgan from "morgan";
import moment from "moment";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");
const frontendDir = path.resolve(__dirname, "..", "frontend");

global.now = moment();
const app=express();
app.use(
  cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use("/uploads", express.static(path.join(publicDir, "uploads")));
app.use("/frontend", express.static(frontendDir));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({extended:true}))
global.db=new DatabaseClass();
app.get("/", (_req, res) => {
    res.redirect("/frontend/index.html");
});
app.use("/admin", adminRoutes);
app.use("/clients", clientRoutes);
app.use("/projects", projectRoutes);
app.use("/invoice",invoiceRoutes);
app.use("/notifications", notificationRoutes);

app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`);
})
