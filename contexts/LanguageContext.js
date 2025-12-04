'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
    tr: {
        // Navbar
        navbar: {
            courses: 'Dersler',
            notes: 'Arşiv',
            forum: 'Forum',
            profile: 'Profil',
            logout: 'Çıkış',
            login: 'Giriş Yap',
            register: 'Kayıt Ol'
        },
        // Forum
        forum: {
            title: 'Öğrenci Topluluğu',
            subtitle: 'Soru sorun, bilgi paylaşın ve arkadaşlarınızla bağlantı kurun.',
            search: 'Başlık, içerik veya etiketlerde ara...',
            newPost: 'Yeni Gönderi',
            sort: 'Sırala:',
            sortNewest: 'En Yeni',
            sortOldest: 'En Eski',
            sortMostReplies: 'En Çok Yanıt',
            newest: 'En Yeni',
            oldest: 'En Eski',
            mostReplies: 'En Çok Yanıt',
            resultsFound: 'sonuç bulundu',
            loading: 'Gönderiler yükleniyor...',
            noResults: 'Sonuç bulunamadı',
            noResultsDesc: 'Farklı bir arama terimi deneyin veya yeni bir gönderi başlatın!',
            file: 'Dosya',
            replies: 'yanıt'
        },
        // Forum Create
        forumCreate: {
            title: 'Yeni Tartışma Oluştur',
            titleLabel: 'Başlık',
            contentLabel: 'İçerik',
            tagsLabel: 'Etiketler (virgülle ayırın)',
            tagsPlaceholder: 'örn. Matematik, Yardım, Sınav',
            addFile: 'Dosya Ekle',
            maxFiles: 'Maksimum 5 dosya yükleyebilirsiniz.',
            publishing: 'Yayınlanıyor...',
            publish: 'Tartışmayı Yayınla',
            warning: 'Önemli Uyarı!',
            warningMessage: 'Yükleyeceğiniz içeriği daha sonra silemeyeceksiniz. Lütfen paylaşmadan önce içeriğinizi dikkatlice kontrol edin. Devam etmek istediğinizden emin misiniz?',
            cancel: 'Vazgeç',
            confirm: 'Evet, Paylaş',
            createFailed: 'Gönderi oluşturulamadı',
            error: 'Gönderi oluşturulurken hata oluştu'
        },
        // Forum Detail
        forumDetail: {
            backToForum: 'Foruma Dön',
            loading: 'Yükleniyor...',
            postNotFound: 'Gönderi bulunamadı',
            postNotFoundDesc: 'Aradığınız gönderi mevcut değil veya kaldırılmış olabilir.',
            replies: 'Yanıtlar',
            noReplies: 'Henüz yanıt yok',
            beFirst: 'İlk yanıtlayan siz olun!',
            replyPlaceholder: 'Yanıtınızı yazın...',
            posting: 'Gönderiliyor...',
            postReply: 'Yanıtla',
            loginToReply: 'Yanıt vermek için giriş yapın'
        },
        // Profile
        profile: {
            title: 'Profilim',
            name: 'Ad Soyad',
            username: 'Kullanıcı Adı',
            email: 'E-posta',
            university: 'Üniversite',
            department: 'Bölüm',
            bio: 'Hakkımda',
            bioPlaceholder: 'Kendiniz hakkında birkaç kelime...',
            saving: 'Kaydediliyor...',
            save: 'Değişiklikleri Kaydet',
            loading: 'Profil yükleniyor...',
            updateSuccess: 'Profil başarıyla güncellendi!',
            updateError: 'Profil güncellenirken hata oluştu'
        },
        // Courses
        courses: {
            title: 'Derslerim',
            subtitle: 'Tüm derslerinizi tek yerden yönetin.',
            addCourse: 'Ders Ekle',
            noCourses: 'Henüz ders eklenmemiş',
            addFirst: 'İlk dersinizi ekleyerek başlayın!',
            loading: 'Dersler yükleniyor...',
            instructor: 'Öğretim Görevlisi',
            credits: 'Kredi'
        },
        // Notes
        notes: {
            title: 'Arşivim',
            subtitle: 'Tüm dosyalarınızı düzenli tutun.',
            uploadNote: 'Yeni Dosya Yükle',
            selectCourse: 'Ders Seçin',
            allCourses: 'Tüm Dersler',
            noNotes: 'Henüz dosya eklenmemiş',
            noNotesDesc: 'İlk dosyanızı ekleyerek başlayın!',
            loading: 'Dosyalar yükleniyor...',
            searchPlaceholder: 'Arşivde ara...',
            titleLabel: 'Başlık',
            descriptionLabel: 'Açıklama',
            tagsLabel: 'Etiketler (virgülle ayırın)',
            tagsPlaceholder: 'örn. Vize, Bölüm 3',
            courseLabel: 'Ders',
            selectCoursePlaceholder: 'Bir ders seçin...',
            createNewCourse: 'Yeni Ders Oluştur',
            filesLabel: 'Dosyalar',
            addFiles: 'Dosya Ekle',
            maxFiles: 'Maksimum 5 dosya yükleyebilirsiniz',
            supportedFormats: 'Desteklenen formatlar: PDF, DOCX, PPTX, TXT, XLSX',
            publicNote: 'Herkese Açık',
            privateNote: 'Özel',
            saveNote: 'Notu Kaydet',
            saving: 'Kaydediliyor...',
            backToNotes: 'Arşive Dön',
            uploadSuccess: 'Not başarıyla oluşturuldu!',
            uploadError: 'Not oluşturulurken hata oluştu',
            createNoteTitle: 'Yeni Not Oluştur',
            courseName: 'Ders Adı',
            courseCode: 'Ders Kodu',
            instructor: 'Öğretim Görevlisi',
            credits: 'Kredi',
            createCourse: 'Ders Oluştur',
            publicWarning: 'Herkesle Paylaşım Onayı',
            publicWarningMessage: 'Bu notu herkese açık olarak paylaşacaksınız. Not otomatik olarak forumda da paylaşılacak ve tüm öğrenciler görebilecek. Devam etmek istiyor musunuz?',
            sharePublic: 'Evet, Paylaş'
        },
        // Courses
        courses: {
            title: 'Derslerim',
            subtitle: 'Tüm derslerinizi ve notlarınızı yönetin.',
            addCourse: 'Yeni Ders Ekle',
            loading: 'Dersler yükleniyor...',
            noCourses: 'Henüz ders eklenmemiş',
            addFirst: 'İlk dersinizi ekleyerek başlayın!',
            nameCodeRequired: 'Ders adı ve kodu zorunludur',
            addError: 'Ders eklenirken hata oluştu',
            credits: 'Kredi'
        },
        // Auth
        auth: {
            loginTitle: 'Giriş Yap',
            registerTitle: 'Kayıt Ol',
            email: 'E-posta',
            password: 'Şifre',
            name: 'Ad Soyad',
            username: 'Kullanıcı Adı',
            university: 'Üniversite',
            department: 'Bölüm',
            login: 'Giriş',
            register: 'Kayıt Ol',
            noAccount: 'Hesabınız yok mu?',
            hasAccount: 'Zaten hesabınız var mı?',
            registerLink: 'Kayıt olun',
            loginLink: 'Giriş yapın'
        },
        // Common
        common: {
            loading: 'Yükleniyor...',
            save: 'Kaydet',
            cancel: 'İptal',
            delete: 'Sil',
            edit: 'Düzenle',
            close: 'Kapat',
            search: 'Ara...',
            unknown: 'Bilinmiyor'
        }
    },
    en: {
        // Navbar
        navbar: {
            courses: 'Courses',
            notes: 'Archive',
            forum: 'Forum',
            profile: 'Profile',
            logout: 'Logout',
            login: 'Login',
            register: 'Sign Up'
        },
        // Forum
        forum: {
            title: 'Student Community',
            subtitle: 'Ask questions, share knowledge, and connect with peers.',
            search: 'Search in titles, content, or tags...',
            newPost: 'New Post',
            sort: 'Sort:',
            sortNewest: 'Newest',
            sortOldest: 'Oldest',
            sortMostReplies: 'Most Replies',
            newest: 'Newest',
            oldest: 'Oldest',
            mostReplies: 'Most Replies',
            resultsFound: 'results found',
            loading: 'Loading posts...',
            noResults: 'No Results Found',
            noResultsDesc: 'Try a different search term or start a new post!',
            file: 'File',
            replies: 'replies'
        },
        // Forum Create
        forumCreate: {
            title: 'Create New Discussion',
            titleLabel: 'Title',
            contentLabel: 'Content',
            tagsLabel: 'Tags (comma separated)',
            tagsPlaceholder: 'e.g. Math, Help, Exam',
            addFile: 'Add File',
            maxFiles: 'You can upload a maximum of 5 files.',
            publishing: 'Publishing...',
            publish: 'Publish Discussion',
            warning: 'Important Warning!',
            warningMessage: 'You will not be able to delete the content you upload later. Please review your content carefully before sharing. Are you sure you want to continue?',
            cancel: 'Cancel',
            confirm: 'Yes, Share',
            createFailed: 'Failed to create post',
            error: 'Error creating post'
        },
        // Forum Detail
        forumDetail: {
            backToForum: 'Back to Forum',
            loading: 'Loading...',
            postNotFound: 'Post Not Found',
            postNotFoundDesc: 'The post you are looking for does not exist or may have been removed.',
            replies: 'Replies',
            noReplies: 'No replies yet',
            beFirst: 'Be the first to reply!',
            replyPlaceholder: 'Write your reply...',
            posting: 'Posting...',
            postReply: 'Post Reply',
            loginToReply: 'Login to reply'
        },
        // Profile
        profile: {
            title: 'My Profile',
            name: 'Full Name',
            username: 'Username',
            email: 'Email',
            university: 'University',
            department: 'Department',
            bio: 'About Me',
            bioPlaceholder: 'A few words about yourself...',
            saving: 'Saving...',
            save: 'Save Changes',
            loading: 'Loading profile...',
            updateSuccess: 'Profile updated successfully!',
            updateError: 'Error updating profile'
        },
        // Courses
        courses: {
            title: 'My Courses',
            subtitle: 'Manage all your courses in one place.',
            addCourse: 'Add Course',
            noCourses: 'No courses added yet',
            addFirst: 'Start by adding your first course!',
            loading: 'Loading courses...',
            instructor: 'Instructor',
            credits: 'Credits'
        },
        // Notes
        notes: {
            title: 'My Archive',
            subtitle: 'Keep all your files organized.',
            uploadNote: 'Upload New File',
            selectCourse: 'Select Course',
            allCourses: 'All Courses',
            noNotes: 'No files yet',
            noNotesDesc: 'Start by adding your first file!',
            loading: 'Loading files...',
            searchPlaceholder: 'Search in archive...',
            titleLabel: 'Title',
            descriptionLabel: 'Description',
            tagsLabel: 'Tags (comma separated)',
            tagsPlaceholder: 'e.g. Midterm, Chapter 3',
            courseLabel: 'Course',
            selectCoursePlaceholder: 'Select a course...',
            createNewCourse: 'Create New Course',
            filesLabel: 'Files',
            addFiles: 'Add Files',
            maxFiles: 'You can upload a maximum of 5 files',
            supportedFormats: 'Supported formats: PDF, DOCX, PPTX, TXT, XLSX',
            publicNote: 'Public',
            privateNote: 'Private',
            saveNote: 'Save Note',
            saving: 'Saving...',
            backToNotes: 'Back to Archive',
            uploadSuccess: 'Note created successfully!',
            uploadError: 'Error creating note',
            createNoteTitle: 'Create New Note',
            courseName: 'Course Name',
            courseCode: 'Course Code',
            instructor: 'Instructor',
            credits: 'Credits',
            createCourse: 'Create Course',
            publicWarning: 'Share Publicly Confirmation',
            publicWarningMessage: 'You are about to share this note publicly. The note will also be automatically posted to the forum and visible to all students. Do you want to continue?',
            sharePublic: 'Yes, Share'
        },
        // Courses
        courses: {
            title: 'My Courses',
            subtitle: 'Manage all your courses and notes.',
            addCourse: 'Add New Course',
            loading: 'Loading courses...',
            noCourses: 'No courses yet',
            addFirst: 'Start by adding your first course!',
            nameCodeRequired: 'Course name and code are required',
            addError: 'Error adding course',
            credits: 'Credits'
        },
        // Auth
        auth: {
            loginTitle: 'Login',
            registerTitle: 'Sign Up',
            email: 'Email',
            password: 'Password',
            name: 'Full Name',
            username: 'Username',
            university: 'University',
            department: 'Department',
            login: 'Login',
            register: 'Sign Up',
            noAccount: "Don't have an account?",
            hasAccount: 'Already have an account?',
            registerLink: 'Sign up',
            loginLink: 'Login'
        },
        // Common
        common: {
            loading: 'Loading...',
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            close: 'Close',
            search: 'Search...',
            unknown: 'Unknown'
        }
    }
};

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('tr');

    useEffect(() => {
        // Load language from localStorage
        const savedLanguage = localStorage.getItem('language');
        if (savedLanguage && (savedLanguage === 'tr' || savedLanguage === 'en')) {
            setLanguage(savedLanguage);
        }
    }, []);

    const toggleLanguage = () => {
        const newLanguage = language === 'tr' ? 'en' : 'tr';
        setLanguage(newLanguage);
        localStorage.setItem('language', newLanguage);
    };

    const t = translations[language];

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
