import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowRight } from 'lucide-react';
import Reveal from '../components/Reveal';
import SectionHeading from '../components/SectionHeading';
import SectionShell from '../components/SectionShell';
const WritingSection = ({ writings }) => (_jsxs(SectionShell, { id: "writing", children: [_jsx(Reveal, { children: _jsx(SectionHeading, { eyebrow: "Writing", title: "Notes & Essays", subtitle: "Thoughts on engineering, design, and building products." }) }), _jsx("div", { className: "aa-card-grid aa-card-grid--stack", children: writings.map((writing, index) => (_jsx(Reveal, { delayMs: index * 90, children: _jsxs("article", { className: "aa-card aa-card--engagement", children: [_jsxs("div", { className: "aa-engagement-main", children: [_jsx("p", { className: "aa-eyebrow", children: writing.date }), _jsx("h3", { children: writing.title }), _jsx("p", { children: writing.summary })] }), writing.link && (_jsxs("a", { href: writing.link, className: "aa-btn aa-btn--ghost", style: { alignSelf: 'center' }, children: ["Read Post ", _jsx(ArrowRight, { size: 14 })] }))] }) }, writing.title))) })] }));
export default WritingSection;
