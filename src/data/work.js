// Portfolio entries shown on Home and /work.
// These are SAMPLE entries: replace them with your real projects
// (GitHub / Vercel links) before going live. While `sample: true`,
// the card shows a "Sample project" tag so nothing is mistaken for a real client.
//
//   practice: a slug from src/data/practices.js (used for filtering)
//   links:    { live, code } — leave '' to hide
//   tone:     cover colour until you add a screenshot: 'gold' | 'black' | 'white'
//   image:    cover/screenshot in /public/work (4:3, e.g. 1280×960). Also shown on the
//             curved screens of the homepage showcase. Generated placeholders for now.

export const work = [
  {
    id: 'vision-qc',
    image: '/work/vision-qc.jpg',
    sample: true,
    title: 'Visual quality inspection for a packaging line',
    practice: 'ai-machine-learning',
    summary:
      'Camera-based defect detection that flags damaged cartons before they leave the line, with a review screen for operators.',
    stack: ['PyTorch', 'OpenCV', 'FastAPI', 'React'],
    tone: 'gold',
    links: { live: '', code: '' },
  },
  {
    id: 'clinic-portal',
    image: '/work/clinic-portal.jpg',
    sample: true,
    title: 'Patient booking portal for a clinic group',
    practice: 'web-full-stack',
    summary:
      'Online booking, reminders and a staff dashboard replacing phone-only scheduling across several locations.',
    stack: ['Next.js', 'Node.js', 'PostgreSQL'],
    tone: 'black',
    links: { live: '', code: '' },
  },
  {
    id: 'ops-saas',
    image: '/work/ops-saas.jpg',
    sample: true,
    title: 'Multi-tenant field service SaaS',
    practice: 'saas-product-development',
    summary:
      'Job scheduling, technician mobile views and per-company billing, launched as an MVP and scaled to paying customers.',
    stack: ['React', 'Spring Boot', 'PostgreSQL', 'Stripe'],
    tone: 'white',
    links: { live: '', code: '' },
  },
  {
    id: 'ledger-modernization',
    image: '/work/ledger-modernization.jpg',
    sample: true,
    title: 'Ledger system modernization',
    practice: 'enterprise-java',
    summary:
      'A legacy monolith split into Spring Boot services behind an API gateway, migrated module by module with zero downtime.',
    stack: ['Java 21', 'Spring Boot', 'Kafka', 'Oracle'],
    tone: 'black',
    links: { live: '', code: '' },
  },
  {
    id: 'support-agent',
    image: '/work/support-agent.jpg',
    sample: true,
    title: 'WhatsApp support agent for an online retailer',
    practice: 'ai-agents-automation',
    summary:
      'Answers order and return questions on WhatsApp, checks order status in the store, and hands complex cases to staff.',
    stack: ['LangGraph', 'WhatsApp Business API', 'Node.js'],
    tone: 'gold',
    links: { live: '', code: '' },
  },
  {
    id: 'managed-sales-agents',
    image: '/work/managed-sales-agents.jpg',
    sample: true,
    title: 'Managed lead qualification agents',
    practice: 'agentic-ai-as-a-service',
    summary:
      'Hosted agents that qualify inbound leads, book meetings and update the CRM, reviewed and tuned by our team monthly.',
    stack: ['Hosted agents', 'CRM integration', 'Analytics'],
    tone: 'white',
    links: { live: '', code: '' },
  },
];
