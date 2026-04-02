import express from "express";
import projectsController from "../controllers/projects.js";
import { projectUploader } from "../middlewares/multer.js";
const router=express.Router();

router.get("/get-projects", projectsController.getAllProjects);
router.post(
  "/add-project",
  projectUploader.single("cover_image_url"),
  projectsController.addProject,
);
router.put("/update-project/:id", projectUploader.single("cover_image_url"), projectsController.updateProject);
router.get("/get-project/:project_id", projectsController.getProjectId);
// router.delete("/delete-project/:id", projectsController.deleteProject);

export default router;