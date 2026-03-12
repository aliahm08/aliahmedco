import type { FC, ReactNode } from 'react';
import type { SectionId } from '../types';

interface SectionShellProps {
  id: SectionId;
  children: ReactNode;
  className?: string;
}

const SectionShell: FC<SectionShellProps> = ({ id, children, className = '' }) => (
  <section id={id} className={`aa-section ${className}`.trim()}>
    <div className="aa-container">{children}</div>
  </section>
);

export default SectionShell;
