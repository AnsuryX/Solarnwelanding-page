/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Battery, 
  ShieldCheck, 
  Zap, 
  Smartphone, 
  ClipboardCheck, 
  ChevronRight, 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2,
  ArrowRight,
  Calculator,
  ShieldAlert,
  Search,
  Wrench,
  Users,
  X,
  Sparkles,
  TreeDeciduous,
  TrendingDown,
  Clock,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getSolarAIRecommendation, type SolarAIResponse } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Constants ---
const FORMSPREE_URL = "https://formspree.io/f/xnjlrlyq";
const COMPANY_WHATSAPP = "254141153031";

// --- Components ---

const WhatsAppModal = ({ isOpen, onClose, context }: { isOpen: boolean, onClose: () => void, context?: string }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.name,
          phone: formData.phone,
          source: 'whatsapp_modal',
          context: context || 'general',
          timestamp: new Date().toISOString()
        })
      });

      // Redirect to WhatsApp using a new tab to avoid iframe restrictions
      const defaultMsg = `Hi Solargear! My name is ${formData.name}. I'm interested in a solar solution.`;
      const contextMsg = context ? `Hi Solargear! My name is ${formData.name}. I'm interested in the ${context} package.` : defaultMsg;
      const message = encodeURIComponent(contextMsg);
      const whatsappUrl = `https://wa.me/${COMPANY_WHATSAPP}?text=${message}`;
      
      // Use window.open with _blank to avoid "refused to connect" in iframe
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      onClose(); // Close modal after redirecting
    } catch (error) {
      console.error("Submission failed", error);
      window.open(`https://wa.me/${COMPANY_WHATSAPP}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-deep-green/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
            <button onClick={onClose} className="absolute top-6 right-6 text-stone-400 hover:text-deep-green transition-colors">
              <X className="h-6 w-6" />
            </button>
            
            <div className="p-10">
              <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                <MessageCircle className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-deep-green mb-2">Connect via WhatsApp</h3>
              <p className="text-stone-500 text-sm mb-8 leading-relaxed">
                What's the best number to reach you on? Our engineers will use this to send your custom 3D audit.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">Your Name</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-4 bg-stone-50 border border-stone-100 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all text-deep-green font-medium" 
                    placeholder="Enter your name" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-stone-400 tracking-widest">Phone Number</label>
                  <input 
                    required 
                    type="tel" 
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-4 bg-stone-50 border border-stone-100 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all text-deep-green font-medium" 
                    placeholder="+254..." 
                  />
                </div>
                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full py-5 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 uppercase tracking-wider mt-4 disabled:opacity-50"
                >
                  {loading ? "Connecting..." : "Start Chat Now"}
                  <ArrowRight className="h-5 w-5" />
                </button>
                <p className="text-[10px] text-center text-stone-400 font-bold uppercase tracking-widest mt-4">
                  Privacy Secured • Instant Response
                </p>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const SolarAIEstimator = () => {
  const [bill, setBill] = useState('15000');
  const [location, setLocation] = useState('Nairobi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SolarAIResponse | null>(null);

  const kenyanRegions = [
    "Nairobi", "Mombasa (Coast)", "Kisumu", "Eldoret", "Nakuru", 
    "Garissa (North Eastern)", "Mandera", "Lodwar (Turkana)", 
    "Nyeri", "Machakos", "Voi", "Narok"
  ];

  const handleEstimate = async () => {
    setLoading(true);
    setError(null);
    try {
      const recommendation = await getSolarAIRecommendation(bill, location);
      if (!recommendation || Object.keys(recommendation).length === 0) {
        throw new Error("Invalid response from AI");
      }
      setResult(recommendation);
      
      // Auto-submit to Formspree for lead generation if they've given a bill
      fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'ai_estimator_usage',
          bill,
          location,
          timestamp: new Date().toISOString()
        })
      }).catch(e => console.warn("Background lead sync failed", e));

    } catch (err: any) {
      console.error("AI Estimation failed", err);
      setError("Energy modeling is currently busy. Please try again in 30 seconds.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="ai-engine" className="py-24 bg-deep-green text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-500 text-sm font-bold mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Proprietary AI Engine</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight">
              Decode Your Energy Future with <span className="text-amber-500 italic">Neural Modeling</span>
            </h2>
            <p className="text-stone-400 text-lg mb-10 leading-relaxed max-w-xl">
              Our AI analyzes your consumption patterns against regional solar irradiance data across Kenya to 
              deliver a customized energy roadmap in seconds.
            </p>

            <div className="space-y-6 max-w-md">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-stone-500 tracking-widest">Average Monthly Bill (KES)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={bill}
                    onChange={(e) => setBill(e.target.value)}
                    className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all text-2xl font-bold font-mono" 
                    placeholder="15000"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-500 font-bold">KES</div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-stone-500 tracking-widest">Your Location</label>
                <div className="relative">
                  <select 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all text-xl appearance-none"
                  >
                    {kenyanRegions.map(reg => (
                      <option key={reg} value={reg} className="bg-deep-green text-white">
                        {reg}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="h-5 w-5 text-stone-500" />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <button 
                onClick={handleEstimate}
                disabled={loading}
                className="w-full py-6 bg-amber-500 text-deep-green font-black rounded-2xl shadow-xl shadow-amber-900/40 hover:bg-amber-400 hover:-translate-y-0.5 transition-all text-xl uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="h-6 w-6" />
                    </motion.div>
                    <span>Modeling...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze My Savings</span>
                    <ArrowRight className="h-6 w-6" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="relative">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-[48px] p-8 md:p-12 text-deep-green shadow-3xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 opacity-20" />
                  </div>
                  
                  <div className="mb-10">
                    <h3 className="text-stone-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">Recommended Solution</h3>
                    <div className="text-3xl font-serif font-bold text-deep-green">{result.recommendedPackage}</div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-8 mb-10">
                    <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100 transition-hover hover:border-amber-500/30">
                      <TrendingDown className="h-6 w-6 text-emerald-500 mb-3" />
                      <div className="text-xs font-bold text-stone-400 uppercase mb-1">Monthly Savings</div>
                      <div className="text-2xl font-bold font-mono text-emerald-600">KES {result.monthlySavings}</div>
                    </div>
                    <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100 transition-hover hover:border-amber-500/30">
                      <Clock className="h-6 w-6 text-amber-500 mb-3" />
                      <div className="text-xs font-bold text-stone-400 uppercase mb-1">Payback Period</div>
                      <div className="text-2xl font-bold text-deep-green">{result.paybackPeriod}</div>
                    </div>
                  </div>

                  <div className="p-8 bg-emerald-50 rounded-[32px] border border-emerald-100 mb-10">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                        <TreeDeciduous className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-700/60 uppercase mb-1">Environmental Impact</div>
                        <p className="text-emerald-900 font-medium leading-relaxed">
                          {result.environmentalBenefit}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-stone-500 text-sm leading-relaxed italic mb-8 border-l-2 border-amber-500 pl-4">
                    "{result.impact}"
                  </div>

                  <button 
                    onClick={() => setResult(null)}
                    className="w-full py-4 text-stone-400 font-bold hover:text-deep-green transition-colors text-sm uppercase tracking-widest"
                  >
                    Reset Calculation
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="aspect-square bg-white/5 border-2 border-dashed border-white/10 rounded-[48px] flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="h-24 w-24 bg-white/5 rounded-[32px] flex items-center justify-center mb-8">
                    <Calculator className="h-12 w-12 text-stone-500" />
                  </div>
                  <h4 className="text-xl font-bold mb-4 text-stone-300">Ready to Calculate Your Future?</h4>
                  <p className="text-stone-500 leading-relaxed">
                    Enter your electricity bill above to unlock a bespoke energy efficiency report for your Nairobi home.
                  </p>
                  
                  <div className="mt-8 flex gap-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-1.5 w-8 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          animate={{ x: [-32, 32] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                          className="h-full w-full bg-amber-500/20"
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Floating Badges */}
            <div className="absolute -top-6 -right-6 h-32 w-32 bg-amber-500 rounded-full flex items-center justify-center text-deep-green text-center p-4 border-8 border-deep-green rotate-12 shadow-2xl z-20 hidden md:flex">
              <div className="font-black text-xs uppercase leading-tight tracking-tighter">
                90%<br />Lower Bills
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Logo = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-2 font-bold text-2xl tracking-tighter", className)}>
    <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white shadow-lg shadow-amber-500/20">
      <Sun className="h-6 w-6" strokeWidth={2.5} />
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -inset-1 border border-amber-500/30 rounded-full border-dashed"
      />
    </div>
    <span className="text-deep-green group">
      Solar<span className="text-amber-600 transition-colors duration-300">gear</span>
    </span>
  </div>
);

const SectionHeading = ({ children, title, subtitle, center = false }: { children?: React.ReactNode, title: string, subtitle?: string, center?: boolean }) => (
  <div className={cn("mb-12", center && "text-center")}>
    <motion.span 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-widest text-amber-600 uppercase bg-amber-50 rounded-full"
    >
      {subtitle}
    </motion.span>
    <motion.h2 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className={cn("text-3xl md:text-4xl font-serif font-light text-deep-green tracking-tight mb-4", center && "mx-auto")}
    >
      {title}
    </motion.h2>
    {children}
  </div>
);

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6",
      isScrolled ? "py-3 bg-white/50 backdrop-blur-sm shadow-sm border-b border-stone-200" : "py-6 bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Logo />
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-deep-green">
          <a href="#why-solar" className="hover:text-amber-600 transition-colors">Why Solar</a>
          <a href="#packages" className="hover:text-amber-600 transition-colors">Packages</a>
          <a href="#ai-engine" className="flex items-center gap-1 hover:text-amber-600 transition-colors">
            <Sparkles className="h-4 w-4 text-amber-500" />
            AI Engine
          </a>
          <a href="#journey" className="hover:text-amber-600 transition-colors">Your Journey</a>
          <a href="#contact" className="px-5 py-2.5 bg-deep-green text-white rounded-full hover:bg-deep-green-dark transition-all shadow-md hover:shadow-lg flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Get Free Quote
          </a>
        </div>
      </div>
    </nav>
  );
};

const Hero = ({ onOpenWhatsApp }: { onOpenWhatsApp: () => void }) => (
  <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
    <div className="absolute inset-0 z-0">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-amber-50/50 rounded-l-[100px] -z-10" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-100/30 blur-3xl rounded-full" />
    </div>
    
    <div className="max-w-7xl mx-auto px-6 relative z-10">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-bold uppercase tracking-wider mb-6">
              Nairobi's Solar Leaders
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-light text-deep-green tracking-tight leading-[1.1] mb-6">
              Empowering your home with <br/>
              <span className="text-amber-600 italic">limitless energy.</span>
            </h1>
            <p className="text-lg text-stone-600 mb-8 max-w-lg leading-relaxed">
              Transition to sustainable living in Kenya. We handle the design, monitoring, and expert installation while you save up to 90% on electricity bills.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="#packages" 
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-deep-green text-white font-bold rounded-full hover:bg-deep-green-dark transition-all shadow-xl hover:-translate-y-0.5"
              >
                View Packages <ArrowRight className="h-5 w-5" />
              </a>
              <button 
                onClick={onOpenWhatsApp}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border border-stone-200 text-deep-green font-bold rounded-full hover:bg-stone-50 transition-all shadow-sm"
              >
                <MessageCircle className="h-5 w-5 text-emerald-500" />
                WhatsApp Us
              </button>
              <a 
                href="#ai-engine"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-deep-green text-white font-bold rounded-full hover:bg-stone-800 transition-all shadow-sm group"
              >
                <Sparkles className="h-5 w-5 text-amber-500 group-hover:animate-pulse" />
                Try AI Engine
              </a>
            </div>
            
            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 12}`} alt="User" />
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <div className="font-bold text-slate-900">450+ Homes Powered</div>
                <div className="text-slate-500 flex items-center gap-1">
                  <div className="flex text-amber-400">
                    {[1,2,3,4,5].map(i => <Sun key={i} className="h-3 w-3 fill-current" />)}
                  </div>
                  in the Nairobi Region
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.8, delay: 0.2 }}
           className="relative"
        >
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
            <img 
              src="https://asset.solargear.co.ke/Whisk_df91f1544e6756881164c8127c6e9b2bdr.jpeg" 
              alt="Solar panels on a beautiful home" 
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-deep-green/80 to-transparent z-10" />
            <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur p-6 rounded-[32px] shadow-lg border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-deep-green uppercase tracking-widest">Live Savings</span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-3xl font-serif font-bold text-deep-green">KES 14,250</div>
              <p className="text-xs text-stone-500 uppercase tracking-wide">Approx. Monthly Bill Reduction</p>
            </div>
          </div>
          
          {/* Floating features */}
          <div className="absolute -top-6 -right-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 hidden lg:block animate-float">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                <Battery className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">24/7 Power</div>
                <div className="text-[10px] text-slate-500">Lithium Backup</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

