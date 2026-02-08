"use client";

export default function SiteFooter() {
  return (
    <footer className="border-t-3 border-black bg-white px-6 py-16">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 md:flex-row">
        <div className="group flex items-center gap-2">
          <img
            src="/offramp-logo.png"
            alt="OffRamp logo"
            className="h-10 w-10 rounded border-2 border-black bg-white object-cover transition-transform duration-300 group-hover:rotate-6"
          />
          <span className="font-impact text-4xl uppercase">OffRamp</span>
        </div>
        <div className="flex flex-wrap justify-center gap-8 text-sm font-black uppercase tracking-widest">
          <a className="transition-colors duration-300 hover:scale-110 hover:text-accent" href="#">
            Privacy
          </a>
          <a className="transition-colors duration-300 hover:scale-110 hover:text-accent" href="#">
            Terms
          </a>
          <a className="transition-colors duration-300 hover:scale-110 hover:text-accent" href="#">
            LinkedIn
          </a>
          <a className="transition-colors duration-300 hover:scale-110 hover:text-accent" href="#">
            Contact
          </a>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          © 2026 OFFRAMP. BE BOLD. EAT WELL.
        </div>
      </div>
    </footer>
  );
}
