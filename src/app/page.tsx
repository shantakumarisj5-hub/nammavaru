import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0F0A0A] text-white">
      <Navbar />

      {/* ========== HERO SECTION ========== */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <p className="text-yellow-400/90 text-lg md:text-xl mb-6 font-medium">
            ಒಂದು ಅವಕಾಶ. ಒಂದು ಸಂಪರ್ಕ. ಒಂದು ಬದಲಾವಣೆ.
          </p>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            Find opportunities.<br />
            Meet your people.<br />
            <span className="text-yellow-400">Grow together.</span>
          </h1>

          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            A trusted professional community for Kannadigas — where students, freshers and working professionals help each other with jobs, referrals and mentorship.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-14">
            <a
              href="/join"
              className="bg-yellow-400 text-black font-semibold px-8 py-3.5 rounded-full text-lg hover:bg-yellow-300 transition"
            >
              Join the Community
            </a>
            <a
              href="/about"
              className="border border-white/30 text-white px-8 py-3.5 rounded-full text-lg hover:bg-white/10 transition"
            >
              Learn More
            </a>
          </div>

          <p className="text-white/50 text-sm">
            ನಮ್ಮವರ ಜೊತೆ, ನಿಮ್ಮ ಮುಂದಿನ ಹೆಜ್ಜೆ.
          </p>
        </div>
      </section>

      {/* ========== PROBLEM SECTION ========== */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Nammavaru exists</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Too many talented Kannadigas miss good opportunities only because they don’t have the right connections.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-yellow-400 font-semibold text-lg mb-2">Scattered Opportunities</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Jobs and internships are shared randomly across WhatsApp, Telegram and Instagram groups.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-yellow-400 font-semibold text-lg mb-2">No Strong Network</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Most students and freshers struggle to get referrals because they don’t know working professionals.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-yellow-400 font-semibold text-lg mb-2">Trust is Missing</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Many groups are filled with spam, fake offers and coaching centre scams.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What you can do here</h2>
            <p className="text-white/60">Built for real help, not just job listings.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Jobs & Internships", desc: "Discover genuine opportunities shared by the community." },
              { title: "Referral Network", desc: "Request referrals from working professionals and help others." },
              { title: "Mentorship", desc: "Get career guidance from experienced people." },
              { title: "Professional Network", desc: "Connect with people from your college, city or domain." },
              { title: "Verified Community", desc: "Students, professionals and startups go through verification." },
              { title: "Scam Awareness", desc: "Stay safe from fake offers and coaching scams." },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-yellow-400/40 transition"
              >
                <h3 className="text-yellow-400 font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how" className="py-20 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-14">How it works</h2>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { step: "1", title: "Create Profile", desc: "Sign up as Student, Fresher, Professional or Startup." },
              { step: "2", title: "Get Verified", desc: "Complete simple verification to build trust." },
              { step: "3", title: "Connect & Request", desc: "Find opportunities and request referrals." },
              { step: "4", title: "Grow Together", desc: "Help others and build a strong network." },
            ].map((item) => (
              <div key={item.step}>
                <div className="w-12 h-12 bg-yellow-400 text-black font-bold rounded-full flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== WHO IS IT FOR ========== */}
      <section id="who" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-14">Who is it for?</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { title: "Students", desc: "Find internships, mentors and guidance." },
              { title: "Freshers", desc: "Get referrals and first job opportunities." },
              { title: "Professionals", desc: "Give referrals and mentor others." },
              { title: "Startups", desc: "Hire talented local candidates." },
            ].map((item) => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="py-24 border-t border-white/10">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-yellow-400 text-lg mb-4">ನಮ್ಮವರು ಸೇರಿ. ಮುಂದೆ ಸಾಗೋಣ.</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to grow with your people?
          </h2>
          <p className="text-white/60 text-lg mb-10">
            Join a trusted community where Kannadigas help each other move forward.
          </p>
          <a
            href="/join"
            className="inline-block bg-yellow-400 text-black font-semibold px-10 py-4 rounded-full text-lg hover:bg-yellow-300 transition"
          >
            Join Nammavaru – It’s Free
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}