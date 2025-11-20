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
    const recipients = [
      process.env.ADMIN_EMAIL_1,
      process.env.ADMIN_EMAIL_2,
    ].filter((value): value is string => Boolean(value && value.trim().length));

    if (recipients.length === 0) {
      return;
    }
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
      to: recipients,
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

  async sendPendingReviewNotification(params: {
    productName: string;
    productId: string;
    rating: number;
    message: string;
    customerName: string;
    orderNumber?: string;
  }): Promise<void> {
    const recipients = [
      process.env.ADMIN_EMAIL_1,
      process.env.ADMIN_EMAIL_2,
      process.env.ADMIN_EMAIL_3,
    ].filter((value): value is string => Boolean(value && value.trim().length));

    if (recipients.length === 0) {
      return;
    }

    const brandColor = '#e3b094';
    const mutedColor = '#6b7280';
    const border = '#e5e7eb';
    const rating = Math.min(5, Math.max(1, Math.round(params.rating || 0)));
    const stars = Array.from({ length: 5 })
      .map((_, idx) => (idx < rating ? '★' : '☆'))
      .join(' ');

    const orderRef =
      params.orderNumber && params.orderNumber.trim().length > 0
        ? params.orderNumber.trim()
        : '—';

    const html = `
      <div style="font-family:Inter,system-ui,sans-serif;background:#fff;color:#111;padding:24px">
        <div style="font-weight:800;font-size:18px;margin-bottom:8px;">New Product Review Pending</div>
        <div style="border:1px solid ${border};border-radius:12px;padding:20px">
          <div style="font-weight:700;margin-bottom:4px">${params.productName}</div>
          <div style="color:${mutedColor};font-size:13px;margin-bottom:12px">Order Reference: <span style="font-family:ui-monospace,Menlo,monospace">${orderRef}</span></div>

          <div style="margin-bottom:12px">
            <div style="font-size:24px;color:${brandColor};letter-spacing:4px">${stars}</div>
            <div style="color:${mutedColor};font-size:12px">Submitted by ${params.customerName}</div>
          </div>

          <div style="padding:16px;border-radius:10px;background:#f9fafb;border:1px solid ${border};white-space:pre-wrap">${params.message}</div>

          <a href="${process.env.ADMIN_APP_ORIGIN || 'https://admin.theglamstore.ng'}/admin/reviews/pending"
             style="display:inline-block;margin-top:16px;background:${brandColor};color:#111;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">
            Moderate reviews
          </a>
        </div>
        <div style="color:${mutedColor};font-size:12px;margin-top:16px">Product ID: ${params.productId}</div>
      </div>
    `;

    await this.plunk.emails.send({
      to: recipients,
      from: process.env.MAIL_FROM || 'no-reply@theglamstore.ng',
      subject: `Review pending approval: ${params.productName}`,
      body: html,
    });
  }

  async sendOrderNotificationToAdmins(order: {
    _id: string;
    orderNumber?: string | null;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    address1: string;
    city: string;
    state: string;
    subtotal: number;
    total: number;
    deliveryFee?: number | null;
    couponCode?: string | null;
    paymentMethod: string;
    transferProofUrl?: string | null;
    items: Array<{
      productId: string;
      name?: string | null;
      price?: number | null;
      quantity?: number | null;
      selectedSize?: string | null;
      selectedColor?: string | null;
    }>;
    notes?: string | null;
  }): Promise<void> {
    const recipients = [
      process.env.ADMIN_EMAIL_1,
      process.env.ADMIN_EMAIL_2,
      process.env.ADMIN_EMAIL_3,
    ].filter((value): value is string => Boolean(value && value.trim().length));

    if (recipients.length === 0) {
      return;
    }

    const orderNumberDisplay = order.orderNumber || order._id;
    const paymentMethodDisplay =
      order.paymentMethod?.replace(/_/g, ' ') || 'bank transfer';
    const brandColor = '#111827';
    const accentColor = '#fbbf24';
    const borderColor = '#e5e7eb';
    const mutedColor = '#6b7280';

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const notesMarkup =
      order.notes && order.notes.trim().length > 0
        ? `<div style="margin-top:24px;">
             <div style="font-weight:600;margin-bottom:6px;">Additional notes</div>
             <div style="white-space:pre-wrap;border:1px solid ${borderColor};border-radius:10px;padding:12px;color:${mutedColor};background:#f9fafb;">
               ${escapeHtml(order.notes.trim())}
             </div>
           </div>`
        : '';

    const itemsMarkup =
      (order.items || [])
        .map((item) => {
          const qty = item.quantity ?? 0;
          const price = item.price ?? 0;
          const lineTotal = price * qty;
          const formatPrice = new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 2,
          });
          return `
            <tr>
              <td style="padding:8px 12px;border-bottom:1px solid ${borderColor}">
                <div style="font-weight:600;">${item.name || 'Untitled product'}</div>
                <div style="color:${mutedColor};font-size:12px;">ID: ${item.productId}</div>
                ${
                  item.selectedSize || item.selectedColor
                    ? `<div style="color:${mutedColor};font-size:12px;margin-top:4px;">
                        ${item.selectedSize ? `<span>Size: ${item.selectedSize}</span>` : ''}
                        ${
                          item.selectedColor
                            ? `<span style="margin-left:8px;">Color: ${item.selectedColor}</span>`
                            : ''
                        }
                      </div>`
                    : ''
                }
              </td>
              <td style="padding:8px 12px;border-bottom:1px solid ${borderColor};text-align:center;">${qty}</td>
              <td style="padding:8px 12px;border-bottom:1px solid ${borderColor};text-align:right;">${formatPrice.format(
                price,
              )}</td>
              <td style="padding:8px 12px;border-bottom:1px solid ${borderColor};text-align:right;font-weight:600;">${formatPrice.format(
                lineTotal,
              )}</td>
            </tr>
          `;
        })
        .join('') ||
      `
        <tr>
          <td colspan="4" style="padding:12px;text-align:center;color:${mutedColor};border-bottom:1px solid ${borderColor};">
            No items were attached to this order.
          </td>
        </tr>
      `;

    const formatPrice = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    });

    const html = `
      <div style="font-family:Inter,system-ui,sans-serif;background:#fff;color:#111;padding:24px;">
        <div style="font-size:18px;font-weight:800;margin-bottom:16px;">
          New order placed #${orderNumberDisplay}
        </div>
        <div style="margin-bottom:20px;color:${mutedColor};font-size:14px;">
          Placed by <strong>${order.firstName} ${order.lastName}</strong> (${order.email}) ${
            order.phone ? `• ${order.phone}` : ''
          }
        </div>
        <div style="border:1px solid ${borderColor};border-radius:12px;overflow:hidden;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:${accentColor};color:#111;">
                <th style="padding:10px 12px;text-align:left;">Item</th>
                <th style="padding:10px 12px;text-align:center;width:80px;">Qty</th>
                <th style="padding:10px 12px;text-align:right;width:120px;">Price</th>
                <th style="padding:10px 12px;text-align:right;width:140px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsMarkup}
            </tbody>
          </table>
        </div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;">
          <div style="flex:1;min-width:220px;">
            <div style="font-weight:600;margin-bottom:6px;">Delivery Details</div>
            <div style="color:${mutedColor};font-size:13px;">
              ${order.address1}, ${order.city}, ${order.state}
            </div>
          </div>
          <div style="flex:1;min-width:220px;">
            <div style="font-weight:600;margin-bottom:6px;">Payment</div>
            <div style="color:${mutedColor};font-size:13px;">
              ${paymentMethodDisplay}
              ${
                order.transferProofUrl
                  ? `<div style="margin-top:4px;"><a href="${order.transferProofUrl}" style="color:${brandColor};">View transfer proof</a></div>`
                  : ''
              }
            </div>
          </div>
        </div>
        <div style="margin-top:24px;border-top:1px solid ${borderColor};padding-top:16px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:6px 0;color:${mutedColor};">Subtotal</td>
              <td style="padding:6px 0;color:${mutedColor};text-align:right;">${formatPrice.format(order.subtotal)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:${mutedColor};">Delivery</td>
              <td style="padding:6px 0;color:${mutedColor};text-align:right;">${formatPrice.format(order.deliveryFee ?? 0)}</td>
            </tr>
            ${
              order.couponCode
                ? `<tr>
                    <td style="padding:6px 0;color:${mutedColor};">Coupon (${order.couponCode})</td>
                    <td style="padding:6px 0;color:${mutedColor};text-align:right;">-</td>
                  </tr>`
                : ''
            }
            <tr>
              <td style="padding:10px 0;border-top:1px solid ${borderColor};font-weight:800;">Total</td>
              <td style="padding:10px 0;border-top:1px solid ${borderColor};font-weight:800;text-align:right;">${formatPrice.format(order.total)}</td>
            </tr>
          </table>
        </div>
        ${notesMarkup}
        <div style="margin-top:24px;">
          <a href="${process.env.ADMIN_APP_ORIGIN || 'https://admin.theglamstore.ng'}/admin/orders?id=${
            order._id
          }"
             style="display:inline-block;background:${brandColor};color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600;">
            View order in admin
          </a>
        </div>
      </div>
    `;

    await this.plunk.emails.send({
      to: recipients,
      from: process.env.MAIL_FROM || 'no-reply@theglamstore.ng',
      subject: `New order #${orderNumberDisplay} received`,
      body: html,
    });
  }
}
