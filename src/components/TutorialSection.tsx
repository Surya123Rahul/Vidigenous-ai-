import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Sparkles, Zap, Layout, ChevronRight } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Choose Your Pipeline',
    description: 'Select from AI Lab, Smart Graphics, or Sound Library to start your creative journey.',
    icon: <Layout className="text-blue-400" size={20} />,
    videoUrl: 'https://cdn.pixabay.com/video/2023/10/20/185791-876345634_tiny.mp4', // Placeholder
  },
  {
    id: 2,
    title: 'Configure & Generate',
    description: 'Adjust parameters like style, duration, and aspect ratio, then hit generate.',
    icon: <Sparkles className="text-purple-400" size={20} />,
    videoUrl: 'https://cdn.pixabay.com/video/2020/09/11/49557-458434604_tiny.mp4', // Placeholder
  },
  {
    id: 3,
    title: 'Export & Share',
    description: 'Review your masterpiece, make final tweaks, and export in high quality.',
    icon: <Zap className="text-emerald-400" size={20} />,
    videoUrl: 'https://cdn.pixabay.com/video/2021/04/12/70860-537443657_tiny.mp4', // Placeholder
  },
];

export const TutorialSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="mt-12 mb-8"
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl">
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none" />

        <div className="p-8 md:p-12">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            {/* Left Column: Video Player */}
            <div className="w-full md:w-1/2 relative group">
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-inner">
                <video
                  key={steps[activeStep].videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                >
                  <source src={steps[activeStep].videoUrl} type="video/mp4" />
                </video>
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                
                {/* Play Button Icon (Visual only) */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                    <Play size={32} className="text-white fill-white ml-1" />
                  </div>
                </div>
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -bottom-4 -right-4 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Live Preview</span>
              </div>
            </div>

            {/* Right Column: Steps */}
            <div className="w-full md:w-1/2 space-y-6">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">How to Use VidiGenius</h2>
                <p className="text-white/50 text-sm">Master the art of AI video creation in three simple steps.</p>
              </div>

              <div className="space-y-4">
                {steps.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(index)}
                    className={`w-full text-left p-5 rounded-2xl transition-all duration-300 border ${
                      activeStep === index
                        ? 'bg-white/10 border-white/20 shadow-lg translate-x-2'
                        : 'bg-transparent border-transparent hover:bg-white/5 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        activeStep === index ? 'bg-white/10' : 'bg-white/5'
                      }`}>
                        {step.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-bold ${activeStep === index ? 'text-white' : 'text-white/70'}`}>
                            {step.title}
                          </h3>
                          {activeStep === index && (
                            <ChevronRight size={16} className="text-white/40" />
                          )}
                        </div>
                        <p className="text-xs text-white/40 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-6">
                <button className="px-6 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-white/90 transition-colors flex items-center gap-2">
                  Get Started Now <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
