import express from "express";
import { connectToDataBase } from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();
function parseIsAdmin(val) {
  // Accept true/false, "true"/"false", 1/0, "1"/"0"
  return val === true || val === "true" || val === 1 || val === "1";
}

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt:", email);

  if (!email || !password) {
    return res.status(400).json({ message: "Missing email or password" });
  }

  try {
    const pool = await connectToDataBase();
    // Query both member and admin, include password for comparison
    const [rows] = await pool.query(
      `SELECT id, email, username, password, 0 AS isAdmin
       FROM member
       WHERE email = ?
       UNION
       SELECT id, email, username, password, isAdmin
       FROM admin
       WHERE email = ?;`,
      [email, email]
    );
    console.log(rows);
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

    const token = jwt.sign(
      { id: user.id, username: user.username, isAdmin: user.isAdmin || 0 },
      process.env.JWT_KEY,
      { expiresIn: "6h" }
    );

    // Remove password before sending user object
    delete user.password;
    return res.status(201).json({ token: token });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
});

router.post("/register", async (req, res) => {
  const { name, gender, email, username, password } = req.body;
  const isAdmin = parseIsAdmin(req.body.isAdmin);

  console.log("Register attempt:", { name, gender, email, username, isAdmin });

  // Basic validation
  if (!name || !gender || !email || !username || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const allowedGenders = ["Male", "Female", "Other"];
  if (!allowedGenders.includes(gender)) {
    return res.status(400).json({ message: "Invalid gender value" });
  }

  try {
    const pool = await connectToDataBase();

    // 1) Check duplicates in member table
    const [memberExisting] = await pool.query(
      `SELECT email, username FROM member WHERE email = ? OR username = ?`,
      [email, username]
    );
    if (memberExisting && memberExisting.length > 0) {
      const sameEmail = memberExisting.some((r) => r.email === email);
      const sameUsername = memberExisting.some((r) => r.username === username);
      const message =
        sameEmail && sameUsername
          ? "Email and username already in use"
          : sameEmail
          ? "Email already in use"
          : "Username already in use";
      return res.status(409).json({ message });
    }

    // 2) Check duplicates in admin table
    // admin table columns (per your DESCRIBE): email, username exist there
    const [adminExisting] = await pool.query(
      `SELECT email, username FROM admin WHERE email = ? OR username = ?`,
      [email, username]
    );
    if (adminExisting && adminExisting.length > 0) {
      const sameEmail = adminExisting.some((r) => r.email === email);
      const sameUsername = adminExisting.some((r) => r.username === username);
      const message =
        sameEmail && sameUsername
          ? "Email and username already in use (admin)"
          : sameEmail
          ? "Email already in use (admin)"
          : "Username already in use (admin)";
      return res.status(409).json({ message });
    }

    // 3) Hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // 4) Insert into the chosen table
    if (isAdmin) {
      await pool.query(
        `INSERT INTO admin (name, phone, email, username, password, isAdmin) VALUES (?, ?, ?, ?, ?, ?)`,
        // We don't have phone from frontend — send NULL
        [name, null, email, username, hashPassword, 1]
      );
      return res
        .status(201)
        .json({ message: "Admin user created successfully" });
    } else {
      await pool.query(
        `INSERT INTO member (name, gender, email, username, password) VALUES (?, ?, ?, ?, ?)`,
        [name, gender, email, username, hashPassword]
      );
      return res
        .status(201)
        .json({ message: "Member user created successfully" });
    }
  } catch (error) {
    console.error("Register error:", error);
    // Give meaningful message in dev; in production you may want to hide internals.
    return res.status(500).json({ message: error.message || "Server error" });
  }
});

// use correct header access and attach decoded info to req
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

    // attach useful info for handlers
    req.id = decoded.id;
    req.isAdmin = !!decoded.isAdmin;
    req.user = decoded;
    next();
  } catch (error) {
    console.error("verifyToken error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

router.get("/register", verifyToken, async (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ message: "Forbidden: admins only" });
  }

  try {
    const db = await connectToDataBase();

    // choose table based on token's isAdmin flag
    const table = req.isAdmin ? "admin" : "member";

    // select only commonly needed columns to keep results consistent
    const [rows] = await db.query(
      `SELECT id, name, email, username, isAdmin FROM admin WHERE id = ?;`,
      [req.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user: rows[0] });
  } catch (error) {
    console.error("GET /register error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
});

export default router;
