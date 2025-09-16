import express from "express";
import { connectToDataBase } from "../db.js";
import multer from "multer";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const log = (...args) => console.log("[plansRoutes]", ...args);


const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.header("Authorization");
    if (!authHeader) {
      log("verifyToken: missing Authorization header");
      return res.status(403).json({ message: "No authorization header" });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      log("verifyToken: bad auth header format", authHeader);
      return res
        .status(401)
        .json({ message: "Invalid authorization header format" });
    }

    const token = parts[1];
    const decoded = jwt.verify(token, process.env.JWT_KEY);

    req.user = decoded;
    req.id = decoded.id;
    req.user_type = decoded.user_type ?? null;
    req.permissions = decoded.permissions ?? {};
    req.isAdmin =
      decoded.user_type === "admin" || !!decoded.permissions?.isAdmin || false;

    next();
  } catch (err) {
    log("verifyToken error:", err?.message || err);
    return res
      .status(401)
      .json({ message: "Invalid or expired token", details: err?.message });
  }
};

function validatePlanPayload({ name, price, duration }) {
  if (!name || typeof name !== "string" || name.trim() === "")
    return "Name is required";
  if (price === undefined || price === null || isNaN(Number(price)))
    return "Price must be a number";
  if (duration === undefined || duration === null || isNaN(Number(duration)))
    return "Duration must be an integer";
  return null;
}


router.get("/", async (req, res) => {
  try {
    const db = await connectToDataBase();
    const [rows] = await db.query(
      `SELECT id, name, description, price, duration, admin_id, created_at FROM plans ORDER BY id DESC;`
    );
    return res.status(200).json(rows || []);
  } catch (err) {
    log("GET /plans error:", err);
    return res
      .status(500)
      .json({ message: "Server error", details: err?.message });
  }
});

router.get("/:id/image", async (req, res) => {
  try {
    const id = req.params.id;
    const db = await connectToDataBase();
    const [rows] = await db.query(
      `SELECT image FROM plans WHERE id = ? LIMIT 1;`,
      [id]
    );
    if (!rows || rows.length === 0)
      return res.status(404).json({ message: "Plan not found" });
    const rec = rows[0];
    if (!rec.image) return res.status(404).json({ message: "Image not found" });
    res.setHeader("Content-Type", "image/*");
    return res.status(200).send(rec.image);
  } catch (err) {
    log("GET image error:", err);
    return res
      .status(500)
      .json({ message: "Server error", details: err?.message });
  }
});


