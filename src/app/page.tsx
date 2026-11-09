
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0F0A0A] text-white">
      <Navbar />

      {/* HERO SECTION */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <p className="text-yellow-400/90 text-lg md:text-xl mb-6 font-medium">
            ಒಂದು ಅವಕಾಶ. ಒಂದು ಸಂಪರ್ಕ. ಒಂದು ಬದಲಾವಣೆ.
          </p>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            Find opportunities.
            <br />
            Meet your people.
            <br />
            <span className="text-yellow-400">Grow together.</span>
          </h1>

          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            A trusted professional community for Kannadigas — where students,
            freshers and working professionals help each other with jobs,
            referrals and mentorship.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-14">
            <a
              href="/join"
              className="bg-yellow-400 text-black font-semibold px-8 py-4 rounded-xl hover:bg-yellow-300 transition"
            >
              Join the Community
            </a>

            <a
              href="/about"
              className="border border-white/20 text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/10 transition"
            >
              Learn More
            </a>
          </div>

          <p className="text-white/50 text-sm">
            ನಮ್ಮವರ ಜೊತೆ, ನಿಮ್ಮ ಮುಂದಿನ ಹೆಜ್ಜೆ.
          </p>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-yellow-400 font-medium mb-4">
              The problem we want to solve
            </p>

            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Opportunities are everywhere.
              <span className="text-yellow-400"> Connections make the difference.</span>
            </h2>

            <p className="text-white/60 text-lg leading-relaxed">
              Many talented Kannadigas struggle to find genuine opportunities,
              trusted referrals and the right guidance. Nammavaru brings our
              community together so we can grow by helping one another.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-yellow-400 font-medium mb-4">
              What you can do here
            </p>

            <h2 className="text-3xl md:text-5xl font-bold">
              More than a professional network.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Find Opportunities",
                description:
                  "Discover job opportunities and internships shared by our community.",
              },
              {
                title: "Get Referrals",
                description:
                  "Connect with professionals and request genuine referrals.",
              },
              {
                title: "Learn and Grow",
                description:
                  "Find mentors, share knowledge and support fellow Kannadigas.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white/[0.04] border border-white/10 rounded-2xl p-8"
              >
                <h3 className="text-xl font-bold text-yellow-400 mb-4">
                  {feature.title}
                </h3>

                <p className="text-white/60 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-yellow-400 font-medium mb-4">Simple steps</p>

            <h2 className="text-3xl md:text-5xl font-bold">
              How Nammavaru works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              {
                number: "01",
                title: "Join the Community",
                description:
                  "Become part of a network built to support Kannadigas.",
              },
              {
                number: "02",
                title: "Build Connections",
                description:
                  "Meet students, professionals, mentors and employers.",
              },
              {
                number: "03",
                title: "Grow Together",
                description:
                  "Find opportunities, share referrals and help others succeed.",
              },
            ].map((step) => (
              <div key={step.number}>
                <p className="text-4xl font-bold text-yellow-400 mb-4">
                  {step.number}
                </p>

                <h3 className="text-xl font-bold mb-3">{step.title}</h3>

                <p className="text-white/60 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IS IT FOR */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-yellow-400 font-medium mb-4">
            Built for our people
          </p>

          <h2 className="text-3xl md:text-5xl font-bold mb-10">
            A community for every stage of your career.
          </h2>

          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Students",
              "Freshers",
              "Job Seekers",
              "Working Professionals",
              "Mentors",
              "Startup Founders",
              "Employers",
            ].map((item) => (
              <span
                key={item}
                className="border border-white/15 bg-white/[0.04] rounded-full px-6 py-3 text-white/80"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 border-t border-white/10">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-yellow-400 text-lg mb-4">
            ನಮ್ಮವರು ಸೇರಿ. ಮುಂದೆ ಸಾಗೋಣ.
          </p>

          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to grow with your people?
          </h2>

          <p className="text-white/60 text-lg mb-10">
            Join a trusted community where Kannadigas help each other move
            forward.
          </p>

          <a
            href="/join"
            className="inline-block bg-yellow-400 text-black font-semibold px-8 py-4 rounded-xl hover:bg-yellow-300 transition"
          >
            Join Nammavaru – It’s Free
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