const Packages = ({ onOpenWhatsApp }: { onOpenWhatsApp: (context: string) => void }) => {
  const [activeTab, setActiveTab] = useState<'start' | 'family' | 'elite'>('family');
  
  const packageData = {
    start: {
      name: "SolarStart™ Backup",
      description: "Perfect for urban apartments. Never lose Wi-Fi or refrigeration during blackouts.",
      price: "325,000",
      features: ["3kW Hybrid Inverter", "2.5kWh Lithium Storage", "4x 450W Solar Panels", "Rapid switching (<10ms)", "App Monitoring"],
      bestFor: "Apartments & Small Townhomes",
      color: "bg-blue-600"
    },
    family: {
      name: "SolarFamily™ Hybrid",
      description: "The Nairobi Bestseller. Designed for mainstream energy independence for 3-4 bedroom homes.",
      price: "695,000",
      features: ["5kW Hybrid Inverter", "10kWh Lithium Storage", "10x 550W Solar Panels", "Water Pump Support", "Whole-home Wi-Fi"],
      bestFor: "Most Nairobi Households",
      color: "bg-amber-600",
      popular: true
    },
    elite: {
      name: "SolarElite™ Independence",
      description: "Luxury freedom. Powerful enough for villas, AC units, and borehole pumps.",
      price: "1,750,000",
      features: ["10kW Parallel Inverter", "20kWh High-Density Storage", "18x 620W Bifacial Panels", "Induction/AC Support", "24/7 VIP Remote Monitoring"],
      bestFor: "Expansive Villas & Estates",
      color: "bg-slate-900"
    }
  };

  return (
    <section id="packages" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading title="Tiered Solutions for Every Home" subtitle="Our Packages" center>
          <p className="max-w-2xl mx-auto text-stone-600">
            Transparent pricing including professional installation and KPLC-compliant component selection.
          </p>
        </SectionHeading>

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {(Object.entries(packageData) as [string, any][]).map(([key, pkg]) => (
            <motion.div 
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={cn(
                "relative flex flex-col p-8 rounded-[40px] border border-stone-200 transition-all duration-300",
                pkg.popular ? "border-amber-500 shadow-xl scale-105 z-10 bg-white" : "bg-white/50 hover:border-stone-400 shadow-sm"
              )}
            >
              {pkg.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-amber-500 text-deep-green text-[10px] font-black uppercase tracking-widest rounded-full">
                  Nairobi Bestseller
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-xl font-bold text-deep-green mb-2">{pkg.name}</h3>
                <p className="text-sm text-stone-500 leading-relaxed mb-6 h-12">{pkg.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-stone-400">KES</span>
                  <span className="text-4xl font-serif font-bold text-deep-green">{pkg.price}</span>
                </div>
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Starting Price</div>
              </div>

              <div className="space-y-4 mb-10 flex-grow">
                {pkg.features.map((feat: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className={cn("h-5 w-5 shrink-0", pkg.popular ? "text-amber-600" : "text-stone-400")} />
                    <span className="text-sm text-stone-700 font-medium">{feat}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => onOpenWhatsApp(pkg.name)}
                className={cn(
                  "w-full py-4 px-6 rounded-2xl font-bold text-center transition-all shadow-lg",
                  pkg.popular ? "bg-amber-500 text-deep-green shadow-amber-500/20 hover:bg-amber-400 font-black" : "bg-deep-green text-white hover:bg-deep-green-dark"
                )}
              >
                Get Started
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Features = () => (
  <section className="py-24 bg-deep-green text-white overflow-hidden relative">
    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid md:grid-cols-2 gap-20 items-center">
        <div>
          <span className="text-amber-500 font-bold uppercase tracking-widest text-xs">The SolarGear Difference</span>
          <h2 className="text-4xl md:text-5xl font-serif font-light tracking-tight mt-4 mb-6">Why we aren't just "Another Solar Company"</h2>
          <p className="text-stone-400 text-lg mb-10 leading-relaxed">
            Nairobi is flooded with low-cost, informal installers. We position ourselves in the professional engineering segment to ensure your safety and ROI.
          </p>
          
          <div className="space-y-8">
            <div className="flex gap-5">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 border border-amber-500/30">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-xl font-serif font-bold mb-1">"Protection-First" Engineering</h4>
                <p className="text-stone-400 text-sm leading-relaxed">We standardise on high-quality DC breakers, surge protectors (SPDs), and proper earthing. Most competitors cut costs here—we don't.</p>
              </div>
            </div>
            
            <div className="flex gap-5">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20">
                <Search className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-xl font-serif font-bold mb-1">Advanced 3D Remote Auditing</h4>
                <p className="text-stone-400 text-sm leading-relaxed">We use satellite data to perfectly model your roof in 3D. No more messy manual measurements or design errors.</p>
              </div>
            </div>
            
            <div className="flex gap-5">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20">
                <Smartphone className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-xl font-serif font-bold mb-1">Smart-Home Integration</h4>
                <p className="text-stone-400 text-sm leading-relaxed">Manage your power from your phone. Peak-shaving and time-of-use scheduling to milk every single drop of KES savings.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative group">
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-deep-green z-10" />
          <motion.div
           initial={{ opacity: 0, x: 50 }}
           whileInView={{ opacity: 1, x: 0 }}
           viewport={{ once: true }}
           className="relative z-0 rounded-[40px] overflow-hidden border border-white/10"
          >
            <img 
              src="https://images.unsplash.com/photo-1592833159155-c62df1b65634?auto=format&fit=crop&q=80&w=800" 
              alt="Installation details" 
              className="w-full grayscale brightness-75 group-hover:grayscale-0 transition-all duration-700"
            />
          </motion.div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-center w-full px-6 text-white">
            <div className="h-20 w-20 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-amber-500/50">
              <ShieldCheck className="h-10 w-10 text-deep-green" />
            </div>
            <h3 className="text-2xl font-serif font-bold mb-2">EPRA Certified</h3>
            <p className="text-amber-500 font-mono tracking-widest text-xs uppercase">Engineering Grade Installations</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Journey = () => (
  <section id="journey" className="py-24 bg-cream">
    <div className="max-w-7xl mx-auto px-6">
      <SectionHeading title="Your Path to Grid Independence" subtitle="The Journey" center />
      
      <div className="grid md:grid-cols-4 gap-8 relative mt-16">
        <div className="hidden md:block absolute top-10 left-0 right-0 h-px bg-stone-200 -z-0" />
        
        {[
          { icon: Search, title: "1. Remote Audit", desc: "We analyze your roof and current energy bills using 3D satellite modeling." },
          { icon: ClipboardCheck, title: "2. Custom Design", desc: "Based on the audit, we design a tiered system that fits your budget and lifestyle." },
          { icon: Wrench, title: "3. Professional Install", desc: "Our certified engineers install your system with extreme attention to detail." },
          { icon: Zap, title: "4. Live Monitoring", desc: "Switch on and start saving. We provide 2-year remote health check monitoring." }
        ].map((step, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[40px] shadow-sm border border-stone-100 flex flex-col items-center text-center relative z-10"
          >
            <div className="text-amber-500 font-serif text-4xl mb-4">0{i+1}</div>
            <h4 className="text-sm font-black uppercase tracking-tight text-deep-green mb-3">{step.title}</h4>
            <p className="text-xs text-stone-500 leading-relaxed font-medium">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const LeadForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      full_name: formData.get('fullName'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      location: formData.get('location'),
      monthly_bill: formData.get('monthlyBill'),
      source: 'quote_form_main',
      timestamp: new Date().toISOString()
    };

    try {
      await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Submission failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-deep-green rounded-[80px] overflow-hidden shadow-[0_24px_50px_-12px_rgba(45,71,57,0.3)] relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
          
          <div className="grid md:grid-cols-2">
            <div className="p-12 md:p-20 text-white border-r border-white/10">
              <h2 className="text-4xl md:text-5xl font-serif font-light mb-6 leading-tight">Get Your <br/>Solar Quote</h2>
              <p className="text-stone-400 mb-10 leading-relaxed">
                Fill out the form and our design engineers will prepare a satellite-based audit of your property within 24 hours.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center text-amber-500">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-500 uppercase tracking-widest font-bold">Call/WhatsApp</div>
                    <div className="font-medium">+254 141 153031</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center text-amber-500">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-500 uppercase tracking-widest font-bold">Email</div>
                    <div className="font-medium">hello@solargear.co.ke</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center text-amber-500">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-stone-500 uppercase tracking-widest font-bold">Location</div>
                    <div className="font-medium">Nairobi, Kenya</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-12 md:p-20 bg-transparent flex flex-col justify-center">
              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center text-white"
                >
                  <div className="h-20 w-20 bg-amber-500 text-deep-green rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold mb-2">Request Received!</h3>
                  <p className="text-stone-400">Our engineers are working on your 3D audit. We'll contact you shortly via WhatsApp.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Full Name</label>
                      <input name="fullName" required type="text" className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all text-white placeholder:text-stone-600" placeholder="John Kamau" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Phone</label>
                        <input name="phone" required type="tel" className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all text-white placeholder:text-stone-600" placeholder="+254..." />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Location</label>
                        <input name="location" required type="text" className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all text-white placeholder:text-stone-600" placeholder="e.g. Karen" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Email Address</label>
                      <input name="email" required type="email" className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all text-white placeholder:text-stone-600" placeholder="john@example.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Monthly Bill (KES)</label>
                      <select name="monthlyBill" className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all text-white appearance-none">
                        <option className="text-deep-green">10,000 - 30,000</option>
                        <option className="text-deep-green">30,000 - 50,000</option>
                        <option className="text-deep-green">Above 50,000</option>
                      </select>
                    </div>
                  <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-amber-500 text-deep-green font-black rounded-2xl shadow-xl shadow-amber-900/20 hover:bg-amber-400 hover:-translate-y-0.5 transition-all text-lg uppercase tracking-wider disabled:opacity-50"
                  >
                    {loading ? "Syncing..." : "Get Expert Audit"}
                  </button>
                  <p className="text-[10px] text-center text-stone-500 mt-4 leading-normal uppercase font-bold tracking-widest">
                    AI-Driven Automations • Data Secured
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Testimonials = () => (
  <section className="py-24 bg-white overflow-hidden">
    <div className="max-w-7xl mx-auto px-6">
      <SectionHeading title="Trust Verified by Local Homeowners" subtitle="Social Proof" center />
      
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { name: "David M.", loc: "Karen", text: "SolarGear's SolarElite system finally gave me the peace of mind to use my induction cooker and AC without fear of blackouts. Professional team through and through.", rating: 5 },
          { name: "Esther W.", loc: "Westlands", text: "The SolarStart backup for my apartment is amazing. My laptop and Wi-Fi never go off, and I barely noticed when KPLC went down last week.", rating: 5 },
          { name: "Samuel O.", loc: "Runda", text: "What set Solargear apart was their engineering report. They showed me exactly where shadows hit my roof. 10 months in and savings are on target.", rating: 5 }
        ].map((t, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="p-10 bg-white rounded-[40px] border border-stone-100 shadow-sm relative"
          >
             <div className="flex text-amber-500 mb-6 h-4">
              {[...Array(t.rating)].map((_, idx) => <Sun key={idx} className="h-4 w-4 fill-current shrink-0" />)}
            </div>
            <p className="text-stone-600 italic mb-8 leading-relaxed text-sm">"{t.text}"</p>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-stone-100 overflow-hidden shrink-0 border-2 border-cream">
                 <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${t.name}`} alt={t.name} />
              </div>
              <div className="text-sm">
                <div className="font-bold text-deep-green tracking-tight">{t.name}</div>
                <div className="text-stone-500 font-medium text-xs uppercase tracking-widest">{t.loc}, Nairobi</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="pt-20 pb-10 bg-white border-t border-stone-200">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-2">
          <Logo className="mb-6" />
          <p className="text-stone-500 max-w-sm mb-8 leading-relaxed text-sm">
            Nairobi's premium solar engineering firm. We provide energy freedom without stress through technical excellence and client-first support.
          </p>
          <div className="flex gap-4">
            <a href="#" className="h-10 w-10 bg-cream border border-stone-200 rounded-full flex items-center justify-center text-deep-green hover:text-amber-600 hover:border-amber-600 transition-all shadow-sm">
              <Users className="h-5 w-5" />
            </a>
            <a href="#" className="h-10 w-10 bg-cream border border-stone-200 rounded-full flex items-center justify-center text-deep-green hover:text-amber-600 hover:border-amber-600 transition-all shadow-sm">
              <Smartphone className="h-5 w-5" />
            </a>
          </div>
        </div>
        
        <div>
          <h4 className="font-bold text-deep-green mb-6">Quick Links</h4>
          <ul className="space-y-4 text-sm text-stone-500">
            <li><a href="#why-solar" className="hover:text-amber-600 transition-colors">Why Solar</a></li>
            <li><a href="#packages" className="hover:text-amber-600 transition-colors">Packages</a></li>
            <li><a href="#journey" className="hover:text-amber-600 transition-colors">Process</a></li>
            <li><a href="#contact" className="hover:text-amber-600 transition-colors">Request Quote</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold text-deep-green mb-6">Contact Support</h4>
          <ul className="space-y-4 text-sm text-stone-500">
            <li className="flex items-center gap-3"><Mail className="h-4 w-4" /> info@solargear.co.ke</li>
            <li className="flex items-center gap-3"><Mail className="h-4 w-4" /> hello@solargear.co.ke</li>
            <li className="flex items-center gap-3"><Phone className="h-4 w-4" /> +254 141 153031</li>
            <li className="flex items-center gap-3"><MapPin className="h-4 w-4" /> Nairobi, Kenya</li>
          </ul>
        </div>
      </div>
      
      <div className="pt-10 border-t border-stone-200 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] text-stone-400 font-bold uppercase tracking-widest">
        <p>© 2026 Solargear Kenya. All rights reserved. EPRA Certified.</p>
        <div className="flex gap-8">
          <a href="#" className="hover:text-deep-green">Privacy Policy</a>
          <a href="#" className="hover:text-deep-green">Terms of Service</a>
          <a href="#" className="hover:text-deep-green">Warranty Framework</a>
        </div>
      </div>
    </div>
  </footer>
);

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState<string | undefined>(undefined);

  const openWhatsApp = (context?: string) => {
    setModalContext(context);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-cream font-sans selection:bg-amber-100 selection:text-deep-green scroll-smooth text-deep-green">
      <Navbar />
      
      <WhatsAppModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        context={modalContext}
      />
      
      <main>
        <Hero onOpenWhatsApp={() => openWhatsApp()} />
        
        <SolarAIEstimator />

        {/* Why Solar Section */}
        <section id="why-solar" className="py-24 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-stone-50 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-16 items-center">
               <div className="relative">
                <div className="aspect-square bg-white rounded-[80px] overflow-hidden relative shadow-lg border border-stone-100">
                  <img 
                    src="https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&q=80&w=800" 
                    alt="Solar efficiency" 
                    className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-700"
                  />
                  <div className="absolute bottom-6 left-6 right-6 bg-deep-green/90 backdrop-blur p-8 rounded-[40px] border border-white/10 text-white shadow-2xl">
                    <div className="text-4xl font-serif font-bold mb-1">KES 25</div>
                    <p className="text-[10px] uppercase font-black tracking-[0.2em] text-stone-400 uppercase">Current KPLC Tariff per kWh</p>
                    <div className="mt-4 flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-widest">
                       <ArrowRight className="h-3 w-3 rotate-45" /> Rising 12% Yearly
                    </div>
                  </div>
                </div>
                <div className="absolute -top-10 -right-10 h-32 w-32 bg-amber-500 rounded-full border-8 border-cream flex flex-col items-center justify-center text-deep-green shadow-xl rotate-12">
                   <div className="text-xl font-black">100%</div>
                   <div className="text-[8px] uppercase font-black text-center px-4 leading-tight">Clean Energy Certified</div>
                </div>
              </div>
              
              <div>
                <SectionHeading title="Beat KPLC Tariffs & Reliability" subtitle="The Opportunity" />
                <p className="text-stone-600 mb-8 leading-relaxed">
                  Electricity prices in Kenya are at a critical tipping point. With tariffs between 20-25 KES/kWh, solar is no longer a luxury—it's a critical tool for home engineering.
                </p>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="h-10 w-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <h5 className="font-bold text-deep-green uppercase tracking-tight text-sm">Security</h5>
                    <p className="text-[11px] text-stone-500 leading-normal">Full independence from grid failures.</p>
                  </div>
                  <div className="space-y-3">
                    <div className="h-10 w-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
                      <Calculator className="h-6 w-6" />
                    </div>
                    <h5 className="font-bold text-deep-green uppercase tracking-tight text-sm">Return</h5>
                    <p className="text-[11px] text-stone-500 leading-normal">3.5 year average payback period.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Packages onOpenWhatsApp={(ctx) => openWhatsApp(ctx)} />
        <Features />
        <Journey />
        <Testimonials />
        <LeadForm />
      </main>
      
      <Footer />
      
      {/* Floating Elements */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4">
        {/* WhatsApp Link */}
        <motion.button
          onClick={() => setIsModalOpen(true)}
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1 }}
          className="h-16 w-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 relative group"
        >
          <MessageCircle className="h-8 w-8" />
          <span className="absolute right-full mr-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest">
            Chat with Nairobi Support
          </span>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
          </span>
        </motion.button>
      </div>
    </div>
  );
}
