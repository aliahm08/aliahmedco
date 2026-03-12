import { motion } from 'motion/react';

const projects = [
  {
    id: 1,
    category: "FRANCHISE",
    serviceType: "Operations",
    clientDescription: "A regional coffee shop chain",
    title: "Predictive Inventory System",
    description: "Automated ordering system analyzing local events, weather, and historical sales to predict pastry and bean demand per location, reducing waste while ensuring availability during peak hours.",
    impact: "22% reduction in food waste",
    tags: ["Hospitality", "Forecasting"],
    date: "February 2026"
  },
  {
    id: 2,
    category: "CONSTRUCTION",
    serviceType: "Automation",
    clientDescription: "A commercial plumbing contractor",
    title: "Automated Bid Estimation",
    description: "AI-driven tool that scans architectural blueprints to generate material takeoffs and labor estimates instantly, allowing the team to bid on more projects with higher accuracy and less manual overhead.",
    impact: "3x increase in bid volume",
    tags: ["Construction", "Computer Vision"],
    date: "January 2026"
  },
  {
    id: 3,
    category: "GOVERNMENT",
    serviceType: "Infrastructure",
    clientDescription: "A county transit authority",
    title: "Predictive Maintenance Fleet",
    description: "IoT sensor integration and machine learning model that predicts bus engine failures before they happen, scheduling maintenance during off-hours to prevent service disruptions on critical routes.",
    impact: "99.8% fleet uptime achieved",
    tags: ["Transit", "IoT"],
    date: "December 2025"
  },
  {
    id: 4,
    category: "EDUCATION",
    serviceType: "Student Services",
    clientDescription: "A state university system",
    title: "Enrollment Support Agent",
    description: "24/7 conversational AI handling financial aid and course registration queries, reducing administrative wait times during peak enrollment periods from days to seconds.",
    impact: "40% drop in support tickets",
    tags: ["Higher Ed", "NLP"],
    date: "March 2026"
  }
];

export default function Work() {
  return (
    <section className="py-32 px-6 max-w-7xl mx-auto" id="work">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-16"
      >
        <h2 className="text-4xl font-medium tracking-tight mb-4">Case Studies</h2>
        <div className="h-px w-full bg-neutral-200" />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group border border-neutral-200 p-8 hover:border-black transition-colors duration-300 flex flex-col justify-between min-h-[400px] bg-white"
          >
            <div>
              {/* Header: Category • Service Type */}
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 mb-6">
                <span className="font-semibold text-neutral-900">{project.category}</span>
                <span className="text-neutral-300">•</span>
                <span>{project.serviceType}</span>
              </div>

              {/* Client Description */}
              <div className="text-sm text-neutral-500 italic mb-2">
                {project.clientDescription}
              </div>

              {/* Title */}
              <h3 className="text-2xl font-medium mb-4 text-neutral-900 group-hover:underline decoration-1 underline-offset-4 decoration-neutral-300">
                {project.title}
              </h3>

              {/* Description */}
              <p className="text-neutral-600 leading-relaxed mb-8 text-sm md:text-base">
                {project.description}
              </p>
            </div>
            
            {/* Footer Section */}
            <div className="pt-6 border-t border-neutral-100">
              <div className="mb-4">
                <span className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-1">Impact</span>
                <span className="text-lg font-medium text-neutral-900">{project.impact}</span>
              </div>
              
              <div className="flex justify-between items-end">
                <div className="flex flex-wrap gap-2">
                  {project.tags.map(tag => (
                    <span key={tag} className="text-xs text-neutral-500 bg-neutral-50 px-2 py-1 rounded-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-neutral-400 font-mono">{project.date}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
