import { jsx as _jsx } from "react/jsx-runtime";
const SectionShell = ({ id, children, className = '' }) => (_jsx("section", { id: id, className: `aa-section ${className}`.trim(), children: _jsx("div", { className: "aa-container", children: children }) }));
export default SectionShell;
