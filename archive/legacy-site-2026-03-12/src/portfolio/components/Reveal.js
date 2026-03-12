import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';
const Reveal = ({ children, delayMs = 0, className = '' }) => {
    const [visible, setVisible] = useState(false);
    const elementRef = useRef(null);
    const reducedMotion = usePrefersReducedMotion();
    useEffect(() => {
        const node = elementRef.current;
        if (!node)
            return;
        if (reducedMotion || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
            setVisible(true);
            return;
        }
        const observer = new IntersectionObserver((entries, obs) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    setVisible(true);
                    obs.unobserve(entry.target);
                }
            }
        }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
        observer.observe(node);
        return () => observer.disconnect();
    }, [reducedMotion]);
    return (_jsx("div", { ref: elementRef, className: `aa-reveal ${visible ? 'is-visible' : ''} ${className}`.trim(), style: delayMs ? { transitionDelay: `${delayMs}ms` } : undefined, children: children }));
};
export default Reveal;
