import express from "express";
import projectsController from "../controllers/projects.js";
import { projectUploader } from "../middlewares/multer.js";
import authMiddleware from "../middlewares/auth.js";
const router=express.Router();

router.get("/get-projects", authMiddleware, projectsController.getAllProjects);
router.post(
  "/add-project",
  authMiddleware,
  projectUploader.single("cover_image_url"),
  projectsController.addProject,
);
router.put("/update-project/:id", authMiddleware, projectUploader.single("cover_image_url"), projectsController.updateProject);
router.get("/get-project/:project_id", authMiddleware, projectsController.getProjectId);
// router.delete("/delete-project/:id", authMiddleware, projectsController.deleteProject);

export default router;