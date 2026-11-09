import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Trust() {
  return (
    <main className="min-h-screen bg-[#0F0A0A] text-white">
      <Navbar />

      <section className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-yellow-400 mb-4">ನಂಬಿಕೆ ಮತ್ತು ಸುರಕ್ಷತೆ</p>
        <h1 className="text-4xl md:text-5xl font-bold mb-8">Trust & Safety</h1>

        <div className="space-y-8 text-white/70 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Our Promise</h2>
            <p>
              Nammavaru is built on trust. We want this community to stay safe, helpful and free from spam and scams.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">What we do</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>We verify students, professionals and startups</li>
              <li>We moderate job and internship posts</li>
              <li>We take reports of fake offers seriously</li>
              <li>We educate members about common job scams</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Important Rules</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Never pay anyone for a job or internship</li>
              <li>Never share your OTP, bank details or passwords</li>
              <li>Be careful of coaching centres that promise guaranteed placement</li>
              <li>Report anything that looks suspicious</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Scam Awareness</h2>
            <p>
              Many students lose money to fake job offers and fake certificates.
              On Nammavaru, we actively work to reduce this risk through verification and community reporting.
            </p>
          </div>

          <div className="pt-4">
            <p className="text-yellow-400 font-medium">
              ನಮ್ಮವರು ಸುರಕ್ಷಿತರಾಗಿರಿ. ಒಬ್ಬರಿಗೊಬ್ಬರು ಸಹಾಯ ಮಾಡಿ.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}