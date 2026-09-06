import nodemailer from "nodemailer";

async function test() {
  console.log("Testing Gmail SMTP connection...");
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "arjavdariya2@gmail.com",
      pass: "zsvkfmeosfiejxph",
    },
    connectionTimeout: 8000,
  });

  try {
    await transporter.verify();
    console.log("✅ Gmail SMTP connection VERIFIED!");

    const info = await transporter.sendMail({
      from: '"DealFlow360" <arjavdariya2@gmail.com>',
      to: "arjavdariya2@gmail.com",
      subject: "Your Quotation from DealFlow360 (Live Verification)",
      html: `
        <div style="font-family:sans-serif;padding:24px;border:1px solid #e2e8f0;border-radius:10px;">
          <h2 style="color:#54324c;">DealFlow360 — Quotation Email Test</h2>
          <p>This verifies that the <strong>Quotation Email Dispatch System</strong> is online and actively delivering emails via Gmail SMTP.</p>
          <div style="background:#faf5f8;padding:12px;border-radius:8px;font-weight:bold;color:#714b67;">
            Status: Operational & Delivering
          </div>
        </div>
      `,
    });

    console.log("✅ Quotation email successfully sent! Message ID:", info.messageId);
    process.exit(0);
  } catch (err) {
    console.error("❌ Email verification failed:", err);
    process.exit(1);
  }
}

test();
