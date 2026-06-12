import Link from "next/link";

export function HeroActions() {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-4">
      <a
        href="#cta-enroll"
        className="bg-primary text-white px-6 py-3 rounded-lg whitespace-nowrap hover:bg-primary/90 font-semibold text-center no-underline inline-flex items-center justify-center"
      >
        Start Learning Now
      </a>
      <Link
        href="/scanner"
        className="bg-white text-primary border border-primary px-6 py-3 rounded-lg whitespace-nowrap hover:bg-gray-50 font-semibold text-center no-underline inline-flex items-center justify-center"
      >
        View Market Scanner
      </Link>
      <Link
        href="/courses"
        className="bg-white text-primary border border-primary px-6 py-3 rounded-lg whitespace-nowrap hover:bg-gray-50 font-semibold text-center no-underline hidden md:inline-flex items-center justify-center"
      >
        Explore Courses
      </Link>
    </div>
  );
}
