const clientControllers={
    getClients:async(req,res)=>{
        try {
            const clients=await db.executeQuery("SELECT * FROM clients");
            res.status(200).json(clients);
        } catch (error) {
            res.status(500).json({ error: "Internal server error" });
        }
    },

    addClient:async(req,res)=>{
        try {
            const { name, email,phone,address,avatar_url } = req.body;
            if (!name || !email || !phone || !address) {
                return res.status(400).json({ error: "Name, email, phone, and address are required" });
            }
            const result=await db.executeQuery("INSERT INTO clients (name, email, phone, address, avatar_url) VALUES ($1, $2, $3, $4, $5)", [name, email, phone, address, avatar_url || null]);
            res.status(201).json({ message: "Client added successfully", clientId: result.insertId });
        } catch (error) {
            res.status(500).json({ error: "Internal server error" });
        }
    }   

}

export default clientControllers;
