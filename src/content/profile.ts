export const profile = {
  name: 'Ali Ahmed',
  headline: 'Operator, builder, and AI product partner.',
  location: 'New York, NY',
  intro:
    'This is a fast-read personal site template built to turn a LinkedIn profile into a clear narrative: who Ali is, what he has done, and how to start a conversation.',
  summary: [
    'I work across product, operations, and applied AI. I like building simple systems that remove drag, tighten execution, and make teams faster.',
    'Most people do not need a long biography. They need enough signal to decide whether to hire, collaborate, or interview. This site is designed for that decision.',
  ],
  highlights: [
    'Built and shipped AI-assisted workflows for small teams and operators.',
    'Comfortable moving from strategy and positioning into implementation.',
    'Bias toward clean execution, direct communication, and readable systems.',
  ],
  focusAreas: [
    'AI workflows and lightweight automation',
    'Product strategy and fast prototyping',
    'Operator-facing internal tools',
    'Clear positioning, messaging, and web presence',
  ],
  experience: [
    {
      role: 'Current Role',
      company: 'Your Company',
      period: 'Add dates',
      description:
        'Replace this block with your current LinkedIn position summary. Keep it to two or three sentences focused on scope, results, and the kinds of problems you solve.',
    },
    {
      role: 'Previous Role',
      company: 'Previous Company',
      period: 'Add dates',
      description:
        'Use this area for the most relevant prior role. Emphasize outcomes, ownership, and what changed because of your work.',
    },
    {
      role: 'Earlier Role',
      company: 'Earlier Company',
      period: 'Add dates',
      description:
        'Only include experience that helps a visitor understand your current direction. Delete the rest.',
    },
  ],
  proofPoints: [
    {
      label: 'What Ali tends to do',
      value: 'Turn ambiguity into a plan, a system, and a shipped result.',
    },
    {
      label: 'What collaborators get',
      value: 'Fast iteration, honest tradeoffs, and concise communication.',
    },
    {
      label: 'What this site is for',
      value: 'Introduce Ali in under three minutes and invite the next conversation.',
    },
  ],
  interviewPrompts: [
    'What kind of work does Ali do best?',
    'What would Ali likely improve first in a small business?',
    'How would Ali describe his working style?',
    'What should I ask Ali in an interview?',
  ],
  contact: {
    email: 'ali@example.com',
    linkedin: 'https://www.linkedin.com/in/replace-with-your-profile',
  },
} as const;

export function buildProfileContext() {
  const roles = profile.experience
    .map(
      (item) =>
        `${item.role} at ${item.company} (${item.period}): ${item.description}`,
    )
    .join('\n');

  const proof = profile.proofPoints
    .map((item) => `${item.label}: ${item.value}`)
    .join('\n');

  return [
    `Name: ${profile.name}`,
    `Headline: ${profile.headline}`,
    `Location: ${profile.location}`,
    `Intro: ${profile.intro}`,
    `Summary: ${profile.summary.join(' ')}`,
    `Highlights: ${profile.highlights.join(' | ')}`,
    `Focus areas: ${profile.focusAreas.join(' | ')}`,
    `Experience:\n${roles}`,
    `Proof points:\n${proof}`,
  ].join('\n\n');
}
