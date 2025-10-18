const nodemailer = require("nodemailer");
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    ciphers: "SSLv3",
  },
});

async function testMail() {
  try {
    const info = await transporter.sendMail({
      from: `"no-reply | TPO Portal" ${process.env.FROM_EMAIL}`,
      to: "krnmaheshwari2003@gmail.com",
      subject: "Test Email ✔",
      text: "This is a test email from your TPO backend setup!",
    });
    console.log("✅ Email sent:", info.messageId);
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

testMail();
