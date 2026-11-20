// How we work: process, engagement models, example builds for the hero,
// and FAQs. Edit freely.

export const process = [
  {
    title: 'Discovery call',
    desc: 'A 30-minute conversation about the problem, your users and your constraints. No pitch deck.',
  },
  {
    title: 'Scope and estimate',
    desc: 'A written scope with milestones, a fixed or ranged estimate, and the risks we see up front.',
  },
  {
    title: 'Design',
    desc: 'Flows and interface design you can click through before a line of production code is written.',
  },
  {
    title: 'Build in short cycles',
    desc: 'Working software every one to two weeks on a staging link, with a short demo and your feedback.',
  },
  {
    title: 'Launch and support',
    desc: 'Production release, monitoring and handover — or ongoing support if you want us to stay on.',
  },
];

export const engagements = [
  {
    name: 'Fixed-scope project',
    desc: 'A defined product or feature, delivered against an agreed scope and milestone plan.',
    bestFor: 'MVPs, websites, integrations, clearly defined builds',
  },
  {
    name: 'Dedicated team',
    desc: 'Engineers and a designer working as an extension of your team, billed monthly.',
    bestFor: 'Ongoing product work and roadmaps that change',
  },
  {
    name: 'Managed AI service',
    desc: 'We host and run AI agents for you under a monthly service agreement.',
    bestFor: 'Teams that want results without running AI infrastructure',
  },
];

// Example builds rotated in the hero "build sheet". Illustrative scopes, not client claims.
export const exampleBuilds = [
  {
    practice: 'AI & Machine Learning',
    slug: 'ai-machine-learning', // clicking this screen in the hero opens /services/ai-machine-learning
    title: 'Invoice reading and approval routing',
    scope: ['OCR and field extraction', 'Confidence-based human review', 'ERP export'],
    stack: ['Python', 'FastAPI', 'React'],
    weeks: '8–10',
  },
  {
    practice: 'SaaS & Product',
    slug: 'saas-product-development', // clicking this screen in the hero opens /services/saas-product-development
    title: 'Booking SaaS MVP for fitness studios',
    scope: ['Multi-tenant accounts', 'Stripe subscriptions', 'Member mobile web app'],
    stack: ['React', 'Node.js', 'PostgreSQL'],
    weeks: '10–12',
  },
  {
    practice: 'AI Agents & Automation',
    slug: 'ai-agents-automation', // clicking this screen in the hero opens /services/ai-agents-automation
    title: 'WhatsApp order assistant',
    scope: ['Order status and returns', 'Store and CRM integration', 'Handoff to staff'],
    stack: ['LangGraph', 'Node.js', 'WhatsApp API'],
    weeks: '5–6',
  },
  {
    practice: 'Enterprise & Java',
    slug: 'enterprise-java', // clicking this screen in the hero opens /services/enterprise-java
    title: 'Payments API for a partner network',
    scope: ['OAuth2 partner onboarding', 'Idempotent transactions', 'Audit trail'],
    stack: ['Spring Boot', 'Kafka', 'PostgreSQL'],
    weeks: '12–14',
  },
];

export const faqs = [
  {
    q: 'How much does a project cost?',
    a: 'Every build is different, so we price after a discovery call. You receive a written scope with a fixed price or a clear range before any work starts, and nothing is billed until you approve it.',
  },
  {
    q: 'Do you work with clients outside your time zone?',
    a: 'Yes. We work remotely with clients internationally, keep a few hours of daily overlap with your team, and run demos at times that suit you.',
  },
  {
    q: 'Who owns the code?',
    a: 'You do. On custom projects, source code and intellectual property transfer to you on payment. Managed AI services run on our platform under a service agreement.',
  },
  {
    q: 'Can you take over an existing codebase?',
    a: 'Yes. We start with a short code and architecture review, then propose fixes and a plan before changing anything significant.',
  },
  {
    q: 'Will you sign an NDA?',
    a: 'Happily, before the discovery call if you prefer.',
  },
];
