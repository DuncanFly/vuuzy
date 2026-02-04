import React, { useState, useRef, useEffect } from 'react';

// Configuration (Environment provided)
const apiKey = ""; 
const appId = typeof __app_id !== 'undefined' ? __app_id : 'vuuzy-app';

export default function App() {
  const [view, setView] = useState('home'); // 'home', 'privacy', 'terms', or 'contact'
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingText, setProcessingText] = useState("Analyzing Image...");
  const [error, setError] = useState(null);
  const [bgType, setBgType] = useState('checker');
  const [bgDescription, setBgDescription] = useState("");
  const fileInputRef = useRef(null);

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // --- Handlers ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setError("Please upload a valid image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1];
      setOriginalImage(e.target.result);
      runAiLogic(base64);
    };
    reader.readAsDataURL(file);
  };

  const runAiLogic = async (base64Data, replaceDesc = null) => {
    setIsProcessing(true);
    setError(null);
    setProcessingText(replaceDesc ? "Generating Scene..." : "Removing Background...");

    const prompt = replaceDesc 
      ? `Act as an expert image editor. Keep the main subject exactly as is, but replace the background with ${replaceDesc}. Match lighting. Output ONLY the resulting PNG.`
      : "Act as an expert image editor. Remove the background. Keep only the main subject with transparency. Output ONLY the modified PNG.";

    try {
      const response = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }, { inlineData: { mimeType: "image/png", data: base64Data } }]
            }],
            generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
          })
        }
      );

      const result = await response.json();
      const outputBase64 = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

      if (outputBase64) {
        setProcessedImage(`data:image/png;base64,${outputBase64}`);
        setBgType(replaceDesc ? 'white' : 'checker');
      } else {
        throw new Error("AI failed to return an image. It might be a safety refusal.");
      }
    } catch (err) {
      setError(err.message || "Processing failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchWithRetry = async (url, options, retries = 5, backoff = 1000) => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, backoff));
        return fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
      throw err;
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `vuuzy-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
    setBgDescription("");
  };

  const getBgStyle = () => {
    if (bgType === 'white') return { backgroundColor: 'white' };
    if (bgType === 'black') return { backgroundColor: 'black' };
    return {};
  };

  // --- Sub-components for Views ---

  const HomeView = () => (
    <>
      {/* Hero / Tool Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">AI-Powered Background Removal</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            Remove backgrounds<br />instantly
          </h1>
          
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-12">
            Drop any image, get professional results in seconds.<br />
            Free preview, pay only when you download.
          </p>

          <div className="max-w-3xl mx-auto">
            {!originalImage && !isProcessing && (
              <div 
                onClick={() => fileInputRef.current.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); processFile(e.dataTransfer.files[0]); }}
                className="w-full h-80 border border-zinc-800 rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all hover:border-zinc-500 bg-zinc-950/50 group"
              >
                <div className="bg-white/10 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform text-white">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <p className="text-lg font-semibold">Drop your image here</p>
                <p className="text-zinc-500 text-sm mt-1">or click to browse</p>
                <p className="text-[10px] text-zinc-600 mt-4 uppercase tracking-widest font-bold">Supports PNG, JPG, WEBP up to 10MB</p>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              </div>
            )}

            {isProcessing && (
              <div className="py-24 bg-zinc-900/30 border border-white/5 rounded-3xl">
                <div className="w-16 h-16 border-2 border-white/10 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
                <h3 className="text-xl font-bold">{processingText}</h3>
                <p className="text-zinc-500 text-sm mt-2">Gemini AI is isolating your subject.</p>
              </div>
            )}

            {originalImage && processedImage && !isProcessing && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="relative group">
                    <p className="absolute top-4 left-4 z-20 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Original</p>
                    <div className="h-64 rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900 flex items-center justify-center">
                      <img src={originalImage} className="max-h-full max-w-full object-contain" alt="Original" />
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="absolute top-4 right-4 z-20 flex gap-2">
                      <button onClick={() => setBgType('checker')} className="w-5 h-5 rounded border border-white/20 bg-zinc-800 flex items-center justify-center text-[8px]">🏁</button>
                      <button onClick={() => setBgType('white')} className="w-5 h-5 rounded border border-white/20 bg-white"></button>
                      <button onClick={() => setBgType('black')} className="w-5 h-5 rounded border border-white/20 bg-black"></button>
                    </div>
                    <p className="absolute top-4 left-4 z-20 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Result</p>
                    <div 
                      style={getBgStyle()}
                      className={`h-64 rounded-2xl border border-zinc-800 overflow-hidden flex items-center justify-center transition-all ${bgType === 'checker' ? 'bg-[radial-gradient(#222_1px,transparent_0)] [background-size:16px_16px]' : ''}`}
                    >
                      <img src={processedImage} className="max-h-full max-w-full object-contain drop-shadow-2xl" alt="Result" />
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 mb-8 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Replace Background</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="text" 
                      value={bgDescription}
                      onChange={(e) => setBgDescription(e.target.value)}
                      placeholder="Describe a new scene..." 
                      className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 ring-white/30 text-sm"
                    />
                    <button 
                      onClick={() => runAiLogic(originalImage.split(',')[1], bgDescription)}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button onClick={downloadImage} className="bg-white text-black font-bold py-4 px-10 rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center">
                    Download HD PNG
                  </button>
                  <button onClick={reset} className="text-zinc-400 font-bold py-4 px-10 rounded-2xl hover:text-white transition-colors">
                    Upload Another
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-16">Why choose Vuuzy?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              { title: "Lightning Fast", desc: "AI removes backgrounds in under 5 seconds. No waiting, no hassle.", icon: "⚡" },
              { title: "Privacy First", desc: "Your images are never stored. Processed securely and deleted instantly.", icon: "🛡️" },
              { title: "Pixel Perfect", desc: "Advanced AI preserves fine details like hair, fur, and transparent objects.", icon: "🎯" },
              { title: "Free Preview", desc: "See your result for free. Only pay when you're 100% satisfied.", icon: "💎" }
            ].map((f, i) => (
              <div key={i} className="bg-zinc-900/30 p-8 rounded-3xl border border-white/5 hover:border-white/20 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-6 text-lg group-hover:bg-white group-hover:text-black transition-all">
                  {f.icon}
                </div>
                <h4 className="text-lg font-bold mb-2">{f.title}</h4>
                <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-32 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-16">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="absolute top-1/2 left-0 w-full h-px bg-zinc-800 -translate-y-1/2 hidden md:block"></div>
            <div className="relative bg-black px-4">
              <div className="w-12 h-12 rounded-full border border-zinc-700 flex items-center justify-center mx-auto mb-6 bg-black text-xs font-bold">01</div>
              <h4 className="font-bold mb-2">Upload</h4>
              <p className="text-zinc-500 text-xs">Drag and drop your image or click to browse. We support all common formats.</p>
            </div>
            <div className="relative bg-black px-4">
              <div className="w-12 h-12 rounded-full border border-zinc-700 flex items-center justify-center mx-auto mb-6 bg-black text-xs font-bold">02</div>
              <h4 className="font-bold mb-2">Process</h4>
              <p className="text-zinc-500 text-xs">Our AI instantly analyzes and removes the background in seconds.</p>
            </div>
            <div className="relative bg-black px-4">
              <div className="w-12 h-12 rounded-full border border-zinc-700 flex items-center justify-center mx-auto mb-6 bg-black text-xs font-bold">03</div>
              <h4 className="font-bold mb-2">Download</h4>
              <p className="text-zinc-500 text-xs">Preview for free, then download your high-resolution result.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-zinc-500 mb-16">Preview for free. Pay only when you download.</p>
          
          <div className="max-w-md mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-zinc-700 to-zinc-900 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-zinc-900/50 rounded-[2rem] p-10 text-left border border-zinc-800">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-1">Pay per image</p>
                  <h3 className="text-4xl font-bold">$1<span className="text-lg text-zinc-500 font-medium tracking-normal">/ image</span></h3>
                </div>
                <span className="bg-white text-black text-[10px] font-black uppercase px-2 py-1 rounded">Most Popular</span>
              </div>
              <ul className="space-y-4 mb-10 text-sm">
                <li className="flex items-center gap-3"><span className="text-zinc-400">✓</span> Free preview before download</li>
                <li className="flex items-center gap-3"><span className="text-zinc-400">✓</span> Full HD resolution output</li>
                <li className="flex items-center gap-3"><span className="text-zinc-400">✓</span> Transparent PNG format</li>
                <li className="flex items-center gap-3"><span className="text-zinc-400">✓</span> No watermarks</li>
                <li className="flex items-center gap-3"><span className="text-zinc-400">✓</span> Instant delivery</li>
              </ul>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-colors">
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );

  const PrivacyView = () => (
    <section className="pt-40 pb-32 px-6 min-h-[80vh]">
      <div className="max-w-4xl mx-auto text-left">
        <h1 className="text-5xl font-bold mb-12">Privacy Policy</h1>
        
        <div className="space-y-10 text-zinc-400 leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">1. Information We Collect</h2>
            <p>We collect minimal information necessary to provide our service. Images you upload are processed immediately and deleted from our servers after processing.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">2. How We Use Your Information</h2>
            <p>Images are used solely for processing and are not stored, shared, or used for training AI models. Payment information is handled securely by Stripe.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">3. Data Retention</h2>
            <p>Uploaded images are automatically deleted within 1 hour of processing. We do not retain copies of your images or processed results.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">4. Third-Party Services</h2>
            <p>We use Stripe for payment processing. Their privacy policy governs how they handle your payment information.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">5. Cookies</h2>
            <p>We use essential cookies only to ensure the proper functioning of our service. We do not use tracking or advertising cookies.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">6. Contact</h2>
            <p>For privacy-related questions, please contact us at <a href="mailto:privacy@vuuzy.com" className="text-white hover:underline">privacy@vuuzy.com</a>.</p>
          </div>

          <div className="pt-8 border-t border-zinc-900">
            <p className="text-xs text-zinc-600">Last updated: February 2026</p>
          </div>
        </div>
      </div>
    </section>
  );

  const TermsView = () => (
    <section className="pt-40 pb-32 px-6 min-h-[80vh]">
      <div className="max-w-4xl mx-auto text-left">
        <h1 className="text-5xl font-bold mb-12">Terms of Service</h1>
        
        <div className="space-y-10 text-zinc-400 leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p>By accessing and using Vuuzy ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">2. Service Description</h2>
            <p>Vuuzy provides AI-powered background removal services for images. We offer free preview functionality and paid downloads for high-resolution outputs.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">3. User Responsibilities</h2>
            <p>You are responsible for ensuring you have the rights to any images you upload. You agree not to upload illegal, offensive, or copyrighted content without permission.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">4. Payment Terms</h2>
            <p>Payments are processed securely through Stripe. All purchases are final and non-refundable unless the service fails to deliver the promised result.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">5. Limitation of Liability</h2>
            <p>Vuuzy is provided "as is" without warranties. We are not liable for any damages arising from your use of the service.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4">6. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of any changes.</p>
          </div>

          <div className="pt-8 border-t border-zinc-900">
            <p className="text-xs text-zinc-600">Last updated: February 2026</p>
          </div>
        </div>
      </div>
    </section>
  );

  const ContactView = () => {
    const [status, setStatus] = useState('idle'); // 'idle', 'submitting', 'success'

    const handleSubmit = (e) => {
      e.preventDefault();
      setStatus('submitting');
      setTimeout(() => setStatus('success'), 1500);
    };

    return (
      <section className="pt-40 pb-32 px-6 min-h-[80vh]">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h1 className="text-5xl font-bold mb-4">Get in touch</h1>
          <p className="text-zinc-500 mb-12">Have a question or feedback? We'd love to hear from you.</p>

          {status === 'success' ? (
            <div className="bg-zinc-900/50 p-12 rounded-3xl border border-white/5 animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
                 <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                 </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Message sent!</h3>
              <p className="text-zinc-500 text-sm">We'll get back to you as soon as possible.</p>
              <button 
                onClick={() => setStatus('idle')}
                className="mt-8 text-white font-bold text-sm hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">Email</label>
                <input 
                  required
                  type="email" 
                  placeholder="you@example.com" 
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:ring-1 ring-white/20 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">Subject</label>
                <input 
                  required
                  type="text" 
                  placeholder="How can we help?" 
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:ring-1 ring-white/20 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 ml-1">Message</label>
                <textarea 
                  required
                  rows="5"
                  placeholder="Tell us more..." 
                  className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:ring-1 ring-white/20 transition-all text-sm resize-none"
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                disabled={status === 'submitting'}
                className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
              >
                {status === 'submitting' ? (
                  <div className="w-5 h-5 border-2 border-black/10 border-t-black rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Message
                  </>
                )}
              </button>

              <p className="text-center text-[10px] text-zinc-600 mt-6 uppercase tracking-widest font-bold">
                Or email us directly at <a href="mailto:hello@vuuzy.com" className="text-zinc-400 hover:text-white transition-colors">hello@vuuzy.com</a>
              </p>
            </form>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 border-b border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-black font-black text-xl">v</span>
            </div>
            <span className="text-xl font-bold tracking-tighter">vuuzy</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <button onClick={() => { setView('home'); setTimeout(() => { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }, 100); }} className="hover:text-white transition-colors">Features</button>
            <button onClick={() => { setView('home'); setTimeout(() => { document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }, 100); }} className="hover:text-white transition-colors">How it Works</button>
            <button onClick={() => { setView('home'); setTimeout(() => { document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }, 100); }} className="hover:text-white transition-colors">Pricing</button>
          </div>
          <button 
            onClick={() => { setView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="bg-white text-black text-sm font-bold px-5 py-2 rounded-full hover:bg-zinc-200 transition-colors"
          >
            Try Free
          </button>
        </div>
      </nav>

      {/* Conditional Rendering of Views */}
      {view === 'home' && <HomeView />}
      {view === 'privacy' && <PrivacyView />}
      {view === 'terms' && <TermsView />}
      {view === 'contact' && <ContactView />}

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-zinc-900 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-zinc-500 text-xs font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2 text-white cursor-pointer" onClick={() => setView('home')}>
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
              <span className="text-black font-black text-xs">v</span>
            </div>
            <span className="text-lg font-bold tracking-tighter">vuuzy</span>
          </div>
          <div className="flex gap-8">
            <button onClick={() => setView('terms')} className="hover:text-white transition-colors uppercase">Terms</button>
            <button onClick={() => setView('privacy')} className="hover:text-white transition-colors uppercase">Privacy</button>
            <button onClick={() => setView('contact')} className="hover:text-white transition-colors uppercase">Contact</button>
          </div>
          <p>© 2026 Vuuzy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}