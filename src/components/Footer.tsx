export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-10 mt-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-md flex items-center justify-center text-black font-bold">
              ನ
            </div>
            <span className="font-bold text-lg">Nammavaru</span>
          </div>

          <div className="flex gap-6 text-sm text-white/50">
            <a href="/about" className="hover:text-yellow-400 transition">About</a>
            <a href="/join" className="hover:text-yellow-400 transition">Join</a>
            <a href="/trust" className="hover:text-yellow-400 transition">Trust & Safety</a>
          </div>
        </div>

        <div className="text-center md:text-left text-white/40 text-sm mt-8">
          <p>Find opportunities. Meet your people. Grow together.</p>
          <p className="mt-1">ನಮ್ಮವರ ಜೊತೆ, ನಿಮ್ಮ ಮುಂದಿನ ಹೆಜ್ಜೆ.</p>
        </div>

        <div className="text-center text-white/30 text-xs mt-6">
          © 2026 Nammavaru. Built with care for the community.
        </div>
      </div>
    </footer>
  );
}