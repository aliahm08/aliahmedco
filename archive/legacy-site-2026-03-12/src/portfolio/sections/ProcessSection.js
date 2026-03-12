import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Reveal from '../components/Reveal';
import SectionHeading from '../components/SectionHeading';
import SectionShell from '../components/SectionShell';
const ProcessSection = ({ steps }) => (_jsxs(SectionShell, { id: "process", children: [_jsx(Reveal, { children: _jsx(SectionHeading, { eyebrow: "Process", title: "A delivery cadence designed for momentum and accountability.", subtitle: "We run structured engagements that balance speed with technical rigor, stakeholder communication, and operational handoff." }) }), _jsx("div", { className: "aa-process-grid", children: steps.map((step, index) => (_jsx(Reveal, { delayMs: index * 80, children: _jsxs("article", { className: "aa-card aa-card--process", children: [_jsxs("div", { className: "aa-process-head", children: [_jsx("span", { children: step.step }), _jsx("div", { className: "aa-card-icon", children: _jsx(step.icon, { size: 18 }) })] }), _jsx("h3", { children: step.title }), _jsx("p", { children: step.summary })] }) }, step.step))) })] }));
export default ProcessSection;
