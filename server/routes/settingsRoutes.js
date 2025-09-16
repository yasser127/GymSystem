import express from "express";
import { connectToDataBase } from "../db.js";

const router = express.Router();
const log = (...args) => console.log("[settingsRoutes]", ...args);


router.get("/payment-types", async (req, res) => {
  try {
    const db = await connectToDataBase();
    const [rows] = await db.query(
      `SELECT id, name, description, created_at FROM payment_type ORDER BY id DESC`
    );
    return res.json(rows || []);
  } catch (err) {
    log("GET /payment-types error:", err?.stack || err);
    return res
      .status(500)
      .json({
        message: "Server error (payment-types)",
        details: String(err?.message || err),
      });
  }
});


router.post("/payment-types", async (req, res) => {
  try {
    const { name, description } = req.body || {};
    if (!name || !name.trim())
      return res.status(400).json({ message: "Name is required" });

    const db = await connectToDataBase();

    const [exists] = await db.query(
      `SELECT id FROM payment_type WHERE name = ? LIMIT 1`,
      [name.trim()]
    );
    if (Array.isArray(exists) && exists.length > 0) {
      return res
        .status(409)
        .json({ message: "Payment type with this name already exists" });
    }

    const [result] = await db.query(
      `INSERT INTO payment_type (name, description) VALUES (?, ?)`,
      [name.trim(), description ?? null]
    );

    const [rows] = await db.query(
      `SELECT id, name, description, created_at FROM payment_type WHERE id = ? LIMIT 1`,
      [result.insertId]
    );
    return res.status(201).json(rows[0] || null);
  } catch (err) {
    log("POST /payment-types error:", err?.stack || err);
    return res
      .status(500)
      .json({
        message: "Server error (create payment-type)",
        details: String(err?.message || err),
      });
  }
});


router.patch("/payment-types/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id))
      return res.status(400).json({ message: "Invalid id" });

    const { name, description } = req.body || {};
    if (!name && !description)
      return res.status(400).json({ message: "Nothing to update" });

    const db = await connectToDataBase();

    if (name) {
      const [existing] = await db.query(
        `SELECT id FROM payment_type WHERE name = ? AND id <> ? LIMIT 1`,
        [name.trim(), id]
      );
      if (Array.isArray(existing) && existing.length > 0) {
        return res
          .status(409)
          .json({ message: "Another payment type with this name exists" });
      }
    }

    await db.query(
      `UPDATE payment_type SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?`,
      [name ?? null, description ?? null, id]
    );

    const [rows] = await db.query(
      `SELECT id, name, description, created_at FROM payment_type WHERE id = ? LIMIT 1`,
      [id]
    );
    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    if (!row)
      return res.status(404).json({ message: "Payment type not found" });

    return res.json(row);
  } catch (err) {
    log("PATCH /payment-types/:id error:", err?.stack || err);
    return res
      .status(500)
      .json({
        message: "Server error (update payment-type)",
        details: String(err?.message || err),
      });
  }
});


router.delete("/payment-types/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id))
      return res.status(400).json({ message: "Invalid id" });

    const db = await connectToDataBase();
    const [result] = await db.query(`DELETE FROM payment_type WHERE id = ?`, [
      id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Payment type not found" });

    return res.json({ ok: true });
  } catch (err) {
    log("DELETE /payment-types/:id error:", err?.stack || err);
    return res
      .status(500)
      .json({
        message: "Server error (delete payment-type)",
        details: String(err?.message || err),
      });
  }
});


router.get("/user-types", async (req, res) => {
  try {
    const db = await connectToDataBase();
    const [rows] = await db.query(
      `SELECT id, name, can_view_subscriptions, can_view_members, can_view_payments, created_at FROM user_type ORDER BY id ASC`
    );
    return res.json(rows || []);
  } catch (err) {
    log("GET /user-types error:", err?.stack || err);
    return res
      .status(500)
      .json({
        message: "Server error (user-types)",
        details: String(err?.message || err),
      });
  }
});


