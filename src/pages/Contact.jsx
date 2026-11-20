import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiAlertCircle,
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiGlobe,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShare2,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa6';
import { site, mapHref, telHref, whatsappHref } from '../config/site';
import { useContent } from '../content/store';
import { usePageMeta } from '../hooks/usePageMeta';
import PageHeader from '../components/PageHeader.jsx';
import SocialLinks from '../components/SocialLinks.jsx';
import Faq from '../components/Faq.jsx';
import Reveal from '../components/fx/Reveal.jsx';
import s from './Contact.module.css';

const nextSteps = [
  { title: 'We reply', text: 'Within one business day, with questions or a time for a call.' },
  { title: 'Discovery call', text: 'Thirty minutes on the problem, your users and constraints. Free.' },
  { title: 'Written scope', text: 'Milestones, a fixed price or range, and the risks we see. You decide from there.' },
];

const EMPTY = { name: '', email: '', company: '', interest: '', message: '', website: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(v) {
  const e = {};
  if (!v.name.trim()) e.name = 'Please tell us your name.';
  if (!v.email.trim()) e.email = 'We need an email to reply to.';
  else if (!EMAIL_RE.test(v.email.trim())) e.email = 'That email address doesn’t look right.';
  if (v.message.trim().length < 10) e.message = 'A sentence or two about the project, please.';
  return e;
}

export default function Contact() {
  usePageMeta({
    title: 'Contact',
    description: `Start a project with ${site.name}. Send a message, call or WhatsApp us; we reply within one business day.`,
    path: '/contact',
  });

  const { practices, products, getPractice } = useContent();
  const [params] = useSearchParams();
  const practice = getPractice(params.get('service') || '');
  const [values, setValues] = useState({ ...EMPTY, interest: practice ? practice.short : '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | mailto | error
const [sendError, setSendError] = useState('');

  const set = (k) => (e) => {
    const v = e.target.value;
    setValues((x) => ({ ...x, [k]: v }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const mailtoFor = (v) => {
    const subject = `Project enquiry${v.interest ? `: ${v.interest}` : ''} from ${v.name.trim()}`;
    const body = [
      v.message.trim(),
      '',
      '—',
      `Name: ${v.name.trim()}`,
      `Email: ${v.email.trim()}`,
      v.company.trim() && `Company: ${v.company.trim()}`,
      v.interest && `Interest: ${v.interest}`,
    ]
      .filter((x) => x !== false && x !== '')
      .join('\n');
    return `mailto:${site.contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (values.website) return; // honeypot: bots fill hidden fields
    const found = validate(values);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(`cf-${first}`)?.focus();
      return;
    }

    // No form service configured: hand the message to the visitor's email app.
    if (!site.contact.formEndpoint) {
      window.location.href = mailtoFor(values);
      setStatus('mailto');
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch(site.contact.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...(site.contact.formAccessKey ? { access_key: site.contact.formAccessKey } : {}),
          subject: `New enquiry from ${values.name.trim()} via ${site.name} website`,
          name: values.name.trim(),
          email: values.email.trim(),
          company: values.company.trim(),
          interest: values.interest,
          message: values.message.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.fields) setErrors(data.fields);
        throw new Error(data?.error || 'The message didn’t go through.');
      }
      setStatus('sent');
    } catch (err) {
      setSendError(err instanceof TypeError ? 'Could not reach the server. Check your connection.' : err.message);
      setStatus('error');
    }
  };

  const reset = () => {
    setValues({ ...EMPTY });
    setErrors({});
    setStatus('idle');
  };

  const field = (k) => ({
    id: `cf-${k}`,
    name: k,
    value: values[k],
    onChange: set(k),
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `cf-${k}-err` : undefined,
    className: `${s.input} ${errors[k] ? s.invalid : ''}`,
  });
  const Err = ({ k }) =>
    errors[k] ? (
      <p id={`cf-${k}-err`} className={s.err}>
        <FiAlertCircle aria-hidden /> {errors[k]}
      </p>
    ) : null;

  const wa = whatsappHref();
  const done = status === 'sent' || status === 'mailto';

  return (
    <>
      <PageHeader title="Start a project" intro={`Tell us what you are building. ${site.contact.responseTime}`} />

      <section className="container">
        <div className={s.contact}>
          {/* ── Form ───────────────────────────────── */}
          <Reveal className={s.formCard} data-keep-clear>
            {done ? (
              <div className={s.done} role="status">
                <span className={s.doneIcon} aria-hidden="true">
                  <FiCheck />
                </span>
                {status === 'sent' ? (
                  <>
                    <h2 className={s.doneTitle}>Thanks, {values.name.trim().split(' ')[0]}. Message received.</h2>
                    <p className="muted">
                      We will reply to {values.email.trim()} within one business day.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className={s.doneTitle}>Your email app should now be open</h2>
                    <p className="muted">
                      Your message is filled in and ready to send. If nothing opened, email us directly at{' '}
                      <a href={mailtoFor(values)}>{site.contact.email}</a>
                      {wa && (
                        <>
                          {' '}
                          or{' '}
                          <a href={wa} target="_blank" rel="noreferrer">
                            message us on WhatsApp
                          </a>
                        </>
                      )}
                      .
                    </p>
                  </>
                )}
                <button type="button" className="btn btn--ghost" onClick={reset}>
                  Send another message
                </button>
              </div>
            ) : (
              <form className={s.form} onSubmit={onSubmit} noValidate>
                <div className={s.row}>
                  <div className={s.field}>
                    <label htmlFor="cf-name" className={s.label}>
                      Name
                    </label>
                    <input {...field('name')} type="text" autoComplete="name" placeholder="Your name" required />
                    <Err k="name" />
                  </div>
                  <div className={s.field}>
                    <label htmlFor="cf-email" className={s.label}>
                      Email
                    </label>
                    <input
                      {...field('email')}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      required
                    />
                    <Err k="email" />
                  </div>
                </div>

                <div className={s.field}>
                  <label htmlFor="cf-company" className={s.label}>
                    Company <span className={s.optional}>optional</span>
                  </label>
                  <input {...field('company')} type="text" autoComplete="organization" placeholder="Company" />
                </div>

                <div className={s.field}>
                  <label htmlFor="cf-interest" className={s.label}>
                    Interest
                  </label>
                  <div className={s.selectWrap}>
                    <select {...field('interest')} className={`${s.input} ${s.select} ${values.interest ? '' : s.placeholder}`}>
                      <option value="">Select an interest</option>
                      <optgroup label="Custom software">
                        {practices.map((p) => (
                          <option key={p.slug} value={p.short}>
                            {p.short}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Our products">
                        {products.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Other">
                        <option value="Partnership">Partnership</option>
                        <option value="Careers">Careers</option>
                        <option value="Something else">Something else</option>
                      </optgroup>
                    </select>
                    <FiChevronDown className={s.chevron} aria-hidden />
                  </div>
                </div>

                <div className={s.field}>
                  <label htmlFor="cf-message" className={s.label}>
                    Message
                  </label>
                  <textarea
                    {...field('message')}
                    rows={6}
                    placeholder="Tell us what you're building: the problem, who will use it, and any timeline."
                    required
                  />
                  <Err k="message" />
                </div>

                {/* honeypot: hidden from people, tempting for bots */}
                <div className={s.hp} aria-hidden="true">
                  <label htmlFor="cf-website">Website</label>
                  <input id="cf-website" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
                </div>

                {status === 'error' && (
                  <p className={s.formError} role="alert">
                    <FiAlertCircle aria-hidden /> {sendError || 'The message didn’t go through.'} Please try again, or email{' '}
                    <a href={mailtoFor(values)}>{site.contact.email}</a>.
                  </p>
                )}

                <button type="submit" className={`btn btn--accent ${s.submit}`} disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending…' : 'Send message'}
                  <FiArrowRight aria-hidden />
                </button>
                <p className={s.note}>
                  {site.contact.formEndpoint
                    ? 'We only use your details to reply to this message.'
                    : 'Opens your email app with your message ready to send.'}
                </p>
              </form>
            )}
          </Reveal>

          {/* ── Details ─────────────────────────────── */}
          <Reveal as="ul" role="list" className={s.info} delay={0.15} data-keep-clear>
            {site.contact.phones?.length > 0 && (
              <li className={s.item}>
                <span className={s.tile} aria-hidden="true">
                  <FiPhone />
                </span>
                <div>
                  <h2 className={s.itemTitle}>Call us</h2>
                  {site.contact.phones.map((p) => (
                    <a key={p} href={telHref(p)} className={s.strong}>
                      {p}
                    </a>
                  ))}
                  {site.contact.hours && <p className={s.sub}>{site.contact.hours}</p>}
                </div>
              </li>
            )}

            {wa && (
              <li className={s.item}>
                <span className={`${s.tile} ${s.waTile}`} aria-hidden="true">
                  <FaWhatsapp />
                </span>
                <div>
                  <h2 className={s.itemTitle}>WhatsApp</h2>
                  <a href={wa} target="_blank" rel="noreferrer" className={s.strong}>
                    Chat with us <FiArrowRight aria-hidden />
                  </a>
                  <p className={s.sub}>Quick questions are welcome here too.</p>
                </div>
              </li>
            )}

            <li className={s.item}>
              <span className={s.tile} aria-hidden="true">
                <FiMail />
              </span>
              <div>
                <h2 className={s.itemTitle}>Email</h2>
                <a href={`mailto:${site.contact.email}`} className={`${s.strong} ${s.email}`}>
                  {site.contact.email}
                </a>
                <p className={s.sub}>We reply within one business day.</p>
              </div>
            </li>

            {site.contact.address && (
              <li className={s.item}>
                <span className={s.tile} aria-hidden="true">
                  <FiMapPin />
                </span>
                <div>
                  <h2 className={s.itemTitle}>Office</h2>
                  <address className={s.address}>{site.contact.address}</address>
                  <a href={mapHref()} target="_blank" rel="noreferrer" className={s.link}>
                    Get directions
                  </a>
                </div>
              </li>
            )}

            {site.contact.bookingUrl && (
              <li className={s.item}>
                <span className={s.tile} aria-hidden="true">
                  <FiCalendar />
                </span>
                <div>
                  <h2 className={s.itemTitle}>Book a call</h2>
                  <a href={site.contact.bookingUrl} target="_blank" rel="noreferrer" className={s.strong}>
                    Pick a 30-minute slot <FiArrowRight aria-hidden />
                  </a>
                </div>
              </li>
            )}

            <li className={s.item}>
              <span className={s.tile} aria-hidden="true">
                <FiGlobe />
              </span>
              <div>
                <h2 className={s.itemTitle}>Worldwide</h2>
                <p className={s.sub}>Based in Hyderabad, Pakistan. Working with clients across time zones.</p>
              </div>
            </li>

            <li className={s.item}>
              <span className={s.tile} aria-hidden="true">
                <FiShare2 />
              </span>
              <div>
                <h2 className={s.itemTitle}>Follow us</h2>
                <SocialLinks className={s.socials} />
              </div>
            </li>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className={s.h2}>What happens next</h2>
          <ol role="list" className={s.next}>
            {nextSteps.map((n, i) => (
              <li key={n.title}>
                <span className={s.num} aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <h3 className={s.nTitle}>{n.title}</h3>
                  <p className="muted">{n.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section--tight">
        <div className={`container ${s.faq}`}>
          <h2 className={s.h2}>Before you write</h2>
          <Faq />
        </div>
      </section>
      <div className="section--tight" />
    </>
  );
}
