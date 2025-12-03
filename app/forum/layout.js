export const metadata = {
    title: 'Forum - Üniversite Soru Cevap ve Not Paylaşımı',
    description: 'Üniversite öğrencileri için soru cevap forumu. Ders notları, vize ve final soruları hakkında tartışın, yardım alın. Binlerce öğrenci ile bilgi paylaşın.',
    keywords: ['üniversite forumu', 'öğrenci forumu', 'soru cevap', 'ders notları paylaşımı', 'sınav soruları', 'vize final', 'öğrenci yardımlaşması'],
    openGraph: {
        title: 'Notvarmı Forum - Öğrenci Tartışma Platformu',
        description: 'Dersler, sınavlar ve üniversite hayatı hakkında her şey. Binlerce öğrenci ile bilgi paylaşın.',
        type: 'website',
        url: 'https://www.notvarmi.com/forum',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Notvarmı Forum - Öğrenci Tartışma Platformu',
        description: 'Dersler, sınavlar ve üniversite hayatı hakkında her şey',
    },
    alternates: {
        canonical: 'https://www.notvarmi.com/forum',
    },
}

export default function ForumLayout({ children }) {
    return children;
}
