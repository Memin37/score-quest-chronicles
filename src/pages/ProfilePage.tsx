import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

const ProfilePage = () => {
  const { user, loading, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.name || '');
  const [saved, setSaved] = useState(false);

  if (loading) return <div className="min-h-screen bg-background grid-pattern flex items-center justify-center"><p className="text-muted-foreground">{t('loading')}</p></div>;
  if (!user || user.isAnonymous) { navigate('/auth'); return null; }

  const handleSave = async () => {
    if (name.trim()) {
      await updateProfile(name.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display text-sm text-primary neon-text">{t('myAccount')}</h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="bg-card border border-border rounded-lg p-6 neon-box space-y-6">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">{t('nameField')}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-muted border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-md font-semibold hover:opacity-90 transition-opacity neon-box"
          >
            <Save className="w-4 h-4" />
            {saved ? t('saved') : t('save')}
          </button>

          <button
            onClick={async () => { await logout(); navigate('/auth'); }}
            className="w-full py-2.5 rounded-md font-semibold text-destructive border border-destructive/30 hover:bg-destructive/10 transition-all"
          >
            {t('logoutBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
