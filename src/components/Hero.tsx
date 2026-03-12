import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col justify-center px-6 max-w-7xl mx-auto pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-4xl"
      >
        <h1 className="text-6xl md:text-8xl font-medium tracking-tight mb-8 leading-[0.9]">
          We build intelligence.
        </h1>
        <p className="text-xl md:text-2xl text-neutral-500 max-w-2xl leading-relaxed mb-12">
          Solving complex problems with simple, effective AI solutions. No hype. Just results.
        </p>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group flex items-center gap-2 text-lg font-medium border-b border-black pb-1 hover:text-neutral-600 transition-colors"
        >
          See our work
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </motion.div>
    </section>
  );
}
