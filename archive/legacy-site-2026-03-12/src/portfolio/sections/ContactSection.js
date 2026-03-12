import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Globe, Send, User } from 'lucide-react';
import { useState } from 'react';
import Reveal from '../components/Reveal';
import SectionHeading from '../components/SectionHeading';
import SectionShell from '../components/SectionShell';
const ContactSection = () => {
    const [submitted, setSubmitted] = useState(false);
    const handleSubmit = (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        if (String(formData.get('company_website') || '').trim()) {
            return;
        }
        setSubmitted(true);
    };
    return (_jsx(SectionShell, { id: "contact", className: "aa-section--contact", children: _jsxs("div", { className: "aa-contact-grid", children: [_jsxs(Reveal, { children: [_jsx(SectionHeading, { eyebrow: "Contact", title: "Let's build something.", subtitle: "Available for roles bridging engineering, design, and product." }), _jsxs("div", { className: "aa-contact-list", "aria-label": "Availability and positioning", children: [_jsxs("p", { children: [_jsx(User, { size: 15 }), " Ali Ahmed \u2022 Software Engineer"] }), _jsxs("p", { children: [_jsx(Globe, { size: 15 }), " U.S.-based"] })] })] }), _jsx(Reveal, { delayMs: 120, children: _jsx("div", { className: "aa-card aa-card--contact-form", children: _jsxs("form", { onSubmit: handleSubmit, noValidate: true, children: [_jsx("input", { className: "aa-honeypot", type: "text", name: "company_website", tabIndex: -1, autoComplete: "off", "aria-hidden": "true" }), _jsx("label", { htmlFor: "contact-name", children: "Name" }), _jsx("input", { id: "contact-name", name: "name", type: "text", autoComplete: "name", required: true, maxLength: 120 }), _jsx("label", { htmlFor: "contact-email", children: "Work Email" }), _jsx("input", { id: "contact-email", name: "email", type: "email", autoComplete: "email", autoCapitalize: "none", spellCheck: false, inputMode: "email", required: true, maxLength: 254 }), _jsx("label", { htmlFor: "contact-org", children: "Organization" }), _jsx("input", { id: "contact-org", name: "organization", type: "text", autoComplete: "organization", required: true, maxLength: 160 }), _jsx("label", { htmlFor: "contact-audience", children: "Primary Audience" }), _jsxs("select", { id: "contact-audience", name: "audience", defaultValue: "", required: true, children: [_jsx("option", { value: "", disabled: true, children: "Select one" }), _jsx("option", { value: "business", children: "Business / Enterprise" }), _jsx("option", { value: "federal", children: "Federal / Public Sector" }), _jsx("option", { value: "investor", children: "Investor / Diligence" }), _jsx("option", { value: "other", children: "Other" })] }), _jsx("label", { htmlFor: "contact-message", children: "What are you trying to build or improve?" }), _jsx("textarea", { id: "contact-message", name: "message", rows: 5, required: true, maxLength: 2400 }), _jsxs("button", { type: "submit", className: "aa-btn aa-btn--primary aa-form-submit", children: ["Send Inquiry ", _jsx(Send, { size: 14 })] }), _jsx("p", { className: `aa-form-note ${submitted ? 'is-visible' : ''}`, role: "status", "aria-live": "polite", children: "Thanks. I will follow up with you shortly." })] }) }) })] }) }));
};
export default ContactSection;
