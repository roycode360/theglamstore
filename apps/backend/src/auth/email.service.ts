import { Injectable } from '@nestjs/common';
import Plunk from '@plunk/node';

@Injectable()
export class EmailService {
  private plunk = new Plunk(process.env.PLUNK_API_KEY || '');

  async sendContactMessage(params: {
    name: string;
    email: string;
    subject?: string;
    message: string;
  }): Promise<void> {
    const toEmail = process.env.ADMIN_EMAIL_1 || '';
    if (!toEmail) return;
    const html = `
      <div style="font-family:Inter,system-ui,sans-serif;background:#fff;color:#111;padding:24px">
        <div style="font-weight:800;font-size:18px;margin-bottom:8px;">New Contact Message</div>
        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px">
          <div style="margin-bottom:8px"><strong>From:</strong> ${params.name} (${params.email})</div>
          <div style="margin-bottom:8px"><strong>Subject:</strong> ${params.subject || '—'}</div>
          <div style="white-space:pre-wrap">${params.message}</div>
        </div>
      </div>`;

    await this.plunk.emails.send({
      to: toEmail,
      from: process.env.MAIL_FROM || 'no-reply@theglamstore.ng',
      subject: `Customer Inquiry: ${params.subject || 'New message'}`,
      body: html,
    });
  }

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

