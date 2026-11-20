// ARTISOL's own SaaS products. Each has its own website — this site only
// introduces them and links out.
//   status: 'live' | 'beta' | 'soon'
//   url:    leave '' until the product site is live; the button then shows
//           "Site launching soon" instead of a broken link.

export const products = [
  {
    id: 'trademind',
    name: 'TradeMind AI',
    status: 'soon',
    url: '', // TODO: product site URL
    oneLiner: 'Market intelligence and paper trading for trading institutes and their students.',
    description:
      'TradeMind AI gives trading institutes one platform to teach, practise and review. Students get AI market analysis for stocks and crypto, a paper-trading desk and a trade journal. Instructors see the progress students choose to share. TradeMind analyses and teaches; it never places real trades.',
    audience: 'Trading institutes, instructors and their students',
    highlights: ['AI market analysis', 'Paper trading', 'Trade journal', 'Institute dashboards'],
  },
  {
    id: 'listing-agent',
    name: 'Listing Agent',
    status: 'soon',
    url: 'https://ecommercelistingagent.com',
    oneLiner: 'Turn product photos into finished store listings, published for you.',
    description:
      'Snap a photo, type a few details or just say what you are selling. Listing Agent writes the title, description, category and attributes, then publishes straight to Shopify, WooCommerce or your custom store. Built for sellers who would rather sell than fill in forms.',
    audience: 'Online sellers on Shopify, WooCommerce and custom stores',
    highlights: ['Photo, text or voice input', 'Shopify app', 'WooCommerce', 'Custom store API'],
  },
  {
    id: 'orion',
    name: 'Orion AI',
    status: 'soon',
    url: '', // TODO: product site URL
    oneLiner: 'A personal AI assistant that works across your laptop and phone.',
    description:
      'Orion connects your devices into one secure assistant. Ask from your phone for a file that is on your laptop, have it handle tasks on your computer, and keep up with messages, with every sensitive action waiting for your approval.',
    audience: 'Professionals and students who work across several devices',
    highlights: ['Laptop and Android', 'Remote file access', 'Voice commands', 'Approve-before-act'],
  },
];

export const statusLabel = {
  live: 'Live',
  beta: 'Public beta',
  soon: 'Launching soon',
};
