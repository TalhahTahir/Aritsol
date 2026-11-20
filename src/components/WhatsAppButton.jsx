import { FaWhatsapp } from 'react-icons/fa6';
import { site, whatsappHref } from '../config/site';
import s from './WhatsAppButton.module.css';

// Floating "chat on WhatsApp" button, bottom right on every page.
// Opens a WhatsApp chat with ARTISOL (app on phones, WhatsApp Web on desktop) with a short greeting filled in.
export default function WhatsAppButton() {
  const href = whatsappHref();
  if (!href) return null;
  return (
    <a
      className={s.button}
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`Chat with ${site.name} on WhatsApp`}
      data-fluid-off
    >
      <span className={s.icon} aria-hidden="true">
        <FaWhatsapp />
      </span>
      <span className={s.label} aria-hidden="true">
        Chat with us
      </span>
    </a>
  );
}
