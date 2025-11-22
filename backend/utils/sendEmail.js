import nodemailer from 'nodemailer';

/**
 * Sends an email using Nodemailer.
 * @param {string} to - The recipient's email address.
 * @param {string} subject - The subject line of the email.
 * @param {string} text - The plain text body of the email.
 * @param {string} [html] - The HTML body of the email (optional).
 */
export const sendEmail = async (to, subject, text, html) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    // Use true for port 465, false for other ports like 587
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"MarketSphere" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html, // Add the HTML content to the email
    });
    console.log(`Email sent to ${to} with subject "${subject}"`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    // We don't re-throw the error, as email failure shouldn't
    // block core application logic (like order creation).
  }
};
