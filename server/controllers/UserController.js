import axios from "axios";
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

// robust clerkWebhooks - place this in server/controllers/UserController.js replacing the old function
// requires axios import at top: import axios from "axios";
const clerkWebhooks = async (req, res) => {
  const start = Date.now();

  // small helpers
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const retry = async (fn, attempts = 3, delay = 500) => {
    let lastErr;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        await sleep(delay * (i + 1));
      }
    }
    throw lastErr;
  };

  try {
    console.log("➡ Incoming Clerk webhook");

    // verify signature quickly
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    const rawBody = req.body.toString();

    const verifyStart = Date.now();
    await whook.verify(rawBody, {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });
    console.log("✅ Webhook verified in", Date.now() - verifyStart, "ms");

    // parse payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (err) {
      console.error("Webhook parse error:", err);
      return res.status(400).json({ success: false, message: "Invalid JSON" });
    }
    const { data, type } = payload;

    // ACK Clerk quickly to avoid timeout/retry
    res.status(200).json({ success: true });
    console.log("ACK sent to Clerk in", Date.now() - start, "ms");

    // background processing (fire-and-forget)
    setImmediate(async () => {
      try {
        console.log("➡ Background processing:", type);

        // helper: fetch clerk user if email missing (non-blocking)
        const fetchClerkUser = async (clerkId) => {
          if (!process.env.CLERK_API_KEY || !clerkId) return null;
          const url = `https://api.clerk.com/v1/users/${clerkId}`;
          return await retry(
            async () => {
              const resp = await axios.get(url, {
                headers: {
                  Authorization: `Bearer ${process.env.CLERK_API_KEY}`,
                  Accept: "application/json",
                },
                timeout: 3000,
              });
              return resp.data;
            },
            2,
            500
          );
        };

        switch (type) {
          case "user.created": {
            // extract email if present
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

            // try to fetch from Clerk API if email missing (non-blocking)
            if (!email && data.id) {
              try {
                const clerkUser = await fetchClerkUser(data.id);
                if (clerkUser) {
                  if (
                    Array.isArray(clerkUser.email_addresses) &&
                    clerkUser.email_addresses.length
                  ) {
                    const primary =
                      clerkUser.email_addresses.find(
                        (e) => e.id === clerkUser.primary_email_address_id
                      ) || clerkUser.email_addresses[0];
                    email = primary?.email_address || "";
                  } else if (clerkUser.email_address) {
                    email = clerkUser.email_address;
                  }
                }
              } catch (err) {
                console.warn(
                  "Clerk API fetch failed (non-blocking):",
                  err.message || err
                );
              }
            }

            const userData = {
              clerkId: data.id,
              ...(email ? { email } : {}),
              firstName: data.first_name || "",
              lastName: data.last_name || "",
              photo: data.image_url || "",
              creditBalance: 5,
            };

            // upsert with retries (avoids duplicate-key on retries)
            try {
              await retry(
                async () => {
                  const filter = data.id
                    ? { clerkId: data.id }
                    : email
                    ? { email }
                    : {};
                  const update = {
                    $setOnInsert: {
                      clerkId: userData.clerkId,
                      ...(email ? { email } : {}),
                      firstName: userData.firstName,
                      lastName: userData.lastName,
                      photo: userData.photo,
                      creditBalance: userData.creditBalance,
                    },
                  };
                  await userModel.findOneAndUpdate(filter, update, {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true,
                  });
                },
                3,
                400
              );
              console.log(
                "✅ User created/upserted:",
                userData.clerkId || userData.email
              );
            } catch (err) {
              console.error("❌ User upsert failed:", err.message || err);
            }
            break;
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
              ...(email ? { email } : {}),
              firstName: data.first_name || "",
              lastName: data.last_name || "",
              photo: data.image_url || "",
            };

            try {
              await retry(
                async () => {
                  await userModel.findOneAndUpdate(
                    { clerkId: data.id },
                    { $set: userData }
                  );
                },
                2,
                400
              );
              console.log("✅ User updated:", data.id);
            } catch (err) {
              console.error("❌ User update failed:", err.message || err);
            }
            break;
          }

          case "user.deleted": {
            try {
              const ids = [data.id, data.user_id, data.userId].filter(Boolean);
              const filters = [];
              if (ids.length) filters.push({ clerkId: { $in: ids } });

              let email = "";
              if (
                Array.isArray(data.email_addresses) &&
                data.email_addresses.length
              ) {
                const primary =
                  data.email_addresses.find(
                    (e) => e.id === data.primary_email_address_id
                  ) || data.email_addresses[0];
                email = primary?.email_address || "";
              } else if (data.email_address) {
                email = data.email_address;
              }
              if (email) filters.push({ email });

              if (filters.length === 0) {
                console.warn("user.deleted had no ID or email:", data);
                break;
              }

              await retry(
                async () => {
                  await userModel.findOneAndDelete({ $or: filters });
                },
                2,
                300
              );

              console.log("🗑 User deleted:", JSON.stringify(filters));
            } catch (err) {
              console.error("❌ User delete failed:", err.message || err);
            }
            break;
          }

          default:
            console.log("ℹ Unknown Clerk event (ignored):", type);
            break;
        }
      } catch (bgErr) {
        console.error(
          "❌ Background webhook processing error:",
          bgErr.message || bgErr
        );
      } finally {
        console.log("Background processing finished for webhook type", type);
      }
    }); // end setImmediate
  } catch (error) {
    console.error("❌ Webhook signature/parse error:", error.message || error);
    // signature failure -> respond 400 (Clerk won't retry on bad signature)
    return res.status(400).json({ success: false, message: error.message });
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
