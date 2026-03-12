import type { FC } from 'react';

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  subtitle: string;
}

const SectionHeading: FC<SectionHeadingProps> = ({ eyebrow, title, subtitle }) => (
  <div className="aa-section-heading">
    <p className="aa-eyebrow">{eyebrow}</p>
    <h2>{title}</h2>
    <p>{subtitle}</p>
  </div>
);

export default SectionHeading;
