import nodemailer from "nodemailer";

// ---------------------------------------------------------------------------
// Transporter (singleton)
// ---------------------------------------------------------------------------

let _transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn(
      "[email] SMTP credentials missing — set SMTP_HOST, SMTP_USER, SMTP_PASS in .env"
    );
    return null;
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  return _transporter;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FROM = process.env.SMTP_FROM ?? "Oil Painting AI Studio <noreply@oilpaintingstudio.com>";
const ADMIN = process.env.ADMIN_EMAIL ?? "admin@oilpainting.com";
const BRAND = "#1a1614";
const GOLD  = "#d4a574";
const BG    = "#f8f1e6";

function labelMap(key: string, value: string): string {
  const TYPES: Record<string, string> = {
    portrait: "Portrait Commission", landscape: "Landscape Painting",
    interior: "Interior / Wall Art", event: "Event Live Painting",
    pet: "Pet Portrait", custom: "Custom Concept",
  };
  const SIZES: Record<string, string> = {
    small: "Small (up to 12×16 in)", medium: "Medium (up to 18×24 in)",
    large: "Large (up to 24×36 in)", mural: "Mural / Oversized",
  };
  const SURFACES: Record<string, string> = {
    canvas: "Stretched canvas", paper: "Fine art paper",
    board: "Wood / panel board", digital: "Digital file only",
  };
  const STYLES: Record<string, string> = {
    modern: "Contemporary / Modern", realist: "Photorealist",
    abstract: "Abstract", impressionist: "Impressionist", minimal: "Minimalist",
  };
  if (key === "paintingType") return TYPES[value] ?? value;
  if (key === "size")         return SIZES[value]  ?? value;
  if (key === "surface")      return SURFACES[value] ?? value;
  if (key === "style")        return STYLES[value] ?? value;
  return value;
}

function row(label: string, value: string) {
  if (!value || value === "undefined") return "";
  return `
    <tr>
      <td style="padding:10px 16px;background:#fdf8f1;border-bottom:1px solid #eadfcb;
                 width:38%;font-size:13px;color:#6b5d54;font-weight:600;vertical-align:top;">
        ${label}
      </td>
      <td style="padding:10px 16px;background:#ffffff;border-bottom:1px solid #eadfcb;
                 font-size:13px;color:#1a1614;vertical-align:top;">
        ${value}
      </td>
    </tr>`;
}

function imageGrid(urls: string[]): string {
  if (!urls.length) return "";
  const thumbs = urls
    .map(
      (url) =>
        `<td style="padding:4px;">
           <a href="${url}" target="_blank">
             <img src="${url}" width="120" height="120"
                  style="width:120px;height:120px;object-fit:cover;
                         border-radius:12px;border:2px solid #eadfcb;display:block;" />
           </a>
         </td>`
    )
    .join("");
  return `
    <tr>
      <td colspan="2" style="padding:16px;">
        <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#6b5d54;">
          Reference photos (${urls.length})
        </p>
        <table cellpadding="0" cellspacing="0" border="0"><tr>${thumbs}</tr></table>
        <p style="margin:8px 0 0;font-size:11px;color:#8c7764;">
          Click any photo to open full size.
        </p>
      </td>
    </tr>`;
}

