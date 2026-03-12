import { useEffect, useState } from 'react';
import type { SectionId } from '../types';

const useActiveSection = (sectionIds: SectionId[]) => {
  const [activeSection, setActiveSection] = useState<SectionId>(sectionIds[0]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setActiveSection(sectionIds[0]);
      return;
    }

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (!elements.length) return;

    let bestRatioById: Partial<Record<SectionId, number>> = {};

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute('id') as SectionId | null;
          if (!id) continue;
          bestRatioById[id] = entry.isIntersecting ? entry.intersectionRatio : 0;
        }

        let next = sectionIds[0];
        let maxRatio = -1;

        for (const id of sectionIds) {
          const ratio = bestRatioById[id] ?? 0;
          if (ratio > maxRatio) {
            maxRatio = ratio;
            next = id;
          }
        }

        if (maxRatio >= 0) {
          setActiveSection((previous) => (previous === next ? previous : next));
        }
      },
      {
        rootMargin: '-38% 0px -45% 0px',
        threshold: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1]
      }
    );

    for (const element of elements) observer.observe(element);

    return () => {
      observer.disconnect();
      bestRatioById = {};
    };
  }, [sectionIds]);

  return activeSection;
};

export default useActiveSection;
