import { Clock, Globe, MapPin, Send, User } from 'lucide-react';
import { useState } from 'react';
import Reveal from '../components/Reveal';
import SectionHeading from '../components/SectionHeading';
import SectionShell from '../components/SectionShell';

const ContactSection = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: any) => {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);

    if (String(formData.get('company_website') || '').trim()) {
      return;
    }

    setSubmitted(true);
  };

  return (
    <SectionShell id="contact" className="aa-section--contact">
      <div className="aa-contact-grid">
        <Reveal>
          <SectionHeading
            eyebrow="Contact"
            title="Let's build something."
            subtitle="Available for roles bridging engineering, design, and product."
          />
          <div className="aa-contact-list" aria-label="Availability and positioning">
            <p><User size={15} /> Ali Ahmed • Software Engineer</p>
            <p><Globe size={15} /> U.S.-based</p>
          </div>
        </Reveal>

        <Reveal delayMs={120}>
          <div className="aa-card aa-card--contact-form">
            <form onSubmit={handleSubmit} noValidate>
              <input
                className="aa-honeypot"
                type="text"
                name="company_website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              <label htmlFor="contact-name">Name</label>
              <input id="contact-name" name="name" type="text" autoComplete="name" required maxLength={120} />

              <label htmlFor="contact-email">Work Email</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                inputMode="email"
                required
                maxLength={254}
              />

              <label htmlFor="contact-org">Organization</label>
              <input id="contact-org" name="organization" type="text" autoComplete="organization" required maxLength={160} />

              <label htmlFor="contact-audience">Primary Audience</label>
              <select id="contact-audience" name="audience" defaultValue="" required>
                <option value="" disabled>Select one</option>
                <option value="business">Business / Enterprise</option>
                <option value="federal">Federal / Public Sector</option>
                <option value="investor">Investor / Diligence</option>
                <option value="other">Other</option>
              </select>

              <label htmlFor="contact-message">What are you trying to build or improve?</label>
              <textarea id="contact-message" name="message" rows={5} required maxLength={2400} />

              <button type="submit" className="aa-btn aa-btn--primary aa-form-submit">
                Send Inquiry <Send size={14} />
              </button>

              <p className={`aa-form-note ${submitted ? 'is-visible' : ''}`} role="status" aria-live="polite">
                Thanks. I will follow up with you shortly.
              </p>
            </form>
          </div>
        </Reveal>
      </div>
    </SectionShell>
  );
};

export default ContactSection;
