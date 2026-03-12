import { useEffect, useState } from 'react';
const useScrollProgress = () => {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        let ticking = false;
        const update = () => {
            const doc = document.documentElement;
            const scrollable = Math.max(1, doc.scrollHeight - doc.clientHeight);
            setProgress(Math.min(1, Math.max(0, window.scrollY / scrollable)));
            ticking = false;
        };
        const onScroll = () => {
            if (ticking)
                return;
            ticking = true;
            window.requestAnimationFrame(update);
        };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);
    return progress;
};
export default useScrollProgress;
