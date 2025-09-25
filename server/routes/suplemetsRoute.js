import express from "express";
import multer from "multer";
import { connectToDataBase } from "../db.js";

const router = express.Router();


const upload = multer({ storage: multer.memoryStorage() });

router.post("/add", upload.single("image"), async (req, res) => {
  const { name, desc, price } = req.body;
  const file = req.file;
  console.log("Supplement add attempt:", { name, desc, price, hasImage: !!file });

  if (!name || !desc || price == null) {
    return res
      .status(400)
      .json({ message: "Missing required fields: name, desc (description), price" });
  }

  try {
    const pool = await connectToDataBase();
    const sql = `INSERT INTO suplements (name, description, price, image) VALUES (?, ?, ?, ?)`;
    const params = [name, desc, price, file ? file.buffer : null];

    const [result] = await pool.query(sql, params);

    return res.status(201).json({
      success: true,
      insertId: result.insertId ?? null,
      affectedRows: result.affectedRows ?? 0,
    });
  } catch (error) {
    console.error("Supplement add error:", error);
    return res.status(500).json({
      message: error.message || "Server error",
      details: String(error),
    });
  }
});


router.put("/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name, desc, price } = req.body;
  const file = req.file;

  try {
    const pool = await connectToDataBase();

   
    const fields = [];
    const params = [];

    if (name !== undefined) {
      fields.push("name = ?");
      params.push(name);
    }
    if (desc !== undefined) {
      fields.push("description = ?");
      params.push(desc);
    }
    if (price !== undefined) {
     
      params.push(price === "" ? null : price);
      fields.push("price = ?");
    }
    if (file) {
      fields.push("image = ?");
      params.push(file.buffer);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "No fields provided to update" });
    }

    const sql = `UPDATE suplements SET ${fields.join(", ")} WHERE id = ?`;
    params.push(id);

    const [result] = await pool.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.json({ success: true, affectedRows: result.affectedRows });
  } catch (error) {
    console.error("Supplement update error:", error);
    return res.status(500).json({ message: "Server error", details: String(error) });
  }
});


router.get("/", async (req, res) => {
  try {
    const pool = await connectToDataBase();
    const sql = `SELECT id, name, description, price, image FROM suplements ORDER BY id DESC`;
    const [rows] = await pool.query(sql);

    const items = (rows || []).map((r) => {
      const item = {
        id: String(r.id),
        name: r.name,
        description: r.description ?? null,
        price: r.price,
        image: null,
      };

      if (r.image && Buffer.isBuffer(r.image)) {
       
        const mimeType = "image/jpeg";
        const b64 = r.image.toString("base64");
        item.image = `data:${mimeType};base64,${b64}`;
      } else if (r.image) {
        item.image = r.image;
      }

      return item;
    });

    return res.json(items);
  } catch (error) {
    console.error("Failed to fetch supplements:", error);
    return res.status(500).json({ message: "Server error", details: String(error) });
  }
});


router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await connectToDataBase();
    const sql = `SELECT id, name, description, price, image FROM suplements WHERE id = ? LIMIT 1`;
    const [rows] = await pool.query(sql, [id]);

    if (!rows || rows.length === 0) return res.status(404).json({ message: "Not found" });

    const r = rows[0];
    const item = {
      id: String(r.id),
      name: r.name,
      description: r.description ?? null,
      price: r.price,
      image: null,
    };

    if (r.image && Buffer.isBuffer(r.image)) {
      const mimeType = "image/jpeg";
      const b64 = r.image.toString("base64");
      item.image = `data:${mimeType};base64,${b64}`;
    } else if (r.image) {
      item.image = r.image;
    }

    return res.json(item);
  } catch (error) {
    console.error("Failed to fetch supplement:", error);
    return res.status(500).json({ message: "Server error", details: String(error) });
  }
});


router.get("/:id/image", async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await connectToDataBase();
    const sql = `SELECT image FROM suplements WHERE id = ? LIMIT 1`;
    const [rows] = await pool.query(sql, [id]);
    if (!rows || rows.length === 0) return res.status(404).end();

    const r = rows[0];
    if (!r.image) return res.status(404).end();

    if (Buffer.isBuffer(r.image)) {
      res.setHeader("Content-Type", "image/jpeg");
      return res.send(r.image);
    } else {
      
      return res.json({ url: r.image });
    }
  } catch (error) {
    console.error("Failed to fetch image:", error);
    return res.status(500).json({ message: "Server error", details: String(error) });
  }
});


router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await connectToDataBase();
    const sql = `DELETE FROM suplements WHERE id = ?`;
    const [result] = await pool.query(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    return res.json({ success: true, affectedRows: result.affectedRows });
  } catch (error) {
    console.error("Failed to delete supplement:", error);
    return res.status(500).json({ message: "Server error", details: String(error) });
  }
});

export default router;
