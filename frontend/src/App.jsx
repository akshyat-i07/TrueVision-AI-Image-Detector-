import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Github,
  Linkedin,
  Mail,
  Cpu,
  Zap,
  ShieldCheck,
  Eye,
  Layers,
  Gauge,
  Braces,
  Server,
  Camera,
  Flame,
  BrainCircuit,
  Network,
  ArrowRight,
  RotateCcw,
  ScanEye,
  FileImage,
  AlertTriangle,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MIN_LOADING_MS = 3200; // keeps the loading animation from flashing by too fast

/* ----------------------------------------------------------------------- */
/* GLOBAL STYLES / DESIGN TOKENS                                           */
/* ----------------------------------------------------------------------- */

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');

    :root {
      --bg: #0B1220;
      --bg-secondary: #111827;
      --card: #1A2235;
      --accent: #1E3A8A;
      --accent-hover: #2563EB;
      --text-primary: #FFFFFF;
      --text-secondary: #94A3B8;
      --border: rgba(255,255,255,0.08);
    }

    .tv-root {
      background: var(--bg);
      color: var(--text-primary);
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
      min-height: 100vh;
      scroll-behavior: smooth;
    }

    .tv-display { font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }

    .tv-bg { background: var(--bg); }
    .tv-bg-secondary { background: var(--bg-secondary); }
    .tv-card { background: var(--card); border: 1px solid var(--border); }
    .tv-border { border-color: var(--border); }
    .tv-text-secondary { color: var(--text-secondary); }
    .tv-accent { color: var(--accent-hover); }
    .tv-bg-accent { background: var(--accent); }

    .tv-btn-primary {
      background: var(--accent);
      color: #fff;
      transition: all 0.25s ease;
      border: 1px solid rgba(255,255,255,0.06);
    }
    .tv-btn-primary:hover:not(:disabled) {
      background: var(--accent-hover);
      transform: translateY(-1px);
      box-shadow: 0 8px 24px -8px rgba(37, 99, 235, 0.5);
    }
    .tv-btn-secondary {
      background: transparent;
      color: var(--text-primary);
      border: 1px solid var(--border);
      transition: all 0.25s ease;
    }
    .tv-btn-secondary:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.18); }

    .tv-card-hover { transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease; }
    .tv-card-hover:hover {
      transform: translateY(-4px);
      border-color: rgba(255,255,255,0.16);
      box-shadow: 0 20px 40px -20px rgba(0,0,0,0.6);
    }

    .tv-nav { transition: background 0.3s ease, backdrop-filter 0.3s ease, border-color 0.3s ease; }
    .tv-nav-scrolled {
      background: rgba(11, 18, 32, 0.75);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
    }

    .tv-focus:focus-visible { outline: 2px solid var(--accent-hover); outline-offset: 2px; }

    .tv-dropzone { border: 1.5px dashed var(--border); transition: border-color 0.2s ease, background 0.2s ease; }
    .tv-dropzone:hover { border-color: rgba(255,255,255,0.2); }
    .tv-dropzone-active { border-color: var(--accent-hover) !important; background: rgba(37,99,235,0.06); }

    ::-webkit-scrollbar { width: 10px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: #232d45; border-radius: 8px; }

    .tv-badge-real { background: rgba(16, 185, 129, 0.12); color: #34D399; border: 1px solid rgba(52, 211, 153, 0.3); }
    .tv-badge-fake { background: rgba(239, 68, 68, 0.12); color: #F87171; border: 1px solid rgba(248, 113, 113, 0.3); }
    .tv-badge-warn { background: rgba(245,158,11,0.12); color: #FBBF24; border: 1px solid rgba(251,191,36,0.3); }

    .tv-progress-track { background: rgba(255,255,255,0.06); }

    @media (prefers-reduced-motion: reduce) {
      * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
    }
  `}</style>
);

/* ----------------------------------------------------------------------- */
/* NAV                                                                      */
/* ----------------------------------------------------------------------- */

const NAV_LINKS = ["Home", "Features", "How It Works", "About"];

function NavBar({ page, setPage }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (page !== "landing") return null;

  const goHome = () => {
    setPage("landing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={`tv-nav fixed top-0 left-0 right-0 z-50 ${scrolled ? "tv-nav-scrolled" : ""}`}>
      <div className="flex items-center justify-between py-5 px-6 md:px-10">
        <button
          onClick={goHome}
          className="tv-focus tv-display text-lg font-bold tracking-[0.2em] hover:text-white/90 transition-colors"
        >
          TRUEVISION
        </button>

        <nav className="hidden md:flex flex-wrap justify-center gap-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(/\s/g, "-")}`}
              className="tv-focus tv-text-secondary text-sm hover:text-white transition-colors rounded"
            >
              {link}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <a href="https://github.com/akshyat-i07" className="tv-focus tv-text-secondary hover:text-white transition-colors" aria-label="GitHub"><Github size={17} /></a>
          <a href="https://www.linkedin.com/in/akshyat-bora-6693a0341/" className="tv-focus tv-text-secondary hover:text-white transition-colors" aria-label="LinkedIn"><Linkedin size={17} /></a>
          <a href="mailto:akshyat.bora30@gmail.com" className="tv-focus tv-text-secondary hover:text-white transition-colors" aria-label="Email"><Mail size={17} /></a>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* HERO                                                                     */
/* ----------------------------------------------------------------------- */

function UploadCardMockup() {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="tv-card rounded-[20px] p-6 w-full max-w-sm shadow-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium tv-text-secondary">image_0842.jpg</span>
        <span className="text-xs px-2 py-1 rounded-full tv-badge-fake font-medium">AI GENERATED</span>
      </div>
      <div
        className="rounded-2xl h-44 mb-4 flex items-center justify-center relative overflow-hidden"
        style={{ background: "radial-gradient(circle at 30% 30%, rgba(37,99,235,0.35), transparent 60%), #10182B" }}
      >
        <ImageIcon size={36} className="tv-text-secondary" strokeWidth={1.5} />
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs tv-text-secondary">Confidence</span>
        <span className="text-xs font-semibold">94.2%</span>
      </div>
      <div className="tv-progress-track rounded-full h-1.5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "94.2%" }}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
          className="h-full rounded-full tv-bg-accent"
        />
      </div>
    </motion.div>
  );
}

function Hero({ setPage }) {
  return (
    <section id="home" className="pt-32 pb-28 px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}>
        <h1 className="tv-display text-4xl md:text-5xl font-extrabold leading-[1.1] tracking-tight mb-6">
          Detect AI-Generated Images with Confidence
        </h1>
        <p className="tv-text-secondary text-lg leading-relaxed mb-9 max-w-lg">
          TrueVision uses deep learning and Grad-CAM visualization to determine whether an image is authentic or AI-generated, revealing exactly which regions influenced the model's decision.
        </p>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setPage("upload")}
            className="tv-focus tv-btn-primary rounded-2xl px-6 py-3.5 text-sm font-semibold flex items-center gap-2"
          >
            Analyze Image <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
        className="flex justify-center md:justify-end"
      >
        <UploadCardMockup />
      </motion.div>
    </section>
  );
}

/* ----------------------------------------------------------------------- */
/* BUILT WITH                                                               */
/* ----------------------------------------------------------------------- */

const STACK = [
  { name: "React", icon: Braces },
  { name: "FastAPI", icon: Server },
  { name: "PyTorch", icon: Cpu },
  { name: "OpenCV", icon: Camera },
  { name: "Grad-CAM", icon: Flame },
  { name: "Deep Learning", icon: BrainCircuit },
  { name: "CNN", icon: Network },
];

function BuiltWith() {
  return (
    <section className="py-20 px-6 max-w-6xl mx-auto">
      <p className="text-center text-xs tracking-[0.2em] tv-text-secondary mb-8 font-medium">BUILT WITH</p>
      <div className="flex flex-wrap justify-center gap-4">
        {STACK.map(({ name, icon: Icon }) => (
          <div key={name} className="tv-card tv-card-hover rounded-2xl px-5 py-3 flex items-center gap-2.5">
            <Icon size={17} className="tv-accent" strokeWidth={1.75} />
            <span className="text-sm font-medium">{name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------- */
/* FEATURES                                                                 */
/* ----------------------------------------------------------------------- */

const FEATURES = [
  { icon: Gauge, title: "High Accuracy Detection", desc: "Fine-tuned convolutional architecture trained to distinguish authentic photography from synthetic generation." },
  { icon: Eye, title: "Explainable AI with Grad-CAM", desc: "Every prediction is paired with a visual heatmap showing exactly which regions informed the model's decision." },
  { icon: Zap, title: "Fast Predictions", desc: "Optimized inference pipeline returns a verdict and confidence score in a couple of seconds." },
  { icon: Layers, title: "Research-Oriented Architecture", desc: "Built on a documented, reproducible pipeline suited for academic evaluation and further study." },
  { icon: ScanEye, title: "Responsive Interface", desc: "A consistent experience across desktop, tablet, and mobile, with no compromise on clarity." },
  { icon: ShieldCheck, title: "Secure Image Processing", desc: "Uploaded images are processed in memory for analysis and are not retained beyond your session." },
];

function Features() {
  return (
    <section id="features" className="py-28 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-14">
        <h2 className="tv-display text-3xl font-bold mb-3">Features</h2>
        <p className="tv-text-secondary max-w-xl mx-auto">A focused set of capabilities, each built to make a detection result easier to trust.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="tv-card tv-card-hover rounded-[20px] p-6"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: "rgba(37,99,235,0.12)" }}>
              <Icon size={20} className="tv-accent" strokeWidth={1.75} />
            </div>
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="tv-text-secondary text-sm leading-relaxed">{desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------- */
/* HOW IT WORKS                                                             */
/* ----------------------------------------------------------------------- */

const STEPS = [
  { title: "Upload Image", desc: "Drag and drop a photo, or browse your device to select one." },
  { title: "AI Model Analysis", desc: "A fine-tuned CNN evaluates the image for signs of synthetic generation." },
  { title: "View Prediction + Grad-CAM", desc: "See the verdict, confidence score, and a heatmap of the regions that mattered." },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 px-6 max-w-4xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="tv-display text-3xl font-bold mb-3">How It Works</h2>
        <p className="tv-text-secondary">From upload to explanation, in three steps.</p>
      </div>
      <div className="relative">
        <div className="hidden md:block absolute left-0 right-0 top-6 h-px" style={{ background: "var(--border)" }} />
        <div className="grid md:grid-cols-3 gap-10">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative text-center md:text-left"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto md:mx-0 mb-5 font-semibold tv-display relative z-10"
                style={{ background: "var(--accent)" }}
              >
                {i + 1}
              </div>
              <h3 className="font-semibold mb-2">{step.title}</h3>
              <p className="tv-text-secondary text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------- */
/* WHY TRUEVISION                                                          */
/* ----------------------------------------------------------------------- */

const WHY = [
  { icon: Eye, title: "Explainability", desc: "Grad-CAM heatmaps make every verdict inspectable, not just a black-box label." },
  { icon: ShieldCheck, title: "Transparency", desc: "Confidence scores are shown alongside every prediction, never hidden." },
  { icon: BrainCircuit, title: "Deep Learning", desc: "Built on a convolutional architecture fine-tuned specifically for this task." },
  { icon: FileImage, title: "Image Authenticity", desc: "Focused on one problem: telling real photography apart from synthetic output." },
  { icon: Layers, title: "Modern Research", desc: "Grounded in current techniques for generative image detection." },
];

function WhyTrueVision() {
  return (
    <section id="about" className="py-28 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-14">
        <h2 className="tv-display text-3xl font-bold mb-3">Why TrueVision</h2>
        <p className="tv-text-secondary max-w-xl mx-auto">A small set of principles guided every design decision.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {WHY.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="tv-card tv-card-hover rounded-[20px] p-6">
            <Icon size={20} className="tv-accent mb-4" strokeWidth={1.75} />
            <h3 className="font-semibold mb-2 text-sm">{title}</h3>
            <p className="tv-text-secondary text-xs leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------- */
/* FAQ                                                                      */
/* ----------------------------------------------------------------------- */

const FAQS = [
  { q: "How accurate is the model?", a: "The model is fine-tuned on a large, labeled dataset of real and AI-generated images and evaluated on a held-out test set before deployment." },
  { q: "What image formats are supported?", a: "JPEG, PNG, and WebP images are supported, up to 10 MB, for fast analysis." },
  { q: "What is Grad-CAM?", a: "Grad-CAM is a technique that highlights which regions of an image most influenced a convolutional network's prediction, shown here as a heatmap overlay." },
  { q: "Does TrueVision store uploaded images?", a: "Images are processed in memory to generate a result and are not retained beyond your session." },
  { q: "Can AI-generated images always be detected?", a: "No detector is perfect. Generative models continue to evolve, and results should be read as a confidence estimate rather than an absolute guarantee." },
];

function FaqItem({ q, a, isOpen, onClick }) {
  return (
    <div className="tv-card rounded-2xl overflow-hidden">
      <button onClick={onClick} className="tv-focus w-full flex items-center justify-between px-6 py-5 text-left">
        <span className="font-medium text-sm">{q}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={18} className="tv-text-secondary" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="tv-text-secondary text-sm leading-relaxed px-6 pb-5">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Faq() {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <section className="py-28 pb-32 px-6 max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="tv-display text-3xl font-bold mb-3">Frequently Asked Questions</h2>
      </div>
      <div className="flex flex-col gap-3">
        {FAQS.map((item, i) => (
          <FaqItem key={item.q} {...item} isOpen={openIndex === i} onClick={() => setOpenIndex(openIndex === i ? -1 : i)} />
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------- */
/* FINAL CTA + FOOTER                                                       */
/* ----------------------------------------------------------------------- */

function Footer() {
  return (
    <footer className="tv-border border-t py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <span className="tv-display text-sm font-bold tracking-[0.2em]">TRUEVISION</span>
        <nav className="flex flex-wrap justify-center gap-6">
          {NAV_LINKS.map((link) => (
            <a key={link} href={`#${link.toLowerCase().replace(/\s/g, "-")}`} className="tv-focus tv-text-secondary text-xs hover:text-white transition-colors">
              {link}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <a href="https://github.com/akshyat-i07" className="tv-focus tv-text-secondary hover:text-white transition-colors" aria-label="GitHub"><Github size={17} /></a>
          <a href="https://www.linkedin.com/in/akshyat-bora-6693a0341/" className="tv-focus tv-text-secondary hover:text-white transition-colors" aria-label="LinkedIn"><Linkedin size={17} /></a>
          <a href="mailto:akshyat.bora30@gmail.com" className="tv-focus tv-text-secondary hover:text-white transition-colors" aria-label="Email"><Mail size={17} /></a>
        </div>
      </div>
      <p className="tv-text-secondary text-xs text-center mt-8">&copy; {new Date().getFullYear()} TrueVision. All rights reserved.</p>
    </footer>
  );
}

/* ----------------------------------------------------------------------- */
/* LANDING PAGE                                                             */
/* ----------------------------------------------------------------------- */

function LandingPage({ setPage }) {
  return (
    <>
      <Hero setPage={setPage} />
      <BuiltWith />
      <Features />
      <HowItWorks />
      <WhyTrueVision />
      <Faq />
      <Footer />
    </>
  );
}

/* ----------------------------------------------------------------------- */
/* UPLOAD PAGE                                                              */
/* ----------------------------------------------------------------------- */

function UploadPage({ onAnalyze, setPage, initialError }) {
  const [dragActive, setDragActive] = useState(false);
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState(initialError || null);
  const inputRef = useRef(null);

  const handleFile = useCallback((selected) => {
    if (!selected) return;
    if (!ACCEPTED_TYPES.has(selected.type)) {
      setErrorMsg("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg("Choose an image smaller than 10 MB.");
      return;
    }
    setErrorMsg(null);
    setFile(selected);
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target.result);
    reader.readAsDataURL(selected);
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-lg">
        <button onClick={() => setPage("landing")} className="tv-focus tv-text-secondary text-sm mb-8 hover:text-white transition-colors">
          &larr; Back to home
        </button>
        <h1 className="tv-display text-2xl font-bold mb-2 text-center">Upload an Image</h1>
        <p className="tv-text-secondary text-sm text-center mb-8">Drag and drop, or browse your device</p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={`tv-card tv-dropzone rounded-[20px] p-8 text-center transition-all duration-300 ${dragActive ? "tv-dropzone-active" : ""}`}
        >
          {!image ? (
            <div className="py-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(37,99,235,0.12)" }}>
                <Upload size={22} className="tv-accent" strokeWidth={1.75} />
              </div>
              <p className="font-medium mb-2">Drop your image here</p>
              <p className="tv-text-secondary text-sm mb-6">JPEG, PNG or WebP &middot; up to 10 MB</p>
              <button onClick={() => inputRef.current?.click()} className="tv-focus tv-btn-secondary rounded-xl px-5 py-2.5 text-sm font-medium">
                Browse Files
              </button>
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
              <div
                className="rounded-2xl overflow-hidden mb-5 tv-border border flex items-center justify-center"
                style={{ background: "#0A0F1C", maxHeight: "22rem" }}
              >
                <img
                  src={image}
                  alt="Selected preview"
                  className="w-full max-h-[22rem] object-contain"
                />
              </div>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => inputRef.current?.click()} className="tv-focus tv-btn-secondary rounded-xl px-4 py-2 text-xs font-medium">
                  Replace Image
                </button>
                <button onClick={() => { setImage(null); setFile(null); }} className="tv-focus tv-btn-secondary rounded-xl px-4 py-2 text-xs font-medium">
                  Remove Image
                </button>
                <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
              </div>
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="tv-card rounded-xl p-4 mt-4 flex items-start gap-3"
            >
              <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm tv-text-secondary">{errorMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          disabled={!image}
          onClick={() => onAnalyze(file, image)}
          className="tv-focus tv-btn-primary w-full rounded-2xl px-6 py-3.5 text-sm font-semibold mt-6 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Analyze Image <ArrowRight size={16} />
        </button>
      </motion.div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* LOADING PAGE                                                             */
/* ----------------------------------------------------------------------- */

const LOADING_STAGES = ["Uploading Image...", "Running AI Model...", "Generating Grad-CAM...", "Preparing Results..."];

function LoadingPage() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (stage >= LOADING_STAGES.length - 1) return;
    const t = setTimeout(() => setStage((s) => s + 1), 850);
    return () => clearTimeout(t);
  }, [stage]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 rounded-full mb-10"
        style={{ border: "3px solid rgba(255,255,255,0.08)", borderTopColor: "var(--accent-hover)" }}
      />
      <div className="flex flex-col items-center gap-3">
        {LOADING_STAGES.map((label, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0 }}
            animate={{ opacity: i === stage ? 1 : i < stage ? 0.35 : 0.15 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 text-sm"
          >
            {i < stage && <CheckCircle2 size={14} className="text-emerald-400" />}
            <span className={i === stage ? "font-medium" : "tv-text-secondary"}>{label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* RESULTS PAGE                                                             */
/* ----------------------------------------------------------------------- */

function ImagePanel({ label, src, accentBadge }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="tv-text-secondary text-xs font-medium">{label}</span>
        {accentBadge}
      </div>
      <div
        className="relative rounded-2xl overflow-hidden tv-border border flex items-center justify-center"
        style={{ background: "#0A0F1C", height: "18rem" }}
      >
        <img
          src={src}
          alt={label}
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />
      </div>
    </div>
  );
}

function ResultsPage({ image, result, onReset }) {
  const isReal = result.label === "REAL";

  return (
    <div className="min-h-screen flex flex-col items-center px-6 pt-24 pb-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-2xl">
        <h1 className="tv-display text-2xl font-bold text-center mb-2">Analysis Result</h1>
        <p className="tv-text-secondary text-sm text-center mb-8">
          The original image and its Grad-CAM heatmap, side by side
        </p>

        {result.demoMode && (
          <div className="tv-badge-warn text-xs rounded-lg px-3 py-2 mb-5 flex items-center gap-2 justify-center">
            <AlertTriangle size={13} />
            Demo mode: model isn't trained yet, result is illustrative.
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <ImagePanel label="Original Image" src={image} />
          <ImagePanel label="Grad-CAM Heatmap" src={result.heatmap || image} />
        </div>

        <div className="tv-card rounded-[20px] p-6 mt-6">
          <div className="flex items-center justify-between mb-5">
            <span className="tv-text-secondary text-sm">Prediction</span>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${isReal ? "tv-badge-real" : "tv-badge-fake"}`}>
              {isReal ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              {isReal ? "REAL" : "AI GENERATED"}
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="tv-text-secondary text-sm">Confidence</span>
            <span className="text-sm font-semibold">{result.confidence.toFixed(1)}%</span>
          </div>
          <div className="tv-progress-track rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.confidence}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: isReal ? "#34D399" : "var(--accent-hover)" }}
            />
          </div>
        </div>

        <button
          onClick={onReset}
          className="tv-focus tv-btn-secondary w-full rounded-2xl px-6 py-3.5 text-sm font-semibold mt-6 flex items-center justify-center gap-2"
        >
          <RotateCcw size={15} /> Analyze Another Image
        </button>
      </motion.div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* APP                                                                      */
/* ----------------------------------------------------------------------- */

export default function App() {
  const [page, setPage] = useState("landing");
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const handleAnalyze = async (file, imagePreview) => {
    setImage(imagePreview);
    setPage("loading");
    setUploadError(null);

    const startedAt = Date.now();

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.detail || `Request failed (${response.status})`);
      }

      const data = await response.json();

      if (
        !["REAL", "FAKE"].includes(data.label) ||
        !Number.isFinite(data.confidence) ||
        data.confidence < 0 ||
        data.confidence > 100
      ) {
        throw new Error("The API returned an invalid prediction response.");
      }

      // Keep the loading animation visible for a minimum duration so it
      // doesn't flash by instantly on a fast local backend.
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
      }

      setResult({
        label: data.label,
        confidence: data.confidence,
        heatmap: data.heatmap,
        demoMode: data.demo_mode,
      });
      setPage("results");
    } catch (err) {
      setUploadError(
        err.message === "Failed to fetch"
          ? `Couldn't reach the TrueVision API at ${API_URL}. Is the backend running?`
          : err.message
      );
      setPage("upload");
    }
  };

  const handleReset = () => {
    setImage(null);
    setResult(null);
    setUploadError(null);
    setPage("upload");
  };

  return (
    <div className="tv-root">
      <GlobalStyles />
      <NavBar page={page} setPage={setPage} />
      <AnimatePresence mode="wait">
        {page === "landing" && (
          <motion.div key="landing" exit={{ opacity: 0 }}>
            <LandingPage setPage={setPage} />
          </motion.div>
        )}
        {page === "upload" && (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <UploadPage onAnalyze={handleAnalyze} setPage={setPage} initialError={uploadError} />
          </motion.div>
        )}
        {page === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoadingPage />
          </motion.div>
        )}
        {page === "results" && result && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ResultsPage image={image} result={result} onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