router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    log("CREATE /plans request received");
    log("User from token:", req.user);


    if (req.user_type !== "admin") {
      log("Create forbidden: not admin:", req.user);
      return res.status(403).json({ message: "Forbidden: admins only" });
    }

    const { name, description = null, price, duration } = req.body;
    if (req.file)
      log("Uploaded file:", {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });

    const validation = validatePlanPayload({ name, price, duration });
    if (validation) {
      return res.status(400).json({ message: validation });
    }

    const db = await connectToDataBase();
    const imageBuffer = req.file ? req.file.buffer : null;
    const adminId = req.user.id || null;

    try {
      const [result] = await db.query(
        `INSERT INTO plans (name, description, price, duration, admin_id, image)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [
          name,
          description,
          Number(price),
          Number(duration),
          adminId,
          imageBuffer,
        ]
      );
      log("Inserted plan id:", result.insertId);
      return res
        .status(201)
        .json({ message: "Plan created", id: result.insertId });
    } catch (dbErr) {
      log("DB error on insert:", dbErr);
      if (dbErr && dbErr.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          message: "Plan name already exists",
          details: dbErr.sqlMessage || dbErr.message,
        });
      }
      return res
        .status(500)
        .json({ message: "Database error", details: dbErr?.message || dbErr });
    }
  } catch (err) {
    log("Unhandled error in POST /plans:", err);
    return res
      .status(500)
      .json({ message: "Server error", details: err?.message || err });
  }
});


router.put("/:id", verifyToken, upload.single("image"), async (req, res) => {
  try {
    log(
      "UPDATE /plans/:id called:",
      req.params.id,
      "user:",
      req.user && req.user.id
    );
    if (req.user_type !== "admin")
      return res.status(403).json({ message: "Forbidden: admins only" });

    const planId = req.params.id;
    const { name, description, price, duration } = req.body;
    const removeImage =
      req.query.removeImage === "true" || req.query.removeImage === "1";

    log("Update payload:", {
      name,
      price,
      duration,
      description,
      removeImage,
      file: req.file
        ? { name: req.file.originalname, size: req.file.size }
        : null,
    });

    const fields = [];
    const params = [];

    if (name !== undefined) {
      if (!name || name.trim() === "")
        return res.status(400).json({ message: "Invalid name" });
      fields.push("name = ?");
      params.push(name);
    }
    if (description !== undefined) {
      fields.push("description = ?");
      params.push(description);
    }
    if (price !== undefined) {
      if (price === "" || isNaN(Number(price)))
        return res.status(400).json({ message: "Invalid price" });
      fields.push("price = ?");
      params.push(Number(price));
    }
    if (duration !== undefined) {
      if (duration === "" || isNaN(Number(duration)))
        return res.status(400).json({ message: "Invalid duration" });
      fields.push("duration = ?");
      params.push(Number(duration));
    }

    if (req.file) {
      fields.push("image = ?");
      params.push(req.file.buffer);
    } else if (removeImage) {
      fields.push("image = NULL");
    }

    if (fields.length === 0)
      return res.status(400).json({ message: "No updatable fields provided" });

    params.push(planId);
    const sql = `UPDATE plans SET ${fields.join(", ")} WHERE id = ?;`;
    const db = await connectToDataBase();

    try {
      const [result] = await db.query(sql, params);
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Plan not found" });
      return res.status(200).json({ message: "Plan updated" });
    } catch (dbErr) {
      log("DB error on update:", dbErr);
      if (dbErr && dbErr.code === "ER_DUP_ENTRY")
        return res.status(409).json({ message: "Plan name already exists" });
      return res
        .status(500)
        .json({ message: "Database error", details: dbErr?.message });
    }
  } catch (err) {
    log("Unhandled update error:", err);
    return res
      .status(500)
      .json({ message: "Server error", details: err?.message || err });
  }
});


router.delete("/:id", verifyToken, async (req, res) => {
  try {
    log(
      "DELETE /plans/:id called:",
      req.params.id,
      "by user:",
      req.user && req.user.id
    );
    if (req.user_type !== "admin")
      return res.status(403).json({ message: "Forbidden: admins only" });

    const db = await connectToDataBase();
    const [result] = await db.query(`DELETE FROM plans WHERE id = ?;`, [
      req.params.id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Plan not found" });
    return res.status(200).json({ message: "Plan deleted" });
  } catch (err) {
    log("DELETE error:", err);
    return res
      .status(500)
      .json({ message: "Server error", details: err?.message || err });
  }
});

router.get("/payment-types", async (req, res) => {
  try {
    const db = await connectToDataBase();
    const [rows] = await db.query("SELECT id, name FROM payment_type;");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching payment types:", err);
    res.status(500).json({ message: "Failed to fetch payment types" });
  }
});

async function resolvePaymentTypeId(db, provided, cardPresent) {

  if (provided !== undefined && provided !== null) {
  
    if (typeof provided === "number" || /^\d+$/.test(String(provided))) {
      const id = Number(provided);
      const [rows] = await db.query(
        "SELECT id FROM payment_type WHERE id = ? LIMIT 1;",
        [id]
      );
      if (rows && rows.length > 0) return id;
      return null;
    }

    const [rowsByName] = await db.query(
      "SELECT id FROM payment_type WHERE name = ? LIMIT 1;",
      [String(provided)]
    );
    if (rowsByName && rowsByName.length > 0) return rowsByName[0].id;
    return null;
  }


  const preferred = cardPresent ? "Credit Card" : "Cash";
  let [rows] = await db.query(
    "SELECT id FROM payment_type WHERE name = ? LIMIT 1;",
    [preferred]
  );
  if (rows && rows.length > 0) return rows[0].id;


  [rows] = await db.query("SELECT id FROM payment_type LIMIT 1;");
  return rows && rows.length > 0 ? rows[0].id : null;
}


router.post("/:id/subscribe", verifyToken, async (req, res) => {
  try {
    const memberId = req.id;
    const planId = Number(req.params.id);
    if (!memberId) return res.status(403).json({ message: "Unauthorized" });

    const db = await connectToDataBase();


    const [planRows] = await db.query(
      `SELECT id, name, price, duration FROM plans WHERE id = ? LIMIT 1;`,
      [planId]
    );
    if (!planRows || planRows.length === 0)
      return res.status(404).json({ message: "Plan not found" });
    const plan = planRows[0];

   
    const [activeRows] = await db.query(
      `SELECT COUNT(1) as c FROM subscribe WHERE member_id = ? AND plan_id = ? AND status = 'Active' AND (end_date IS NULL OR end_date >= CURDATE());`,
      [memberId, planId]
    );
    if (activeRows && activeRows[0] && activeRows[0].c > 0) {
      return res
        .status(400)
        .json({
          message: "You already have an active subscription for this plan.",
        });
    }


    const { card, payment_type_id } = req.body || {};

    const payMethodId = await resolvePaymentTypeId(db, payment_type_id, !!card);


    let cardHash = null;
    if (card && card.number) {
      const last4 = String(card.number).slice(-4);
      const raw = String(card.number);
      cardHash =
        crypto.createHash("sha256").update(raw).digest("hex").slice(0, 64) +
        `|last4:${last4}`;
    }


    try {
      await db.query("START TRANSACTION;");

    
      const startDate = new Date();
      const startDateStr = startDate.toISOString().slice(0, 10); // YYYY-MM-DD
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + Number(plan.duration));
      const endDateStr = endDate.toISOString().slice(0, 10);

      const status = "Active";

      const [subResult] = await db.query(
        `INSERT INTO subscribe (member_id, plan_id, start_date, end_date, renewal_date, status)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [memberId, planId, startDateStr, endDateStr, endDateStr, status]
      );

      const subscribeId = subResult.insertId;

   
      const amount = Number(plan.price) || 0;
      const [payResult] = await db.query(
        `INSERT INTO payment (member_id, subscribe_id, amount, card_hash, payment_type_id)
         VALUES (?, ?, ?, ?, ?);`,
        [memberId, subscribeId, amount, cardHash, payMethodId]
      );

      await db.query("COMMIT;");
      return res.status(201).json({
        message: "Subscription created",
        subscriptionId: subscribeId,
        paymentId: payResult.insertId,
      });
    } catch (txErr) {
      log("Transaction error creating subscription/payment:", txErr);
      try {
        await db.query("ROLLBACK;");
      } catch (rbErr) {
        log("Rollback failed:", rbErr);
      }
      return res
        .status(500)
        .json({
          message: "Failed to create subscription",
          details: txErr?.message || txErr,
        });
    }
  } catch (err) {
    log("Unhandled error in /:id/subscribe:", err);
    return res
      .status(500)
      .json({ message: "Server error", details: err?.message || err });
  }
});


router.get("/subscriptions", verifyToken, async (req, res) => {
  try {
    const memberId = req.id;
    const db = await connectToDataBase();
    const [rows] = await db.query(
      `SELECT s.id as subscription_id, s.plan_id, s.start_date, s.end_date, s.renewal_date, s.status, s.created_at,
              p.name as plan_name, p.description as plan_description, p.price as plan_price, p.duration as plan_duration
       FROM subscribe s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.member_id = ?
       ORDER BY s.created_at DESC;`,
      [memberId]
    );
    return res.status(200).json(rows || []);
  } catch (err) {
    log("GET /plans/subscriptions error:", err);
    return res
      .status(500)
      .json({ message: "Server error", details: err?.message });
  }
});

export default router;
