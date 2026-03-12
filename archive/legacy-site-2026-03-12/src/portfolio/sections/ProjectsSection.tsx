import { ArrowRight } from 'lucide-react';
import type { FC } from 'react';
import Reveal from '../components/Reveal';
import SectionHeading from '../components/SectionHeading';
import SectionShell from '../components/SectionShell';
import type { ProjectCard } from '../types';

import React from 'react';
import useGithubRepos from '../hooks/useGithubRepos';

const ProjectsSection: FC = () => {
    const { projects, loading, error } = useGithubRepos('aliahm08');

    return (
        <SectionShell id="projects">
            <div className="aa-row-header">
                <Reveal>
                    <SectionHeading
                        eyebrow="Selected Projects"
                        title="Recent Work"
                        subtitle="Open source contributions, side projects, and major production systems."
                    />
                </Reveal>
                <Reveal delayMs={120}>
                    <a href="https://github.com/aliahm08" target="_blank" rel="noopener noreferrer" className="aa-btn aa-btn--ghost">
                        View GitHub <ArrowRight size={14} />
                    </a>
                </Reveal>
            </div>

            <div className="aa-card-grid aa-card-grid--stack">
                {loading && <p style={{ color: 'var(--aa-text-muted)', textAlign: 'center' }}>Loading repositories...</p>}
                {error && <p style={{ color: 'red', textAlign: 'center' }}>Error loading repositories: {error.message}</p>}
                {!loading && !error && projects.map((project, index) => (
                    <Reveal key={project.title} delayMs={index * 90}>
                        <article className="aa-card aa-card--engagement">
                            <div className="aa-engagement-main">
                                <p className="aa-eyebrow">{project.role}</p>
                                <h3>{project.title}</h3>
                                <h4>{project.outcome}</h4>
                                <p>{project.summary}</p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                                <div className="aa-tag-list" aria-label={`${project.title} technologies`}>
                                    {project.tags.map((tag) => (
                                        <span key={tag} className="aa-tag">{tag}</span>
                                    ))}
                                </div>
                                {project.link && (
                                    <a href={project.link} target="_blank" rel="noopener noreferrer" className="aa-btn aa-btn--ghost">
                                        Source Code <ArrowRight size={14} />
                                    </a>
                                )}
                            </div>
                        </article>
                    </Reveal>
                ))}
            </div>
        </SectionShell>
    );
};

export default ProjectsSection;
