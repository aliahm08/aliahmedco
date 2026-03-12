import InterviewAli from './components/InterviewAli';
import {profile} from './content/profile';

export default function App() {
  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="wordmark" href="#top">
          {profile.name}
        </a>
        <nav className="topnav" aria-label="Primary">
          <a href="#about">About</a>
          <a href="#experience">Experience</a>
          <a href="#interview">Interview Ali</a>
          <a href={`mailto:${profile.contact.email}`}>Contact</a>
        </nav>
      </header>

      <main className="page" id="top">
        <section className="hero">
          <p className="eyebrow">Personal site template</p>
          <h1>{profile.headline}</h1>
          <p className="lede">{profile.intro}</p>
          <div className="meta-row">
            <span>{profile.location}</span>
            <a href={profile.contact.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
            <a href={`mailto:${profile.contact.email}`}>Email</a>
          </div>
        </section>

        <section id="about" className="panel">
          <div className="section-heading">
            <p className="eyebrow">About</p>
            <h2>Readable in minutes, built to answer the obvious questions fast.</h2>
          </div>
          <div className="two-column">
            <div>
              {profile.summary.map((paragraph) => (
                <p key={paragraph} className="body-copy">
                  {paragraph}
                </p>
              ))}
            </div>
            <ul className="plain-list">
              {profile.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <p className="eyebrow">Focus</p>
            <h2>The short list of what Ali is actually useful for.</h2>
          </div>
          <div className="tag-grid">
            {profile.focusAreas.map((item) => (
              <div key={item} className="tag-card">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section id="experience" className="panel">
          <div className="section-heading">
            <p className="eyebrow">Experience</p>
            <h2>Use this section to mirror the strongest parts of the LinkedIn profile.</h2>
          </div>
          <div className="experience-list">
            {profile.experience.map((item) => (
              <article key={`${item.role}-${item.company}`} className="experience-item">
                <div className="experience-header">
                  <h3>
                    {item.role}
                    <span>{item.company}</span>
                  </h3>
                  <p>{item.period}</p>
                </div>
                <p className="body-copy">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <p className="eyebrow">Proof</p>
            <h2>Give visitors enough confidence to continue the conversation.</h2>
          </div>
          <div className="proof-grid">
            {profile.proofPoints.map((item) => (
              <article key={item.label} className="proof-card">
                <p className="proof-label">{item.label}</p>
                <p>{item.value}</p>
              </article>
            ))}
          </div>
        </section>

        <InterviewAli />

        <section className="footer-panel">
          <p>
            Replace the placeholder role summaries in `src/content/profile.ts` with your actual
            LinkedIn content and the whole site updates from one file.
          </p>
        </section>
      </main>
    </div>
  );
}
