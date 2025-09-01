// routes/plansRoutes.js (dev-friendly, verbose logging)
import express from "express";
import { connectToDataBase } from "../db.js";
import multer from "multer";
import jwt from "jsonwebtoken";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// dev helper: pretty log
const log = (...args) => console.log("[plansRoutes]", ...args);

// verifyToken middleware (same as authRoutes but verbose)
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
      return res.status(401).json({ message: "Invalid authorization header format" });
    }

    const token = parts[1];
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.user = { id: decoded.id, username: decoded.username, isAdmin: !!decoded.isAdmin };
    req.id = decoded.id;
    req.isAdmin = !!decoded.isAdmin;
    next();
  } catch (err) {
    log("verifyToken error:", err?.message || err);
    return res.status(401).json({ message: "Invalid or expired token", details: err?.message });
  }
};

// validate basic payload
function validatePlanPayload({ name, price, duration }) {
  if (!name || typeof name !== "string" || name.trim() === "") return "Name is required";
  if (price === undefined || price === null || isNaN(Number(price))) return "Price must be a number";
  if (duration === undefined || duration === null || isNaN(Number(duration))) return "Duration must be an integer";
  return null;
}

/* GET /plans - list metadata */
router.get("/", async (req, res) => {
  try {
    const db = await connectToDataBase();
    const [rows] = await db.query(
      `SELECT id, name, description, price, duration, admin_id, created_at FROM plans ORDER BY id DESC;`
    );
    return res.status(200).json(rows || []);
  } catch (err) {
    log("GET /plans error:", err);
    return res.status(500).json({ message: "Server error", details: err?.message });
  }
});

/* GET /plans/:id/image - serve image blob */
router.get("/:id/image", async (req, res) => {
  try {
    const id = req.params.id;
    const db = await connectToDataBase();
    const [rows] = await db.query(`SELECT image FROM plans WHERE id = ? LIMIT 1;`, [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ message: "Plan not found" });
    const rec = rows[0];
    if (!rec.image) return res.status(404).json({ message: "Image not found" });
    // Best-effort content-type so browsers try: image/* may render many types
    res.setHeader("Content-Type", "image/*");
    return res.status(200).send(rec.image);
  } catch (err) {
    log("GET image error:", err);
    return res.status(500).json({ message: "Server error", details: err?.message });
  }
});

/* POST /plans - create plan (admin only) */
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  // Because we are using multer, req.body contains the form fields
  try {
    log("CREATE /plans request received");
    log("Headers:", req.headers ? { authorization: req.headers.authorization } : {});
    log("User from token:", req.user);

    if (!req.isAdmin) {
      log("Create forbidden: not admin:", req.user);
      return res.status(403).json({ message: "Forbidden: admins only" });
    }

    // fields from multipart/form-data
    const { name, description = null, price, duration } = req.body;
    log("Form fields:", { name, price, duration, description });
    if (req.file) log("Uploaded file:", { originalname: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype });

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
        [name, description, Number(price), Number(duration), adminId, imageBuffer]
      );
      log("Inserted plan id:", result.insertId);
      return res.status(201).json({ message: "Plan created", id: result.insertId });
    } catch (dbErr) {
      log("DB error on insert:", dbErr);
      if (dbErr && dbErr.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Plan name already exists", details: dbErr.sqlMessage || dbErr.message });
      }
      return res.status(500).json({ message: "Database error", details: dbErr?.message || dbErr });
    }
  } catch (err) {
    // Multer throws a MulterError for file-size or multipart issues; catch it and return
    log("Unhandled error in POST /plans:", err);
    return res.status(500).json({ message: "Server error", details: err?.message || err });
  }
});

/* PUT /plans/:id - update plan (admin only) */
router.put("/:id", verifyToken, upload.single("image"), async (req, res) => {
  try {
    log("UPDATE /plans/:id called:", req.params.id, "user:", req.user && req.user.id);
    if (!req.isAdmin) return res.status(403).json({ message: "Forbidden: admins only" });

    const planId = req.params.id;
    const { name, description, price, duration } = req.body;
    const removeImage = req.query.removeImage === "true" || req.query.removeImage === "1";

    log("Update payload:", { name, price, duration, description, removeImage, file: req.file ? { name: req.file.originalname, size: req.file.size } : null });

    const fields = [];
    const params = [];

    if (name !== undefined) { if (!name || name.trim() === "") return res.status(400).json({ message: "Invalid name" }); fields.push("name = ?"); params.push(name); }
    if (description !== undefined) { fields.push("description = ?"); params.push(description); }
    if (price !== undefined) { if (price === "" || isNaN(Number(price))) return res.status(400).json({ message: "Invalid price" }); fields.push("price = ?"); params.push(Number(price)); }
    if (duration !== undefined) { if (duration === "" || isNaN(Number(duration))) return res.status(400).json({ message: "Invalid duration" }); fields.push("duration = ?"); params.push(Number(duration)); }

    if (req.file) {
      fields.push("image = ?");
      params.push(req.file.buffer);
    } else if (removeImage) {
      fields.push("image = NULL");
    }

    if (fields.length === 0) return res.status(400).json({ message: "No updatable fields provided" });

    params.push(planId);
    const sql = `UPDATE plans SET ${fields.join(", ")} WHERE id = ?;`;
    const db = await connectToDataBase();

    try {
      const [result] = await db.query(sql, params);
      if (result.affectedRows === 0) return res.status(404).json({ message: "Plan not found" });
      return res.status(200).json({ message: "Plan updated" });
    } catch (dbErr) {
      log("DB error on update:", dbErr);
      if (dbErr && dbErr.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Plan name already exists" });
      return res.status(500).json({ message: "Database error", details: dbErr?.message });
    }
  } catch (err) {
    log("Unhandled update error:", err);
    return res.status(500).json({ message: "Server error", details: err?.message || err });
  }
});

/* DELETE /plans/:id - admin only */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    log("DELETE /plans/:id called:", req.params.id, "by user:", req.user && req.user.id);
    if (!req.isAdmin) return res.status(403).json({ message: "Forbidden: admins only" });

    const db = await connectToDataBase();
    const [result] = await db.query(`DELETE FROM plans WHERE id = ?;`, [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Plan not found" });
    return res.status(200).json({ message: "Plan deleted" });
  } catch (err) {
    log("DELETE error:", err);
    return res.status(500).json({ message: "Server error", details: err?.message || err });
  }
});

export default router;
