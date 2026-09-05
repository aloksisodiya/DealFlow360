import "dotenv/config";
import nodemailer from "nodemailer";

/**
 * DealFlow360 - Enterprise Email Dispatch Service (Nodemailer)
 * 
 * Supports production Gmail SMTP, Microsoft 365, SendGrid, Amazon SES, or custom SMTP servers.
 * When real SMTP credentials (SMTP_USER and SMTP_PASS) are provided in server/.env,
 * emails are dispatched directly to the recipient's real mailbox (Gmail, Outlook, etc.).
 */

let transporter = null;

export function resetTransporter() {
  transporter = null;
}

async function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_SERVICE, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  // Real Email Dispatch Configuration (e.g. Gmail App Password, Sendgrid, etc.)
  if (SMTP_USER && SMTP_PASS) {
    const isGmail = (SMTP_SERVICE && SMTP_SERVICE.toLowerCase() === "gmail") ||
      (SMTP_HOST && SMTP_HOST.includes("gmail")) ||
      (SMTP_USER && SMTP_USER.endsWith("@gmail.com"));

    if (isGmail && !SMTP_HOST) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });
      console.log(`[EmailService] Connected to Gmail SMTP service for: ${SMTP_USER}`);
    } else {
      transporter = nodemailer.createTransport({
        host: SMTP_HOST || "smtp.gmail.com",
        port: Number(SMTP_PORT) || 465,
        secure: SMTP_SECURE === "true" || Number(SMTP_PORT) === 465 || !SMTP_PORT,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });
      console.log(`[EmailService] Connected to SMTP server (${SMTP_HOST || "smtp.gmail.com"}) for: ${SMTP_USER}`);
    }
  } else {
    // Development / Test inbox fallback when SMTP credentials are not yet entered in .env
    console.warn(
      "[EmailService] Notice: SMTP_USER and SMTP_PASS are not configured in server/.env.\n" +
      "To send directly to actual Gmail/inbox addresses, add your SMTP_USER and SMTP_PASS (Google App Password) to server/.env."
    );
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[EmailService] Using temporary test transport (${testAccount.user})`);
    } catch {
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  return transporter;
}

/**
 * Send password reset email with 6-digit OTP verification code
 */
export async function sendPasswordResetEmail({ toEmail, resetCode, userName = "DealFlow360 User" }) {
  try {
    const mailer = await getTransporter();

    const fromAddress = process.env.EMAIL_FROM || (process.env.SMTP_USER ? `"DealFlow360 Security" <${process.env.SMTP_USER}>` : '"DealFlow360 Security Team" <security@dealflow360.com>');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>DealFlow360 Password Reset</title>
      </head>
      <body style="margin: 0; padding: 24px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #54324c 0%, #3b2235 100%); padding: 28px 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">
                DealFlow<span style="color: #f3c2e7;">360</span>
              </h1>
              <p style="color: #f5d0eb; margin: 6px 0 0; font-size: 13px; letter-spacing: 0.5px;">Enterprise CPQ & Deal Governance Platform</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px 24px;">
              <div style="display: inline-block; padding: 4px 10px; background-color: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 6px; font-size: 12px; font-weight: 600; color: #9d174d; margin-bottom: 16px;">
                SECURITY VERIFICATION
              </div>
              <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 12px;">Password Reset Request</h2>
              <p style="font-size: 14.5px; color: #475569; line-height: 1.6; margin: 0 0 16px;">
                Hello <strong>${userName}</strong>,
              </p>
              <p style="font-size: 14.5px; color: #475569; line-height: 1.6; margin: 0 0 24px;">
                We received a request to reset credentials for your DealFlow360 account associated with <strong>${toEmail}</strong>. Please use the following 6-digit verification code to complete the process:
              </p>

              <!-- OTP Code Display -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: #faf5f8; border: 2px dashed #714b67; border-radius: 12px; padding: 18px 42px; text-align: center;">
                      <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #54324c; font-family: monospace;">
                        ${resetCode}
                      </span>
                    </div>
                    <p style="font-size: 12.5px; color: #64748b; margin: 10px 0 0;">
                      ⏱️ This code expires in <strong>15 minutes</strong> and can only be used once.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13.5px; color: #64748b; line-height: 1.6; margin: 24px 0 0;">
                If you did not initiate this password reset, no action is needed. Your account remains secure and your current password will not change.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
              <p style="margin: 0 0 6px;">DealFlow360 Technologies Inc. • Enterprise Grade Security</p>
              <p style="margin: 0;">256-Bit TLS Encryption • SOC 2 Type II Certified • Support: <a href="mailto:security@dealflow360.com" style="color: #714b67; text-decoration: none;">security@dealflow360.com</a></p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const info = await mailer.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `[DealFlow360 Security] Your Verification Code: ${resetCode}`,
      text: `Your DealFlow360 password reset code is: ${resetCode}. It is valid for 15 minutes.`,
      html: htmlContent,
    });

    console.log(`[EmailService] Password reset email dispatched to ${toEmail}. MessageId: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("[EmailService] Failed to dispatch password reset email:", error.message);
    throw error;
  }
}
