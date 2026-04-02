const projectsController = {
  getAllProjects: async (req, res) => {
    try {
      const projects = await db.executeQuery("SELECT p.*, pl.total_amount, pl.paid_amount, pl.pending_amount FROM projects p inner join project_logs pl on p.project_id = pl.project_id");
      res.status(200).json(projects.rows);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },

  addProject: async (req, res) => {
    const {
      title,
      description,
      client_id,
      owner_id,
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
    const cover_image_url = req.file ? `/uploads/${req.file.filename}` : null;
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
      const paidAmountValue = paid_amount ? parseFloat(paid_amount) : 0;
      const remainingAmount = budget ? parseFloat(budget) - paidAmountValue : 0;
      const result = await db.executeQuery(
        "INSERT INTO projects (title, description, client_id, owner_id, type, status, tags, start_date, deadline, budget, budget_currency, cover_image_url, brief, remaining_amount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING project_id",
        [
          title,
          description,
          client_id,
          owner_id,
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
      
      
      await db.executeQuery('Insert into project_logs (project_id,total_amount,paid_amount) values ($1,$2,$3) ',[result[0].project_id,budget,paidAmountValue]);
      await db.executeQuery('INSERT INTO invoice (project_id,client_id,total_amount,paid_amount,payment_date) values ($1,$2,$3,$4,NOW())',[result[0].project_id,client_id,budget,paidAmountValue]);
      res
        .status(201)
        .json({
          message: "Project added successfully",
          projectId: result[0].project_id,
        });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },

  updateProject: async (req, res) => {
    const { id } = req.params;
    const {
      description,
      title,
      client_id,
      owner_id,
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
        "SELECT p.*, pl.total_amount, pl.paid_amount FROM projects p inner join project_logs pl on p.project_id = pl.project_id WHERE p.project_id = $1",
        [id],
      );
      if (existing.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }      
       const amount_left = existing[0].remaining_amount;
       const remainingAmount =amount_left - (paid_amount ? parseFloat(paid_amount) : 0);       
      const current = existing[0];
      const avatar_url = req.file
        ? `/uploads/${req.file.filename}`
        : current.cover_image_url;
      const updatedProject = {
        title: title || current.title,
        description: description || current.description,
        client_id: client_id || current.client_id,
        owner_id: owner_id || current.owner_id,
        type: type || current.type,
        status: status || current.status,
        tags: tags || current.tags,
        start_date: start_date || current.start_date,
        deadline: deadline || current.deadline,
        budget: budget || current.budget,
        budget_currency: budget_currency || current.budget_currency,
        cover_image_url: avatar_url,
        brief: brief || current.brief,
        remaining_amount: remainingAmount || current.remaining_amount,  
      };
      
      await db.executeQuery(
        "UPDATE projects SET title = $1, description = $2, client_id = $3, owner_id = $4, type = $5, status = $6, tags = $7, start_date = $8, deadline = $9, budget = $10, budget_currency = $11, cover_image_url = $12, brief = $13, remaining_amount = $14,updated_at = NOW() WHERE project_id = $15",
        [
          title,
          description,
          client_id,
          owner_id,
          type,
          status,
          tags,
          start_date,
          deadline,
          budget,
          budget_currency,
          avatar_url,
          brief,
          remainingAmount,
          id
        ],
      );
      await db.executeQuery('INSERT INTO invoice (project_id,client_id,total_amount,paid_amount,payment_date) values ($1,$2,$3,$4,NOW())',[id,client_id,budget,paid_amount ? parseFloat(paid_amount) : 0]);
      const paidAmountValue = paid_amount ? parseFloat(paid_amount) : 0;
            await db.executeQuery(
              "Insert into project_logs (project_id,total_amount,paid_amount) values ($1,$2,$3) ",
              [id, budget, paidAmountValue],
            );
      res.status(200).json({ message: "Project updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
  getProjectId:async(req,res)=>{
    try {
      const {project_id}=req.params;
      const project=await db.executeQuery("SELECT * FROM projects WHERE project_id=$1",[project_id]);
      if(project.length===0){
        return res.status(404).json({error:"Project not found"});
      }
      res.status(200).json(project[0]);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

export default projectsController;
