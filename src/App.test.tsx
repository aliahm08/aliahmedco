import {describe, test, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import App from './App';

describe('App & Navigation Tests', () => {
  test('renders HomePage with correct sections and subpage links', () => {
    window.history.pushState({}, '', '/');
    render(<App />);

    // Verify sections exist
    const workHeader = screen.getByText('WORK');
    const resumeHeader = screen.getByText('RESUME');
    const writingHeader = screen.getByText('WRITING');

    expect(workHeader).toBeInTheDocument();
    expect(resumeHeader).toBeInTheDocument();
    expect(writingHeader).toBeInTheDocument();

    // Verify links to subpages exist
    const workLinks = screen.getAllByRole('link', {name: /work/i});
    const resumeLinks = screen.getAllByRole('link', {name: /resume/i});
    const writingLinks = screen.getAllByRole('link', {name: /writing/i});

    expect(workLinks.some(link => link.getAttribute('href') === '/work')).toBe(true);
    expect(resumeLinks.some(link => link.getAttribute('href') === '/resume')).toBe(true);
    expect(writingLinks.some(link => link.getAttribute('href') === '/writing')).toBe(true);
  });

  test('renders WritingPage without header and with direct article links', () => {
    window.history.pushState({}, '', '/writing');
    render(<App />);

    // Verify the old header description or title does NOT exist
    const archiveHeader = screen.queryByText('Writing', {selector: '.writing-archive-header p'});
    expect(archiveHeader).not.toBeInTheDocument();

    // Verify that writing links are direct links rather than buttons
    const postTitle = "Rebuilding Washington D.C.'s MetroBus Fleet Overhaul Program with AI";
    const postLink = screen.getByRole('link', {name: new RegExp(postTitle, 'i')});
    expect(postLink).toBeInTheDocument();
    expect(postLink.getAttribute('href')).toBe('https://aliahmed312.substack.com/p/rebuilding-washington-dcs-metrobus');
    expect(postLink.getAttribute('target')).toBe('_blank');

    // Verify no accordion button or trigger is present
    const expandButton = screen.queryByRole('button', {name: /\+/i});
    expect(expandButton).not.toBeInTheDocument();
  });
});
