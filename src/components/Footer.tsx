export default function Footer() {
  return (
    <footer className="py-12 px-6 max-w-7xl mx-auto border-t border-neutral-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <h3 className="text-lg font-medium tracking-tight">Minimal AI Solutions</h3>
          <p className="text-sm text-neutral-500 mt-2">© 2024 All rights reserved.</p>
        </div>
        
        <div className="flex gap-8 text-sm text-neutral-600">
          <a href="#" className="hover:text-black transition-colors">Privacy</a>
          <a href="#" className="hover:text-black transition-colors">Terms</a>
          <a href="#" className="hover:text-black transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}
