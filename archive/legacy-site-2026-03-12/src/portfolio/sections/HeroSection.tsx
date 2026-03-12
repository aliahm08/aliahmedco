import type { FC } from 'react';
import Reveal from '../components/Reveal';
import SectionShell from '../components/SectionShell';
import type { Metric } from '../types';

interface HeroSectionProps {
  metrics: Metric[];
}

const HeroSection: FC<HeroSectionProps> = ({ metrics }) => (
  <SectionShell id="home" className="aa-section--hero">
    <div className="aa-hero-grid">
      <Reveal className="aa-hero-copy">
        <p className="aa-kicker">Software Engineer</p>
        <h1>
          Building systems that scale and products that matter.
        </h1>
        <p className="aa-hero-subtitle">
          I'm Ali Ahmed, a full-stack engineer focused on clean architecture, minimal abstractions, and crafting reliable software for businesses and users.
        </p>
      </Reveal>
    </div>

    <div className="aa-metrics-grid" role="list" aria-label="Professional highlights">
      {metrics.map((metric, index) => (
        <Reveal key={metric.label} delayMs={index * 80}>
          <article className="aa-metric-card" role="listitem">
            <p>{metric.label}</p>
            <h3>{metric.value}</h3>
            <span>{metric.note}</span>
          </article>
        </Reveal>
      ))}
    </div>
  </SectionShell>
);

export default HeroSection;
