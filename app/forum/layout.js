export const metadata = {
    title: 'Forum - Üniversite Soru Cevap ve Not Paylaşımı | Notvarmı',
    description: 'Üniversite öğrencileri için soru cevap forumu. Ders notları, vize ve final soruları hakkında tartışın, yardım alın. Binlerce öğrenci ile bilgi paylaşın.',
    keywords: ['üniversite forumu', 'öğrenci forumu', 'soru cevap', 'ders notları paylaşımı', 'sınav soruları', 'vize final', 'öğrenci yardımlaşması', 'üniversite notları', 'ödev yardım'],
    openGraph: {
        title: 'Notvarmı Forum - Öğrenci Tartışma Platformu',
        description: 'Dersler, sınavlar ve üniversite hayatı hakkında her şey. Binlerce öğrenci ile bilgi paylaşın.',
        type: 'website',
        url: 'https://www.notvarmi.com/forum',
        siteName: 'Notvarmı',
        locale: 'tr_TR',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Notvarmı Forum - Öğrenci Tartışma Platformu',
        description: 'Dersler, sınavlar ve üniversite hayatı hakkında her şey',
    },
    alternates: {
        canonical: 'https://www.notvarmi.com/forum',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
}

// JSON-LD Structured Data for Forum
const forumJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    'name': 'Notvarmı Forum',
    'description': 'Üniversite öğrencileri için soru cevap ve not paylaşım forumu',
    'url': 'https://www.notvarmi.com/forum',
    'publisher': {
        '@type': 'Organization',
        'name': 'Notvarmı',
        'url': 'https://www.notvarmi.com'
    },
    'inLanguage': 'tr-TR',
    'audience': {
        '@type': 'EducationalAudience',
        'educationalRole': 'student'
    }
};

export default function ForumLayout({ children }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(forumJsonLd) }}
            />
            {children}
        </>
    );
}
