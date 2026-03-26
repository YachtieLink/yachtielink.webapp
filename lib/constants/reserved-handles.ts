/**
 * Handles that cannot be claimed by users.
 * Prevents subdomain collisions (*.yachtie.link) and brand/phishing abuse.
 */
export const RESERVED_HANDLES = new Set([
  // Infrastructure subdomains
  'www', 'api', 'app', 'admin', 'dashboard', 'mail', 'email', 'smtp', 'imap',
  'ftp', 'ssh', 'cdn', 'assets', 'static', 'media', 'img', 'images',
  // Auth / system
  'auth', 'login', 'logout', 'signup', 'register', 'account', 'billing',
  'settings', 'oauth', 'callback', 'webhook', 'webhooks', 'status', 'health',
  'verify', 'reset', 'upgrade',
  // App routes
  'u', 'r',
  // Brand / trust
  'support', 'help', 'info', 'contact', 'about', 'team', 'careers', 'jobs',
  'blog', 'news', 'press', 'legal', 'terms', 'privacy', 'security',
  'yachtielink', 'yachtie', 'link', 'pro', 'enterprise', 'crew', 'yacht',
  // Phishing vectors
  'paypal', 'stripe', 'google', 'apple', 'facebook', 'instagram',
  // Common DNS records
  'ns1', 'ns2', 'mx', 'autodiscover', 'autoconfig',
])
