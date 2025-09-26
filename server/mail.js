import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  RECEIVER_EMAIL,
  FROM_NAME,
  FROM_EMAIL,
} = process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !RECEIVER_EMAIL) {
  console.warn("Missing some SMTP env variables. Make sure they are set.");
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 465,
  secure: String(SMTP_SECURE).toLowerCase() === "true",
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// verify transporter (optional)
transporter
  .verify()
  .then(() => console.log("SMTP transporter ready"))
  .catch((err) => console.error("SMTP verification failed:", err));

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

router.post("/contact", async (req, res) => {
  try {
    const { name = "Website visitor", contact = "no-contact", message = "" } = req.body || {};

    // minimal validation
    if (!contact && !message) {
      return res.status(400).json({ ok: false, error: "Please send contact or message" });
    }

    const html = `
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Contact:</strong> ${escapeHtml(contact)}</p>
      <p><strong>Message:</strong></p>
      <div>${escapeHtml(message).replace(/\n/g, "<br/>")}</div>
      <hr/>
      <p>Sent from website</p>
    `;

    const mailOptions = {
      from: `"${FROM_NAME || name}" <${FROM_EMAIL || SMTP_USER}>`,
      to: RECEIVER_EMAIL,
      subject: `Website contact from ${name}`,
      text: `Name: ${name}\nContact: ${contact}\n\nMessage:\n${message}\n\n--\nSent from website`,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error sending email:", err);
    return res.status(500).json({ ok: false, error: "Failed to send email" });
  }
});

export default router;
