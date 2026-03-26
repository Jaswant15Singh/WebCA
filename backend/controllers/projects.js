const projectsController = {
    getAllProjects: async (req, res) => {
        try {
            const projects = await db.executeQuery("SELECT * FROM projects");
            res.status(200).json(projects);
        } catch (error) {
            res.status(500).json({ error: "Internal server error" });
        }
    }
}

export default projectsController