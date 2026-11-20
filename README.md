# ARTISOL website

Company website for ARTISOL: a **MERN** app. The front end is **React 18 + Vite** (JavaScript), a
single-page app with React Router, light and dark theme, plain CSS Modules. The back end is a small
**Express 5** API with **Mongoose** (MongoDB Atlas) and **Cloudinary** for images, used by the admin
controls to add and edit products, work, services and the workflow. Both deploy together on **Vercel**.

## Run it

Requires Node.js 18.18 or newer.

```bash
npm install             # run again after updating: the backend packages were added
npm run dev             # site on http://localhost:5173 + API on http://localhost:3001 (Ctrl+C stops both)
npm run dev:web         # the site only (built-in content, no admin)
npm run build           # production build in /dist
npm run admin:password  # create the admin password settings (see "Admin controls")
```

The `.env` file ships with placeholder values (`YOUR_…`). Until they are replaced the site runs as
before, using its built-in content; admin login and image uploads switch on as each service is set up.
`npm run dev` prints which parts are configured.

## Deploy

**Vercel** (recommended, runs the site and the API): import the repo, framework preset "Vite", and add
the environment variables listed under **Admin controls**. `api/index.js` becomes the API function and
`vercel.json` routes `/api/*` to it and everything else to the app, so deep links such as
`/services/enterprise-java` work on refresh.

**Netlify**: build command `npm run build`, publish directory `dist`. `public/_redirects` handles SPA
routing. Netlify does not run the Express API, so the site shows its built-in content and admin
controls are unavailable there.

After deploying, update the domain in `src/config/site.js`, `index.html` (Open Graph tags),
`public/robots.txt` and `public/sitemap.xml`.

## Where to edit things

| What | File |
| --- | --- |
| Brand name, email, phone numbers, address, WhatsApp, social links, contact-form delivery | `src/config/site.js` |
| Products, work, services and the workflow | **Admin controls** on the live site (see below) |
| Starting content for the above (copied into the database on first run, and used if the API is down) | `src/data/products.js`, `work.js`, `practices.js`, `studio.js` (`process`) |
| Engagement models, hero examples, FAQs | `src/data/studio.js` |
| Fields in the admin forms (labels, limits, which are required) | `shared/schema.js` |
| Colours, type scale, spacing, radius | `src/styles/global.css` (top of file) |
| Logo | `src/components/Logo.jsx` and `public/favicon.svg` |
| Team members | `src/pages/About.jsx` (`team` array) |

Any link left as `''` in the config is hidden automatically (a social icon, the booking link, the
WhatsApp button, office hours).

## Admin controls

The last item in the menu, **Admin controls**, opens a sign-in form. After signing in with the admin
email and password the page reloads in admin mode:

- **Admin bar** (bottom right): Add project, Add product, Add service, Workflow, Log out.
- **On every card and section**: Edit, move earlier/later, Delete (with a confirmation).
- **Add buttons** at the end of the Work grid, the products list and the services list.
- **Edit workflow** next to "How a project runs" (homepage and service pages).

The add/edit form has the name, deployed URL, image (upload a file or paste an `https://` link),
description and the other details of each type. Press **Enter** in any one-line field (or the button)
to save; a new item opens in its section straight away, using the same card or page template as the
rest. Uploaded images are resized in the browser, then stored on **Cloudinary**
(`artisol/work`, `artisol/products` folders) and served in the best format for each browser.

- **Products**: SaaS products ARTISOL owns. Shown on the homepage rail, the Products page, menu and footer.
- **Work**: projects built for clients. Shown on the homepage, the Work page, service pages and the 3D
  showcase (projects with an image).
- **Services**: name, short name, summary, “good fit when”, sub-services, tools and deliverables. Each
  has a page at `/services/<url id>`. A service that still has projects cannot be deleted until they move.
- **Workflow**: the “How a project runs” steps, edited as one list (add, remove, reorder, reword).

