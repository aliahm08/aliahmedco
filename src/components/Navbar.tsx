import { motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <a href="#" className="text-xl font-medium tracking-tight">Minimal AI</a>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 text-sm font-medium text-neutral-600">
          <a href="#work" className="hover:text-black transition-colors">Work</a>
          <a href="#industries" className="hover:text-black transition-colors">Industries</a>
          <a href="#team" className="hover:text-black transition-colors">Team</a>
          <a href="#contact" className="bg-black text-white px-4 py-2 rounded-full hover:bg-neutral-800 transition-colors">Contact</a>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-neutral-100 p-6 flex flex-col gap-4 shadow-lg"
        >
          <a href="#work" className="text-lg font-medium" onClick={() => setIsOpen(false)}>Work</a>
          <a href="#industries" className="text-lg font-medium" onClick={() => setIsOpen(false)}>Industries</a>
          <a href="#team" className="text-lg font-medium" onClick={() => setIsOpen(false)}>Team</a>
          <a href="#contact" className="text-lg font-medium text-black" onClick={() => setIsOpen(false)}>Contact</a>
        </motion.div>
      )}
    </nav>
  );
}
