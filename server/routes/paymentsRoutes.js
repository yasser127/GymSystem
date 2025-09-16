import express from "express";
import { connectToDataBase } from "../db.js";

const router = express.Router();
const log = (...args) => console.log("[paymentsRoutes]", ...args);

router.use((req, res, next) => {
  log("REQ", req.method, req.originalUrl);
  next();
});


router.get("/_debug_payments_ping", async (req, res) => {
  return res.json({ ok: true, at: new Date().toISOString() });
});

router.get("/payment/raw", async (req, res) => {
  try {
    const db = await connectToDataBase();
    const [rows] = await db.query(
      "SELECT * FROM payment ORDER BY id DESC LIMIT 200;"
    );
    return res.json(rows || []);
  } catch (err) {
    log("payment/raw error:", err?.stack || err);
    return res
      .status(500)
      .json({
        message: "DB error (payment/raw)",
        details: String(err?.message || err),
      });
  }
});


router.get("/payment", async (req, res) => {
  try {
    const db = await connectToDataBase();
    const [rows] = await db.query(
      `SELECT pay.id,
              pay.member_id,
              u.name,
              pay.subscribe_id,
              s.plan_id,
              p.name AS plan_name,
              pay.amount,
              pay.card_hash,
              pay.payment_type_id,
              pt.name AS payment_type,
              pay.paid_at AS paid_at
       FROM payment pay
       LEFT JOIN users u ON pay.member_id = u.id
       LEFT JOIN subscribe s ON pay.subscribe_id = s.id
       LEFT JOIN plans p ON s.plan_id = p.id
       LEFT JOIN payment_type pt ON pay.payment_type_id = pt.id
       ORDER BY pay.id DESC
       LIMIT 500;`
    );
    return res.json(rows || []);
  } catch (err) {
    log("GET /payment error:", err?.stack || err);
    return res
      .status(500)
      .json({ message: "Server error", details: String(err?.message || err) });
  }
});


router.get("/users", async (req, res) => {
  try {
    const db = await connectToDataBase();
    const [rows] = await db.query(
      "SELECT id, name, email FROM users ORDER BY id DESC LIMIT 200;"
    );
    return res.json(rows || []);
  } catch (err) {
    log("GET /users error:", err?.stack || err);
    return res
      .status(500)
      .json({ message: "Server error", details: String(err?.message || err) });
  }
});

router.get("/subscribe", async (req, res) => {
  try {
    const db = await connectToDataBase();
    const [rows] = await db.query(
      "SELECT id, member_id, plan_id, start_date, end_date, status FROM subscribe ORDER BY id DESC LIMIT 200;"
    );
    return res.json(rows || []);
  } catch (err) {
    log("GET /subscribe error:", err?.stack || err);
    return res
      .status(500)
      .json({ message: "Server error", details: String(err?.message || err) });
  }
});

router.get("/plans", async (req, res) => {
  try {
    const db = await connectToDataBase();
    const [rows] = await db.query(
      "SELECT id, name, price, duration FROM plans ORDER BY id DESC LIMIT 200;"
    );
    return res.json(rows || []);
  } catch (err) {
    log("GET /plans error:", err?.stack || err);
    return res
      .status(500)
      .json({ message: "Server error", details: String(err?.message || err) });
  }
});

router.get("/payment_type", async (req, res) => {
  try {
    const db = await connectToDataBase();
    const [rows] = await db.query(
      "SELECT id, name FROM payment_type ORDER BY id;"
    );
    return res.json(rows || []);
  } catch (err) {
    log("GET /payment_type error:", err?.stack || err);
    return res
      .status(500)
      .json({ message: "Server error", details: String(err?.message || err) });
  }
});

export default router;
