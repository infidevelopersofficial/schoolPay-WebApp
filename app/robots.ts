import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/parent/', '/student/', '/api/'],
    },
    sitemap: 'https://schoolpay.example.com/sitemap.xml',
  }
}
