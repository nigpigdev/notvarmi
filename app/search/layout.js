export const metadata = {
    title: 'Arama',
    description: 'Notvarmı üzerinde ders notları, tartışmalar ve kullanıcıları arayın. Aradığınız her şeyi kolayca bulun.',
    keywords: ['arama', 'search', 'not ara', 'ders notu bul', 'forum ara', 'Notvarmı arama'],
    openGraph: {
        title: 'Arama | Notvarmı',
        description: 'Ders notları, tartışmalar ve kullanıcıları arayın.',
        type: 'website',
        url: 'https://www.notvarmi.com/search',
        siteName: 'Notvarmı',
        locale: 'tr_TR',
    },
    twitter: {
        card: 'summary',
        title: 'Arama | Notvarmı',
        description: 'Ders notları, tartışmalar ve kullanıcıları arayın.',
    },
    alternates: {
        canonical: 'https://www.notvarmi.com/search',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function SearchLayout({ children }) {
    return children;
}
