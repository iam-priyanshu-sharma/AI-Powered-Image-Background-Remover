<!-- Project Title -->
<h1 align="center">AI-Powered Image Background Remover</h1>
<p align="center">
  <!-- Badges Row 1 — Core Stack -->
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-Build-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-Styling-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" />
</p>

<p align="center">
  <!-- Badges Row 2 — Backend + DB -->
  <br/>
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-API-black?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  </p>

  <p align="center">
  <!-- Badges Row 3 — APIs & Authentication -->
  <br/>
  <img src="https://img.shields.io/badge/ClipDrop-AI_BG_Removal-purple?style=for-the-badge&logo=magic&logoColor=white" />
  <img src="https://img.shields.io/badge/Clerk-Authentication-7C3AED?style=for-the-badge&logo=clerk&logoColor=white" />
</p>

<p align="center">
  <!-- Badges Row 4 — Payments -->
  <br/>
  <img src="https://img.shields.io/badge/Razorpay-Payments-0055FF?style=for-the-badge&logo=razorpay&logoColor=white" />
  <img src="https://img.shields.io/badge/Stripe-Checkout-635BFF?style=for-the-badge&logo=stripe&logoColor=white" />
</p>

<p align="center">
  <!-- Badges Row 5 — Deployment -->
  <br/>
  <img src="https://img.shields.io/badge/Render-Backend_Hosting-46E3B7?style=for-the-badge&logo=render&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-Frontend_Optional-000000?style=for-the-badge&logo=vercel&logoColor=white" />
</p>

---

# 📑 Table of Contents

1. 🔍 Project Overview

2. ⭐ Features

3. 🧰 Tech Stack

4. 📂 Project Structure

5. 🔐 Environment Variables

6. 🖥 Run Project Locally (Client + Server + DB)

7. 🧑‍💼 Clerk Configuration & Webhooks

8. ✂ ClipDrop Background Removal API

9. 💳 Payments Setup — Razorpay & Stripe

10. 🚀 Deployment on Render (Frontend + Backend)

11. 🧭 How to Use the App (User Flow)

12. 🛠 Troubleshooting Guide

13. 🖼 Screenshots Placeholder

14. 📌 Final Checklist

15. 📦 License & Credits

---

# 🔍 Project Overview

**AI-Powered Image Background Remover** is a full-stack web application that lets users remove image backgrounds instantly using the **ClipDrop AI API**.
The project includes:

✔ User authentication (Clerk)<br />
✔ AI background removal (ClipDrop)<br />
✔ Credits system<br />
✔ Razorpay & Stripe payments<br />
✔ Webhooks for user creation & payment reification<br />
✔ MongoDB for database<br />
✔ Fully responsive, professional UI (React + Tailwind)

Ideal for MCA Major Project or any real-world SaaS starter project.

---

# ⭐ Features

### 🔐 Authentication

- Secure JWT-based login with Clerk

- Automatic user creation via webhook

- Real-time credit sync

### 🎨 Background Removal

- Powered by ClipDrop Remove Background API

- Downloads image in high-quality PNG with transparency

### 💰 Credit System

- Users receive credits

- Every image processing deducts 1 credit

- Buy credits using Razorpay or Stripe

### 💳 Payments

- Razorpay Checkout (India)

- Stripe Checkout (Global)

### 🧾 Transactions

- Saved in MongoDB

- Webhook verified, secure

### 💻 UI Features

- Beautiful responsive layout

- Professional steps section

- Clean footer

- Upload → Process → Download flow

---

# 🧰 Tech Stack

### 💻Frontend

- React (Vite)

- Tailwind CSS

- Clerk React SDK

- Axios

### 🛠 Backend

- Node.js + Express

- Clerk Express SDK

- Stripe SDK

- Razorpay SDK

- Multer (file upload)

- Axios

- MongoDB + Mongoose

- API Services

- ClipDrop Remove Background API

- Clerk Authentication API

- Razorpay Payments API

- Stripe Checkout API

### ☁ Deployment

Render (Backend + Frontend recommended)

MongoDB Atlas

---

# 📂 Project Structure / Code Layout

