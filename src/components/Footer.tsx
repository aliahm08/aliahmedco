import {ReactNode} from 'react';
import {profile} from '../content/profile';
import {AppRoute, navItems, site} from '../content/site';

function navigateTo(route: AppRoute) {
  window.history.pushState({}, '', route);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function InternalLink(props: {href: AppRoute; children: ReactNode; isCurrent?: boolean; key?: string}) {
  return (
    <a
      href={props.href}
      aria-current={props.isCurrent ? 'page' : undefined}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        event.preventDefault();
        navigateTo(props.href);
      }}
    >
      {props.children}
    </a>
  );
}

export default function Footer(props: {route: AppRoute | null}) {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" aria-label="Site footer">
      <div className="footer-background" aria-hidden="true">
        <span className="footer-background-lines" />
      </div>
      <div className="footer-inner">
        <div className="footer-grid">
          <section className="footer-intro">
            <p className="eyebrow">Contact</p>
            <a href={`mailto:${site.email}`} className="footer-contact-link">
              {site.email}
            </a>
            <p className="footer-location">DC and NYC</p>
          </section>

          <nav className="footer-column" aria-labelledby="footer-nav-heading">
            <p id="footer-nav-heading" className="eyebrow">
              Navigate
            </p>
            <div className="footer-link-list">
              <InternalLink href="/" isCurrent={props.route === '/'}>
                Home
              </InternalLink>
              {navItems.map((item) => (
                <InternalLink key={item.href} href={item.href} isCurrent={props.route === item.href}>
                  {item.label}
                </InternalLink>
              ))}
            </div>
          </nav>

          <section className="footer-column" aria-labelledby="footer-links-heading">
            <p id="footer-links-heading" className="eyebrow">
              Connect
            </p>
            <div className="footer-link-list">
              <a href={site.linkedinUrl} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
              <a href={site.githubUrl} target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a href={site.substackUrl} target="_blank" rel="noreferrer">
                Substack
              </a>
              <a href={profile.b2wUrl} target="_blank" rel="noreferrer">
                B2W-ai
              </a>
            </div>
          </section>
        </div>

        <div className="footer-meta">
          <p>© {year} Ali Ahmed Co.</p>
          <p>
            {props.route === '/' ? 'Portfolio, resume, and writing.' : (
              <InternalLink href="/">Back to home</InternalLink>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
