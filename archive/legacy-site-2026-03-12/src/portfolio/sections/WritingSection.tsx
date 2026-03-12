import { ArrowRight } from 'lucide-react';
import type { FC } from 'react';
import Reveal from '../components/Reveal';
import SectionHeading from '../components/SectionHeading';
import SectionShell from '../components/SectionShell';
import type { WritingCard } from '../types';

interface WritingSectionProps {
    writings: WritingCard[];
}

const WritingSection: FC<WritingSectionProps> = ({ writings }) => (
    <SectionShell id="writing">
        <Reveal>
            <SectionHeading
                eyebrow="Writing"
                title="Notes & Essays"
                subtitle="Thoughts on engineering, design, and building products."
            />
        </Reveal>
        <div className="aa-card-grid aa-card-grid--stack">
            {writings.map((writing, index) => (
                <Reveal key={writing.title} delayMs={index * 90}>
                    <article className="aa-card aa-card--engagement">
                        <div className="aa-engagement-main">
                            <p className="aa-eyebrow">{writing.date}</p>
                            <h3>{writing.title}</h3>
                            <p>{writing.summary}</p>
                        </div>
                        {writing.link && (
                            <a href={writing.link} className="aa-btn aa-btn--ghost" style={{ alignSelf: 'center' }}>
                                Read Post <ArrowRight size={14} />
                            </a>
                        )}
                    </article>
                </Reveal>
            ))}
        </div>
    </SectionShell>
);

export default WritingSection;
