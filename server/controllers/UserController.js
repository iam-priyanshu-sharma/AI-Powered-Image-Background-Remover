import { Webhook } from "svix";
import userModel from "../models/userModel.js";
import transactionModel from "../models/transactionModel.js";
import razorpay from "razorpay";
import stripe from "stripe";

// Gateway Initialize
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// API Controller Function to Manage Clerk User with database
const clerkWebhooks = async (req, res) => {
  try {
    console.log("➡️ Incoming Clerk webhook");

    // 1️⃣ Create the webhook verifier
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    // 2️⃣ Convert the raw Buffer body to string
    const rawBody = req.body.toString();

    // 3️⃣ Verify signature using the raw body
    await whook.verify(rawBody, {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    // 4️⃣ Parse JSON after verifying
    const { data, type } = JSON.parse(rawBody);

    console.log("✅ Webhook verified:", type);

    // 5️⃣ Handle event types
    switch (type) {
      case "user.created": {
        // 🧠 safely extract email for all Clerk payload formats
        let email = "";
        if (
          Array.isArray(data.email_addresses) &&
          data.email_addresses.length > 0
        ) {
          const primary =
            data.email_addresses.find(
              (e) => e.id === data.primary_email_address_id
            ) || data.email_addresses[0];
          email = primary?.email_address || "";
        } else if (data.email_address) {
          email = data.email_address;
        }

        if (!email) {
          console.warn(
            "⚠ Clerk user.created event missing email. Skipping DB creation for:",
            data.id
          );
          return res.json({ success: false, message: "No email in payload" });
        }

        const userData = {
          clerkId: data.id,
          email,
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          photo: data.image_url || "",
          creditBalance: 5, // optional: give 5 free credits to new users
        };

        await userModel.create(userData);
        console.log("✅ User created:", userData.email);
        return res.json({ success: true });
      }

      case "user.updated": {
        const primaryEmailObj = Array.isArray(data.email_addresses)
          ? data.email_addresses.find(
              (emailObj) => emailObj.id === data.primary_email_address_id
            ) || data.email_addresses[0]
          : null;

        const email =
          primaryEmailObj?.email_address || data.email_address || "";

        const userData = {
          email,
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          photo: data.image_url || "",
        };

        await userModel.findOneAndUpdate({ clerkId: data.id }, userData);
        console.log("✅ User updated:", email);
        res.json({ success: true });
        break;
      }

      case "user.deleted": {
        await userModel.findOneAndDelete({ clerkId: data.id });
        console.log("🗑️ User deleted:", data.id);
        return res.json({ success: true });
      }

      default:
        console.log("⚠️ Unknown event type:", type);
        return res.json({ success: true });
    }
  } catch (error) {
    console.error("❌ Webhook error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

// API Controller function to get user available credits data
const userCredits = async (req, res) => {
  try {
    const clerkId = req.clerkId || req.body.clerkId || req.auth?.userId;

    // Make sure clerkId is sent
    if (!clerkId) {
      return res.json({ success: false, message: "Missing clerkId" });
    }

    // Find the user
    const userData = await userModel.findOne({ clerkId });

    if (!userData) {
      // User not found in DB
      return res.json({ success: false, message: "User not found" });
    }

    // Success: return credit balance
    res.json({ success: true, credits: userData.creditBalance });
  } catch (error) {
    console.error("Error fetching user credits:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// Payment API to add credits ( RazorPay )
const paymentRazorpay = async (req, res) => {
  try {
    const clerkId = req.clerkId;
    const { planId } = req.body;

    const userData = await userModel.findOne({ clerkId });

    // checking for planId and userdata
    if (!userData || !planId) {
      return res.json({ success: false, message: "Invalid Credentials" });
    }

    let credits, plan, amount, date;

    // Switch Cases for different plans
    switch (planId) {
      case "Basic":
        plan = "Basic";
        credits = 100;
        amount = 50;
        break;

      case "Advanced":
        plan = "Advanced";
        credits = 500;
        amount = 200;
        break;

      case "Business":
        plan = "Business";
        credits = 5000;
        amount = 1000;
        break;

      default:
        return res.json({ success: false, message: "plan not found" });
    }

    date = Date.now();

    // Creating Transaction Data
    const transactionData = {
      clerkId,
      plan,
      amount,
      credits,
      date,
    };

    // Saving Transaction Data to Database
    const newTransaction = await transactionModel.create(transactionData);

    // Creating options to create razorpay Order
    const options = {
      amount: amount * 100,
      currency: process.env.CURRENCY,
      receipt: newTransaction._id,
    };

    // Creating razorpay Order
    await razorpayInstance.orders.create(options, (error, order) => {
      if (error) {
        console.log(error);
        return res.json({ success: false, message: error });
      }
      res.json({ success: true, order });
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API Controller function to verify razorpay payment
const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;

    // Fetching order data from razorpay
    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    // Checking for payment status
    if (orderInfo.status === "paid") {
      const transactionData = await transactionModel.findById(
        orderInfo.receipt
      );
      if (transactionData.payment) {
        return res.json({ success: false, message: "Payment Failed" });
      }

      // Adding Credits in user data
      const userData = await userModel.findOne({
        clerkId: transactionData.clerkId,
      });
      const creditBalance = userData.creditBalance + transactionData.credits;
      await userModel.findByIdAndUpdate(userData._id, { creditBalance });

      // Marking the payment true
      await transactionModel.findByIdAndUpdate(transactionData._id, {
        payment: true,
      });

      res.json({ success: true, message: "Credits Added" });
    } else {
      res.json({ success: false, message: "Payment Failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Payment API to add credits ( Stripe )
const paymentStripe = async (req, res) => {
  try {
    const clerkId = req.clerkId; // ✅ from auth middleware
    const { planId } = req.body;
    const { origin } = req.headers;

    const userData = await userModel.findOne({ clerkId });
    if (!userData || !planId) {
      return res.json({ success: false, message: "Invalid Credentials" });
    }

    let credits, plan, amount;
    switch (planId) {
      case "Basic":
        plan = "Basic";
        credits = 100;
        amount = 50;
        break;
      case "Advanced":
        plan = "Advanced";
        credits = 500;
        amount = 200;
        break;
      case "Business":
        plan = "Business";
        credits = 5000;
        amount = 1000;
        break;
      default:
        return res.json({ success: false, message: "plan not found" });
    }

    const transactionData = {
      clerkId,
      plan,
      amount,
      credits,
      date: Date.now(),
    };
    const newTransaction = await transactionModel.create(transactionData);

    const currency = (process.env.CURRENCY || "INR").toLowerCase();

    const session = await stripeInstance.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: "Credit Purchase" },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/verify?success=true&transactionId=${newTransaction._id}`,
      cancel_url: `${origin}/verify?success=false&transactionId=${newTransaction._id}`,
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// API Controller function to verify stripe payment
const verifyStripe = async (req, res) => {
  try {
    const { transactionId, success } = req.body;

    // Checking for payment status
    if (success === "true") {
      const transactionData = await transactionModel.findById(transactionId);
      if (transactionData.payment) {
        return res.json({
          success: false,
          message: "Payment Already Verified",
        });
      }

      // Adding Credits in user data
      const userData = await userModel.findOne({
        clerkId: transactionData.clerkId,
      });
      const creditBalance = userData.creditBalance + transactionData.credits;
      await userModel.findByIdAndUpdate(userData._id, { creditBalance });

      // Marking the payment true
      await transactionModel.findByIdAndUpdate(transactionData._id, {
        payment: true,
      });

      res.json({ success: true, message: "Credits Added" });
    } else {
      res.json({ success: false, message: "Payment Failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  clerkWebhooks,
  userCredits,
  paymentRazorpay,
  verifyRazorpay,
  paymentStripe,
  verifyStripe,
};
