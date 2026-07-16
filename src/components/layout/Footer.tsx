import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { SmartCardLogo } from "@/components/brand/SmartCardLogo";

const footerLinks = {
  Product: [
    { name: "Features", href: "/products" },
    { name: "Templates", href: "/templates" },
    { name: "Marketplace", href: "/marketplace" },
    { name: "Pricing", href: "/pricing" },
  ],
  Resources: [
    { name: "Help Center", href: "/learn" },
    { name: "Blog", href: "/learn" },
    { name: "Community", href: "#" },
    { name: "Creators", href: "#" },
  ],
  Company: [
    { name: "About", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Press", href: "#" },
    { name: "Contact", href: "/contact" },
  ],
  Legal: [
    { name: "Terms", href: "#" },
    { name: "Privacy", href: "#" },
    { name: "Cookies", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer
      className="relative overflow-hidden border-t border-white/[0.06] bg-[#0a0a1a] text-white"
      role="contentinfo"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#4f46e5]/60 to-transparent" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[600px] -translate-x-1/2 rounded-full bg-[#4f46e5]/10 blur-[140px]" />

      <div className="container relative z-10 mx-auto px-4 pb-20 pt-10 sm:pb-16 sm:pt-20">
        <div className="grid grid-cols-2 gap-5 sm:gap-10 md:grid-cols-6">
          {/* Brand + contact */}
          <div className="col-span-2 md:col-span-2">
            <Link to="/" className="group inline-flex items-center gap-2" aria-label="SmartCard — homepage">
              <SmartCardLogo className="h-6 w-6 text-[#a5b4fc] transition-transform group-hover:scale-110 group-hover:-rotate-3 sm:h-7 sm:w-7" />
              <span className="font-display text-lg font-bold tracking-tight sm:text-xl">
                Smart<span className="text-[#a5b4fc]">Card</span>
              </span>
            </Link>
            <p className="mt-2 max-w-xs font-body-alt text-[13px] text-white/55 sm:mt-4 sm:text-sm">
              Everything you are. In one simple tap.
            </p>
            <ul className="mt-3 space-y-2 font-body-alt text-[13px] sm:mt-5 sm:space-y-3 sm:text-sm">
              <li className="flex items-start gap-2 text-white/70 hover:text-white sm:gap-2.5">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#a5b4fc] sm:h-4 sm:w-4" />
                <a href="mailto:info@smartcardsa.shop" className="break-all">info@smartcardsa.shop</a>
              </li>
              <li className="flex items-start gap-2 text-white/70 hover:text-white sm:gap-2.5">
                <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#a5b4fc] sm:h-4 sm:w-4" />
                <a href="tel:+966502900193" dir="ltr">+966 50 290 0193</a>
              </li>
              <li className="flex items-start gap-2 text-white/70 sm:gap-2.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#a5b4fc] sm:h-4 sm:w-4" />
                <span className="leading-snug">King Fahad St, Al Faisaliya<br />Jeddah 23435, KSA</span>
              </li>
            </ul>
          </div>

          {/* Link groups */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <nav key={category} aria-labelledby={`footer-${category.toLowerCase()}`}>
              <h4
                id={`footer-${category.toLowerCase()}`}
                className="mb-2 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 sm:mb-4 sm:text-[11px] sm:tracking-[0.2em]"
              >
                {category}
              </h4>
              <ul className="space-y-1.5 font-body-alt text-[13px] sm:space-y-2.5 sm:text-sm" role="list">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="group inline-flex items-center gap-1 text-white/70 transition-colors hover:text-[#a5b4fc]"
                    >
                      {link.name}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-60" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-4 text-center sm:mt-16 sm:gap-4 sm:pt-8 md:flex-row md:text-left">
          <p className="font-body-alt text-[11px] text-white/40 sm:text-xs">
            © {new Date().getFullYear()} SmartCard. All rights reserved.
          </p>
          <nav aria-label="Social media">
            <ul className="flex items-center gap-3 sm:gap-4" role="list">
              {[
                { label: "Twitter", d: "M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" },
                { label: "Instagram", d: "M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" },
                { label: "YouTube", d: "M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" },
              ].map((s) => (
                <li key={s.label}>
                  <a
                    href="#"
                    aria-label={s.label}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 transition-all hover:border-[#4f46e5]/50 hover:bg-[#4f46e5]/10 hover:text-[#a5b4fc] sm:h-9 sm:w-9"
                  >
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" clipRule="evenodd" d={s.d} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
