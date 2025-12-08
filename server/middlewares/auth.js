// server/middlewares/auth.js
import { requireAuth } from "@clerk/express";

const authUser = (req, res, next) => {
  try {
    requireAuth()(req, res, () => {
      req.clerkId = req.auth.userId; // attach for controllers
      next();
    });
  } catch (error) {
    console.error("❌ Clerk auth error:", error.message);
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

export default authUser;
