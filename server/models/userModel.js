// server/models/userModel.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Clerk stable id — unique when present, sparse to allow older docs without clerkId
    clerkId: { type: String, unique: true, sparse: true },

    // Email is required and unique
    email: { type: String, required: true, unique: true },

    // Optional profile fields
    photo: { type: String, default: "" },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },

    creditBalance: { type: Number, default: 5 },
  },
  { timestamps: true }
);

// NOTE: Do NOT duplicate indexes here with userSchema.index(...).
// The unique flag on the field above is sufficient. If you previously added
// explicit index declarations, remove them to avoid duplicate index warnings.

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