```
AI-Powered-Image-Background-Remover/
│
├── client/ # React + Tailwind frontend
│ ├── public/
│ ├── src/
│ │ ├── assets/
│ │ ├── components/
│ │ │ ├── Navbar.jsx
│ │ │ ├── Footer.jsx
│ │ │ ├── Steps.jsx
│ │ │ ├── BuyCredit.jsx
│ │ │ ├── Verify.jsx
│ │ ├── context/
│ │ │ ├── AppContext.jsx
│ │ ├── App.jsx
│ │ ├── main.jsx
│ ├── index.html
│ ├── package.json
│
├── server/ # Node + Express backend
│ ├── controllers/
│ │ ├── UserController.js
│ │ ├── ImageController.js
│ ├── models/
│ │ ├── userModel.js
│ │ ├── transactionModel.js
│ ├── routes/
│ │ ├── userRoutes.js
│ │ ├── imageRoutes.js
│ ├── middlewares/
│ │ ├── auth.js
│ │ ├── multer.js
│ ├── configs/
│ │ ├── mongodb.js
│ ├── server.js
│ ├── package.json
│
├── README.md
├── .env # server env
└── client/.env # frontend env
```

### 🔎 Important Server Files

- _server.js_ → app entry point, webhook raw middleware, routes
- _UserController.js_ → credits, payments, webhooks
- _ImageController.js_ → ClipDrop integration, credit deduction
- _auth.js_ → Clerk authentication wrapper (requireAuth)

### 🔎 Important Client Files

- _AppContext.jsx_ → API calls, loadCreditsData(), removeBG()
- _BuyCredit.jsx_ → Razorpay & Stripe integration
- _Steps.jsx_ → Upload → Remove → Download UI

---

# 🔐 Environment Variables

## Client (`client/.env`)

## Backend (`.env in server/`)

## MongoDB

```
MONGO_URI=mongodb+srv://...
```

## App

```
CURRENCY=INR
```

## ClipDrop

```
CLIPDROP_API=your_clipdrop_key
```

## Clerk

```
CLERK_PUBLISHABLE_KEY=pk_live..
CLERK_SECRET_KEY=sk_live..
CLERK_WEBHOOK_SECRET=whsec..
```

## Razorpay

```
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=rzp_test_xxx
```

## Stripe

```
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

## Frontend (client/.env)

```
VITE_BACKEND_URL=https://your-render-backend-url
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

⚠ **Never commit `.env` files to GitHub.**

---

# 🖥 Run Project Locally (Client + Server + DB)

### ✅ 1. Clone Repo

```sh
git clone your-project-folder
```

---

### ✅ 2. Install Backend

```sh
cd server
npm install

Create .env and add backend variables.

Run backend:

npm run dev
```

**Backend default:
👉 http://localhost:4000**

---

### ✅ 3. Install Frontend

```sh
cd client
npm install
npm run dev
```

**Frontend default:
👉 http://localhost:5173**

---

# 🧑‍💼 Clerk Configuration & Webhooks

### 1. Create a Clerk project → dashboard.clerk.com

### 2. Get:

- Publishable Key (frontend)

- Secret Key (backend)

### 3. Add allowed origins:

- `http://localhost:5173` Your Render frontend URL

### 4. Create webhook:

- URL → /api/user/webhooks

- Add events:

  - ✔ user.created
  - ✔ user.updated
  - ✔ user.deleted

- Paste Webhook Secret in server .env.

### 🟫 Webhook Verification (Svix sample)

```js
const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
const rawBody = req.body.toString();
await whook.verify(rawBody, {
  "svix-id": req.headers["svix-id"],
  "svix-timestamp": req.headers["svix-timestamp"],
  "svix-signature": req.headers["svix-signature"],
});
```

---

# ✂ ClipDrop Background Removal API

### Backend usage:

```js
const formdata = new FormData();
formdata.append("image_file", fs.createReadStream(imagePath));

const { data } = await axios.post(
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
```

---

# 💳 Payments Setup — Razorpay & Stripe

## 🟦 Razorpay (India)

**Works via Test Mode Requires:**

- Key ID (frontend)

- Key Secret (backend)

**Backend:**

```js
const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
```

**Frontend:**

```js
const rzp = new window.Razorpay(options);
rzp.open();
```

**Indian test card supported.**

## 🟪 Stripe (Global)

Requires:

- Secret Key (backend)

- Publishable Key (frontend)

