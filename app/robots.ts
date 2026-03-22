export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/app/', '/api/', '/welcome', '/invite-only', '/onboarding'],
      },
    ],
    sitemap: 'https://yachtie.link/sitemap.xml',
  }
}
