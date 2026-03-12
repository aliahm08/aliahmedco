import { useEffect, useState } from 'react';
import type { ProjectCard } from '../types';

interface GithubRepo {
    name: string;
    description: string;
    html_url: string;
    stargazers_count: number;
    language: string;
    topics: string[];
    fork: boolean;
    repo?: string; // from pinned api
    link?: string; // from pinned api
}

export default function useGithubRepos(username: string) {
    const [projects, setProjects] = useState<ProjectCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchRepos() {
            try {
                setLoading(true);
                let finalProjects: ProjectCard[] = [];

                // 1. Try to fetch pinned repositories first
                try {
                    const pinnedRes = await fetch(`https://gh-pinned-repos.egoist.dev/?username=${username}`);
                    if (pinnedRes.ok) {
                        const pinnedData = await pinnedRes.json();
                        if (Array.isArray(pinnedData) && pinnedData.length > 0) {
                            finalProjects = pinnedData.map((repo: any) => ({
                                title: repo.repo ? repo.repo.replace(/-/g, ' ') : 'Project',
                                role: 'Pinned Repository',
                                outcome: repo.stars ? `${repo.stars} Stars` : repo.language || 'GitHub Repo',
                                summary: repo.description || 'A prototype repository built by Ali Ahmed.',
                                tags: [repo.language].filter(Boolean),
                                link: repo.link
                            }));
                        }
                    }
                } catch (e) {
                    console.warn('Could not fetch pinned repos, falling back to recent public repos', e);
                }

                // 2. Fallback to recent public repositories if no pinned ones are returned
                if (finalProjects.length === 0) {
                    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=6`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch fallback repositories');
                    }
                    const data: GithubRepo[] = await response.json();

                    finalProjects = data
                        .filter(repo => !repo.fork)
                        .map(repo => {
                            let outcome = 'GitHub Repository';
                            if (repo.stargazers_count > 0) {
                                outcome = `${repo.stargazers_count} Star${repo.stargazers_count > 1 ? 's' : ''}`;
                            }

                            const tags = [];
                            if (repo.language) tags.push(repo.language);
                            if (repo.topics && repo.topics.length > 0) {
                                tags.push(...repo.topics.slice(0, 3));
                            }

                            return {
                                title: repo.name.replace(/-/g, ' '),
                                role: 'Creator & Maintainer',
                                outcome: outcome,
                                summary: repo.description || 'A prototype repository built by Ali Ahmed.',
                                tags: tags,
                                link: repo.html_url
                            };
                        });
                }

                setProjects(finalProjects);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Unknown error'));
            } finally {
                setLoading(false);
            }
        }

        fetchRepos();
    }, [username]);

    return { projects, loading, error };
}
