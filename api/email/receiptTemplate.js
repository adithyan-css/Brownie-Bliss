/**
 * HTML receipt email for Brownie Bliss orders.
 * @param {object} order - Order document (plain object)
 */
function buildReceiptHtml(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const created = order.confirmed_at || order.created_at || new Date();
  const dateStr = new Date(created).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemRows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #f0e6dc;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;color:#3d2b1f;">
          ${escapeHtml(i.emoji || '🍫')} ${escapeHtml(i.name)}
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #f0e6dc;text-align:center;font-size:14px;color:#5c4a3a;">${i.qty}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #f0e6dc;text-align:right;font-size:14px;color:#5c4a3a;">₹${formatInr(i.price)}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #f0e6dc;text-align:right;font-size:14px;font-weight:600;color:#3d2b1f;">₹${formatInr(i.price * i.qty)}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt — ${escapeHtml(order.order_id)}</title>
</head>
<body style="margin:0;padding:0;background:#faf6f1;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf6f1;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 24px rgba(61,43,31,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#3d2b1f 0%,#5c4033 100%);padding:28px 32px;text-align:center;">
              <div style="font-size:28px;line-height:1;">🍫</div>
              <h1 style="margin:8px 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:#faf6f1;letter-spacing:0.5px;">Brownie Bliss</h1>
              <p style="margin:0;font-size:12px;color:#d4b896;letter-spacing:2px;text-transform:uppercase;">Payment Receipt</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 8px;font-size:15px;color:#3d2b1f;">Hi <strong>${escapeHtml(order.customer_name)}</strong>,</p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#5c4a3a;">
                Thank you for your order! Your payment has been confirmed. Here is your receipt.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf6f1;border-radius:6px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size:11px;color:#8b7355;text-transform:uppercase;letter-spacing:1px;padding-bottom:4px;">Order ID</td>
                        <td style="font-size:11px;color:#8b7355;text-transform:uppercase;letter-spacing:1px;padding-bottom:4px;text-align:right;">Date</td>
                      </tr>
                      <tr>
                        <td style="font-size:15px;font-weight:700;color:#3d2b1f;">${escapeHtml(order.order_id)}</td>
                        <td style="font-size:14px;color:#5c4a3a;text-align:right;">${escapeHtml(dateStr)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:8px;">
                <thead>
                  <tr style="background:#f5ebe3;">
                    <th style="padding:10px 8px;text-align:left;font-size:11px;color:#8b7355;text-transform:uppercase;letter-spacing:1px;">Item</th>
                    <th style="padding:10px 8px;text-align:center;font-size:11px;color:#8b7355;text-transform:uppercase;letter-spacing:1px;">Qty</th>
                    <th style="padding:10px 8px;text-align:right;font-size:11px;color:#8b7355;text-transform:uppercase;letter-spacing:1px;">Price</th>
                    <th style="padding:10px 8px;text-align:right;font-size:11px;color:#8b7355;text-transform:uppercase;letter-spacing:1px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows || '<tr><td colspan="4" style="padding:16px;text-align:center;color:#888;">No items</td></tr>'}
                </tbody>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0 24px;">
                <tr>
                  <td style="padding:16px 0;border-top:2px solid #3d2b1f;text-align:right;">
                    <span style="font-size:13px;color:#5c4a3a;margin-right:12px;">Total paid</span>
                    <span style="font-size:22px;font-weight:700;color:#3d2b1f;font-family:Georgia,serif;">₹${formatInr(order.total)}</span>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf6f1;border-radius:6px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;font-size:13px;line-height:1.7;color:#5c4a3a;">
                    <strong style="color:#3d2b1f;display:block;margin-bottom:6px;">Delivery address</strong>
                    ${escapeHtml(order.address)}, ${escapeHtml(order.city)} — ${escapeHtml(order.pincode)}<br>
                    <strong style="color:#3d2b1f;">Phone:</strong> +91 ${escapeHtml(order.phone)}
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#8b7355;text-align:center;">
                Questions? Reply on WhatsApp or call us at <strong>+91 8072596340</strong><br>
                <span style="color:#c9a227;">gpriya26185@gmail.com</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f5ebe3;padding:16px 32px;text-align:center;font-size:11px;color:#8b7355;">
              © Brownie Bliss · Homemade treats · Krishnagiri
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildReceiptText(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const lines = items.map(
    (i) => `  ${i.emoji || '🍫'} ${i.name} × ${i.qty} = ₹${formatInr(i.price * i.qty)}`
  );
  return [
    'Brownie Bliss — Payment Receipt',
    `Order: ${order.order_id}`,
    `Customer: ${order.customer_name}`,
    `Phone: +91 ${order.phone}`,
    '',
    'Items:',
    ...lines,
    '',
    `Total: ₹${formatInr(order.total)}`,
    `Address: ${order.address}, ${order.city} - ${order.pincode}`,
    '',
    'Thank you for your order!',
  ].join('\n');
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatInr(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString('en-IN');
}

module.exports = { buildReceiptHtml, buildReceiptText };
