import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone || !password || (!isLogin && !name)) {
      setError('Tüm alanları doldurun');
      return;
    }

    if (isLogin) {
      const success = login(phone, password);
      if (!success) {
        setError('Telefon veya şifre hatalı');
        return;
      }
    } else {
      const success = register(name, phone, password);
      if (!success) {
        setError('Bu telefon numarası zaten kayıtlı');
        return;
      }
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background grid-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="font-display text-2xl text-primary neon-text text-center mb-2">
          ARENA
        </h1>
        <p className="text-muted-foreground text-center mb-8 text-sm">
          Haftalık Oyun Platformu
        </p>

        <div className="bg-card border border-border rounded-lg p-6 neon-box">
          <div className="flex mb-6 gap-2">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                isLogin
                  ? 'bg-primary text-primary-foreground neon-box'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                !isLogin
                  ? 'bg-primary text-primary-foreground neon-box'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              Kayıt Ol
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Ad</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-muted border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Adınız"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Telefon</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="05XX XXX XX XX"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-destructive text-sm">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-semibold hover:opacity-90 transition-opacity neon-box"
            >
              {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
