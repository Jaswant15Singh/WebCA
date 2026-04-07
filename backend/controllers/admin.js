import DatabaseClass from "../db/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const adminControllers = {
  getAdmins: async function (req, res) {
    const data = await db.executeQuery("SELECT * FROM admins");
    res.json(data);
  },
   registerAdmin : async function (req, res) {
      console.log(req.body);

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }
  try {
    const existingAdmin = await db.executeQuery(
      "SELECT * FROM admins WHERE username = $1",
      [username]
    );

    if (existingAdmin.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.executeQuery(
      "INSERT INTO admins (username, password) VALUES ($1, $2)",
      [username, hashed]
    );
    res.status(201).json({ message: "Admin registered successfully", id: result.insertId });
  } catch (error) {
    console.error("Error registering admin:", error);
    res.status(500).json({ error: "Internal server error" });
  }
},

adminLogin: async function (req, res) {
  const { username, password } = req.body;
  console.log(req.body);
  
  if (!username || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }
  try {
    const admin = await db.executeQuery(
      "SELECT * FROM admins WHERE username = $1",
      [username]
    );
    if (admin.length === 0) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, admin[0].password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid username or password" });
    } else {
      const token = jwt.sign({ id: admin[0].id, username: admin[0].username }, process.env.JWT_SECRET, { expiresIn: "1h" });
      res.json({ message: "Login successful", token });
    }
  } catch (error) {
    console.error("Error during admin login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
},

adminInfo: async function(req,res){
    try{
      const {admin_id}=req.params;
      const adminInfo=await db.executeQuery("SELECT admin_id,username FROM admins WHERE admin_id=$1",[admin_id]); 
      if(adminInfo.length===0){
        return res.status(404).json({error:"Admin not found"});
      }
      res.status(200).json(adminInfo[0]);
    }
    catch(error){
      console.error("Error fetching admin info:", error);
      res.status(500).json({ error: "Internal server error" });
}
}
}




export default adminControllers;