    await this.plunk.emails.send({
      to: email,
      from: process.env.MAIL_FROM || 'no-reply@theglamstore.ng',
      subject: 'Your TheGlamStore verification code',
      body: html,
    });
  }

  async sendOrderStatusEmail(params: {
    order: {
      _id: string;
      email: string;
      firstName: string;
      subtotal: number;
      tax: number;
      total: number;
      paymentMethod: string;
      address1: string;
      city: string;
      state: string;
      items: Array<{
        productId: string;
        name?: string;
        price?: number;
        quantity?: number;
        selectedSize?: string;
        selectedColor?: string;
        image?: string;
      }>;
    };
    status: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  }): Promise<void> {
    const { order, status } = params;
    const orderId = order._id;
    const subjectMap: Record<typeof status, string> = {
      confirmed: `Your order ${orderId} is confirmed`,
      processing: `Your order ${orderId} is processing`,
      shipped: `Your order ${orderId} has been shipped`,
      delivered: `Your order ${orderId} was delivered`,
      cancelled: `Your order ${orderId} was cancelled`,
    } as const;

    const headlineMap: Record<typeof status, string> = {
      confirmed: 'Order Confirmed',
      processing: 'Order Processing',
      shipped: 'Order Shipped',
      delivered: 'Order Delivered',
      cancelled: 'Order Cancelled',
    } as const;

    const messageMap: Record<typeof status, string> = {
      confirmed:
        'Thanks for shopping with TheGlamStore. We have confirmed your order and will start processing it shortly.',
      processing:
        'Great news! Your order is now being prepared. We will notify you once it ships.',
      shipped: 'Your order is on the way! You will receive your package soon.',
      delivered:
        'Your order has been delivered. We hope you love your purchase!',
      cancelled:
        'Your order has been cancelled. If you did not request this or have questions, please contact support.',
    } as const;

    const brandColor = '#e3b094';
    const textColor = '#111827';
    const mutedColor = '#6b7280';
    const border = '#e5e7eb';
    const currency = (n: number) =>
      `₦${Number(n || 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
    const orderLink = `${'https://www.theglamstore.ng'}/orders/${orderId}`;

    const rows = order.items
      .map((it) => {
        const line = (it.price || 0) * (it.quantity || 0);
        const imageCell = it.image
          ? `<td style="vertical-align:top;padding-right:10px">
               <img src="${it.image}" width="48" height="48" alt="${
                 it.name ?? 'Product'
               }" style="border-radius:8px;border:1px solid ${border};object-fit:cover;display:block" />
             </td>`
          : '';
        return `
          <tr>
            <td style="padding:10px;border-bottom:1px solid ${border}">
              <table role="presentation" style="border-collapse:collapse"><tr>
                ${imageCell}
                <td style="vertical-align:top">
                  <div style="font-weight:600">${it.name ?? 'Item'}</div>
                  <div style="color:${mutedColor};font-size:12px">Size: ${
                    it.selectedSize || '—'
                  } · Color: ${it.selectedColor || '—'}</div>
                  <div style="color:${mutedColor};font-size:12px">ID: ${
                    it.productId
                  }</div>
                </td>
              </tr></table>
            </td>
            <td style="padding:10px;border-bottom:1px solid ${border};text-align:center">${
              it.quantity ?? 0
            }</td>
            <td style="padding:10px;border-bottom:1px solid ${border};text-align:right">${currency(
              it.price || 0,
            )}</td>
            <td style="padding:10px;border-bottom:1px solid ${border};text-align:right;font-weight:600">${currency(
              line,
            )}</td>
          </tr>`;
      })
      .join('');

    const html = `
      <div style="font-family:Inter,system-ui,sans-serif;background:#fff;color:${textColor};padding:24px">
        <div style="font-weight:800;font-size:18px;margin-bottom:8px">TheGlamStore</div>
        <div style="border:1px solid ${border};border-radius:12px;padding:20px">
          <div style="font-weight:700;margin-bottom:8px">${headlineMap[status]}</div>
          <div style="color:${mutedColor};margin-bottom:16px">Order ID: <span style="font-family:ui-monospace,Menlo,monospace">${orderId}</span></div>
          <div style="margin-bottom:12px">${messageMap[status]}</div>

          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px">
            <thead>
              <tr>
                <th style="text-align:left;padding:10px;border-bottom:1px solid ${border};color:${mutedColor};font-weight:600">Product</th>
                <th style="text-align:center;padding:10px;border-bottom:1px solid ${border};color:${mutedColor};font-weight:600">Qty</th>
                <th style="text-align:right;padding:10px;border-bottom:1px solid ${border};color:${mutedColor};font-weight:600">Price</th>
                <th style="text-align:right;padding:10px;border-bottom:1px solid ${border};color:${mutedColor};font-weight:600">Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <div style="margin-top:16px">
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="padding:6px 0;color:${mutedColor}">Subtotal</td>
                <td style="padding:6px 0;color:${mutedColor};text-align:right">${currency(order.subtotal)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:${mutedColor}">Tax</td>
                <td style="padding:6px 0;color:${mutedColor};text-align:right">${currency(order.tax)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-top:1px solid ${border};margin-top:6px;font-weight:800">Total</td>
                <td style="padding:8px 0;border-top:1px solid ${border};margin-top:6px;font-weight:800;text-align:right">${currency(order.total)}</td>
              </tr>
            </table>
          </div>

          <a href="${orderLink}"
             style="display:inline-block;background:${brandColor};color:#111;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
            View order
          </a>
        </div>
        <div style="color:#9ca3af;font-size:12px;margin-top:16px">If you have questions, reply to this email.</div>
      </div>
    `;

    await this.plunk.emails.send({
      to: order.email,
      from: process.env.MAIL_FROM || 'no-reply@theglamstore.ng',
      subject: subjectMap[status],
      body: html,
    });
  }

  async sendOrderConfirmationEmail(order: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    state: string;
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: string;
    transferProofUrl?: string;
    items: Array<{
      productId: string;
      name?: string;
      price?: number;
      quantity?: number;
      selectedSize?: string;
      selectedColor?: string;
      image?: string;
    }>;
  }): Promise<void> {
    const brandColor = '#e3b094';
    const textColor = '#111827';
    const mutedColor = '#6b7280';
    const border = '#e5e7eb';
    const currency = (n: number) =>
      `₦${Number(n || 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
    const paymentMethodDisplay = (order.paymentMethod || '').replace('_', ' ');
    const orderLink = `${process.env.WEB_APP_ORIGIN || ''}/orders/${order._id}`;

    const itemsRows = order.items
      .map((it) => {
        const lineTotal = (it.price || 0) * (it.quantity || 0);
        const imageCell = it.image
          ? `<td style="vertical-align:top;padding-right:10px">
               <img src="${it.image}" width="48" height="48" alt="${
                 it.name ?? 'Product'
               }" style="border-radius:8px;border:1px solid ${border};object-fit:cover;display:block" />
             </td>`
          : '';
        return `
          <tr>
            <td style="padding:10px;border-bottom:1px solid ${border}">
              <table role="presentation" style="border-collapse:collapse"><tr>
                ${imageCell}
                <td style="vertical-align:top">
                  <div style="font-weight:600">${it.name ?? 'Item'}</div>
                  <div style="color:${mutedColor};font-size:12px">Size: ${
                    it.selectedSize || '—'
                  } · Color: ${it.selectedColor || '—'}</div>
                  <div style="color:${mutedColor};font-size:12px">ID: ${
                    it.productId
                  }</div>
                </td>
              </tr></table>
            </td>
            <td style="padding:10px;border-bottom:1px solid ${border};text-align:center">${
              it.quantity ?? 0
            }</td>
            <td style="padding:10px;border-bottom:1px solid ${border};text-align:right">${currency(
              it.price || 0,
            )}</td>
            <td style="padding:10px;border-bottom:1px solid ${border};text-align:right;font-weight:600">${currency(
              lineTotal,
            )}</td>
          </tr>`;
      })
      .join('');

    const html = `
      <div style="font-family:Inter,system-ui,sans-serif;background:#fff;color:${textColor};padding:24px">
        <div style="font-weight:800;font-size:18px;margin-bottom:8px">TheGlamStore</div>
        <div style="border:1px solid ${border};border-radius:12px;padding:20px">
          <div style="font-weight:700;margin-bottom:6px">Thanks for your order, ${
            order.firstName
          }!</div>
          <div style="color:${mutedColor};margin-bottom:16px">Order ID: <span style="font-family:ui-monospace,Menlo,monospace">${
            order._id
          }</span></div>

          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:4px">
            <thead>
              <tr>
                <th style="text-align:left;padding:10px;border-bottom:1px solid ${border};color:${mutedColor};font-weight:600">Product</th>
                <th style="text-align:center;padding:10px;border-bottom:1px solid ${border};color:${mutedColor};font-weight:600">Qty</th>
                <th style="text-align:right;padding:10px;border-bottom:1px solid ${border};color:${mutedColor};font-weight:600">Price</th>
                <th style="text-align:right;padding:10px;border-bottom:1px solid ${border};color:${mutedColor};font-weight:600">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div style="margin-top:16px">
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="padding:6px 0;color:${mutedColor}">Subtotal</td>
                <td style="padding:6px 0;color:${mutedColor};text-align:right">${currency(order.subtotal)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:${mutedColor}">Tax</td>
                <td style="padding:6px 0;color:${mutedColor};text-align:right">${currency(order.tax)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-top:1px solid ${border};margin-top:6px;font-weight:800">Total</td>
                <td style="padding:8px 0;border-top:1px solid ${border};margin-top:6px;font-weight:800;text-align:right">${currency(order.total)}</td>
              </tr>
            </table>
          </div>

          <div style="margin-top:16px;color:${mutedColor}">
            <div><span style="font-weight:600;color:${textColor}">Payment:</span> ${paymentMethodDisplay}</div>
            <div><span style="font-weight:600;color:${textColor}">Ship to:</span> ${order.address1}, ${order.city}, ${order.state}</div>
          </div>

          <a href="${orderLink}"
             style="display:inline-block;background:${brandColor};color:#111;padding:10px 14px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
            View order
          </a>
        </div>
        <div style="color:#9ca3af;font-size:12px;margin-top:16px">If you have questions, reply to this email.</div>
      </div>
    `;

    await this.plunk.emails.send({
      to: order.email,
      from: process.env.MAIL_FROM || 'no-reply@theglamstore.ng',
      subject: `We received your order ${order._id}`,
      body: html,
    });
  }
}
