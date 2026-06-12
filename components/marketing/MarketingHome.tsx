import Link from "next/link";
import { CourseGrid } from "./CourseGrid";
import { HeroActions } from "./HeroActions";
import { MarketingShell } from "./MarketingShell";
import { LeadInquiryButton } from "./LeadModal";

const HOME_COURSE_DESCRIPTIONS: Record<string, string> = {
  "Money Made Simple":
    "Learn how to develop, test, and implement automated trading strategies using programming and APIs.",
  "Foundation of Wealth":
    "Master chart patterns, indicators, and technical trading strategies to make data-driven investment decisions.",
  "The Wealth Builder":
    "Learn advanced options strategies, risk management techniques, and how to generate income in any market condition.",
  "Income Accelerator":
    "Learn how to analyze financial statements, value companies, and identify undervalued investment opportunities.",
  "Market Warrior":
    "Master the art of building and managing a diversified investment portfolio for long-term wealth creation.",
  "Smart Risk, Smart Profit":
    "Learn how to develop, test, and implement automated trading strategies using programming and APIs.",
  "Legacy & Wealth Psychology":
    "Learn how to develop, test, and implement automated trading strategies using programming and APIs.",
  "Wealth Her Way":
    "Learn how to develop, test, and implement automated trading strategies using programming and APIs.",
  "Smart Mom, Smart Money":
    "Learn how to develop, test, and implement automated trading strategies using programming and APIs.",
};

const VALUES = [
  { title: "Accessibility", desc: "Making financial education available to all" },
  { title: "Practicality", desc: "Teaching skills that can be immediately applied" },
  { title: "Empowerment", desc: "Enabling financial independence and growth" },
  { title: "Integrity", desc: "Providing honest, transparent guidance" },
];

const WHY_CHOOSE = [
  {
    title: "Learning by Doing",
    desc: "Theory is good, but real growth comes from hands-on practice with live examples and market simulations.",
  },
  {
    title: "Rooted in Real Life",
    desc: "Our courses connect financial concepts to your personal aspirations, making learning immediately applicable.",
  },
  {
    title: "Community that cares",
    desc: "A supportive learner community that helps you stay accountable and grow with peers.",
  },
  {
    title: "Made for Today’s Youth",
    desc: "Designed for students and young professionals ready to take control of their financial future.",
  },
];

export function MarketingHome() {
  return (
    <MarketingShell active="home">
      <section className="hero-section py-16 lg:py-20 w-full">
        <div className="mkt-container w-full">
          <div className="hero-inner">
            <div className="hero-copy">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
                The real profit lies in knowledge
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
                We teach people how to grow wealth through knowledge and smart investing.
              </p>
              <HeroActions />
            </div>
            <div className="hero-visual">
              <img
                src="/group.jpg"
                alt="People learning about investing"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white w-full">
        <div className="mkt-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Vision & Mission</h2>
            <div className="w-20 h-1 bg-primary mx-auto mb-8" />
          </div>
          <div className="grid md:grid-cols-2 gap-10">
            <div className="bg-gray-50 p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-center">Our Vision</h3>
              <p className="text-gray-700 text-center text-lg">
                To make financial literacy a life skill for everyone
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-center">Our Mission</h3>
              <p className="text-gray-700 text-center text-lg">
                We teach people how to grow wealth through knowledge and smart investing.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 w-full">
        <div className="mkt-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">About Us</h2>
            <div className="w-20 h-1 bg-primary mx-auto mb-8" />
          </div>
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2 text-gray-700 text-lg space-y-6">
              <p>
                At The Investing League, we&apos;re on a mission to transform how young people
                perceive and manage money. Financial literacy isn&apos;t just for experts — it&apos;s
                for everyone ready to take control of their future.
              </p>
              <p>
                Investing League is a youth-led initiative making financial literacy a life skill.
                We simplify trading, investing, insurance, and budgeting into actionable steps for
                beginners and intermediates alike.
              </p>
            </div>
            <div className="md:w-1/2 w-full">
              <img
                src="/proff.jpg"
                alt="Founder teaching"
                className="rounded-lg shadow-lg object-cover object-top w-full max-h-[420px]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white w-full">
        <div className="mkt-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <div className="w-20 h-1 bg-primary mx-auto mb-8" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-gray-50 p-6 rounded-lg shadow-md text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{v.title}</h3>
                <p className="text-gray-700">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 w-full">
        <div className="mkt-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Courses</h2>
            <div className="w-20 h-1 bg-primary mx-auto mb-8" />
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Explore our comprehensive range of courses designed to help you master investing and
              trading.
            </p>
          </div>
          <CourseGrid descriptions={HOME_COURSE_DESCRIPTIONS} />
          <div className="text-center mt-12">
            <Link
              href="/courses"
              className="inline-block bg-white text-primary border border-primary px-6 py-3 rounded whitespace-nowrap hover:bg-gray-50 font-medium"
            >
              View all courses
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white w-full">
        <div className="mkt-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose The Investing League</h2>
            <div className="w-20 h-1 bg-primary mx-auto mb-8" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {WHY_CHOOSE.map((item) => (
              <div key={item.title} className="bg-gray-50 p-8 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{item.title}</h3>
                <p className="text-gray-700">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="py-16 bg-primary/5 w-full" id="cta-enroll">
        <div className="mkt-container">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/2 p-8 md:p-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Ready to start your investing journey?
                </h2>
                <p className="text-gray-700 mb-8">
                  Tell us what you&apos;re interested in — we&apos;ll open WhatsApp with your details
                  ready to send.
                </p>
                <LeadInquiryButton
                  className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 w-full sm:w-auto"
                  title="Enrollment enquiry"
                >
                  Contact us on WhatsApp
                </LeadInquiryButton>
              </div>
              <div className="md:w-1/2 bg-gray-100">
                <img src="/group.jpg" alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
