import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-2 py-1.5 md:px-3 bg-muted border border-border rounded-md text-sm hover:bg-muted/80 transition-all focus:outline-none">
          <span className="text-base">{language === 'tr' ? '🇹🇷' : '🇺🇸'}</span>
          <span className="hidden sm:inline font-medium uppercase">{language}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-border min-w-[120px]">
        <DropdownMenuItem 
          className={`cursor-pointer gap-2 ${language === 'tr' ? 'bg-primary/20 text-primary' : 'text-foreground focus:bg-muted'}`}
          onClick={() => setLanguage('tr')}
        >
          <span className="text-lg">🇹🇷</span>
          <span>Türkçe</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className={`cursor-pointer gap-2 ${language === 'en' ? 'bg-primary/20 text-primary' : 'text-foreground focus:bg-muted'}`}
          onClick={() => setLanguage('en')}
        >
          <span className="text-lg">🇺🇸</span>
          <span>English</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
