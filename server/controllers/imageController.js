import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import userModel from "../models/userModel.js";

// Controller function to remove bg from image
const removeBgImage = async (req, res) => {
  try {
    // ✅ Get Clerk ID from middleware or body (for backward compatibility)
    const clerkId = req.clerkId || req.auth?.userId || req.body.clerkId;

    if (!clerkId) {
      return res.json({
        success: false,
        message: "Unauthorized: Clerk ID missing",
      });
    }

    // ✅ Fetch user from DB
    const user = await userModel.findOne({ clerkId });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // ✅ Check credit balance
    if (user.creditBalance === 0) {
      return res.json({
        success: false,
        message: "No Credit Balance",
        creditBalance: user.creditBalance,
      });
    }

    // ✅ Process image with ClipDrop API
    const imagePath = req.file.path;
    const imageFile = fs.createReadStream(imagePath);

    const formdata = new FormData();
    formdata.append("image_file", imageFile);

    const clipdropRes = await axios.post(
      "https://clipdrop-api.co/remove-background/v1",
      formdata,
      {
        headers: {
          "x-api-key": process.env.CLIPDROP_API,
          ...formdata.getHeaders(),
        },
        responseType: "arraybuffer",
      }
    );

    // ✅ Convert result to Base64
    const base64Image = Buffer.from(clipdropRes.data, "binary").toString(
      "base64"
    );
    const resultImage = `data:${req.file.mimetype};base64,${base64Image}`;

    // ✅ Deduct one credit
    const newBalance = user.creditBalance - 1;
    await userModel.findByIdAndUpdate(user._id, { creditBalance: newBalance });

    // ✅ Send response
    res.json({
      success: true,
      message: "Background Removed Successfully",
      resultImage,
      creditBalance: newBalance,
    });
  } catch (error) {
    console.error("❌ removeBgImage error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

export { removeBgImage };
