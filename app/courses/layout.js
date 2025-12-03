export const metadata = {
    title: 'Dersler - Üniversite Ders Notları ve Kaynaklar',
    description: 'Bölümüne ait dersleri bul, notlara ve çıkmış sorulara ulaş. Üniversite ders notları arşivi. Ders programını oluştur ve takip et.',
    keywords: ['üniversite dersleri', 'ders notları', 'çıkmış sorular', 'ders programı', 'akademik kaynaklar', 'ders takibi', 'online ders notları'],
    openGraph: {
        title: 'Notvarmı Dersler - Ders Notu Arşivi',
        description: 'Tüm üniversite dersleri ve kaynakları tek bir yerde. Ders programını oluştur ve takip et.',
        type: 'website',
        url: 'https://www.notvarmi.com/courses',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Notvarmı Dersler - Ders Notu Arşivi',
        description: 'Tüm üniversite dersleri ve kaynakları tek bir yerde',
    },
    alternates: {
        canonical: 'https://www.notvarmi.com/courses',
    },
}

export default function CoursesLayout({ children }) {
    return children;
}
