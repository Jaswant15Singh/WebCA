import express from "express";
import dotenv from "dotenv";
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
global.now = moment();
const app=express();
app.use(express.static(path.join(process.cwd(), "public")));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({extended:true}))
global.db=new DatabaseClass();
app.use("/admin", adminRoutes);
app.use("/clients", clientRoutes);
app.use("/projects", projectRoutes);
app.use("/invoice",invoiceRoutes);
app.use("/notifications", notificationRoutes);

app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`);
})