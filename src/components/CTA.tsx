import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
  return (
    <section className="py-32 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="bg-black text-white p-12 md:p-24 rounded-none text-center"
      >
        <h2 className="text-4xl md:text-6xl font-medium tracking-tight mb-8">
          Ready to simplify?
        </h2>
        <p className="text-xl text-neutral-400 mb-12 max-w-xl mx-auto">
          Let's discuss how we can apply focused intelligence to your specific challenges.
        </p>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 text-lg font-medium hover:bg-neutral-200 transition-colors"
        >
          Get in touch
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </section>
  );
}
