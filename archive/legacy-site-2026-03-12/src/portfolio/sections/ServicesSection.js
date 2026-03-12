import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Reveal from '../components/Reveal';
import SectionHeading from '../components/SectionHeading';
import SectionShell from '../components/SectionShell';
const ServicesSection = ({ services }) => (_jsxs(SectionShell, { id: "services", children: [_jsx(Reveal, { children: _jsx(SectionHeading, { eyebrow: "Services", title: "A focused consultancy model for AI execution.", subtitle: "We combine strategy, product design, and engineering delivery so AI initiatives do not stall between planning and deployment." }) }), _jsx("div", { className: "aa-card-grid aa-card-grid--three", children: services.map((service, index) => (_jsx(Reveal, { delayMs: index * 90, children: _jsxs("article", { className: `aa-card aa-card--service aa-accent-${service.accent}`, children: [_jsx("div", { className: "aa-card-icon", children: _jsx(service.icon, { size: 18 }) }), _jsx("h3", { children: service.title }), _jsx("p", { children: service.summary }), _jsx("ul", { children: service.bullets.map((bullet) => (_jsx("li", { children: bullet }, bullet))) })] }) }, service.title))) })] }));
export default ServicesSection;
