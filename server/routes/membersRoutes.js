// routes/membersRoutes.js
import express from "express";
import { connectToDataBase } from "../db.js";

const router = express.Router();
const log = (...args) => console.log("[membersRoutes]", ...args);

// simple logger for this router
router.use((req, res, next) => {
  log(req.method, req.originalUrl);
  next();
});

/**
 * GET /members
 * Returns users that are members only (user_type_id = 2).
 * Fields: id, name, email, phone, user_type_id
 */
router.get("/members", async (req, res) => {
  try {
    const db = await connectToDataBase();
    const [rows] = await db.query(
      `SELECT id, name, email, phone, user_type_id
       FROM users
       WHERE user_type_id = 2
       ORDER BY id DESC
       LIMIT 1000;`
    );
    return res.json(rows || []);
  } catch (err) {
    log("GET /members error:", err?.stack || err);
    return res.status(500).json({
      message: "Server error (members)",
      details: String(err?.message || err),
    });
  }
});

/**
 * GET /members/:id
 * Return a single member by id (useful for edit page).
 */
router.get("/members/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid member id" });
    }

    const db = await connectToDataBase();
    const [rows] = await db.query(
      `SELECT id, name, email, phone, user_type_id
       FROM users
       WHERE id = ? AND user_type_id = 2
       LIMIT 1;`,
      [id]
    );

    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    if (!row) return res.status(404).json({ message: "Member not found" });

    return res.json(row);
  } catch (err) {
    log("GET /members/:id error:", err?.stack || err);
    return res.status(500).json({
      message: "Server error (members/:id)",
      details: String(err?.message || err),
    });
  }
});


// PATCH /members/:id  -- updates name, email, phone for a member
router.patch("/members/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid member id" });
    }

    const { name, email, phone } = req.body || {};
    if (!name && !email && !phone) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const db = await connectToDataBase();

    // ensure only members (user_type_id = 2) are updated via this route
    const [result] = await db.query(
      `UPDATE users
       SET name = COALESCE(?, name),
           email = COALESCE(?, email),
           phone = COALESCE(?, phone)
       WHERE id = ? AND user_type_id = 2`,
      [name ?? null, email ?? null, phone ?? null, id]
    );

    const [rows] = await db.query(
      `SELECT id, name, email, phone, user_type_id FROM users WHERE id = ? LIMIT 1`,
      [id]
    );

    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    if (!row) {
      return res.status(404).json({ message: "Member not found or not a member" });
    }

    return res.json(row);
  } catch (err) {
    log("PATCH /members/:id error:", err?.stack || err);
    return res.status(500).json({
      message: "Server error (patch member)",
      details: String(err?.message || err),
    });
  }
});


export default router;
