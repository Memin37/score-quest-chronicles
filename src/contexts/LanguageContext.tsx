import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'tr' | 'en';

interface Translations {
  [key: string]: {
    [key: string]: string | Translations;
  };
}

const translations: Translations = {
  tr: {
    // Common
    arena: 'ARENA',
    loading: 'Yükleniyor...',
    guest: 'Misafir',
    settings: 'Ayarlar',
    logout: 'Çıkış',
    saveScoreToLogin: 'Skorunuzu kaydetmek için giriş yapın →',
    easy: 'Kolay',
    medium: 'Orta',
    hard: 'Zor',
    playAgain: 'Tekrar Oyna',
    newGame: 'Yeni Oyun',
    start: 'BAŞLA',
    time: 'Süre',
    totalTime: 'Toplam Süre',
    moves: 'Hamle',
    mistakes: 'hata',
    pieces: 'Parça',
    congrats: 'TEBRİKLER! 🎉',
    changeDifficulty: 'Zorluk Değiştir',
    weekly: 'Haftalık',
    bestTime: 'En İyi Süre',
    scoreSaved: '✓ Skorun kaydedildi!',
    guestLoginToSave: 'Giriş Yap & Kaydet',
    guestWarning: 'Skorunu kaydetmek için giriş yap!',
    teleportHint: 'Parlayan noktalara tıklayarak ışınlan',
    blockHint: 'PARÇALAR — Tıkla veya sürükle',
    close: 'Kapat',

    // Index Page
    games: 'OYUNLAR',
    indexSubtitle: 'Her hafta sıfırlanan skor tablosu ile yarış!',
    moreGamesSoon: 'DAHA FAZLA OYUN YAKINDA...',
    gameSudoku: 'Sudoku',
    gameSudokuDesc: 'Klasik sayı bulmacası. En hızlı süreyi yakala!',
    gameMemory: 'Hafıza Kartları',
    gameMemoryDesc: 'Eşleşen kartları bul, süreye karşı yarış!',
    gameBlock: 'Blok Bulmaca',
    gameBlockDesc: 'Tetris parçalarını sürükleyip alanı tamamen doldur!',
    gameMaze: 'Labirent',
    gameMazeDesc: 'Ok tuşları veya WASD ile labirentten çık!',

    // Leaderboard
    leaderboardTitle: 'SKOR TABLOSU',
    leaderboardDifficulty: 'Zorluk',
    leaderboardEmpty: 'Henüz skor kaydedilmedi.\nİlk giren sen ol!',
    leaderboardGuestDesc: 'Misafirler skor tablosuna katılamaz.',

    // Maze Specific
    mazeCompleted: 'Labirentti tamamladın!',
    penalty: 'ceza',
    perfect: '✨ Mükemmel! Hiç hata yapmadınız!',

    // Profile
    myAccount: 'HESABIM',
    save: 'Kaydet',
    saved: 'Kaydedildi ✓',
    logoutBtn: 'Çıkış Yap',

    // Settings
    settingsTitle: 'AYARLAR',
    colorPalettes: 'RENK PALETLERİ',
    customColor: 'Özel',
    editBelow: 'Aşağıdan düzenle',
    colorEditor: 'RENK DÜZENLEYİCİ',
    hidePreview: 'Önizlemeyi Gizle',
    showPreview: 'Önizlemeyi Göster',
    previewTitle: 'ÖNİZLEME',
    previewHeader: 'ARENA',
    previewUser: 'Kullanıcı',
    previewTitleText: 'Başlık Metni',
    previewDesc: 'Açıklama metni burada görünür',
    previewBtnMain: 'Ana Buton',
    previewBtnSec: 'İkincil',
    previewAccent: 'Vurgu',
    previewDanger: 'Tehlike',
    previewCard: 'Kart Örneği',
    previewCardDesc: 'Kart içeriği buraya gelir',
    previewInput: 'Giriş kutusu örneği...',
    colorMap: 'RENK HARİTASI',

    areaBg: 'Sayfa arkaplanı',
    areaFg: 'Ana metin rengi',
    areaCard: 'Kart arkaplanları',
    areaPrimary: 'Butonlar, başlıklar, neon efektler',
    areaSecondary: 'İkincil butonlar, rozetler',
    areaMuted: 'Devre dışı alanlar, giriş kutuları',
    areaAccent: 'Vurgu ikonları, ödüller',
    areaDestructive: 'Hata mesajları, silme butonu',
    areaBorder: 'Kenarlıklar, ayraçlar',

    // Leaderboard
    thisWeek: 'Bu Hafta',
    allTime: 'Tüm Zamanlar',
    noScores: 'Henüz skor yok',
    loginToSaveScore: 'Skor kaydetmek için giriş yap',

    // Auth
    authWelcome: 'Arena\'ya Hoş Geldin',
    authDesc: 'Skorlarını kaydetmek ve yarışmak için giriş yap.',
    authGuestBtn: 'Misafir Olarak Devam Et',
    authSubtitle: 'Haftalık Oyun Platformu',
    loginGoogle: 'Google ile Giriş Yap',
    or: 'veya',
    loginText: 'Giriş Yap',
    registerText: 'Kayıt Ol',
    fillAllFields: 'Tüm alanları doldurun',
    nameField: 'Ad',
    namePlaceholder: 'Adınız',
    emailField: 'E-posta',
    passwordField: 'Şifre',
    profileProfile: 'Profil',
    profilePlayed: 'Oynanan Oyun',
    profileBest: 'En İyi Süre',
    settingsTheme: 'Tema Seçimi',
    settingsLight: 'Aydınlık',
    settingsDark: 'Karanlık',
    settingsSystem: 'Sistem',
  },
  en: {
    // Common
    arena: 'ARENA',
    loading: 'Loading...',
    guest: 'Guest',
    settings: 'Settings',
    logout: 'Logout',
    saveScoreToLogin: 'Login to save your score →',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    playAgain: 'Play Again',
    newGame: 'New Game',
    start: 'START',
    time: 'Time',
    totalTime: 'Total Time',
    moves: 'Moves',
    mistakes: 'mistakes',
    pieces: 'Pieces',
    congrats: 'CONGRATS! 🎉',
    changeDifficulty: 'Change Difficulty',
    weekly: 'Weekly',
    bestTime: 'Best Time',
    scoreSaved: '✓ Score saved!',
    guestLoginToSave: 'Login & Save',
    guestWarning: 'Login to save your score!',
    teleportHint: 'Click glowing spots to teleport',
    blockHint: 'PIECES — Click or drag',
    close: 'Close',

    // Index Page
    games: 'GAMES',
    indexSubtitle: 'Compete on weekly resetting leaderboards!',
    moreGamesSoon: 'MORE GAMES SOON...',
    gameSudoku: 'Sudoku',
    gameSudokuDesc: 'Classic number puzzle. Get the fastest time!',
    gameMemory: 'Memory Cards',
    gameMemoryDesc: 'Find matching cards, race against time!',
    gameBlock: 'Block Puzzle',
    gameBlockDesc: 'Drag Tetris pieces to completely fill the area!',
    gameMaze: 'Maze',
    gameMazeDesc: 'Escape the maze using arrow keys or WASD!',

    // Leaderboard
    leaderboardTitle: 'LEADERBOARD',
    leaderboardDifficulty: 'Difficulty',
    leaderboardEmpty: 'No scores yet.\nBe the first!',
    leaderboardGuestDesc: 'Guests cannot participate in leaderboards.',

    // Maze Specific
    mazeCompleted: 'You completed the maze!',
    penalty: 'penalty',
    perfect: '✨ Perfect! No mistakes!',

    // Profile
    myAccount: 'MY ACCOUNT',
    save: 'Save',
    saved: 'Saved ✓',
    logoutBtn: 'Log Out',

    // Settings
    settingsTitle: 'SETTINGS',
    colorPalettes: 'COLOR PALETTES',
    customColor: 'Custom',
    editBelow: 'Edit below',
    colorEditor: 'COLOR EDITOR',
    hidePreview: 'Hide Preview',
    showPreview: 'Show Preview',
    previewTitle: 'PREVIEW',
    previewHeader: 'ARENA',
    previewUser: 'User',
    previewTitleText: 'Heading Text',
    previewDesc: 'Description text appears here',
    previewBtnMain: 'Main Button',
    previewBtnSec: 'Secondary',
    previewAccent: 'Accent',
    previewDanger: 'Danger',
    previewCard: 'Card Example',
    previewCardDesc: 'Card content goes here',
    previewInput: 'Input field example...',
    colorMap: 'COLOR MAP',

    areaBg: 'Page background',
    areaFg: 'Main text color',
    areaCard: 'Card backgrounds',
    areaPrimary: 'Buttons, headings, neon effects',
    areaSecondary: 'Secondary buttons, badges',
    areaMuted: 'Disabled areas, inputs',
    areaAccent: 'Accent icons, awards',
    areaDestructive: 'Error messages, delete buttons',
    areaBorder: 'Borders, dividers',

    // Leaderboard
    thisWeek: 'This Week',
    allTime: 'All Time',
    noScores: 'No scores yet',
    loginToSaveScore: 'Login to save your score',

    // Auth
    authWelcome: 'Welcome to Arena',
    authDesc: 'Login to save your scores and compete.',
    authGuestBtn: 'Continue as Guest',
    authSubtitle: 'Weekly Gaming Platform',
    loginGoogle: 'Sign in with Google',
    or: 'or',
    loginText: 'Login',
    registerText: 'Register',
    fillAllFields: 'Fill in all fields',
    nameField: 'Name',
    namePlaceholder: 'Your Name',
    emailField: 'Email',
    passwordField: 'Password',
    profileProfile: 'Profile',
    profilePlayed: 'Games Played',
    profileBest: 'Best Time',
    settingsTheme: 'Theme Selection',
    settingsLight: 'Light',
    settingsDark: 'Dark',
    settingsSystem: 'System',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('arena_lang');
    if (saved === 'en' || saved === 'tr') return saved;
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'tr' ? 'tr' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('arena_lang', language);
  }, [language]);

  const t = (key: string): string => {
    return (translations[language][key] as string) || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
