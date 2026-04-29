import { useEffect, useState } from 'react';
import { Bell, Globe, Moon, Save, Shield } from 'lucide-react';
import { settingsApi } from '../../lib/api';
import type { User, UserSettings } from '../../lib/types';

interface SettingsProps {
  user: User;
}

const emptySettings: UserSettings = {
  userId: '',
  language: 'en',
  theme: 'light',
  emailNotifications: true,
  pushNotifications: true,
  activityNotifications: true,
  recommendationNotifications: true,
};

export function Settings({ user }: SettingsProps) {
  const [settings, setSettings] = useState<UserSettings>({ ...emptySettings, userId: user._id });
  const [saved, setSaved] = useState('');

  useEffect(() => {
    settingsApi.get(user._id).then(setSettings).catch(console.error);
  }, [user._id]);

  const save = async () => {
    const updated = await settingsApi.update(user._id, settings);
    setSettings(updated);
    setSaved('Changes saved to backend.');
    setTimeout(() => setSaved(''), 2500);
  };

  const toggle = (key: keyof UserSettings) => setSettings({ ...settings, [key]: !settings[key as keyof UserSettings] as any });

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-3xl mb-2 text-gray-900">Settings</h1><p className="text-muted-foreground">Preferences are now stored per user in MongoDB.</p></div>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-blue-100 rounded-lg"><Globe className="w-6 h-6 text-blue-600" /></div><div><h2 className="text-xl text-gray-900">Language & Region</h2><p className="text-sm text-muted-foreground">Set your preferred language</p></div></div>
        <select value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value as 'en' | 'fr' })} className="w-full md:w-64 px-4 py-2 border border-input rounded-lg"><option value="en">English</option><option value="fr">Français</option></select>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-purple-100 rounded-lg"><Moon className="w-6 h-6 text-purple-600" /></div><div><h2 className="text-xl text-gray-900">Appearance</h2><p className="text-sm text-muted-foreground">Customize how HRBrain looks</p></div></div>
        <div className="flex gap-4"><button onClick={() => { setSettings({ ...settings, theme: 'light' }); document.documentElement.classList.remove('dark'); localStorage.setItem('hrbrain_theme', 'light'); }} className={`px-6 py-3 border rounded-lg ${settings.theme === 'light' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-input'}`}>Light</button><button onClick={() => { setSettings({ ...settings, theme: 'dark' }); document.documentElement.classList.add('dark'); localStorage.setItem('hrbrain_theme', 'dark'); }} className={`px-6 py-3 border rounded-lg ${settings.theme === 'dark' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-input'}`}>Dark</button></div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-green-100 rounded-lg"><Bell className="w-6 h-6 text-green-600" /></div><div><h2 className="text-xl text-gray-900">Notifications</h2><p className="text-sm text-muted-foreground">Manage your notification preferences</p></div></div>
        <div className="space-y-4">{[
          ['emailNotifications', 'Email Notifications', 'Receive notifications via email'],
          ['pushNotifications', 'Push Notifications', 'Receive push notifications in browser'],
          ['activityNotifications', 'Activity Updates', 'Get notified about activity changes'],
          ['recommendationNotifications', 'Recommendation Alerts', 'Notifications for new recommendations'],
        ].map(([key, title, description]) => <div key={key} className="flex items-center justify-between p-4 border border-border rounded-lg"><div><p className="font-medium text-gray-900">{title}</p><p className="text-sm text-muted-foreground">{description}</p></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={Boolean(settings[key as keyof UserSettings])} onChange={() => toggle(key as keyof UserSettings)} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div></label></div>)}</div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-red-100 rounded-lg"><Shield className="w-6 h-6 text-red-600" /></div><div><h2 className="text-xl text-gray-900">Security & Privacy</h2><p className="text-sm text-muted-foreground">Stored settings, logout still works live.</p></div></div>
        <div className="space-y-4">
          <div className="w-full text-left p-4 border border-border rounded-lg"><p className="font-medium text-gray-900">Current account</p><p className="text-sm text-muted-foreground">{user.email} · {user.role}</p></div>
        </div>
      </div>
      {saved && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{saved}</div>}
      <div className="flex flex-col md:flex-row gap-4"><button onClick={save} className="flex items-center justify-center gap-2 flex-1 bg-primary text-white px-6 py-3 rounded-lg"><Save className="w-5 h-5" />Save Changes</button></div>
    </div>
  );
}
