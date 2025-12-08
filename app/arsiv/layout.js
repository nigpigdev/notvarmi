export const metadata = {
    title: 'Arşiv',
    description: 'Yüklediğiniz dosyaları ve kaydettiğiniz tartışmaları görüntüleyin. Tüm notlarınız ve kaydettikleriniz tek bir yerde.',
    keywords: ['arşiv', 'dosyalarım', 'kaydedilenler', 'Notvarmı arşiv', 'not arşivi', 'belgelerim'],
    openGraph: {
        title: 'Arşiv | Notvarmı',
        description: 'Dosyalarınızı ve kaydettiklerinizi yönetin.',
        type: 'website',
        url: 'https://www.notvarmi.com/arsiv',
        siteName: 'Notvarmı',
        locale: 'tr_TR',
    },
    twitter: {
        card: 'summary',
        title: 'Arşiv | Notvarmı',
        description: 'Dosyalarınızı ve kaydettiklerinizi yönetin.',
    },
    alternates: {
        canonical: 'https://www.notvarmi.com/arsiv',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function ArsivLayout({ children }) {
    return children;
}
