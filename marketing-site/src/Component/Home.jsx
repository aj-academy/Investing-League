import React from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader } from './SiteHeader';
import { ScannerSection } from './ScannerSection';
import { SyllabusForm } from './SyllabusForm';
import { CourseLearnButton } from './CourseLearnButton';

function Home({ openLogin, openSignup }) {
    return (
        <div className='bg-gray-50'>
            <SiteHeader active="home" onLogin={openLogin} onSignup={openSignup} />
            {/* Hero Section */}
            <section className="hero-section pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 mb-10 md:mb-0">
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">The real profit lies in
                                knowledge</h1>
                            <p className="text-xl text-gray-700 mb-8">We teach people how to grow wealth through knowledge and smart
                                investing.</p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <a
                                    href="#cta-enroll"
                                    className="bg-primary text-white px-6 py-3 !rounded-button whitespace-nowrap hover:bg-primary/90 font-medium text-center"
                                >
                                    Get syllabus on WhatsApp
                                </a>
                                <a
                                    href="#scanner"
                                    className="bg-white text-primary border border-primary px-6 py-3 !rounded-button whitespace-nowrap hover:bg-gray-50 font-medium text-center"
                                >
                                    View Market Scanner
                                </a>
                            </div>
                        </div>
                        <div className="md:w-1/2 flex justify-end">
                            <img src="/group.jpg" alt="People learning about investing"
                                className="rounded-lg shadow-lg object-cover object-top max-w-full h-auto" />
                        </div>
                    </div>
                </div>
            </section>
            {/* Vision & Mission Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Vision & Mission</h2>
                        <div className="w-20 h-1 bg-primary mx-auto mb-8"></div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-10">
                        <div className="bg-gray-50 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                                <div className="w-8 h-8 flex items-center justify-center text-primary">
                                    <i className="ri-eye-line ri-2x"></i>
                                </div>
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-center">Our Vision</h3>
                            <p className="text-gray-700 text-center text-lg">To make financial literacy a life skill for everyone
                            </p>
                        </div>
                        <div className="bg-gray-50 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                                <div className="w-8 h-8 flex items-center justify-center text-primary">
                                    <i className="ri-flag-line ri-2x"></i>
                                </div>
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-center">Our Mission</h3>
                            <p className="text-gray-700 text-center text-lg">We teach people how to grow wealth through knowledge
                                and smart investing.</p>
                        </div>
                    </div>
                </div>
            </section>

            <ScannerSection />

            {/* About Us Section */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">About Us</h2>
                        <div className="w-20 h-1 bg-primary mx-auto mb-8"></div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-12 items-center">
                        <div className="md:w-1/2">
                            <p className="text-gray-700 mb-6 text-lg">At The Investing League, we're on a mission to transform how
                                young people perceive and manage money. We believe that financial literacy isn't just for
                                experts — it's for everyone who's ready to take control of their future.
                                <br /><br/>Our courses are designed to simplify trading and investing,
                                breaking down complex concepts into easy, actionable steps. Whether you're a beginner or looking
                                to sharpen your skills, we provide the tools and knowledge you need to start building real,
                                sustainable wealth today.</p>
                            <p className="text-gray-700 mb-6 text-lg">
                                Investing League is a youth-led initiative on a mission to make financial literacy a life skill for everyone — not just experts. We teach students and young professionals how to grow their wealth through knowledge and smart investing.
                                We simplify complex financial concepts like trading, investing, insurance, and budgeting into easy, actionable steps, suitable for beginners and intermediates alike. Our workshops focus on real-life applications, not just theory — from managing daily expenses to achieving long-term financial goals.
                                <br/><br/>What makes us different?<br />
                                •	Hands-on learning with live examples and market simulations<br />
                                •	Community-driven approach that supports every learner<br />
                                •	Industry-recognized certification for participants<br />
                                •	Courses tailored for real-life needs – including student finance, women’s wealth, smart risk-taking, and legacy planning<br />
                                Our core values are accessibility, practicality, empowerment, and integrity.
                                We believe every student deserves the confidence to handle money wisely and build sustainable wealth — and that journey starts right here.
                            </p>

                        </div>
                        <div className="md:w-1/2">
                            <img src="/proff.jpg" alt="Founder teaching"
                                className="rounded-lg shadow-lg object-cover object-top w-full h-auto" />
                        </div>
                    </div>
                </div>
            </section>
            {/* Core Values Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h2>
                        <div className="w-20 h-1 bg-primary mx-auto mb-8"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                                <div className="w-8 h-8 flex items-center justify-center text-primary">
                                    <i className="ri-door-open-line ri-2x"></i>
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">Accessibility</h3>
                            <p className="text-gray-700 text-center">Making financial education available to all</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                                <div className="w-8 h-8 flex items-center justify-center text-primary">
                                    <i className="ri-tools-line ri-2x"></i>
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">Practicality</h3>
                            <p className="text-gray-700 text-center">Teaching skills that can be immediately applied</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                                <div className="w-8 h-8 flex items-center justify-center text-primary">
                                    <i className="ri-rocket-line ri-2x"></i>
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">Empowerment</h3>
                            <p className="text-gray-700 text-center">Enabling financial independence and growth</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                                <div className="w-8 h-8 flex items-center justify-center text-primary">
                                    <i className="ri-shield-check-line ri-2x"></i>
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">Integrity</h3>
                            <p className="text-gray-700 text-center">Providing honest, transparent guidance</p>
                        </div>
                    </div>
                </div>
            </section>
            {/* Courses Section */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Courses</h2>
                        <div className="w-20 h-1 bg-primary mx-auto mb-8"></div>
                        <p className="text-xl text-gray-700 max-w-3xl mx-auto">Explore our comprehensive range of courses designed
                            to help you master the art of investing and trading.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                            <img src="/C-1.png" alt="Investing Fundamentals" className="w-full h-48 object-cover object-top" />
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-3">
                                    <span
                                        className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">Beginner</span>
                                    <span className="text-gray-600 text-sm flex items-center">
                                        <div className="w-4 h-4 flex items-center justify-center mr-1">
                                            <i className="ri-time-line"></i>
                                        </div>
                                        6 weeks
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Money Made Simple</h3>
                                <p className="text-gray-700 mb-4">Learn how to develop, test, and implement automated trading
                                    strategies using programming and APIs.</p>
                                <CourseLearnButton courseName="Money Made Simple" />
                            </div>
                        </div>
                        <div
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                            <img src="/C-2.png" alt="Technical Analysis Mastery" className="w-full h-48 object-cover object-top" />
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-3">
                                    <span
                                        className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-medium">Intermediate</span>
                                    <span className="text-gray-600 text-sm flex items-center">
                                        <div className="w-4 h-4 flex items-center justify-center mr-1">
                                            <i className="ri-time-line"></i>
                                        </div>
                                        8 weeks
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Foundation of Wealth</h3>
                                <p className="text-gray-700 mb-4">Master chart patterns, indicators, and technical trading
                                    strategies to make data-driven investment decisions.</p>
                                <CourseLearnButton courseName="Foundation of Wealth" />
                            </div>
                        </div>
                        <div
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                            <img src="/C-3.png" alt="Options Trading Strategies" className="w-full h-48 object-cover object-top" />
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-3">
                                    <span
                                        className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">Advanced</span>
                                    <span className="text-gray-600 text-sm flex items-center">
                                        <div className="w-4 h-4 flex items-center justify-center mr-1">
                                            <i className="ri-time-line"></i>
                                        </div>
                                        10 weeks
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">The Wealth Builder</h3>
                                <p className="text-gray-700 mb-4">Learn advanced options strategies, risk management techniques, and
                                    how to generate income in any market condition.</p>
                                <CourseLearnButton courseName="The Wealth Builder" />
                            </div>
                        </div>
                        <div
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                            <img src="/C-4.png" alt="Fundamental Analysis" className="w-full h-48 object-cover object-top" />
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-3">
                                    <span
                                        className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-medium">Intermediate</span>
                                    <span className="text-gray-600 text-sm flex items-center">
                                        <div className="w-4 h-4 flex items-center justify-center mr-1">
                                            <i className="ri-time-line"></i>
                                        </div>
                                        7 weeks
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Income Accelerator</h3>
                                <p className="text-gray-700 mb-4">Learn how to analyze financial statements, value companies, and
                                    identify undervalued investment opportunities.</p>
                                <CourseLearnButton courseName="Income Accelerator" />
                            </div>
                        </div>
                        <div
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                            <img src="/c-5 .png" alt="Portfolio Management" className="w-full h-48 object-cover object-top" />
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-3">
                                    <span
                                        className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-medium">Intermediate</span>
                                    <span className="text-gray-600 text-sm flex items-center">
                                        <div className="w-4 h-4 flex items-center justify-center mr-1">
                                            <i className="ri-time-line"></i>
                                        </div>
                                        8 weeks
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Market Warrior</h3>
                                <p className="text-gray-700 mb-4">Master the art of building and managing a diversified investment
                                    portfolio for long-term wealth creation.</p>
                                <CourseLearnButton courseName="Market Warrior" />
                            </div>
                        </div>
                        <div
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                            <img src="/c-6.png" alt="Algorithmic Trading" className="w-full h-48 object-cover object-top " />
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-3">
                                    <span
                                        className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">Advanced</span>
                                    <span className="text-gray-600 text-sm flex items-center">
                                        <div className="w-4 h-4 flex items-center justify-center mr-1">
                                            <i className="ri-time-line"></i>
                                        </div>
                                        12 weeks
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Risk, Smart Profit</h3>
                                <p className="text-gray-700 mb-4">Learn how to develop, test, and implement automated trading
                                    strategies using programming and APIs.</p>
                                <CourseLearnButton courseName="Smart Risk, Smart Profit" />
                            </div>
                        </div>
                        <div
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                            <img src="/c-7.png" alt="Algorithmic Trading" className="w-full h-48 object-cover object-top" />
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-3">
                                    <span
                                        className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">Advanced</span>
                                    <span className="text-gray-600 text-sm flex items-center">
                                        <div className="w-4 h-4 flex items-center justify-center mr-1">
                                            <i className="ri-time-line"></i>
                                        </div>
                                        12 weeks
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Legacy & Wealth Psychology</h3>
                                <p className="text-gray-700 mb-4">Learn how to develop, test, and implement automated trading
                                    strategies using programming and APIs.</p>
                                <CourseLearnButton courseName="Legacy & Wealth Psychology" />
                            </div>
                        </div>
                        <div
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                            <img src="/c-8.png" alt="Algorithmic Trading" className="w-full h-48 object-cover object-top" />
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-3">
                                    <span
                                        className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">Advanced</span>
                                    <span className="text-gray-600 text-sm flex items-center">
                                        <div className="w-4 h-4 flex items-center justify-center mr-1">
                                            <i className="ri-time-line"></i>
                                        </div>
                                        12 weeks
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Wealth Her Way</h3>
                                <p className="text-gray-700 mb-4">Learn how to develop, test, and implement automated trading
                                    strategies using programming and APIs.</p>
                                <CourseLearnButton courseName="Wealth Her Way" />
                            </div>
                        </div>
                        <div
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                            <img src="/C-9.png" alt="Algorithmic Trading" className="w-full h-48 object-cover object-top" />
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-3">
                                    <span
                                        className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">Advanced</span>
                                    <span className="text-gray-600 text-sm flex items-center">
                                        <div className="w-4 h-4 flex items-center justify-center mr-1">
                                            <i className="ri-time-line"></i>
                                        </div>
                                        12 weeks
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Mom, Smart Money</h3>
                                <p className="text-gray-700 mb-4">Learn how to develop, test, and implement automated trading
                                    strategies using programming and APIs.</p>
                                <CourseLearnButton courseName="Smart Mom, Smart Money" />
                            </div>
                        </div>
                    </div>
                    <div className="text-center mt-12">
                        <Link
                            to="/course"
                            className="inline-block bg-white text-primary border border-primary px-6 py-3 !rounded-button whitespace-nowrap hover:bg-gray-50 font-medium"
                        >
                            View all courses
                        </Link>
                    </div>
                </div>
            </section>
            {/* Why Choose Us Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose The Investing League</h2>
                        <div className="w-20 h-1 bg-primary mx-auto mb-8"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="bg-gray-50 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                <div className="w-8 h-8 flex items-center justify-center text-primary">
                                    <i className="ri-hand-coin-line ri-2x"></i>
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Learning by Doing</h3>
                            <p className="text-gray-700">Theory is good, but real growth comes from hands-on practice with live
                                examples and market simulations. Our courses emphasize practical application of concepts through
                                real-world scenarios and interactive exercises.</p>
                        </div>
                        <div className="bg-gray-50 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                <div className="w-8 h-8 flex items-center justify-center text-primary">
                                    <i className="ri-heart-line ri-2x"></i>
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Rooted in Real Life</h3>
                            <p className="text-gray-700">Our courses address not just markets but your life goals — from daily
                                expenses to dream investments. We connect financial concepts to your personal aspirations,
                                making learning relevant and immediately applicable to your life.</p>
                        </div>
                        <div className="bg-gray-50 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                <div className="w-8 h-8 flex items-center justify-center text-primary">
                                    <i className="ri-heart-line ri-2x"></i>
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Community that cares </h3>
                            <p className="text-gray-700">Our courses address not just markets but your life goals — from daily
                                expenses to dream investments. We connect financial concepts to your personal aspirations,
                                making learning relevant and immediately applicable to your life.</p>
                        </div>
                        <div className="bg-gray-50 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                <div className="w-8 h-8 flex items-center justify-center text-primary">
                                    <i className="ri-heart-line ri-2x"></i>
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Made for Today’s Youth</h3>
                            <p className="text-gray-700">Our courses address not just markets but your life goals — from daily
                                expenses to dream investments. We connect financial concepts to your personal aspirations,
                                making learning relevant and immediately applicable to your life.</p>
                        </div>

                    </div>
                </div>
            </section>


            {/* Call to Action Section */}
            <div className="py-16 bg-primary/5" id="cta-enroll">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                            <div className="md:w-1/2 p-8 md:p-12">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to start your investing journey?</h2>
                                <p className="text-gray-700 mb-8">
                                    Request the syllabus and enrollment details on WhatsApp — no signup form or backend required.
                                    Our team will reply with course info and next steps.
                                </p>
                                <SyllabusForm />
                            </div>
                            <div className="md:w-1/2 bg-gray-100">
                                <img src="/group.jpg" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Footer */}
            <footer className="bg-gray-900 text-white pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
                        <div>
                            <h3 className="text-2xl font-['Cinzel'] text-white mb-4"><b>The Investing League</b></h3>
                            <p className="text-gray-400 mb-4">We teach people how to grow wealth through knowledge and smart
                                investing.</p>
                            <div className="flex space-x-3">
                                <a href="https://www.facebook.com/share/1ATTX1K64W/" className="text-gray-400 hover:text-white">
                                    <i className="ri-facebook-fill w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full"></i>
                                </a>
                                <a href="https://youtube.com/@theinvestingleague?si=EM1rtfDUY7_YhfwZ" className="text-gray-400 hover:text-white">
                                    <i className="ri-youtube-fill w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full"></i>
                                </a>
                                <a href="https://www.instagram.com/the_investing_league?igsh=c3d3NWVsaDd3OWls&utm_source=ig_contact_invite" className="text-gray-400 hover:text-white">
                                    <i className="ri-instagram-fill w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full"></i>
                                </a>
                                <a href="https://www.linkedin.com/in/jai-shankar-b78511369" className="text-gray-400 hover:text-white">
                                    <i className="ri-linkedin-fill w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full"></i>
                                </a>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                            <ul className="space-y-2">
                                <li><a className="text-gray-400 hover:text-white"><Link to="/home">Home</Link></a></li>
                                <li><a className="text-gray-400 hover:text-white"><Link to="/about">About Us</Link></a></li>
                                <li><a className="text-gray-400 hover:text-white"><Link to="/course">Courses</Link></a></li>
                                <li><a className="text-gray-400 hover:text-white"><Link to="/contact">Contact</Link></a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Courses</h4>
                            <div>
                                <ul className="space-y-2">
                                    <li><a href="#" className="text-gray-400 hover:text-white whitespace-nowrap">Money Made Simple</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white whitespace-nowrap">Foundation of Wealth</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white whitespace-nowrap">The Wealth Builder</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white whitespace-nowrap">Income Accelerator</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white whitespace-nowrap">Market Warrior</a></li>
                                </ul>
                            </div>
                         </div>
                         <div>
                             <h4 className="text-lg font-semibold mb-4">Advanced Courses</h4>
                             <div>
                                 <ul className="space-y-2">
                                     <li><a href="#" className="text-gray-400 hover:text-white whitespace-nowrap">Smart Risk, Smart Profit</a></li>
                                     <li><a href="#" className="text-gray-400 hover:text-white whitespace-nowrap">Legacy & Wealth Psychology</a></li>
                                     <li><a href="#" className="text-gray-400 hover:text-white whitespace-nowrap">Wealth Her Way</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white whitespace-nowrap">Smart Mom, Smart Money</a></li>
                                </ul>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
                            <ul className="space-y-2">
                                <li className="flex items-start">
                                    <div className="w-5 h-5 flex items-center justify-center text-gray-400 mr-3 mt-0.5">
                                        <i className="ri-map-pin-line"></i>
                                    </div>
                                    <span className="text-gray-400">Mangadu, Tamil Nadu, India, 600122</span>
                                </li>
                                <li className="flex items-start">
                                    <div className="w-5 h-5 flex items-center justify-center text-gray-400 mr-3 mt-0.5">
                                        <i className="ri-mail-line"></i>
                                    </div>
                                    <span className="text-gray-400">info@investingleague.info</span>
                                </li>
                                <li className="flex items-start">
                                    <div className="w-5 h-5 flex items-center justify-center text-gray-400 mr-3 mt-0.5">
                                        <i className="ri-phone-line"></i>
                                    </div>
                                    <span className="text-gray-400">+91 93614 89738</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <p className="text-gray-400 text-sm mb-4 md:mb-0">© 2025 The Investing League. All rights reserved.</p>
                            <div className="flex space-x-6">
                                <Link to="/PrivacyPolicy"><a className="text-gray-400 hover:text-white text-sm">Privacy Policy</a></Link>
                                <Link to='/Terms'><a className="text-gray-400 hover:text-white text-sm">Terms of Service</a></Link>
                                <Link to='/Cookies'><a className="text-gray-400 hover:text-white text-sm">Cookie Policy</a></Link>
                            </div>
                        </div>
                    </div>
                </div>
            </footer >
        </div >
    );
}

export default Home;