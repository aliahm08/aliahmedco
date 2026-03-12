import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Reveal from '../components/Reveal';
import SectionHeading from '../components/SectionHeading';
import SectionShell from '../components/SectionShell';
const ExperienceSection = ({ experiences }) => (_jsxs(SectionShell, { id: "experience", children: [_jsx(Reveal, { children: _jsx(SectionHeading, { eyebrow: "Experience", title: "Professional History", subtitle: "A track record of shipping production software and leading engineering teams." }) }), _jsx("div", { className: "aa-card-grid aa-card-grid--stack", children: experiences.map((exp, index) => (_jsx(Reveal, { delayMs: index * 90, children: _jsxs("article", { className: "aa-card aa-card--engagement", children: [_jsxs("div", { className: "aa-engagement-main", children: [_jsx("p", { className: "aa-eyebrow", children: exp.period }), _jsx("h3", { children: exp.role }), _jsx("h4", { children: exp.company }), _jsx("p", { children: exp.summary })] }), _jsx("div", { className: "aa-card--service", children: _jsx("ul", { children: exp.bullets.map((bullet) => (_jsx("li", { children: bullet }, bullet))) }) })] }) }, exp.company))) })] }));
export default ExperienceSection;