- Stripe minimum amount = 50 cents → adjust plan pricing accordingly

Create Cjeckout Session:

```js
const session = await stripe.checkout.sessions.create({
  success_url: ${origin}/verify?success=true&transactionId=${id},
  cancel_url: ${origin}/verify?success=false&transactionId=${id},
  line_items: [...],
  mode: "payment",
});
```

---

# 🚀 Deployment on Render (Frontend + Backend)

### 🟢 Backend on Render

- Select `server` folder

- Build: `npm install`

- Start: `node server.js`

- Add all environment variables

- Enable Web Service

- Copy backend URL → use in frontend `VITE_BACKEND_URL`

---

### 🔵 Frontend on Render

- Create a Static Site

- Build command: `npm install && npm run build`

- Publish directory: dist

- Add Vite env:

  - VITE_BACKEND_URL

  - VITE_RAZORPAY_KEY_ID

  - VITE_CLERK_PUBLISHABLE_KEY

---

# 🧭 How to Use the App (User Flow)

1. User signs in using Clerk

2. User uploads image

3. ClipDrop removes background

4. 1 credit deducted

5. If credits = 0 → redirected to Buy page

6. User buys credits via Razorpay/Stripe

7. Credits auto-updated in navbar

---

# 🛠 Troubleshooting Guide

### ❌ “No matching signature found”

`Wrong Clerk webhook secret`

`Webhook route NOT using raw body parser`

### ❌ User not found

`Missing Clerk token in Authorization header`

### ❌ Razorpay popup not opening

`Script missing in index.html`

### ❌ Stripe amount too small

`Must be ≥ 50 cents / ₹50`

### ❌ Credits showing 0 on login

`loadCreditsData not called`

`Wrong HTTP method (GET/POST mismatch)`

---

# 🖼 Screenshots Placeholder

## Home Page

<img width="1365" height="690" alt="image" src="https://github.com/user-attachments/assets/14d018db-d84c-49ee-a0d6-a047a4223f71" />

## Login / Sign-up UI

<img width="1132" height="616" alt="image" src="https://github.com/user-attachments/assets/2075fd55-d106-4e95-98bf-1cc19e9a85eb" />

## Dashboard / Account Page UI

<img width="1096" height="553" alt="image" src="https://github.com/user-attachments/assets/69fdfd3f-00c5-4c5f-a02e-9523c960742f" />

## Remove Background Result

<img width="1096" height="614" alt="image" src="https://github.com/user-attachments/assets/c84225de-c70d-4b02-bf9c-866589f268b9" />

## Payments

<img width="1004" height="894" alt="image" src="https://github.com/user-attachments/assets/73e13900-e1b2-4996-9c0f-0fa71001ef08" />

---

# 📌 Final Checklist

- ✔ MongoDB working
- ✔ Clerk keys added
- ✔ Razorpay test mode configured
- ✔ Stripe test mode configured
- ✔ ClipDrop API key added
- ✔ Credits system working
- ✔ Webhooks verified
- ✔ Project deployed on Render
- ✔ README complete

---

# 📦 License & Credits

This project is developed as an MCA Major Project by Priyanshu Sharma.

Special thanks to:

- ClipDrop (Background Removal AI)

- Clerk (Authentication)

- Razorpay (Payments)

- Stripe (Payments)

- MongoDB Atlas

- Render Deployment

---

# Appendix - Useful Snippets

## 🔐 server/middlewares/auth.js

```js
import { requireAuth } from "@clerk/express";

const authUser = (req, res, next) => {
  try {
    requireAuth()(req, res, () => {
      req.clerkId = req.auth.userId;
      next();
    });
  } catch (error) {
    console.error("❌ Clerk auth error:", error.message);
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

export default authUser;
```

## 🎌 server/routes/userRoutes.js

```js
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

userRouter.post(
  "/webhooks",
  bodyParser.raw({ type: "application/json" }),
  clerkWebhooks
);

userRouter.get("/credits", authUser, userCredits);
userRouter.post("/pay-razor", authUser, paymentRazorpay);
userRouter.post("/pay-stripe", authUser, paymentStripe);

userRouter.post("/verify-razor", verifyRazorpay);
userRouter.post("/verify-stripe", verifyStripe);

export default userRouter;
```
