// The six service practices. Each one gets its own page at /services/:slug.
// Edit copy freely — the layout adapts to the number of sub-services.

export const practices = [
  {
    slug: 'ai-machine-learning',
    name: 'AI & Machine Learning Solutions',
    short: 'AI & Machine Learning',
    summary:
      'Models that answer a real business question — forecasting demand, reading documents, spotting defects — trained on your data and shipped into your product.',
    fit: 'You have data and a decision you want made faster, cheaper or more accurately.',
    services: [
      {
        name: 'Custom AI Development',
        desc: 'AI features designed around your workflow, from problem framing and data audit to a production release.',
      },
      {
        name: 'Machine Learning & Deep Learning',
        desc: 'Classical ML and neural networks for tabular, image, text and time-series data, with honest evaluation.',
      },
      {
        name: 'Predictive Analytics',
        desc: 'Forecasts for demand, churn, risk and maintenance that plug into the dashboards your team already uses.',
      },
      {
        name: 'Computer Vision',
        desc: 'Detection, classification, OCR and visual inspection for photos, scanned documents and live camera feeds.',
      },
      {
        name: 'Natural Language Processing (NLP)',
        desc: 'Classification, extraction, search and summarisation across emails, tickets, contracts and reviews.',
      },
      {
        name: 'Generative AI Applications',
        desc: 'LLM-powered products with retrieval (RAG), guardrails and cost controls — built to be relied on, not demoed.',
      },
      {
        name: 'AI Model Development & Integration',
        desc: 'Fine-tuning, evaluation and serving, plus wiring models into your existing apps through clean APIs.',
      },
    ],
    stack: ['Python', 'PyTorch', 'scikit-learn', 'TensorFlow', 'OpenCV', 'LangChain', 'FastAPI', 'pgvector'],
    deliverables: [
      'Data audit and feasibility report',
      'Trained, evaluated model with metrics you can check',
      'Production API or in-app integration',
      'Monitoring for drift and accuracy',
    ],
  },
  {
    slug: 'web-full-stack',
    name: 'Web & Full-Stack Application Development',
    short: 'Web & Full-Stack',
    summary:
      'Fast, accessible websites and web applications on modern JavaScript — from a marketing site to a complex dashboard with real-time data.',
    fit: 'You need a web product built properly, end to end, by one accountable team.',
    services: [
      {
        name: 'Custom Website Development',
        desc: 'Marketing and company websites that load fast, rank well and are easy for your team to update.',
      },
      {
        name: 'Full-Stack Web Application Development',
        desc: 'Database, API and interface designed together, so features ship without hand-off friction.',
      },
      {
        name: 'Frontend Development',
        desc: 'Responsive, accessible interfaces in React with a component system your designers can extend.',
      },
      {
        name: 'Backend Development',
        desc: 'Secure server logic, authentication, background jobs and integrations that hold up under load.',
      },
      {
        name: 'REST API Development',
        desc: 'Documented, versioned APIs for your apps, partners and mobile clients.',
      },
      {
        name: 'E-commerce Development',
        desc: 'Custom storefronts, checkout and order flows, or extensions to Shopify and WooCommerce.',
      },
      {
        name: 'MERN Stack Development',
        desc: 'MongoDB, Express, React and Node applications, from MVP to scaled production.',
      },
      {
        name: 'Next.js & React Development',
        desc: 'Server-rendered and static React apps with strong SEO and performance budgets.',
      },
    ],
    stack: ['React', 'Next.js', 'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'TypeScript', 'Vercel'],
    deliverables: [
      'UX flows and interface design',
      'Production web app with CI/CD',
      'API documentation',
      'Performance and accessibility pass',
    ],
  },
  {
    slug: 'saas-product-development',
    name: 'SaaS & Software Product Development',
    short: 'SaaS & Product',
    summary:
      'We take a product idea to paying customers: scope the MVP, build it on a foundation that scales, and keep shipping after launch.',
    fit: 'You are launching a software product, or rebuilding one that has outgrown its first version.',
    services: [
      {
        name: 'Custom SaaS Development',
        desc: 'Complete SaaS products with accounts, roles, billing and admin tooling.',
      },
      {
        name: 'SaaS MVP Development',
        desc: 'A focused first version, scoped to test your core idea with real users in weeks, not quarters.',
      },
      {
        name: 'Multi-Tenant SaaS Platforms',
        desc: 'Tenant isolation, per-tenant configuration and data separation designed in from day one.',
      },
      {
        name: 'Enterprise Software Development',
        desc: 'Internal platforms with SSO, audit trails and the permission models large organisations need.',
      },
      {
        name: 'CRM & ERP Development',
        desc: 'Custom CRM and ERP modules shaped around how your sales, finance and operations teams actually work.',
      },
      {
        name: 'Business Management Systems',
        desc: 'Inventory, HR, booking and operations software that replaces spreadsheets and disconnected tools.',
      },
      {
        name: 'Marketplace Development',
        desc: 'Two-sided platforms with listings, search, payouts and trust and safety features.',
      },
      {
        name: 'Subscription-Based Platforms',
        desc: 'Plans, trials, metered usage and dunning, integrated with Stripe or your payment provider.',
      },
    ],
    stack: ['React', 'Node.js', 'Spring Boot', 'PostgreSQL', 'Redis', 'Stripe', 'AWS', 'Docker'],
    deliverables: [
      'Product scope and release plan',
      'MVP in production with analytics',
      'Billing and subscription management',
      'Post-launch roadmap and support',
    ],
  },
  {
    slug: 'enterprise-java',
    name: 'Enterprise Application Development',
    short: 'Enterprise & Java',
    summary:
      'Java and Spring Boot systems for organisations where uptime, security and auditability are not optional.',
    fit: 'You run critical systems that need to scale, integrate and stay maintainable for years.',
    services: [
      {
        name: 'Java Full-Stack Development',
        desc: 'Spring Boot backends paired with React frontends, delivered by one team.',
      },
      {
        name: 'Spring Boot Development',
        desc: 'Production services with Spring Security, Spring Data and observability built in.',
      },
      {
        name: 'Enterprise Web Applications',
        desc: 'Portals and line-of-business apps with role-based access and complex workflows.',
      },
      {
        name: 'Backend System Development',
        desc: 'Transaction processing, scheduling and integration layers that other systems depend on.',
      },
      {
        name: 'Microservices Architecture',
        desc: 'Service boundaries, messaging and deployment designed for independent teams and releases.',
      },
      {
        name: 'Database Design & Management',
        desc: 'Schema design, query tuning, migrations and replication for PostgreSQL, MySQL and Oracle.',
      },
      {
        name: 'Enterprise API Development',
        desc: 'Secure, versioned APIs and gateways with rate limiting and partner onboarding.',
      },
      {
        name: 'System Modernization',
        desc: 'Moving legacy monoliths to maintainable services step by step, without a risky big-bang rewrite.',
      },
    ],
    stack: ['Java 21', 'Spring Boot', 'Spring Cloud', 'Kafka', 'PostgreSQL', 'Oracle', 'Kubernetes', 'React'],
    deliverables: [
      'Architecture and integration design',
      'Hardened services with test coverage',
      'Migration plan for legacy systems',
      'Runbooks and monitoring',
    ],
  },
  {
    slug: 'ai-agents-automation',
    name: 'AI Agents & Business Process Automation',
    short: 'AI Agents & Automation',
    summary:
      'We build AI agents that do real work inside your business — answering customers, qualifying leads, processing documents — built for you and owned by you.',
    fit: 'Your team spends hours on repetitive work that follows rules and lives in your existing tools.',
    services: [
      {
        name: 'AI Agent Development',
        desc: 'Agents that use your tools and data to complete tasks, with approvals where it matters.',
      },
      {
        name: 'Multi-Agent Systems',
        desc: 'Teams of specialised agents that plan, hand off and check each other’s work.',
      },
      {
        name: 'AI Customer Support Automation',
        desc: 'Answer common questions instantly, triage tickets and hand off to people with full context.',
      },
      {
        name: 'AI Sales & Marketing Automation',
        desc: 'Lead qualification, personalised outreach and CRM updates without manual data entry.',
      },
      {
        name: 'AI Workflow Automation',
        desc: 'Document intake, approvals and reporting flows that run themselves and log every step.',
      },
      {
        name: 'WhatsApp & Conversational AI',
        desc: 'Assistants on WhatsApp, web chat and voice, connected to your bookings, orders and CRM.',
      },
      {
        name: 'Business Process Automation',
        desc: 'Connect the apps you already use so data moves between them without copy and paste.',
      },
      {
        name: 'AI-powered Virtual Assistants',
        desc: 'Internal assistants that search company knowledge and help staff get answers fast.',
      },
    ],
    stack: ['LangGraph', 'OpenAI', 'Llama', 'Python', 'Node.js', 'WhatsApp Business API', 'n8n', 'Redis'],
    deliverables: [
      'Process map and automation plan',
      'Agent with tool access and guardrails',
      'Human approval and audit logs',
      'Usage and outcome reporting',
    ],
  },
  {
    slug: 'agentic-ai-as-a-service',
    name: 'Agentic AI as a Service',
    short: 'Agentic AI as a Service',
    summary:
      'Run AI agents on our managed platform instead of building from scratch. We host, monitor and improve them; you configure them and see the results.',
    fit: 'You want agents working this month, without hiring a team to build and run the infrastructure.',
    services: [
      {
        name: 'AI Agent-as-a-Service',
        desc: 'Ready agents for support, sales and operations, configured to your business and billed monthly.',
      },
      {
        name: 'Multi-Agent Workforce Platforms',
        desc: 'A coordinated set of agents covering a whole function, managed from one place.',
      },
      {
        name: 'Customizable AI Agent Platforms',
        desc: 'Adjust instructions, tools and knowledge without writing code.',
      },
      {
        name: 'Hosted AI Agent Solutions',
        desc: 'We run the infrastructure, scaling and model updates; you get uptime commitments.',
      },
      {
        name: 'AI Agent API Services',
        desc: 'Call our agents from your own apps through a documented API.',
      },
      {
        name: 'Managed AI Agent Solutions',
        desc: 'Our team monitors performance, reviews conversations and tunes agents every month.',
      },
      {
        name: 'Agent Orchestration Platforms',
        desc: 'Route work between agents and people with clear rules and handoffs.',
      },
      {
        name: 'Enterprise AI Agent Management',
        desc: 'Access control, audit logs, data residency and spend limits across every agent you run.',
      },
    ],
    stack: ['Managed hosting', 'REST API', 'SSO', 'Audit logs', 'Usage analytics', 'Human handoff'],
    deliverables: [
      'Onboarding and agent configuration',
      'Hosted agents with uptime commitments',
      'Monthly performance reviews',
      'Admin console and API access',
    ],
  },
];

export const getPractice = (slug) => practices.find((p) => p.slug === slug);
