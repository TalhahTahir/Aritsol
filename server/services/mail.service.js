import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transport = null;
let builtFor = '';

/** SMTP connection (Gmail by default), or null when the SMTP_* settings are not filled in. */
function getTransport() {
  const cfg = env.mail;
  if (!cfg) return null;
  const key = `${cfg.host}:${cfg.port}:${cfg.user}`;
  if (!transport || builtFor !== key) {
    transport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465, // 465 = TLS from the start, 587 = upgrades with STARTTLS
      auth: { user: cfg.user, pass: cfg.pass },
    });
    builtFor = key;
  }
  return transport;
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const oneLine = (s) => String(s ?? '').replace(/[\r\n]+/g, ' ').trim(); // no line breaks in email headers

/** Email the team about a new enquiry. Reply-To is the visitor, so "Reply" answers them directly. */
export async function sendEnquiryEmail(msg) {
  const t = getTransport();
  if (!t) return false;
  const cfg = env.mail;
  const rows = [
    ['Name', msg.name],
    ['Email', msg.email],
    ['Company', msg.company || '-'],
    ['Interest', msg.interest || '-'],
  ];
  await t.sendMail({
    from: `"ARTISOL website" <${cfg.from}>`,
    to: cfg.to,
    replyTo: `"${oneLine(msg.name).replace(/"/g, '')}" <${msg.email}>`,
    subject: oneLine(`New enquiry${msg.interest ? `: ${msg.interest}` : ''} from ${msg.name}`).slice(0, 180),
    text: `${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${msg.message}\n`,
    html: `
      <div style="font-family:Arial,sans-serif;font-size:15px;color:#08090b;line-height:1.5">
        <h2 style="margin:0 0 12px">New enquiry from the website</h2>
        <table style="border-collapse:collapse;margin-bottom:16px">
          ${rows.map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#666">${k}</td><td style="padding:4px 0"><strong>${esc(v)}</strong></td></tr>`).join('')}
        </table>
        <div style="white-space:pre-wrap;padding:14px 16px;background:#f5f3ef;border-left:4px solid #ffc900">${esc(msg.message)}</div>
        <p style="color:#666;font-size:13px">Press Reply to answer ${esc(msg.name)} directly.</p>
      </div>`,
  });
  return true;
}

/** Optional "we got your message" email to the visitor (CONTACT_AUTOREPLY=true). */
export async function sendAutoReply(msg) {
  const t = getTransport();
  const cfg = env.mail;
  if (!t || !cfg.autoReply) return false;
  const first = oneLine(msg.name).split(' ')[0];
  await t.sendMail({
    from: `"ARTISOL" <${cfg.from}>`,
    to: msg.email,
    replyTo: cfg.to,
    subject: 'We received your message, ARTISOL',
    text: `Hi ${first},\n\nThanks for getting in touch with ARTISOL. We have your message and will reply within one business day.\n\nYour message:\n${msg.message}\n\nARTISOL`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#08090b;line-height:1.6">
      <p>Hi ${esc(first)},</p>
      <p>Thanks for getting in touch with ARTISOL. We have your message and will reply within one business day.</p>
      <p style="color:#666;margin-bottom:4px">Your message:</p>
      <div style="white-space:pre-wrap;padding:12px 14px;background:#f5f3ef;border-left:4px solid #ffc900">${esc(msg.message)}</div>
      <p>ARTISOL</p></div>`,
  });
  return true;
}
