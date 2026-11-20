// ─────────────────────────────────────────────────────────────
// Global site settings. Change brand details and links here —
// every page reads from this file.
// Any link left as an empty string ('') is hidden automatically.
// ─────────────────────────────────────────────────────────────

export const site = {
  name: 'ARTISOL',
  legalName: 'ARTISOL',
  url: 'https://www.artisol.com', // TODO: your production domain
  tagline: 'Software studio for AI, web and enterprise systems',
  description:
    'ARTISOL designs and builds custom AI systems, full-stack web apps, SaaS platforms and enterprise Java backends for clients worldwide — and ships its own SaaS products.',

  contact: {
    email: 'infoataritsolutions@gmail.com',
    // Shown as written; the dial link is made from the digits.
    phones: ['+92 314-4429513', '+92 318-4780681'],
    address: 'Block B, Gulshan-e-Hali, Hali Road, Hyderabad, Sindh, Pakistan',
    hours: '', // optional, e.g. 'Mon to Fri, 10am to 7pm PKT' (shown under the phone numbers)
    // Booking link (Calendly, Cal.com, Google Calendar appointment page…)
    bookingUrl: '', // e.g. 'https://cal.com/artisol/intro'
    // International format, digits only, no "+" (used for wa.me links and the floating WhatsApp button)
    whatsapp: '923144429513',
    whatsappMessage: "Hi ARTISOL, I'd like to discuss a project.",
    responseTime: 'We reply to every project enquiry within one business day.',

    // Contact form delivery. With no endpoint, "Send message" opens the visitor's email app
    // with the message filled in. To receive messages directly in your inbox instead, create a free
    // form at formspree.io (or web3forms.com) and paste its endpoint here:
    formEndpoint: '/api/contact', // e.g. 'https://formspree.io/f/abcdwxyz' or 'https://api.web3forms.com/submit'
    formAccessKey: '', // Web3Forms only: your access key
  },

  // Social profiles. TODO: replace each placeholder with your page's address. Leave '' to hide an icon.
  social: {
    facebook: 'https://www.facebook.com/profile.php?id=61561059860908', // e.g. 'https://www.facebook.com/artisol'
    x: 'https://x.com/WeAreARITSOL', // Twitter / X, e.g. 'https://x.com/artisol'
    youtube: 'https://www.youtube.com/', // e.g. 'https://www.youtube.com/@artisol'
    instagram: 'https://www.instagram.com/at_aritsolutions/', // e.g. 'https://www.instagram.com/artisol'
    linkedin: 'https://www.linkedin.com/in/aritsol-offical-b69abb449/', // e.g. 'https://www.linkedin.com/company/artisol'
    github: '', // optional, e.g. 'https://github.com/artisol'
  },

  // Interactive effects. Set any to false to switch it off site-wide.
  fx: {
    preloader: true, // branded loading screen (once per browser session)
    cursorTrail: true, // particle trail + ring (mouse/trackpad only)
    sound: true, // shows the sound toggle (sound itself is off until a visitor turns it on)
    heroField: true, // interactive WebGL dot field behind the hero
    pageTransition: true, // ARTISOL brand transition between pages
    fluidBackground: true, // ferrofluid beads behind every page (after the hero on Home), with attract/repel magnet
    ferrofluid: true, // glossy black ferrofluid behind the founders (About page)
    liquidFooter: true, // midnight-and-gold liquid surface in the footer that the cursor stirs
    whatsappButton: true, // floating WhatsApp chat button (needs contact.whatsapp)
  },

  media: {
    // Optional scroll-scrubbed video on the About page (e.g. your 3D office tour).
    // Put the file in /public/media and set the path, e.g. '/media/office-tour.mp4'.
    // Leave '' to hide the section.
    officeTourVideo: '',
    officeTourPoster: '', // optional still image shown while the video loads
  },
};

// Helpers shared by the contact page, footer and WhatsApp button
export const telHref = (phone) => `tel:${phone.replace(/[^\d+]/g, '')}`;
export const whatsappHref = (text = site.contact.whatsappMessage) =>
  site.contact.whatsapp ? `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(text)}` : '';
export const mapHref = () => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.contact.address)}`;
