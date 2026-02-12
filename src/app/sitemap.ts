import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://fanta.musike.fm';

    const routes = [
        '',
        '/login',
        '/signup',
        '/terms',
        '/privacy-policy',
        '/cookie-policy',
    ];

    return routes.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : 'monthly',
        priority: route === '' ? 1 : 0.8,
    }));
}
