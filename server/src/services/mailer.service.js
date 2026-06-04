// Надсилання email через nodemailer.
// Якщо SMTP не налаштовано (немає config.smtp.host) — використовується jsonTransport,
// тобто лист не надсилається реально, а виводиться в консоль (зручно для розробки).
import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  if (config.smtp.host) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

export async function sendMail({ to, subject, text }) {
  try {
    const info = await getTransporter().sendMail({
      from: config.smtp.from,
      to,
      subject,
      text,
    });
    if (!config.smtp.host) {
      console.log(`📧 [DEV email] до ${to}: ${subject}`);
    }
    return info;
  } catch (err) {
    console.error('Помилка надсилання email:', err.message);
  }
}
