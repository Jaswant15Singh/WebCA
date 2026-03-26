import express from "express";
import projectsController from "../controllers/projects.js";
const router=express.Router();

router.get("/get-projects", projectsController.getAllProjects);
export default router;