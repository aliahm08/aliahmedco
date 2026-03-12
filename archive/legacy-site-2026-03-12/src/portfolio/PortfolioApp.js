import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './styles.css';
import { useEffect, useMemo } from 'react';
import Footer from './components/Footer';
import TopNav from './components/TopNav';
import { experience, heroMetrics, navItems, writings } from './data/siteContent';
import useActiveSection from './hooks/useActiveSection';
import usePrefersReducedMotion from './hooks/usePrefersReducedMotion';
import useScrollProgress from './hooks/useScrollProgress';
// New personal portfolio sections
import HeroSection from './sections/HeroSection';
import ExperienceSection from './sections/ExperienceSection';
import ProjectsSection from './sections/ProjectsSection';
import WritingSection from './sections/WritingSection';
import ContactSection from './sections/ContactSection';
const PortfolioApp = () => {
    const sectionIds = useMemo(() => navItems.map((item) => item.id), []);
    const activeSection = useActiveSection(sectionIds);
    const reducedMotion = usePrefersReducedMotion();
    const scrollProgress = useScrollProgress();
    useEffect(() => {
        document.title = 'Ali Ahmed | Software Engineer';
    }, []);
    const scrollToSection = (id) => {
        const target = document.getElementById(id);
        if (!target)
            return;
        target.scrollIntoView({
            behavior: reducedMotion ? 'auto' : 'smooth',
            block: 'start'
        });
    };
    return (_jsxs("div", { className: "aa-portfolio", children: [_jsx("div", { className: "aa-bg aa-bg--one", "aria-hidden": "true" }), _jsx("div", { className: "aa-bg aa-bg--two", "aria-hidden": "true" }), _jsx(TopNav, { activeSection: activeSection, items: navItems, progress: scrollProgress, onNavigate: scrollToSection }), _jsxs("main", { className: "aa-main aa-container", children: [_jsx(HeroSection, { metrics: heroMetrics }), _jsx(ExperienceSection, { experiences: experience }), _jsx(ProjectsSection, {}), _jsx(WritingSection, { writings: writings }), _jsx(ContactSection, {})] }), _jsx(Footer, {})] }));
};
export default PortfolioApp;
