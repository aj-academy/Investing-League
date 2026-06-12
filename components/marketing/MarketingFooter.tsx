import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="mkt-footer pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          <div>
            <h3 className="text-xl font-semibold mb-4">The Investing League</h3>
            <p className="text-gray-400 text-sm">
              We teach people how to grow wealth through knowledge and smart investing.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li><Link href="/about" className="hover:text-white">About</Link></li>
              <li><Link href="/courses" className="hover:text-white">Courses</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link href="/#scanner" className="hover:text-white no-underline">Scanner</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Chennai, Tamil Nadu, India</li>
              <li>info@investingleague.info</li>
              <li>+91 93614 89738</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} The Investing League. Educational content only.
        </div>
      </div>
    </footer>
  );
}
