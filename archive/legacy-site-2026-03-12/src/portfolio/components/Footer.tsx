const Footer = () => (
  <footer className="aa-footer">
    <div className="aa-container aa-footer-grid">
      <div>
        <p className="aa-eyebrow">aliahmed.co</p>
        <h3>Minimalist software engineering and design.</h3>
        <p className="aa-footer-copy">
          Building applications, analyzing risk, and crafting digital experiences.
        </p>
      </div>
      <div className="aa-footer-meta">
        <p>Based in the U.S.</p>
        <p>© {new Date().getFullYear()} aliahmed.co. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
