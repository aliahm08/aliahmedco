import { motion } from 'motion/react';

const industries = [
  "Hospitality",
  "Construction",
  "Public Sector"
];

export default function Industries() {
  return (
    <section className="py-32 px-6 max-w-7xl mx-auto bg-neutral-50" id="industries">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-16"
      >
        <h2 className="text-4xl font-medium tracking-tight mb-4">Industries</h2>
        <div className="h-px w-full bg-neutral-200" />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200 border border-neutral-200">
        {industries.map((industry, index) => (
          <motion.div
            key={industry}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="bg-white p-12 md:p-16 flex items-center justify-center hover:bg-neutral-50 transition-colors"
          >
            <span className="text-xl md:text-2xl font-medium tracking-tight">{industry}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
