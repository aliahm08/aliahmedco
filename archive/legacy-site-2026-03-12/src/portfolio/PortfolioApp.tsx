import './styles.css';
import { useEffect, useMemo } from 'react';
import Footer from './components/Footer';
import TopNav from './components/TopNav';
import {
  experience,
  heroMetrics,
  navItems,
  writings
} from './data/siteContent';
import useActiveSection from './hooks/useActiveSection';
import usePrefersReducedMotion from './hooks/usePrefersReducedMotion';
import useScrollProgress from './hooks/useScrollProgress';

// New personal portfolio sections
import HeroSection from './sections/HeroSection';
import ExperienceSection from './sections/ExperienceSection';
import ProjectsSection from './sections/ProjectsSection';
import WritingSection from './sections/WritingSection';
import ContactSection from './sections/ContactSection';

import type { SectionId } from './types';

const PortfolioApp = () => {
  const sectionIds = useMemo(() => navItems.map((item) => item.id), []);
  const activeSection = useActiveSection(sectionIds);
  const reducedMotion = usePrefersReducedMotion();
  const scrollProgress = useScrollProgress();

  useEffect(() => {
    document.title = 'Ali Ahmed | Software Engineer';
  }, []);

  const scrollToSection = (id: SectionId) => {
    const target = document.getElementById(id);
    if (!target) return;

    target.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start'
    });
  };

  return (
    <div className="aa-portfolio">
      <div className="aa-bg aa-bg--one" aria-hidden="true" />
      <div className="aa-bg aa-bg--two" aria-hidden="true" />
      <TopNav activeSection={activeSection} items={navItems} progress={scrollProgress} onNavigate={scrollToSection} />
      <main className="aa-main aa-container">
        <HeroSection metrics={heroMetrics} />
        <ExperienceSection experiences={experience} />
        <ProjectsSection />
        <WritingSection writings={writings} />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default PortfolioApp;
