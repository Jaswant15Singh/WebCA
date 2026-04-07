const notificationController = {
  getNotifications: async (req, res) => {
    const { admin_id } = req.params;
    try {
      const notifications = await db.executeQuery(
        `SELECT 
  (p.deadline - INTERVAL '1 month')::DATE AS deadline_period,
    p.deadline:: Date as project_deadline,
    p.title as project_name,
    p.project_id,
    c.name as client_name
    FROM projects p
    INNER JOIN admins a ON p.owner_id = a.admin_id
    INNER JOIN clients c ON c.client_id = p.client_id
    WHERE a.admin_id = $1
    AND (p.deadline - INTERVAL '1 month')::DATE <= CURRENT_DATE
    and p.status not in ('completed') and p.deadline >= CURRENT_DATE`,
        [admin_id],
      );
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Error fetching notifications", error });
    }
  },

  dueProjects: async (req, res) => {
    const { admin_id } = req.params;
    try {
      const dueProjects = await db.executeQuery(
        `SELECT 
   p.deadline:: Date as project_deadline,
    p.title as project_name,
    p.project_id,
    c.name as client_name
FROM projects p
INNER JOIN admins a ON p.owner_id = a.admin_id
INNER JOIN clients c ON c.client_id = p.client_id
WHERE a.admin_id = $1
AND p.deadline <= CURRENT_DATE
and p.status not in ('completed')`,
        [admin_id],
      );
      res.json(dueProjects);
    } catch (error) {
      res.status(500).json({ message: "Error fetching due projects", error });
    }
  },
};
export default notificationController;
