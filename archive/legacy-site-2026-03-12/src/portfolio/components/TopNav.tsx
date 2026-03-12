import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FC } from 'react';
import type { NavItem, SectionId } from '../types';

interface TopNavProps {
  activeSection: SectionId;
  items: NavItem[];
  progress: number;
  onNavigate: (id: SectionId) => void;
}

const TopNav: FC<TopNavProps> = ({ activeSection, items, onNavigate }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!isMobileOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMobileOpen]);

  const handleNavigate = (id: SectionId) => {
    onNavigate(id);
    setIsMobileOpen(false);
  };

  return (
    <header className="aa-nav-wrap">
      <nav className="aa-nav" aria-label="Primary">
        <button type="button" className="aa-nav-brand aa-nav-brand-btn" onClick={() => handleNavigate('home')}>
          <span className="aa-logo-dot" />
          <div>
            <strong>Ali Ahmed</strong>
          </div>
        </button>

        <div className="aa-nav-links">
          {items.filter(item => item.id !== 'home').map((item) => (
            <button
              key={item.id}
              type="button"
              className={`aa-nav-link ${activeSection === item.id ? 'is-active' : ''}`}
              onClick={() => handleNavigate(item.id)}
              aria-current={activeSection === item.id ? 'page' : undefined}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="aa-nav-actions">
          <button
            type="button"
            className="aa-nav-toggle"
            aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileOpen}
            onClick={() => setIsMobileOpen((value) => !value)}
          >
            {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      <div className={`aa-mobile-panel ${isMobileOpen ? 'is-open' : ''}`} aria-hidden={!isMobileOpen}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`aa-mobile-link ${activeSection === item.id ? 'is-active' : ''}`}
            onClick={() => handleNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};

export default TopNav;
