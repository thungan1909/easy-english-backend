require("dotenv").config();

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendVerificationEmail(to, code, expiresAt) {

  console.log("SEND EMAIL to", to, " with code", code)
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set")
  }

  const expiresUTC = expiresAt ? new Date(expiresAt).toUTCString() : "";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.4; color:#111;">
      <h2>Easy English — Email verification</h2>
      <p>Your verification code is:</p>
      <div style="font-size: 22px; font-weight:700; margin:10px 0; letter-spacing:2px;">
        ${code}
      </div>
      <p>This code expires on <strong>${expiresUTC}</strong>.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <hr/>
      <small>© Easy English</small>
    </div>
  `;

  const from = process.env.EMAIL_FROM;
  const toEmail = process.env.EMAIL_TO; //TODO: replace with real to email
  const result = await resend.emails.send({
    from,
    // to: String(to),
    to: toEmail,
    subject: "Your Easy English verification code",
    html,
  })

  if (result?.error) {
    const err = result.error;
    throw new Error(`Resend error: ${JSON.stringify(err)}`);
  }

  return result.data ?? result

}

module.exports = { sendVerificationEmail }