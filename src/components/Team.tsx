import { motion } from 'motion/react';

const team = [
  { name: "Sarah Chen", role: "Lead Engineer" },
  { name: "Marcus Thorne", role: "Data Scientist" },
  { name: "Elena Rodriguez", role: "Product Strategy" },
  { name: "David Kim", role: "Systems Architect" }
];

export default function Team() {
  return (
    <section className="py-32 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-16"
      >
        <h2 className="text-4xl font-medium tracking-tight mb-4">Team</h2>
        <div className="h-px w-full bg-neutral-200" />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {team.map((member, index) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group"
          >
            <div className="aspect-[3/4] bg-neutral-100 mb-6 overflow-hidden relative">
              {/* Placeholder for team image - using minimal abstract pattern/color for now or just gray */}
              <div className="absolute inset-0 bg-neutral-200 group-hover:bg-neutral-300 transition-colors duration-500" />
            </div>
            <h3 className="text-lg font-medium mb-1">{member.name}</h3>
            <p className="text-sm text-neutral-500 font-mono">{member.role}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
