const clientControllers = {
  getClients: async (req, res) => {
    try {
      const clients = await db.executeQuery("SELECT * FROM clients");
      res.status(200).json(clients);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },

  addClient: async (req, res) => {
    try {
      const { name, email, phone, address } = req.body;
      const avatar_url = req.file ? `/uploads/clients/${req.file.filename}` : null;
      if (!name || !email || !phone || !address) {
        return res
          .status(400)
          .json({ error: "Name, email, phone, and address are required" });
      }
      const result = await db.executeQuery(
        "INSERT INTO clients (name, email, phone, address, avatar_url) VALUES ($1, $2, $3, $4, $5)",
        [name, email, phone, address, avatar_url || null],
      );
      res
        .status(201)
        .json({
          message: "Client added successfully",
          clientId: result.insertId,
        });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },

  getClientById: async (req, res) => {
    try {
      const { client_id } = req.params;
      const client = await db.executeQuery(
        "SELECT * FROM clients WHERE client_id=$1",
        [client_id],
      );
      if (client.length === 0) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.status(200).json(client[0]);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  },
  
  updateClient: async (req, res) => {
    const { client_id } = req.params;
    const { name, email, phone, address } = req.body;
    const avatar_url = req.file ? `/uploads/clients/${req.file.filename}` : null;   
    try {
      const existingClient = await db.executeQuery(
        "SELECT * FROM clients WHERE client_id=$1",
        [client_id],
      );    
        if (existingClient.length === 0) {
            return res.status(404).json({ error: "Client not found" });
        }
        const updatedClient = {
            name: name || existingClient[0].name,
            email: email || existingClient[0].email,
            phone: phone || existingClient[0].phone,    
        address: address || existingClient[0].address,
        avatar_url: avatar_url || existingClient[0].avatar_url,
      }; 
      await db.executeQuery(
        "UPDATE clients SET name=$1, email=$2, phone=$3, address=$4, avatar_url=$5, updated_at=NOW() WHERE client_id=$6",
        [updatedClient.name, updatedClient.email, updatedClient.phone, updatedClient.address, updatedClient.avatar_url, client_id],
      );
      res.status(200).json({ message: "Client updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }   
}
};

export default clientControllers;
