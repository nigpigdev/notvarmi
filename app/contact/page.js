import ContactClient from './ContactClient';

export const metadata = {
    title: 'İletişim',
    description: 'Notvarmı ekibiyle iletişime geçin. Sorularınız, önerileriniz veya geri bildirimleriniz için bize ulaşın.',
    keywords: ['iletişim', 'contact', 'destek', 'yardım', 'Notvarmı iletişim', 'geri bildirim'],
    openGraph: {
        title: 'İletişim | Notvarmı',
        description: 'Notvarmı ekibiyle iletişime geçin. Sorularınız için bize yazın.',
        type: 'website',
        url: 'https://www.notvarmi.com/contact',
        siteName: 'Notvarmı',
        locale: 'tr_TR',
    },
    twitter: {
        card: 'summary',
        title: 'İletişim | Notvarmı',
        description: 'Notvarmı ekibiyle iletişime geçin.',
    },
    alternates: {
        canonical: 'https://www.notvarmi.com/contact',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function ContactPage() {
    return <ContactClient />;
}