router.post("/user-types", async (req, res) => {
  try {
    const {
      name,
      can_view_subscriptions,
      can_view_members,
      can_view_payments,
    } = req.body || {};
    if (!name || !name.trim())
      return res.status(400).json({ message: "Name is required" });

    const db = await connectToDataBase();
    const [exists] = await db.query(
      `SELECT id FROM user_type WHERE name = ? LIMIT 1`,
      [name.trim()]
    );
    if (Array.isArray(exists) && exists.length > 0) {
      return res
        .status(409)
        .json({ message: "User type with this name already exists" });
    }

    const [result] = await db.query(
      `INSERT INTO user_type (name, can_view_subscriptions, can_view_members, can_view_payments) VALUES (?, ?, ?, ?)`,
      [
        name.trim(),
        can_view_subscriptions ? 1 : 0,
        can_view_members ? 1 : 0,
        can_view_payments ? 1 : 0,
      ]
    );

    const [rows] = await db.query(
      `SELECT id, name, can_view_subscriptions, can_view_members, can_view_payments, created_at FROM user_type WHERE id = ? LIMIT 1`,
      [result.insertId]
    );
    return res.status(201).json(rows[0] || null);
  } catch (err) {
    log("POST /user-types error:", err?.stack || err);
    return res
      .status(500)
      .json({
        message: "Server error (create user-type)",
        details: String(err?.message || err),
      });
  }
});


router.patch("/user-types/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id))
      return res.status(400).json({ message: "Invalid id" });

    const {
      name,
      can_view_subscriptions,
      can_view_members,
      can_view_payments,
    } = req.body || {};
    if (
      !name &&
      can_view_subscriptions === undefined &&
      can_view_members === undefined &&
      can_view_payments === undefined
    ) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    const db = await connectToDataBase();
    if (name) {
      const [existing] = await db.query(
        `SELECT id FROM user_type WHERE name = ? AND id <> ? LIMIT 1`,
        [name.trim(), id]
      );
      if (Array.isArray(existing) && existing.length > 0) {
        return res
          .status(409)
          .json({ message: "Another user type with this name exists" });
      }
    }

    await db.query(
      `UPDATE user_type
       SET name = COALESCE(?, name),
           can_view_subscriptions = COALESCE(?, can_view_subscriptions),
           can_view_members = COALESCE(?, can_view_members),
           can_view_payments = COALESCE(?, can_view_payments)
       WHERE id = ?`,
      [
        name ?? null,
        can_view_subscriptions === undefined
          ? null
          : can_view_subscriptions
          ? 1
          : 0,
        can_view_members === undefined ? null : can_view_members ? 1 : 0,
        can_view_payments === undefined ? null : can_view_payments ? 1 : 0,
        id,
      ]
    );

    const [rows] = await db.query(
      `SELECT id, name, can_view_subscriptions, can_view_members, can_view_payments, created_at FROM user_type WHERE id = ? LIMIT 1`,
      [id]
    );
    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    if (!row) return res.status(404).json({ message: "User type not found" });

    return res.json(row);
  } catch (err) {
    log("PATCH /user-types/:id error:", err?.stack || err);
    return res
      .status(500)
      .json({
        message: "Server error (update user-type)",
        details: String(err?.message || err),
      });
  }
});


router.delete("/user-types/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id))
      return res.status(400).json({ message: "Invalid id" });

    const db = await connectToDataBase();

 
    const [usersWithType] = await db.query(
      `SELECT id FROM users WHERE user_type_id = ? LIMIT 1`,
      [id]
    );
    if (Array.isArray(usersWithType) && usersWithType.length > 0) {
      return res
        .status(409)
        .json({
          message:
            "Cannot delete user type; it is assigned to one or more users",
        });
    }

    const [result] = await db.query(`DELETE FROM user_type WHERE id = ?`, [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User type not found" });

    return res.json({ ok: true });
  } catch (err) {
    log("DELETE /user-types/:id error:", err?.stack || err);
    return res
      .status(500)
      .json({
        message: "Server error (delete user-type)",
        details: String(err?.message || err),
      });
  }
});

export default router;
