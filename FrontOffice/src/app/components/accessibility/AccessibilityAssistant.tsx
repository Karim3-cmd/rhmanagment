import { useEffect, useMemo, useState } from 'react';
import {
  Accessibility,
  Check,
  Eye,
  Keyboard,
  MousePointer2,
  RotateCcw,
  Type,
  X,
  ZapOff,
} from 'lucide-react';

type AccessibilitySettings = {
  highContrast: boolean;
  largeText: boolean;
  dyslexiaFriendly: boolean;
  reducedMotion: boolean;
  bigCursor: boolean;
  readingGuide: boolean;
};

type AccessibilityKey = keyof AccessibilitySettings;

const STORAGE_KEY = 'hrbrain_accessibility_settings';

const DEFAULT_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  dyslexiaFriendly: false,
  reducedMotion: false,
  bigCursor: false,
  readingGuide: false,
};

const ACCESSIBILITY_CLASS_MAP: Record<AccessibilityKey, string> = {
  highContrast: 'a11y-high-contrast',
  largeText: 'a11y-large-text',
  dyslexiaFriendly: 'a11y-dyslexia-friendly',
  reducedMotion: 'a11y-reduced-motion',
  bigCursor: 'a11y-big-cursor',
  readingGuide: 'a11y-reading-guide-enabled',
};

const OPTIONS: Array<{
  key: AccessibilityKey;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    key: 'highContrast',
    title: 'High contrast',
    description: 'Strong black/white/yellow contrast for low vision.',
    icon: <Eye className="h-5 w-5" aria-hidden="true" />,
  },
  {
    key: 'largeText',
    title: 'Large text',
    description: 'Bigger readable text without zooming the browser.',
    icon: <Type className="h-5 w-5" aria-hidden="true" />,
  },
  {
    key: 'dyslexiaFriendly',
    title: 'Readable font',
    description: 'Cleaner spacing for dyslexia and reading fatigue.',
    icon: <Type className="h-5 w-5" aria-hidden="true" />,
  },
  {
    key: 'reducedMotion',
    title: 'Reduce motion',
    description: 'Kills heavy animation for vestibular comfort.',
    icon: <ZapOff className="h-5 w-5" aria-hidden="true" />,
  },
  {
    key: 'bigCursor',
    title: 'Large focus/cursor',
    description: 'Thicker focus outlines for keyboard and motor use.',
    icon: <MousePointer2 className="h-5 w-5" aria-hidden="true" />,
  },
  {
    key: 'readingGuide',
    title: 'Reading guide',
    description: 'A horizontal ruler follows the pointer while reading.',
    icon: <Keyboard className="h-5 w-5" aria-hidden="true" />,
  },
];

function loadSettings(): AccessibilitySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AccessibilitySettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function applySettings(settings: AccessibilitySettings) {
  const root = document.documentElement;
  (Object.keys(ACCESSIBILITY_CLASS_MAP) as AccessibilityKey[]).forEach((key) => {
    root.classList.toggle(ACCESSIBILITY_CLASS_MAP[key], settings[key]);
  });
  root.setAttribute(
    'data-accessibility-active',
    Object.values(settings).some(Boolean) ? 'true' : 'false'
  );
}

export function AccessibilityAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [guideTop, setGuideTop] = useState(0);
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    return loadSettings();
  });

  const activeCount = useMemo(
    () => Object.values(settings).filter(Boolean).length,
    [settings]
  );

  useEffect(() => {
    applySettings(settings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        setIsOpen((value) => !value);
      }
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!settings.readingGuide) return undefined;

    const handlePointerMove = (event: PointerEvent) => {
      setGuideTop(event.clientY);
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [settings.readingGuide]);

  const toggleSetting = (key: AccessibilityKey) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <>
      {settings.readingGuide && (
        <div
          className="a11y-reading-guide"
          style={{ top: `${guideTop}px` }}
          aria-hidden="true"
        />
      )}

      <section
        className={`a11y-panel ${isOpen ? 'a11y-panel-open' : ''}`}
        aria-label="Accessibility settings"
      >
        {isOpen && (
          <div className="a11y-panel-card" role="dialog" aria-modal="false" aria-labelledby="a11y-panel-title">
            <div className="a11y-panel-header">
              <div>
                <p className="a11y-eyebrow">Inclusive access</p>
                <h2 id="a11y-panel-title">Accessibility</h2>
              </div>
              <button
                type="button"
                className="a11y-icon-button"
                onClick={() => setIsOpen(false)}
                aria-label="Close accessibility panel"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <p className="a11y-panel-copy">
              Quick controls for people with visual, motor, cognitive, or motion sensitivity needs.
            </p>

            <div className="a11y-options" role="group" aria-label="Accessibility toggles">
              {OPTIONS.map((option) => {
                const enabled = settings[option.key];
                return (
                  <button
                    key={option.key}
                    type="button"
                    className={`a11y-option ${enabled ? 'a11y-option-active' : ''}`}
                    onClick={() => toggleSetting(option.key)}
                    aria-pressed={enabled}
                  >
                    <span className="a11y-option-icon">{option.icon}</span>
                    <span className="a11y-option-content">
                      <span className="a11y-option-title">{option.title}</span>
                      <span className="a11y-option-description">{option.description}</span>
                    </span>
                    <span className="a11y-check" aria-hidden="true">
                      {enabled && <Check className="h-4 w-4" />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="a11y-panel-footer">
              <p>
                Shortcut: <kbd>Alt</kbd> + <kbd>A</kbd>
              </p>
              <button type="button" className="a11y-reset-button" onClick={resetSettings}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          className="a11y-floating-button"
          onClick={() => setIsOpen((value) => !value)}
          aria-label={isOpen ? 'Close accessibility settings' : 'Open accessibility settings'}
          aria-expanded={isOpen}
        >
          <Accessibility className="h-6 w-6" aria-hidden="true" />
          {activeCount > 0 && <span className="a11y-active-count" aria-label={`${activeCount} accessibility options enabled`}>{activeCount}</span>}
        </button>
      </section>
    </>
  );
}
