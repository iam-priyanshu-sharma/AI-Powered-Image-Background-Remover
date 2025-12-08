import express from "express";
import bodyParser from "body-parser";
import {
  userCredits,
  paymentRazorpay,
  verifyRazorpay,
  clerkWebhooks,
  paymentStripe,
  verifyStripe,
} from "../controllers/UserController.js";
import authUser from "../middlewares/auth.js";

const userRouter = express.Router();

// ✅ Webhook route (no auth, must use raw body parser)
userRouter.post(
  "/webhooks",
  bodyParser.raw({ type: "application/json" }),
  clerkWebhooks
);

// ✅ Protected routes (require valid Clerk token)
userRouter.get("/credits", authUser, userCredits);
userRouter.post("/pay-razor", authUser, paymentRazorpay);
userRouter.post("/pay-stripe", authUser, paymentStripe);

// ✅ Public verification routes (no auth)
userRouter.post("/verify-razor", verifyRazorpay);
userRouter.post("/verify-stripe", verifyStripe);

export default userRouter;
