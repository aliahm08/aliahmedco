import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
const TopNav = ({ activeSection, items, onNavigate }) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    useEffect(() => {
        if (!isMobileOpen)
            return;
        const onKeyDown = (event) => {
            if (event.key === 'Escape')
                setIsMobileOpen(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isMobileOpen]);
    const handleNavigate = (id) => {
        onNavigate(id);
        setIsMobileOpen(false);
    };
    return (_jsxs("header", { className: "aa-nav-wrap", children: [_jsxs("nav", { className: "aa-nav", "aria-label": "Primary", children: [_jsxs("button", { type: "button", className: "aa-nav-brand aa-nav-brand-btn", onClick: () => handleNavigate('home'), children: [_jsx("span", { className: "aa-logo-dot" }), _jsx("div", { children: _jsx("strong", { children: "Ali Ahmed" }) })] }), _jsx("div", { className: "aa-nav-links", children: items.filter(item => item.id !== 'home').map((item) => (_jsx("button", { type: "button", className: `aa-nav-link ${activeSection === item.id ? 'is-active' : ''}`, onClick: () => handleNavigate(item.id), "aria-current": activeSection === item.id ? 'page' : undefined, children: item.label }, item.id))) }), _jsx("div", { className: "aa-nav-actions", children: _jsx("button", { type: "button", className: "aa-nav-toggle", "aria-label": isMobileOpen ? 'Close menu' : 'Open menu', "aria-expanded": isMobileOpen, onClick: () => setIsMobileOpen((value) => !value), children: isMobileOpen ? _jsx(X, { size: 18 }) : _jsx(Menu, { size: 18 }) }) })] }), _jsx("div", { className: `aa-mobile-panel ${isMobileOpen ? 'is-open' : ''}`, "aria-hidden": !isMobileOpen, children: items.map((item) => (_jsx("button", { type: "button", className: `aa-mobile-link ${activeSection === item.id ? 'is-active' : ''}`, onClick: () => handleNavigate(item.id), children: item.label }, item.id))) })] }));
};
export default TopNav;
