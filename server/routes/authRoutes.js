import express from "express";
import { connectToDataBase } from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const router = express.Router();

function parseIsAdmin(val) {
  return val === true || val === "true" || val === 1 || val === "1";
}

async function getUserTypeId(pool, typeName = "member") {
  const [rows] = await pool.query(
    `SELECT id, name, can_view_subscriptions, can_view_members, can_view_payments
     FROM user_type WHERE name = ? LIMIT 1`,
    [typeName]
  );
  if (rows && rows.length > 0) return rows[0];

  const [fallback] = await pool.query(
    `SELECT id, name, can_view_subscriptions, can_view_members, can_view_payments
     FROM user_type WHERE name = 'member' LIMIT 1`
  );
  return (fallback && fallback[0]) || null;
}

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt:", email);

  if (!email || !password) {
    return res.status(400).json({ message: "Missing email or password" });
  }

  try {
    const pool = await connectToDataBase();

    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.username, u.password, u.name,
              ut.name AS user_type, ut.can_view_subscriptions, ut.can_view_members, ut.can_view_payments
       FROM users u
       LEFT JOIN user_type ut ON u.user_type_id = ut.id
       WHERE u.email = ? LIMIT 1;`,
      [email]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];

    if (!user.password) {
      return res
        .status(500)
        .json({ message: "No password stored for this user" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = {
      id: user.id,
      username: user.username,
      name: user.name,
      user_type: user.user_type || "member",
      permissions: {
        can_view_subscriptions: !!user.can_view_subscriptions,
        can_view_members: !!user.can_view_members,
        can_view_payments: !!user.can_view_payments,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_KEY, { expiresIn: "12h" });

    delete user.password;
    return res.status(200).json({ token, user: { id: user.id, email: user.email, username: user.username, name: user.name, user_type: user.user_type } });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
});

router.post("/register", async (req, res) => {
  const { name, gender, email, username, password } = req.body;
  const isAdminLegacy = parseIsAdmin(req.body.isAdmin);
  const requestedUserType = req.body.userType;
  console.log("Register attempt:", { name, gender, email, username, requestedUserType, isAdminLegacy });

  if (!name || !email || !username || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  if (gender) {
    const allowedGenders = ["Male", "Female", "Other"];
    if (!allowedGenders.includes(gender)) {
      return res.status(400).json({ message: "Invalid gender value" });
    }
  }

  try {
    const pool = await connectToDataBase();
    const [existing] = await pool.query(
      `SELECT id, email, username FROM users WHERE email = ? OR username = ? LIMIT 1`,
      [email, username]
    );
    if (existing && existing.length > 0) {
      const sameEmail = existing.some((r) => r.email === email);
      const sameUsername = existing.some((r) => r.username === username);
      const message =
        sameEmail && sameUsername
          ? "Email and username already in use"
          : sameEmail
          ? "Email already in use"
          : "Username already in use";
      return res.status(409).json({ message });
    }

    let userTypeRow = null;
    if (requestedUserType) {
      userTypeRow = await getUserTypeId(pool, requestedUserType);
    } else if (isAdminLegacy) {
      userTypeRow = await getUserTypeId(pool, "admin");
    } else {
      userTypeRow = await getUserTypeId(pool, "member");
    }

    if (!userTypeRow) {
      return res.status(500).json({ message: "No user_type found on the server" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (name, gender, email, username, password, user_type_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, gender || null, email, username, hashPassword, userTypeRow.id]
    );

    return res.status(201).json({ message: "User created successfully", userId: result.insertId, user_type: userTypeRow.name });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
});

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.header("Authorization");
    if (!authHeader)
      return res.status(403).json({ message: "No authorization header" });

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer")
      return res
        .status(401)
        .json({ message: "Invalid authorization header format" });

    const token = parts[1];
    const decoded = jwt.verify(token, process.env.JWT_KEY);

    req.id = decoded.id;
    req.user = decoded;
    req.user_type = decoded.user_type;
    req.permissions = decoded.permissions || {};
    next();
  } catch (error) {
    console.error("verifyToken error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

router.get("/register", verifyToken, async (req, res) => {

  if (!req.permissions.can_view_members && req.user_type !== "admin") {
    return res.status(403).json({ message: "Forbidden: admins or authorized roles only" });
  }

  try {
    const db = await connectToDataBase();

    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email, u.username, u.gender, u.birth_date, u.age, u.phone, u.membership_expiry,
              ut.name AS user_type, ut.can_view_subscriptions, ut.can_view_members, ut.can_view_payments
       FROM users u
       LEFT JOIN user_type ut ON u.user_type_id = ut.id
       WHERE u.id = ? LIMIT 1;`,
      [req.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    delete user.password;

    return res.status(200).json({ user });
  } catch (error) {
    console.error("GET /register error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
});

router.get("/me", verifyToken, async (req, res) => {
  try {
    const db = await connectToDataBase();

    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email, u.username, u.gender, u.birth_date, u.age, u.phone, u.membership_expiry,
              ut.name AS user_type, ut.can_view_subscriptions, ut.can_view_members, ut.can_view_payments
       FROM users u
       LEFT JOIN user_type ut ON u.user_type_id = ut.id
       WHERE u.id = ? LIMIT 1;`,
      [req.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userRow = rows[0];

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      username: userRow.username,
      gender: userRow.gender,
      birth_date: userRow.birth_date,
      age: userRow.age,
      phone: userRow.phone,
      membership_expiry: userRow.membership_expiry,
    };

    const user_type = userRow.user_type || "member";
    const permissions = {
      can_view_subscriptions: !!userRow.can_view_subscriptions,
      can_view_members: !!userRow.can_view_members,
      can_view_payments: !!userRow.can_view_payments,
    };

    return res.status(200).json({ user, user_type, permissions });
  } catch (error) {
    console.error("GET /auth/me error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
});

/* =========================
   PASSWORD RESET ROUTES
   =========================
   - POST /auth/request-password-reset  (logged-in users)
   - POST /auth/reset-password          (public, via token)
*/

// Helper: create a nodemailer transporter (similar config to your mail.js)
function createTransporter() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
  } = process.env;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 465,
    secure: String(SMTP_SECURE).toLowerCase() === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

// POST /auth/request-password-reset
router.post("/request-password-reset", verifyToken, async (req, res) => {
  try {
    const db = await connectToDataBase();
    const userId = req.id;

    // fetch user email
    const [rows] = await db.query(
      `SELECT id, email, name FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];
    if (!user.email) {
      return res.status(400).json({ message: "User has no email on record" });
    }

    // create a short-lived JWT token for password reset
    const resetToken = jwt.sign(
      { id: user.id, action: "password-reset" },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(
      resetToken
    )}`;

    // send email
    const transporter = createTransporter();
    const mailOptions = {
      from: `"${process.env.FROM_NAME || "Support"}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: user.email,
      subject: "Password reset request",
      text: `Hello ${user.name || ""},\n\nTo reset your password click the link below (valid for 1 hour):\n\n${resetLink}\n\nIf you didn't request this, ignore this email.\n`,
      html: `<p>Hello ${user.name || ""},</p>
             <p>To reset your password click the link below (valid for 1 hour):</p>
             <p><a href="${resetLink}">${resetLink}</a></p>
             <p>If you didn't request this, ignore this email.</p>`,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ ok: true, message: "Password reset email sent" });
  } catch (err) {
    console.error("request-password-reset error:", err);
    return res.status(500).json({ ok: false, message: err.message || "Server error" });
  }
});

// POST /auth/reset-password
// body: { token: string, password: string }
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) {
      return res.status(400).json({ message: "Missing token or password" });
    }

    // verify token
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_KEY);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (payload.action !== "password-reset") {
      return res.status(400).json({ message: "Invalid token action" });
    }

    const userId = payload.id;
    const db = await connectToDataBase();

    // ensure user exists
    const [rows] = await db.query(`SELECT id FROM users WHERE id = ? LIMIT 1`, [userId]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const hash = await bcrypt.hash(password, 10);
    await db.query(`UPDATE users SET password = ? WHERE id = ?`, [hash, userId]);

    return res.json({ ok: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("reset-password error:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
});

export default router;
