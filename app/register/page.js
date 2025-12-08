import RegisterClient from './RegisterClient';

export const metadata = {
    title: 'Kayıt Ol',
    description: 'Notvarmı\'ya ücretsiz kayıt olun. Üniversite notlarınızı paylaşın, ders materyallerine erişin ve öğrenci topluluğuna katılın.',
    keywords: ['kayıt ol', 'üye ol', 'register', 'üniversite', 'öğrenci kaydı', 'Notvarmı üyelik', 'ücretsiz kayıt'],
    openGraph: {
        title: 'Kayıt Ol | Notvarmı',
        description: 'Ücretsiz hesap oluşturarak üniversite notlarına ve akademik kaynaklara erişin.',
        type: 'website',
        url: 'https://www.notvarmi.com/register',
        siteName: 'Notvarmı',
        locale: 'tr_TR',
    },
    twitter: {
        card: 'summary',
        title: 'Kayıt Ol | Notvarmı',
        description: 'Ücretsiz hesap oluşturarak üniversite notlarına ve akademik kaynaklara erişin.',
    },
    alternates: {
        canonical: 'https://www.notvarmi.com/register',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function RegisterPage() {
    return <RegisterClient />;
}
