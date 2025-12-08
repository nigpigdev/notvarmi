import LoginClient from './LoginClient';

export const metadata = {
    title: 'Giriş Yap',
    description: 'Notvarmı hesabınıza giriş yapın. Üniversite notlarına, ders materyallerine ve topluluk tartışmalarına erişin.',
    keywords: ['giriş yap', 'login', 'üniversite', 'öğrenci girişi', 'Notvarmı giriş'],
    openGraph: {
        title: 'Giriş Yap | Notvarmı',
        description: 'Hesabınıza giriş yaparak üniversite notlarına ve akademik kaynaklara erişin.',
        type: 'website',
        url: 'https://www.notvarmi.com/login',
        siteName: 'Notvarmı',
        locale: 'tr_TR',
    },
    twitter: {
        card: 'summary',
        title: 'Giriş Yap | Notvarmı',
        description: 'Hesabınıza giriş yaparak üniversite notlarına ve akademik kaynaklara erişin.',
    },
    alternates: {
        canonical: 'https://www.notvarmi.com/login',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function LoginPage() {
    return <LoginClient />;
}
