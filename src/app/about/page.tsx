import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function About() {
  return (
    <main className="min-h-screen bg-[#0F0A0A] text-white">
      <Navbar />

      <section className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-yellow-400 mb-4">ನಮ್ಮ ಬಗ್ಗೆ</p>

        <h1 className="text-4xl md:text-5xl font-bold mb-8">
          About Nammavaru
        </h1>

        <div className="space-y-6 text-white/70 text-lg leading-relaxed">
          <p>
            Nammavaru is a trusted professional community built for Kannadigas.
          </p>

          <p>
            We believe that talent should not miss opportunities only because of a lack of connections.
            Students, freshers, working professionals and startups should be able to support each other.
          </p>

          <p>
            Our goal is to create a safe and useful platform where people can:
          </p>

          <ul className="list-disc list-inside space-y-2 text-white/80">
            <li>Discover genuine jobs and internships</li>
            <li>Request and give referrals</li>
            <li>Find mentors and guidance</li>
            <li>Build meaningful professional connections</li>
            <li>Stay safe from scams and fake offers</li>
          </ul>

          <p className="pt-4">
            ನಮ್ಮವರ ಜೊತೆ, ನಿಮ್ಮ ಮುಂದಿನ ಹೆಜ್ಜೆ.
          </p>

          <p className="text-white font-medium">
            We are not just building a website. We are building a community where people help people move forward.
          </p>
        </div>

        <div className="mt-12">
          <a
            href="/join"
            className="inline-block bg-yellow-400 text-black font-semibold px-8 py-3 rounded-full hover:bg-yellow-300 transition"
          >
            Join the Community
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}