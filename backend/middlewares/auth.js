const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];  

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  try {
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("decoded", decoded);
    // req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
export default authMiddleware;