function baseHtml(title: string, preheader: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:Georgia,'Times New Roman',serif;">
  <!-- preheader -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#fdf6ec;">
    ${preheader}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;
                      border:2px solid #eadfcb;background:#ffffff;
                      box-shadow:0 8px 32px rgba(26,22,20,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:${BRAND};padding:28px 32px;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;background:${GOLD};
                                border-radius:12px;padding:8px 12px;margin-bottom:12px;">
                      <span style="color:white;font-size:18px;">🎨</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;
                               letter-spacing:0.05em;">
                      Oil Painting AI Studio
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          ${bodyContent}

          <!-- Footer -->
          <tr>
            <td style="background:#fdf8f1;padding:24px 32px;text-align:center;
                       border-top:1px solid #eadfcb;">
              <p style="margin:0;font-size:12px;color:#8c7764;line-height:1.6;">
                © ${new Date().getFullYear()} Oil Painting AI Studio · All rights reserved
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Admin notification email
// ---------------------------------------------------------------------------

export interface CommissionPayload {
  customerName:       string;
  email:              string;
  phone?:             string;
  paintingType:       string;
  size:               string;
  surface:            string;
  style:              string;
  quantity:           string;
  deadline?:          string;
  budget?:            string;
  deliveryCity?:      string;
  notes?:             string;
  referenceImageUrls?: string[];
  estimatedRange:     string;
  timeline:           string;
  reference:          string;
}

export async function sendCommissionAdminEmail(p: CommissionPayload) {
  const transporter = getTransporter();
  if (!transporter) return;

  const imageUrls = p.referenceImageUrls ?? [];

  const body = `
    <!-- Title row -->
    <tr>
      <td colspan="2" style="padding:28px 32px 12px;background:#fff;">
        <span style="display:inline-block;background:#fdf3e7;color:${GOLD};
                     font-size:11px;font-weight:700;letter-spacing:0.18em;
                     text-transform:uppercase;border-radius:99px;padding:4px 12px;
                     border:1px solid #f0d8b0;margin-bottom:12px;">
          New Commission Request
        </span>
        <h1 style="margin:0;font-size:24px;color:${BRAND};font-family:Georgia,serif;">
          ${p.customerName} would like a painting
        </h1>
        <p style="margin:6px 0 0;font-size:14px;color:#6b5d54;">
          Reference: <strong>${p.reference}</strong> ·
          Received: ${new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}
        </p>
      </td>
    </tr>

    <!-- Details table -->
    <tr>
      <td colspan="2" style="padding:0 32px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="border-radius:14px;overflow:hidden;border:1px solid #eadfcb;">
          ${row("Customer name",     p.customerName)}
          ${row("Email",             `<a href="mailto:${p.email}" style="color:${GOLD};">${p.email}</a>`)}
          ${row("Phone",             p.phone || "—")}
          ${row("Commission type",   labelMap("paintingType", p.paintingType))}
          ${row("Canvas size",       labelMap("size",         p.size))}
          ${row("Surface & medium",  labelMap("surface",      p.surface))}
          ${row("Painting style",    labelMap("style",        p.style))}
          ${row("Quantity",          p.quantity)}
          ${row("Deadline",          p.deadline || "Flexible")}
          ${row("Budget",            p.budget || "Not specified")}
          ${row("Delivery city",     p.deliveryCity || "Not specified")}
          ${p.notes ? row("Project description", p.notes.replace(/\n/g, "<br>")) : ""}
          ${imageUrls.length ? imageGrid(imageUrls) : ""}
        </table>
      </td>
    </tr>

    <!-- Estimate summary -->
    <tr>
      <td colspan="2" style="padding:0 32px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#fdf8f1;border-radius:14px;border:1px solid #eadfcb;overflow:hidden;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;
                         letter-spacing:0.18em;text-transform:uppercase;color:#8c7764;">
                Estimated price range
              </p>
              <p style="margin:0;font-size:28px;font-weight:700;color:${BRAND};
                         font-family:Georgia,serif;">
                ${p.estimatedRange}
              </p>
            </td>
            <td style="padding:20px 24px;border-left:1px solid #eadfcb;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;
                         letter-spacing:0.18em;text-transform:uppercase;color:#8c7764;">
                Production timeline
              </p>
              <p style="margin:0;font-size:16px;font-weight:600;color:${BRAND};">
                ${p.timeline}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td colspan="2" style="padding:0 32px 32px;text-align:center;">
        <a href="mailto:${p.email}?subject=Re: Commission Request ${p.reference}"
           style="display:inline-block;background:${BRAND};color:#ffffff;
                  font-size:14px;font-weight:700;padding:14px 28px;border-radius:14px;
                  text-decoration:none;letter-spacing:0.02em;">
          Reply to ${p.customerName}
        </a>
      </td>
    </tr>`;

  const html = baseHtml(
    `New Commission: ${p.reference}`,
    `${p.customerName} has submitted a new painting commission — ${labelMap("paintingType", p.paintingType)}, ${labelMap("size", p.size)}.`,
    body
  );

  await transporter.sendMail({
    from:    FROM,
    to:      ADMIN,
    replyTo: p.email,
    subject: `🎨 New Commission Request — ${p.reference} (${labelMap("paintingType", p.paintingType)})`,
    html,
    text: [
      `NEW COMMISSION REQUEST — ${p.reference}`,
      ``,
      `Customer:     ${p.customerName}`,
      `Email:        ${p.email}`,
      `Phone:        ${p.phone || "—"}`,
      `Type:         ${labelMap("paintingType", p.paintingType)}`,
      `Size:         ${labelMap("size", p.size)}`,
      `Surface:      ${labelMap("surface", p.surface)}`,
      `Style:        ${labelMap("style", p.style)}`,
      `Quantity:     ${p.quantity}`,
      `Deadline:     ${p.deadline || "Flexible"}`,
      `Budget:       ${p.budget || "Not specified"}`,
      `City:         ${p.deliveryCity || "Not specified"}`,
      ``,
      `Description:`,
      p.notes || "(none)",
      ``,
      `Reference images: ${imageUrls.length ? imageUrls.join(", ") : "none"}`,
      ``,
      `Estimated range:  ${p.estimatedRange}`,
      `Timeline:         ${p.timeline}`,
    ].join("\n"),
  });
}

// ---------------------------------------------------------------------------
// Customer confirmation email
// ---------------------------------------------------------------------------

export async function sendCommissionConfirmationEmail(p: CommissionPayload) {
  const transporter = getTransporter();
  if (!transporter) return;

  const body = `
    <!-- Greeting -->
    <tr>
      <td style="padding:32px 32px 8px;text-align:center;">
        <div style="font-size:40px;margin-bottom:16px;">🎨</div>
        <h1 style="margin:0;font-size:26px;color:${BRAND};font-family:Georgia,serif;">
          We received your commission request!
        </h1>
        <p style="margin:12px 0 0;font-size:15px;color:#6b5d54;line-height:1.7;">
          Hi <strong>${p.customerName}</strong>, thank you for choosing Oil Painting AI Studio.<br/>
          We&rsquo;ll review your brief and reply with a confirmed quote within <strong>24 hours</strong>.
        </p>
      </td>
    </tr>

    <!-- Reference card -->
    <tr>
      <td style="padding:24px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#fdf8f1;border-radius:14px;border:2px solid #eadfcb;
                      overflow:hidden;">
          <tr>
            <td align="center" style="padding:24px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;
                         letter-spacing:0.18em;text-transform:uppercase;color:#8c7764;">
                Your reference number
              </p>
              <p style="margin:0;font-size:32px;font-weight:700;color:${BRAND};
                         letter-spacing:0.1em;font-family:Georgia,serif;">
                ${p.reference}
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#8c7764;">
                Keep this for your records. Quote your reference number in any correspondence.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Summary -->
    <tr>
      <td style="padding:0 32px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="border-radius:14px;overflow:hidden;border:1px solid #eadfcb;">
          ${row("Commission type",  labelMap("paintingType", p.paintingType))}
          ${row("Canvas size",      labelMap("size",         p.size))}
          ${row("Painting style",   labelMap("style",        p.style))}
          ${p.deadline ? row("Your deadline", p.deadline) : ""}
          ${row("Estimated range",  p.estimatedRange)}
          ${row("Typical timeline", p.timeline)}
        </table>
      </td>
    </tr>

    <!-- What happens next -->
    <tr>
      <td style="padding:0 32px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="background:#fdf8f1;border-radius:14px;border:1px solid #eadfcb;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 14px;font-size:13px;font-weight:700;
                         text-transform:uppercase;letter-spacing:0.16em;color:#8c7764;">
                What happens next
              </p>
              ${[
                ["🎨", "Quote confirmation", "We'll review your brief and send a detailed, no-obligation quote within 24 hours."],
                ["✅", "Approval",            "Once you approve, we'll align on colour references and start production."],
                ["📦", "Delivery",            "Your painting ships professionally packaged and fully insured."],
              ].map(([icon, title, desc]) => `
                <table cellpadding="0" cellspacing="0" border="0"
                       style="margin-bottom:12px;width:100%;">
                  <tr>
                    <td style="width:36px;vertical-align:top;font-size:18px;">${icon}</td>
                    <td>
                      <p style="margin:0;font-size:13px;font-weight:700;color:${BRAND};">${title}</p>
                      <p style="margin:3px 0 0;font-size:13px;color:#6b5d54;">${desc}</p>
                    </td>
                  </tr>
                </table>`).join("")}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Questions CTA -->
    <tr>
      <td style="padding:0 32px 32px;text-align:center;">
        <p style="margin:0 0 16px;font-size:14px;color:#6b5d54;">
          Have questions? Simply reply to this email or contact us at
          <a href="mailto:${ADMIN}" style="color:${GOLD};">${ADMIN}</a>
        </p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://oilpaintingstudio.com"}/painting-order/gallery"
           style="display:inline-block;background:${BRAND};color:#ffffff;
                  font-size:14px;font-weight:700;padding:14px 28px;border-radius:14px;
                  text-decoration:none;letter-spacing:0.02em;">
          View Our Customer Gallery
        </a>
      </td>
    </tr>`;

  const html = baseHtml(
    `Commission Request Confirmed — ${p.reference}`,
    `We received your commission request (${p.reference}). We'll reply with a confirmed quote within 24 hours.`,
    body
  );

  await transporter.sendMail({
    from:    FROM,
    to:      p.email,
    subject: `Your Commission Request — Reference ${p.reference}`,
    html,
    text: [
      `Hi ${p.customerName},`,
      ``,
      `We've received your commission request and will reply with a confirmed quote within 24 hours.`,
      ``,
      `Reference number: ${p.reference}`,
      `Commission type:  ${labelMap("paintingType", p.paintingType)}`,
      `Canvas size:      ${labelMap("size", p.size)}`,
      `Painting style:   ${labelMap("style", p.style)}`,
      `Estimated range:  ${p.estimatedRange}`,
      `Typical timeline: ${p.timeline}`,
      ``,
      `Questions? Email us at ${ADMIN}`,
      ``,
      `— The Oil Painting AI Studio team`,
    ].join("\n"),
  });
}
