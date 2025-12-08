import "dotenv/config";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import connectDB from "./configs/mongodb.js";
import userRouter from "./routes/userRoutes.js";
import imageRouter from "./routes/imageRoutes.js";
import { clerkWebhooks } from "./controllers/UserController.js";

const PORT = process.env.PORT || 4000;
const app = express();

// ✅ Connect Database
await connectDB();

// ✅ Step 1: Handle Clerk Webhook FIRST with RAW body (before express.json)
app.post(
  "/api/user/webhooks", // ✅ plural matches your userRoutes.js and Clerk endpoint
  bodyParser.raw({ type: "application/json" }),
  clerkWebhooks
);

// ✅ Step 2: Standard Middleware for everything else
app.use(express.json());
app.use(cors());

// ✅ Step 3: Normal API routes
app.use("/api/user", userRouter);
app.use("/api/image", imageRouter);

// ✅ Step 4: Health route
app.get("/", (req, res) => res.send("API Working"));

// ✅ Step 5: Start server
app.listen(PORT, () => console.log("Server running on port " + PORT));
