import type { FC } from 'react';
import Reveal from '../components/Reveal';
import SectionHeading from '../components/SectionHeading';
import SectionShell from '../components/SectionShell';
import type { ExperienceCard } from '../types';

interface ExperienceSectionProps {
    experiences: ExperienceCard[];
}

const ExperienceSection: FC<ExperienceSectionProps> = ({ experiences }) => (
    <SectionShell id="experience">
        <Reveal>
            <SectionHeading
                eyebrow="Experience"
                title="Professional History"
                subtitle="A track record of shipping production software and leading engineering teams."
            />
        </Reveal>
        <div className="aa-card-grid aa-card-grid--stack">
            {experiences.map((exp, index) => (
                <Reveal key={exp.company} delayMs={index * 90}>
                    <article className="aa-card aa-card--engagement">
                        <div className="aa-engagement-main">
                            <p className="aa-eyebrow">{exp.period}</p>
                            <h3>{exp.role}</h3>
                            <h4>{exp.company}</h4>
                            <p>{exp.summary}</p>
                        </div>
                        <div className="aa-card--service">
                            <ul>
                                {exp.bullets.map((bullet) => (
                                    <li key={bullet}>{bullet}</li>
                                ))}
                            </ul>
                        </div>
                    </article>
                </Reveal>
            ))}
        </div>
    </SectionShell>
);

export default ExperienceSection;
