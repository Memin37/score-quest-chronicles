import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  const flagUrl = (lang: string) => {
    const map: Record<string, string> = {
      tr: 'tr', en: 'gb', de: 'de', es: 'es', zh: 'cn', ja: 'jp', it: 'it', fr: 'fr'
    };
    return `https://flagcdn.com/w20/${map[lang]}.png`;
  };

  const highResFlagUrl = (lang: string) => {
    const map: Record<string, string> = {
      tr: 'tr', en: 'gb', de: 'de', es: 'es', zh: 'cn', ja: 'jp', it: 'it', fr: 'fr'
    };
    return `https://flagcdn.com/w40/${map[lang]}.png 2x`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-2 py-1.5 md:px-3 bg-muted border border-border rounded-md text-sm hover:bg-muted/80 transition-all focus:outline-none">
          <img src={flagUrl(language)} srcSet={highResFlagUrl(language)} alt={language.toUpperCase()} className="w-5 rounded-[2px]" />
          <span className="hidden sm:inline font-medium uppercase text-xs">{language}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-border min-w-[120px] max-h-64 overflow-y-auto">
        {[
          { code: 'tr', name: 'Türkçe' },
          { code: 'en', name: 'English' },
          { code: 'de', name: 'Deutsch' },
          { code: 'es', name: 'Español' },
          { code: 'fr', name: 'Français' },
          { code: 'it', name: 'Italiano' },
          { code: 'ja', name: '日本語' },
          { code: 'zh', name: '中文' },
        ].map((item) => (
          <DropdownMenuItem 
            key={item.code}
            className={`cursor-pointer gap-3 py-2 ${language === item.code ? 'bg-primary/20 text-primary' : 'text-foreground focus:bg-muted'}`}
            onClick={() => setLanguage(item.code as any)}
          >
            <img src={flagUrl(item.code)} alt={item.code.toUpperCase()} className="w-5 rounded-[2px]" />
            <span className="font-medium">{item.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
