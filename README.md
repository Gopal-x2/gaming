# 🎮 Nexus Esports - Full-Stack Paid Gaming Tournament Platform

A modern, production-ready Gaming Tournament Platform built with **Node.js, Express, MongoDB, Razorpay Payments, Nodemailer, Cloudinary, and Vanilla HTML5/CSS3/JavaScript**.

---

## ✨ Features & Capabilities

### 🛡️ Admin Controls & Exclusive Privileges
- **ONLY ADMIN CAN CREATE & MANAGE TOURNAMENTS**: Normal users cannot create or tamper with tournaments, fees, or scores.
- **Match & Room Credential Publishing**: Admin schedules matches and enters Room ID & Password. Credentials remain hidden from regular users until published by Admin.
- **Scoreboard & Leaderboard Management**: Admin updates kills, match points, and declares tournament winners (1st, 2nd, 3rd place).
- **User & Payment Analytics**: Admin dashboard displays real-time statistics, registration charts (Chart.js), user status toggling (Block/Unblock), and revenue tracking.

### 🎮 User & Squad Workflows
- **Account Registration & Security**: Password hashing with `bcryptjs`, JWT token authentication, and role authorization.
- **Team & Invitation System**: Captain creates team, searches registered users by username/email, and sends invites with `ACCEPT` or `REJECT` controls.
- **Tournament Registration & Razorpay Payments**: Captain registers team, checks eligibility (team size, duplicate check, deadline), initiates Razorpay order, and verifies signature securely on backend (`HMAC-SHA256`).
- **Room Credentials with Copy Feature**: One-click copy for Room ID and Room Password when published.
- **Notifications System**: Real-time toast alerts and system notifications for team invites, payment receipts, match schedules, and room credentials.

---

## 🚀 Quick Start Guide

### 1. Installation
Ensure Node.js and MongoDB are installed on your machine.

```bash
# Install dependencies
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (or edit `.env`):

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/esports_db
JWT_SECRET=esports_super_secret_jwt_key_2026
JWT_EXPIRE=30d

# Razorpay Integration (Test Credentials)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# Cloudinary Storage Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Nodemailer SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
EMAIL_FROM="Nexus Gaming Esports <noreply@nexusgaming.com>"
```

### 3. Seed Sample Data (Admin & Featured Tournaments)
Run the seed script to populate default admin credentials, test users, and featured tournaments (BGMI Masters, Valorant Pro Cup, Free Fire Survival):

```bash
npm run seed
```

#### 🔑 Pre-Configured Seed Credentials:
- **Admin Login**: `admin@nexusesports.com` (or username `admin`) / Password: `admin123password`
- **User Login**: `john@example.com` (or username `john_warrior`) / Password: `user123password`

### 4. Run Development Server

```bash
npm run dev
```

Open your browser and navigate to: **`http://localhost:5000`**

---

## 📂 Project Architecture

```
Bharat build 2.0/
├── backend/
│   ├── config/          # MongoDB, Razorpay & Cloudinary setup
│   ├── controllers/     # Auth, User, Team, Tournament, Payment, Match, Admin
│   ├── middleware/      # JWT Protect, Admin Authorization, Error Handling
│   ├── models/          # User, Team, TeamInvitation, Tournament, Payment, Match, Leaderboard, Notification
│   ├── routes/          # RESTful Endpoint Routes
│   ├── utils/           # Nodemailer Emailer, Razorpay HMAC Helper, DB Seed
│   └── server.js        # Express app entry point
│
├── frontend/
│   ├── css/             # Futuristic Esports Theme, Glassmorphism, Auth, Admin CSS
│   ├── js/              # Central Fetch API, Razorpay Checkout, Auth, Tournaments, Admin JS
│   ├── admin/           # Admin Dashboard, Tournaments, Matches, Results, Users, Payments
│   └── index.html       # Landing page and user views
│
├── package.json
└── README.md
```

---

## 🔒 Security Best Practices Implemented
1. **HMAC SHA256 Signature Verification**: Payment success is NEVER trusted from frontend. Razorpay order ID, payment ID, and signature are verified strictly on Node.js backend.
2. **Strict Admin Middleware**: Endpoint authorization checks `req.user.role === 'ADMIN'` for all destructive or organizer operations.
3. **Password Security**: Passwords hashed with `bcryptjs` before DB write.
4. **Helmet Security Headers & Rate Limiting**: Protects against brute-force and DDoS attempts.
