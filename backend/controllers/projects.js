const projectSummaryBaseQuery = `
  SELECT
    p.project_id,
    p.title,
    p.description,
    p.client_id,
    p.owner_id,
    p.type,
    p.status,
    p.tags,
    p.start_date,
    p.deadline,
    p.budget,
    p.budget_currency,
    p.cover_image_url,
    p.brief,
    p.created_at,
    p.updated_at,
    c.name AS client_name,
    COALESCE(SUM(pl.paid_amount), 0) AS paid_amount,
    COALESCE(p.budget, 0) AS total_amount,
    GREATEST(COALESCE(p.budget, 0) - COALESCE(SUM(pl.paid_amount), 0), 0) AS remaining_amount
  FROM projects p
  INNER JOIN clients c ON c.client_id = p.client_id
  LEFT JOIN project_logs pl ON p.project_id = pl.project_id
`;

const projectsController = {
  getAllProjects: async (req, res) => {
    try {
      const ownerId = req.admin.id;
      const projects = await db.executeQuery(
        `${projectSummaryBaseQuery}
         WHERE p.owner_id = $1 AND COALESCE(p.status, '') <> 'cancelled'
         GROUP BY p.project_id, c.client_id, c.name
         ORDER BY p.project_id DESC`,
        [ownerId],
      );
      res.status(200).json(projects);
    } catch (error) {
      res.status(500).json({ error: error.publicMessage || "Internal server error" });
    }
  },

  addProject: async (req, res) => {
    const {
      title,
      description,
      client_id,
      type,
      status,
      tags,
      start_date,
      deadline,
      budget,
      budget_currency,
      paid_amount,
      brief,
    } = req.body;
    const ownerId = req.admin.id;
    const cover_image_url = req.file ? `/uploads/projects/${req.file.filename}` : null;
      const validTypes = ["fixed", "retainer", "hourly"];
      const validStatuses = [
        "draft",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ];

      if (type && !validTypes.includes(type)) {
        return res
          .status(400)
          .json({
            error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
          });
      }
      if (status && !validStatuses.includes(status)) {
        return res
          .status(400)
          .json({
            error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          });
      }

    try {
      const client = await db.executeQuery(
        "SELECT client_id FROM clients WHERE client_id = $1 AND owner_id = $2",
        [client_id, ownerId],
      );

      if (client.length === 0) {
        return res.status(404).json({ error: "Client not found for this admin" });
      }

      const paidAmountValue = paid_amount ? parseFloat(paid_amount) : 0;
      const budgetValue = budget ? parseFloat(budget) : 0;
      const remainingAmount = Math.max(budgetValue - paidAmountValue, 0);
      const result = await db.executeQuery(
        "INSERT INTO projects (title, description, client_id, owner_id, type, status, tags, start_date, deadline, budget, budget_currency, cover_image_url, brief, remaining_amount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING project_id",
        [
          title,
          description,
          client_id,
          ownerId,
          type,
          status,
          tags,
          start_date,
          deadline,
          budget,
          budget_currency,
          cover_image_url,
          brief,
          remainingAmount
        ],
      );
      
      
      await db.executeQuery(
        "INSERT INTO project_logs (project_id,total_amount,paid_amount) VALUES ($1,$2,$3)",
        [result[0].project_id, budgetValue, paidAmountValue],
      );
      await db.executeQuery(
        "INSERT INTO invoice (project_id,client_id,total_amount,paid_amount,payment_date) VALUES ($1,$2,$3,$4,NOW())",
        [result[0].project_id, client_id, budgetValue, paidAmountValue],
      );
      res
        .status(201)
        .json({
          message: "Project added successfully",
          projectId: result[0].project_id,
        });
    } catch (error) {
      res.status(500).json({ error: error.publicMessage || "Internal server error" });
    }
  },

  updateProject: async (req, res) => {
    const ownerId = req.admin.id;
    const { id } = req.params;
    const {
      description,
      title,
      client_id,
      type,
      status,
      tags,
      start_date,
      deadline,
      budget,
      budget_currency,
      brief,
      paid_amount
    } = req.body;
      const validTypes = ["fixed", "retainer", "hourly"];
      const validStatuses = [
        "draft",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ];

      if (type && !validTypes.includes(type)) {
        return res
          .status(400)
          .json({
            error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
          });
      }
      if (status && !validStatuses.includes(status)) {
        return res
          .status(400)
          .json({
            error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          });
      }

    try {
      const existing = await db.executeQuery(
        `${projectSummaryBaseQuery}
         WHERE p.project_id = $1 AND p.owner_id = $2
         GROUP BY p.project_id, c.client_id, c.name`,
        [id, ownerId],
      );
      if (existing.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }
      const current = existing[0];
      const additionalPaid = paid_amount ? parseFloat(paid_amount) : 0;
      const budgetValue = budget ? parseFloat(budget) : parseFloat(current.budget || 0);
      const currentPaid = parseFloat(current.paid_amount || 0);
      const remainingAmount = Math.max(budgetValue - currentPaid - additionalPaid, 0);
      const avatar_url = req.file
        ? `/uploads/projects/${req.file.filename}`
        : current.cover_image_url;

      const nextClientId = client_id || current.client_id;
      const client = await db.executeQuery(
        "SELECT client_id FROM clients WHERE client_id = $1 AND owner_id = $2",
        [nextClientId, ownerId],
      );

      if (client.length === 0) {
        return res.status(404).json({ error: "Client not found for this admin" });
      }

      const updatedProject = {
        title: title || current.title,
        description: description || current.description,
        client_id: nextClientId,
        owner_id: current.owner_id,
        type: type || current.type,
        status: status || current.status,
        tags: tags || current.tags,
        start_date: start_date || current.start_date,
        deadline: deadline || current.deadline,
        budget: budgetValue,
        budget_currency: budget_currency || current.budget_currency,
        cover_image_url: avatar_url,
        brief: brief || current.brief,
        remaining_amount: remainingAmount,  
      };
      
      await db.executeQuery(
        "UPDATE projects SET title = $1, description = $2, client_id = $3, owner_id = $4, type = $5, status = $6, tags = $7, start_date = $8, deadline = $9, budget = $10, budget_currency = $11, cover_image_url = $12, brief = $13, remaining_amount = $14,updated_at = NOW() WHERE project_id = $15",
        [
          updatedProject.title,
          updatedProject.description,
          updatedProject.client_id,
          updatedProject.owner_id,
          updatedProject.type,
          updatedProject.status,
          updatedProject.tags,
          updatedProject.start_date,
          updatedProject.deadline,
          updatedProject.budget,
          updatedProject.budget_currency,
          updatedProject.cover_image_url,
          updatedProject.brief,
          updatedProject.remaining_amount,
          id
        ],
      );
      if (additionalPaid > 0) {
        await db.executeQuery(
          "INSERT INTO invoice (project_id,client_id,total_amount,paid_amount,payment_date) VALUES ($1,$2,$3,$4,NOW())",
          [id, updatedProject.client_id, updatedProject.budget, additionalPaid],
        );
        await db.executeQuery(
          "INSERT INTO project_logs (project_id,total_amount,paid_amount) VALUES ($1,$2,$3)",
          [id, updatedProject.budget, additionalPaid],
        );
      }
      res.status(200).json({ message: "Project updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.publicMessage || "Internal server error" });
    }
  },
  getProjectId:async(req,res)=>{
    try {
      const ownerId = req.admin.id;
      const {project_id}=req.params;
      const project = await db.executeQuery(
        `${projectSummaryBaseQuery}
         WHERE p.project_id = $1 AND p.owner_id = $2
         GROUP BY p.project_id, c.client_id, c.name`,
        [project_id, ownerId],
      );
      if(project.length===0){
        return res.status(404).json({error:"Project not found"});
      }
      res.status(200).json(project[0]);
    } catch (error) {
      res.status(500).json({ error: error.publicMessage || "Internal server error" });
    }
  },
  deleteProject: async (req, res) => {
    try {
      const ownerId = req.admin.id;
      const { id } = req.params;
      const existingProject = await db.executeQuery(
        "SELECT * FROM projects WHERE project_id = $1 AND owner_id = $2",
        [id, ownerId],
      );

      if (existingProject.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }

      await db.executeQuery(
        "DELETE FROM projects WHERE project_id = $1 AND owner_id = $2",
        [id, ownerId],
      );

      res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.publicMessage || "Internal server error" });
    }
  }
};

export default projectsController;