Visitors see changes within about 15 seconds (the API response is cached briefly at Vercel's edge).

### One-time setup

All settings live in `.env` (locally) and in Vercel's Environment Variables (online). The file
already lists every setting with a placeholder; replace each `YOUR_…` value.

| Setting | Where to get it |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas → create a free **M0** cluster → Database Access: add a user → Network Access: add `0.0.0.0/0` (Vercel has no fixed addresses) → Connect → Drivers → copy the string and put your user's password in it |
| `MONGODB_DB` | Database name, `artisol` is fine |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary (free plan) → Dashboard → API keys |
| `CLOUDINARY_FOLDER` | Folder for uploads, `artisol` is fine |
| `ADMIN_EMAIL` | Already set to infoataritsolutions@gmail.com |
| `ADMIN_PASSWORD_HASH`, `JWT_SECRET` | Run `npm run admin:password` and type your password (12+ characters). It writes both into `.env` and prints them for Vercel. The password itself is never stored, only a bcrypt hash |
| `CORS_ORIGINS` | Leave empty. Only needed if the website and API ever live on different domains |

Then:

1. `npm install` and `npm run dev`. The first request copies the content from `src/data/` into the
   database; from then on the database is the source of truth.
2. Open the site, Menu → **Admin controls**, sign in.
3. **Vercel**: Project → Settings → Environment Variables, add the same values (everything except
   `API_PORT`), then redeploy.

To change the password, run `npm run admin:password` again and update `ADMIN_PASSWORD_HASH` on
Vercel. Every existing admin session is signed out automatically.

### How it is protected

- **Password**: checked on the server against a bcrypt hash (cost 12) kept in environment variables;
  nothing secret is in the website code. Wrong emails take as long to reject as wrong passwords.
- **Session**: a signed JWT (HS256, 7 days, issuer and audience checked) in an `HttpOnly`,
  `SameSite=Strict`, `Secure` cookie that page scripts cannot read. Changing the password invalidates it.
- **Cross-site protection**: every change needs the `X-Artisol-Admin` header and must come from the
  site's own origin; CORS allows no other site unless listed in `CORS_ORIGINS`.
- **Brute force**: 8 failed sign-ins from one address, or 30 from anywhere, pause sign-in for 15
  minutes (stored in MongoDB, so it holds across serverless instances), plus request rate limits on
  sign-in, changes and reads (`express-rate-limit`).
- **Input**: request bodies are size-limited, MongoDB operators (`$…`) and dotted keys are stripped,
  everything is cleaned with `shared/schema.js` and validated again by the Mongoose models. Links must
  be `http(s)`, images `https` or uploaded.
- **Uploads**: checked by their actual bytes to be PNG, JPG, WebP, GIF or AVIF (max 4 MB), stored in a
  fixed Cloudinary folder; the server only ever deletes images inside that folder.
- **Headers**: `helmet` (strict Content-Security-Policy, no sniffing, no framing, HSTS); errors never
  reveal internal details.
- **Audit log**: every sign-in, failed sign-in and change is recorded in the `audit_log` collection
  (kept 180 days) with time, address and item. View it in Atlas → Browse Collections.

### Backend structure

```
api/index.js                  Vercel entry: runs server/app.js as one serverless function
server/
  app.js                      Express app: security headers, CORS, routes, errors
  dev.js                      local server on :3001 (reads .env)
  config/                     env.js (settings + placeholder detection), db.js (Mongoose), cloudinary.js
  models/                     Product, Work, Practice, ProcessStep, LoginAttempt, AuditLog, Meta
  routes/index.js             every /api route and which protections it uses
  controllers/                content, auth, upload (thin: read the request, call a service)
  services/                   content (CRUD, ordering, first-run copy), auth (bcrypt + JWT, lockouts),
                              image (Cloudinary upload/delete), audit
  middleware/                 security (helmet, CORS, origin check, sanitising, rate limits), auth, error
shared/schema.js              fields, labels and cleaning rules shared by the API and the admin forms
scripts/admin-password.js     creates the password hash and JWT secret
```

### API (for reference)

| Method | Path | |
| --- | --- | --- |
| GET | `/api/content` | All products, work, services and workflow (public) |
| GET | `/api/health` | Health check |
| POST | `/api/auth/login` · `/api/auth/logout` · GET `/api/auth/me` | Admin session |
| POST | `/api/:type` | Add (`products`, `work`, `practices`) |
| PUT / DELETE | `/api/:type/:id` | Edit / delete |
| POST | `/api/:type/reorder` | Save a new order `{ ids: [...] }` |
| PUT | `/api/process` | Replace the workflow `{ steps: [...] }` |
| POST | `/api/images?folder=work` | Upload an image to Cloudinary (body: the file) |

Front end: `src/content/` (content store and API client) and `src/components/admin/` (admin interface).

## Contact form

The Contact page has a form (name, email, company, interest, message) next to your phone numbers,
WhatsApp, email, office address with a directions link, and social icons. Opening it from a service page
(`/contact?service=enterprise-java`) pre-selects that interest.

Out of the box, **Send message** opens the visitor's email app with their message filled in and addressed
to `site.contact.email`. To receive messages straight into your inbox instead, with no email app needed:

1. Create a free form at [formspree.io](https://formspree.io) (or [web3forms.com](https://web3forms.com)).
2. Paste its endpoint into `site.contact.formEndpoint`, e.g. `'https://formspree.io/f/abcdwxyz'`.
   For Web3Forms use `'https://api.web3forms.com/submit'` and put your access key in `formAccessKey`.

The form validates fields, shows a thank-you state, and has a hidden honeypot field against spam bots.

**Floating WhatsApp button:** bottom right on every page; it opens a chat with `site.contact.whatsapp`
(digits only, international format) with `whatsappMessage` filled in. Turn off with `fx.whatsappButton`.

## Before going live: placeholder checklist

- [ ] `site.social.*`: replace the placeholder Facebook, X, YouTube, Instagram and LinkedIn links with your pages
- [ ] `site.contact.formEndpoint` (optional): see **Contact form**
- [ ] `site.contact.hours` and `site.contact.bookingUrl` (optional)
- [ ] Product site URLs for TradeMind AI and Orion AI in `products.js` (Listing Agent is set)
- [ ] Product `status`: change `'soon'` to `'beta'` or `'live'` as each launches
- [ ] Set up the database and admin login (see **Admin controls**), then replace the sample projects
      with your real ones from the admin controls (untick “Mark as sample project”)
- [ ] Founder names, roles, bios and photos in `src/data/team.js` (photos go in `public/team/`; transparent PNG cut-outs with `cutout: true` look best on the ferrofluid)
- [ ] `public/og-image.png` (1200×630) for link previews

## Brand

| Token | Hex | Use |
| --- | --- | --- |
| Midnight Black | `#08090B` | Dark theme background, light theme text, brand panels |
| Pure White | `#F5F3EF` | Light theme background, dark theme text |
| Golden Yellow | `#FFC900` | Buttons, highlights, the crossbar in the mark, transitions |

Defined at the top of `src/styles/global.css`. Gold is never used for text on white (it is unreadable),
so light mode uses black text with gold underlines and markers instead. `--accent` is gold as a fill,
`--accent-text` is the readable text version.

Fixed brand panels that look the same in both themes: add `tone-gold`, `tone-black` or `tone-white` to any
element (used by the call-to-action band, product panels and work covers).

**Mark:** `src/components/BrandMark.jsx`, an "A" with a gold crossbar. The crossbar is the brand's signature:
it appears on every page transition.

**Transition identity:** every page change plays the same sequence: a gold sweep rises, the midnight panel
follows with a soft curved edge and shows the destination name, the crossbar fills, then the panel lifts
away with the gold trailing it.

**Preloader:** `src/components/fx/Preloader.jsx` (GSAP + SVG), charcoal `#111215` and warm white only.
The word ARTISOL is sketched with construction lines, filled with liquid white (an SVG mask with a soft
wavy edge and a glow), the tagline and a 000–100 counter appear, then the liquid drains out and the
screen splits down the middle into two panels that slide apart while the homepage fades in. The site
renders underneath the whole time; the preloader leaves as soon as the intro has played and the page's
load event has fired (it never waits more than 6s for the page). It plays once per browser session,
reduced-motion visitors get a simple fade, and if the script fails the overlay hides itself (a charcoal
boot screen in `index.html` also clears itself after 8s if the app never starts). While it is up, the
WebGL scenes underneath pause drawing so the animation stays smooth. To see it again, close the tab or
run `sessionStorage.removeItem('artisol-intro-seen')` in the browser console and reload.

## Interactive effects

All effects are written from scratch (no 3D libraries; GSAP is used only by the preloader), live in `src/fx/` and
`src/components/fx/`, and each can be switched off in `site.fx` inside `src/config/site.js`.

| Effect | Where | Notes |
| --- | --- | --- |
| Preloader | `fx/Preloader.jsx` | GSAP + SVG: sketch, liquid fill, tagline and counter, drain, split-curtain reveal. Once per browser session. See **Preloader** above. Turn off with `fx.preloader` |
| Interactive dot field (WebGL) | `fx/HeroField.jsx` | Dots swell in slow waves, lift around the cursor, ripple on click. Pauses off-screen |
| Cursor particle trail + ring | `fx/CursorTrail.jsx` | Mouse/trackpad only; the normal cursor stays visible |
| Headings that type themselves | `fx/TypeHeading.jsx` | Soft keyboard taps when sound is on |
| Scroll reveals | `fx/Reveal.jsx` | `variant="up" \| "left" \| "scale" \| "clip"`, optional `click` sound |
| Pinned horizontal products | `fx/ProductRail.jsx` | Desktop only; stacked list on phones |
| Process line that draws on scroll | `ProcessSteps.jsx` | Each step lights up with a soft click |
| Tech marquee | `fx/Marquee.jsx` | Speeds up with scroll velocity |
| Magnetic buttons | `fx/Magnetic.jsx` | Hero and closing call-to-action |
| Fullscreen menu | `MenuOverlay.jsx` | Opens and closes with the brand curtain. Large serif links, descriptions on hover, services, products and contact. Focus is trapped while open; Escape closes. Edit the links in the `MAIN` list at the top of the file |
| Project showcase | `fx/ProjectShowcase.jsx` | Homepage hero: glowing curved screens; the camera follows the cursor (orbit left/right, rise/dip, slight roll) (WebGL with bloom glow and floor reflection). Drag or swipe to spin, hover to pause, click a screen to open the project. Covers come from `image` in `src/data/work.js` (4:3, files in `public/work/`). Falls back to normal cards without WebGL |
| Founders over ferrofluid | `Founders.jsx` + `fx/Ferrofluid.jsx` | About page. Glossy black ferrofluid whose spikes rise toward the cursor like a magnet; a click gives a stronger pull. Photos and bios in `src/data/team.js` |
| Ferrofluid background | `fx/FerrofluidBackground.jsx` + `fx/FluidControl.jsx` | Every page, behind the content (on Home it appears after the hero). Hover tugs nearby beads; press and hold on empty space pulls the fluid into one spiked pool, letting go throws it outward. The Attract / Repel switch (bottom left) makes the hold open a hole instead. Headings, paragraphs, lists and buttons are kept clear automatically; add `data-keep-clear` to anything else, or `data-fluid-off` to make an area ignore the cursor. Turn off with `fx.fluidBackground` |
| Liquid footer | `fx/LiquidField.jsx` | Midnight liquid with a gold sheen; the cursor stirs it and it settles back. Half-resolution, pauses off-screen |
| Directional hover fill | `src/fx/directional-fill.js` | Add the class `dfill` to any element; all `.btn--ghost` buttons have it |
| Variable-font pressure | `fx/TextPressure.jsx` | Footer wordmark |
| ARTISOL page transition | `brand/BrandCurtain.jsx` + `App.jsx` | Gold sweep, midnight panel with the destination name, then the panel lifts away. The next page loads while the screen is covered |

### Sound

Sounds are synthesised in the browser with the Web Audio API (`src/fx/sound.js`), so there are no audio
files to load. They are **off by default**; the header toggle turns them on and the choice is remembered.

- `key()`: a muted keyboard tap, played while headings type in
- `click()`: a quiet mouse click, played on reveals and on real link/button clicks

Everything passes through a low-pass filter and a small room reverb, and both sounds are rate-limited so
fast scrolling never turns into a rattle. To make it quieter or louder, change `MASTER_VOLUME` at the top
of `sound.js` (default `0.55`). Audio pauses when the tab is hidden.

### Accessibility and performance

With "reduce motion" enabled in the OS, the intro, cursor trail, typing, reveals, marquee, rail and page
wipe are all skipped and the dot field shows one still frame. Animation loops stop when off-screen or
idle, and the WebGL canvas renders at a capped pixel ratio.

## Optional: office tour video

The About page can show a video that plays as the visitor scrolls. Put the file in `public/media/` and set
`site.media.officeTourVideo` (e.g. `'/media/office-tour.mp4'`). For smooth scrubbing, encode with a
keyframe on every frame:

```bash
ffmpeg -i office-tour.mov -an -vcodec libx264 -g 1 -crf 23 -preset veryfast -movflags faststart office-tour.mp4
```

## Project structure

```
src/
  config/site.js        global settings
  data/                 all page content
  hooks/                theme, page meta (title/description), media queries
  components/           header, footer, sections (each with its own .module.css)
  pages/                one file per route; non-home pages are lazy-loaded
  styles/global.css     design tokens + base styles
```

## Notes

- **Theme**: follows the visitor's OS setting until they use the toggle; their choice is then saved. An
  inline script in `index.html` applies it before React loads, so there is no flash.
- **SEO**: each page sets its own title, description and canonical URL (`usePageMeta`). Google renders
  JavaScript, but social link previews only see `index.html`. If per-page previews on LinkedIn or X
  matter later, add pre-rendering (e.g. `vite-plugin-prerender`) or move to Next.js. The page code ports
  over almost unchanged.
- **Accessibility**: skip link, visible focus styles, keyboard-operable menus, tabs and accordions, and
  reduced-motion support (the hero carousel stops and the scroll video becomes a normal player).
- **Fonts**: Bricolage Grotesque from Google Fonts (variable width axis is used for the condensed
  headlines). Swap it in `index.html` and `--font` in `global.css`.
