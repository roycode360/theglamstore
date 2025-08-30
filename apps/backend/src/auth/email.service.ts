import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const html = `
      <div style="font-family:Inter,system-ui,sans-serif;background:#fff;color:#111;padding:24px">
        <div style="font-weight:800;font-size:18px;margin-bottom:8px;">TheGlamStore</div>
        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px">
          <div style="font-weight:600;margin-bottom:8px">Verify your email</div>
          <div style="color:#6b7280;margin-bottom:16px">Enter this 6‑digit code:</div>
          <div style="font-size:28px;letter-spacing:8px;font-weight:800;color:#e3b094">${code}</div>
        </div>
        <div style="color:#9ca3af;font-size:12px;margin-top:16px">If you didn’t request this, ignore this email.</div>
      </div>`;

    await this.transporter.sendMail({
      to: email,
      from: process.env.MAIL_FROM || 'no-reply@theglamstore.ng',
      subject: 'Your TheGlamStore verification code',
      html,
    });
  }
}
