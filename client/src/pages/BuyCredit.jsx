import React, { useContext } from "react";
import { motion } from "framer-motion";
import { assets } from "../assets/assets";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import { plans } from "../assets/assets";

const BuyCredit = () => {
  const { backendUrl, loadCreditsData } = useContext(AppContext);
  const navigate = useNavigate();
  const { getToken } = useAuth();

  // ✅ Razorpay Payment Initialization
  const initPay = (order) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Credits Payment",
      description: "Credits Payment",
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        const token = await getToken();
        try {
          const { data } = await axios.post(
            backendUrl + "/api/user/verify-razor",
            response,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (data.success) {
            loadCreditsData();
            navigate("/");
            toast.success("Payment successful! 🎉 Credits added.");
          }
        } catch (error) {
          toast.error(error.message);
        }
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // ✅ Razorpay Payment
  const paymentRazorpay = async (planId) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + "/api/user/pay-razor",
        { planId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) initPay(data.order);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ✅ Stripe Payment
  const paymentStripe = async (planId) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        backendUrl + "/api/user/pay-stripe",
        { planId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) window.location.replace(data.session_url);
      else toast.error(data.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-[80vh] text-center pt-14 mb-10 overflow-hidden">
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="border border-gray-400 px-10 py-2 rounded-full mb-6"
      >
        Our Plans
      </motion.button>

      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center mb-6 sm:mb-10 text-2xl md:text-3xl lg:text-4xl font-semibold bg-gradient-to-r from-gray-900 to-gray-400 bg-clip-text text-transparent"
      >
        Choose the plan that's right for you
      </motion.h1>

      {/* 🟦 Pricing Cards — single-source motion (Framer Motion only) */}
      <div className="flex flex-wrap justify-center gap-6 text-left">
        {plans.map((item, index) => {
          const isBestValue = item.id === "Advanced";

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.12 }}
              // use one whileHover that handles scale + lift + shadow
              whileHover={{
                scale: 1.04,
                y: -6,
                boxShadow: "0px 18px 40px rgba(16,24,40,0.14)",
              }}
              // use a smooth spring for hover motion
              // (note: transition here is for the initial animation; use whileHover.transition for hover behavior)
              style={{ willChange: "transform" }}
              className={`relative bg-white border rounded-xl py-12 px-8 text-gray-700 cursor-pointer
          ${isBestValue ? "border-blue-400" : "border-gray-200"}`}
              // explicit whileHover transition (separate to avoid mixing with animate transition)
              whileTap={{ scale: 0.995 }}
              // Attach hover transition as a prop on the motion element
              // (framer supports transition nested in whileHover object; we'll pass below using attr)
            >
              {/* Best value badge */}
              {isBestValue && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                  ⭐ Best Value
                </div>
              )}

              <img width={40} src={assets.logo_icon} alt="" />
              <p className="mt-3 font-semibold">{item.id}</p>
              <p className="text-sm">{item.desc}</p>

              <p className="my-6">
                <span className="text-2xl font-semibold text-gray-800">
                  ₹{item.price}
                </span>{" "}
                / {item.credits} credits
              </p>

              <div className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full inline-block mt-2">
                💡 {Math.round(item.credits / item.price)} credits per ₹1
              </div>

              {isBestValue && (
                <p className="text-sm text-blue-600 font-medium mt-3">
                  💰 Save more with this plan!
                </p>
              )}

              <div className="flex flex-col mt-4">
                <button
                  onClick={() => paymentRazorpay(item.id)}
                  className="w-full flex justify-center gap-2 border border-gray-400 mt-2 text-sm rounded-md py-2.5 min-w-52"
                >
                  <img
                    className="h-4 pointer-events-none"
                    src={assets.razorpay_logo}
                    alt=""
                  />
                </button>

                <button
                  onClick={() => paymentStripe(item.id)}
                  className="w-full flex justify-center gap-2 border border-gray-400 mt-2 text-sm rounded-md py-2.5 min-w-52"
                >
                  <img
                    className="h-4 pointer-events-none"
                    src={assets.stripe_logo}
                    alt=""
                  />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ✨ Animated Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="mt-16 px-4 sm:px-12 lg:px-40"
      >
        <h2 className="text-xl font-semibold text-gray-800 mb-4 text-left">
          📊 Plan Comparison
        </h2>

        <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-200 bg-white">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 uppercase text-xs tracking-wider">
              <tr>
                <th className="py-3 px-4 text-left">Plan</th>
                <th className="py-3 px-4 text-center">Price (₹)</th>
                <th className="py-3 px-4 text-center">Credits</th>
                <th className="py-3 px-4 text-center">Credits / ₹1</th>
                <th className="py-3 px-4 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => {
                const isBestValue = plan.id === "Advanced";
                return (
                  <tr
                    key={plan.id}
                    className={`transition-all duration-300 ${
                      isBestValue
                        ? "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-400"
                        : "odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <td className="py-3 px-4 font-medium text-left">
                      {plan.id}
                    </td>
                    <td className="py-3 px-4 text-center font-medium">
                      ₹{plan.price}
                    </td>
                    <td className="py-3 px-4 text-center">{plan.credits}</td>
                    <td className="py-3 px-4 text-center text-blue-600 font-semibold">
                      {Math.round(plan.credits / plan.price)}
                    </td>
                    <td className="py-3 px-4 text-left">
                      {isBestValue ? (
                        <span className="inline-flex items-center gap-1 text-blue-600 font-medium">
                          ⭐ Best for Regular Users
                        </span>
                      ) : plan.id === "Basic" ? (
                        <span className="text-gray-600">
                          🧭 Ideal for Beginners
                        </span>
                      ) : (
                        <span className="text-green-700">
                          🚀 Great for Power Users
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-gray-500 mt-4 italic text-left">
          💡 Higher plans offer more credits per ₹, making them more
          cost-efficient for frequent users.
        </p>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="text-xs text-gray-500 italic mt-8"
      >
        ⚙ Payments are running in Test Mode for demonstration purposes.
      </motion.p>
    </div>
  );
};

export default BuyCredit;
