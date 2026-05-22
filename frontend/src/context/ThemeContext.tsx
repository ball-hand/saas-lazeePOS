import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface ThemeContextType {
  themeMode: 'light' | 'dark';
  primaryColor: string;
  logoUrl: string | null;
  storeName: string;
  updateTheme: (theme: Partial<{ themeMode: 'light' | 'dark', primaryColor: string, logoUrl: string | null, name: string }>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const [primaryColor, setPrimaryColor] = useState('#8B5CF6');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('Demo Store');

  useEffect(() => {
    if (user?.tenant) {
      setThemeMode(user.tenant.themeMode as 'light' | 'dark');
      setPrimaryColor(user.tenant.primaryColor);
      setLogoUrl(user.tenant.logoUrl || null);
      setStoreName(user.tenant.name);
    }
  }, [user]);

  useEffect(() => {
    // Apply theme mode
    document.documentElement.setAttribute('data-theme', themeMode);
    
    // Apply primary color dynamic variable
    // We create a transparent version of the primary color for backgrounds/hover states
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '139, 92, 246';
    };

    const rgb = hexToRgb(primaryColor);
    
    document.documentElement.style.setProperty('--accent-primary', primaryColor);
    document.documentElement.style.setProperty('--accent-primary-transparent', `rgba(${rgb}, 0.15)`);
    document.documentElement.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`);
    
  }, [themeMode, primaryColor]);

  const updateTheme = (updates: Partial<{ themeMode: 'light' | 'dark', primaryColor: string, logoUrl: string | null, name: string }>) => {
    if (updates.themeMode) setThemeMode(updates.themeMode);
    if (updates.primaryColor) setPrimaryColor(updates.primaryColor);
    if (updates.logoUrl !== undefined) setLogoUrl(updates.logoUrl);
    if (updates.name) setStoreName(updates.name);
  };

  return (
    <ThemeContext.Provider value={{ themeMode, primaryColor, logoUrl, storeName, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
