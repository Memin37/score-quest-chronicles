import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Palette, Eye } from 'lucide-react';
import { useTheme, presets, ThemeColors } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

// Convert HSL string "H S% L%" to hex for input[type=color]
function hslStringToHex(hsl: string): string {
  const parts = hsl.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return '#00ff88';
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Convert hex to HSL string
function hexToHslString(hex: string): string {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const PREVIEW_SECTIONS: { key: keyof ThemeColors; area: string }[] = [
  { key: 'background', area: 'Sayfa arkaplanı' },
  { key: 'foreground', area: 'Ana metin rengi' },
  { key: 'card', area: 'Kart arkaplanları' },
  { key: 'primary', area: 'Butonlar, başlıklar, neon efektler' },
  { key: 'secondary', area: 'İkincil butonlar, rozetler' },
  { key: 'muted', area: 'Devre dışı alanlar, giriş kutuları' },
  { key: 'accent', area: 'Vurgu ikonları, ödüller' },
  { key: 'destructive', area: 'Hata mesajları, silme butonu' },
  { key: 'border', area: 'Kenarlıklar, ayraçlar' },
];

const SettingsPage = () => {
  const navigate = useNavigate();
  const { currentPresetId, colors, setPreset, setCustomColor, isCustom, labels } = useTheme();
  const [showPreview, setShowPreview] = useState(true);
  const { t } = useLanguage();

  const colorKeys = Object.keys(labels) as (keyof ThemeColors)[];

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display text-sm text-primary neon-text">{t('settingsTitle')}</h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {/* Preset Palettes */}
        <section className="bg-card border border-border rounded-lg p-6 neon-box">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xs text-foreground uppercase">{t('colorPalettes')}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {presets.map(preset => {
              const active = currentPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setPreset(preset.id)}
                  className={`relative rounded-lg border-2 p-3 transition-all text-left ${
                    active ? 'border-primary neon-box' : 'border-border hover:border-primary/40'
                  }`}
                >
                  {active && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <span className="text-2xl">{preset.icon}</span>
                  <p className="text-xs font-semibold text-foreground mt-2">{preset.name}</p>
                  <div className="flex gap-1 mt-2">
                    {['primary', 'secondary', 'accent', 'background'].map(c => (
                      <div
                        key={c}
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: `hsl(${preset.colors[c as keyof ThemeColors]})` }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
            {/* Custom slot */}
            <button
              onClick={() => {/* already in custom if changing colors */}}
              className={`relative rounded-lg border-2 p-3 transition-all text-left ${
                isCustom ? 'border-primary neon-box' : 'border-border border-dashed hover:border-primary/40'
              }`}
            >
              {isCustom && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
              <span className="text-2xl">🎨</span>
              <p className="text-xs font-semibold text-foreground mt-2">{t('customColor')}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{t('editBelow')}</p>
            </button>
          </div>
        </section>

        {/* Custom Color Picker */}
        <section className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xs text-foreground uppercase">{t('colorEditor')}</h2>
            <button
              onClick={() => setShowPreview(v => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? t('hidePreview') : t('showPreview')}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {colorKeys.map(key => (
              <div key={key} className="flex items-center gap-3 bg-muted/50 rounded-md px-3 py-2">
                <input
                  type="color"
                  value={hslStringToHex(colors[key])}
                  onChange={e => setCustomColor(key, hexToHslString(e.target.value))}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{t(`area${key.charAt(0).toUpperCase() + key.slice(1)}`)}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">
                    hsl({colors[key]})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live Preview */}
        {showPreview && (
          <section className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-display text-xs text-foreground mb-4 uppercase">{t('previewTitle')}</h2>
            {/* Mini preview of the theme */}
            <div
              className="rounded-lg border overflow-hidden"
              style={{ backgroundColor: `hsl(${colors.background})`, borderColor: `hsl(${colors.border})` }}
            >
              {/* Header preview */}
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ backgroundColor: `hsl(${colors.card})`, borderBottom: `1px solid hsl(${colors.border})` }}
              >
                <span className="font-display text-xs uppercase" style={{ color: `hsl(${colors.primary})` }}>{t('previewHeader')}</span>
                <span className="text-xs" style={{ color: `hsl(${colors.foreground})` }}>{t('previewUser')}</span>
              </div>
              {/* Body */}
              <div className="p-4 space-y-3">
                <p className="text-sm font-bold" style={{ color: `hsl(${colors.foreground})` }}>{t('previewTitleText')}</p>
                <p className="text-xs" style={{ color: `hsl(${colors.mutedForeground})` }}>{t('previewDesc')}</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    className="px-3 py-1.5 rounded-md text-xs font-semibold"
                    style={{ backgroundColor: `hsl(${colors.primary})`, color: `hsl(${colors.primaryForeground})` }}
                  >
                    {t('previewBtnMain')}
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-md text-xs font-semibold"
                    style={{ backgroundColor: `hsl(${colors.secondary})`, color: `hsl(${colors.secondaryForeground})` }}
                  >
                    {t('previewBtnSec')}
                  </button>
                  <span
                    className="px-2 py-1 rounded text-[10px] font-bold"
                    style={{ backgroundColor: `hsl(${colors.accent})`, color: `hsl(${colors.accentForeground})` }}
                  >
                    {t('previewAccent')}
                  </span>
                  <span
                    className="px-2 py-1 rounded text-[10px] font-bold"
                    style={{ backgroundColor: `hsl(${colors.destructive})`, color: '#fff' }}
                  >
                    {t('previewDanger')}
                  </span>
                </div>
                {/* Card preview */}
                <div
                  className="rounded-md p-3"
                  style={{ backgroundColor: `hsl(${colors.card})`, border: `1px solid hsl(${colors.border})` }}
                >
                  <p className="text-xs font-semibold" style={{ color: `hsl(${colors.cardForeground})` }}>{t('previewCard')}</p>
                  <p className="text-[10px] mt-1" style={{ color: `hsl(${colors.mutedForeground})` }}>{t('previewCardDesc')}</p>
                </div>
                {/* Input preview */}
                <div
                  className="rounded-md px-3 py-2 text-xs"
                  style={{
                    backgroundColor: `hsl(${colors.muted})`,
                    border: `1px solid hsl(${colors.border})`,
                    color: `hsl(${colors.mutedForeground})`,
                  }}
                >
                  {t('previewInput')}
                </div>
              </div>
            </div>

            {/* Color mapping legend */}
            <div className="mt-4 space-y-1.5">
              <p className="text-[10px] font-display text-muted-foreground mb-2 uppercase">{t('colorMap')}</p>
              {PREVIEW_SECTIONS.map(({ key }) => (
                <div key={key} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full border border-border flex-shrink-0"
                    style={{ backgroundColor: `hsl(${colors[key]})` }}
                  />
                  <span className="text-[11px] text-foreground font-semibold opacity-70">{key}:</span>
                  <span className="text-[10px] text-muted-foreground">{t(`area${key.charAt(0).toUpperCase() + key.slice(1)}`)}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
