import React from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader } from './SiteHeader';
import { CourseLearnButton } from './CourseLearnButton';

function Course({ openLogin, openSignup }) {
    return (
        <div className='bg-gray-50'>
            <SiteHeader active="course" onLogin={openLogin} onSignup={openSignup} />
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
                                <p className="text-gray-700 mb-4">Master your money, one step at a time</p>
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
                        <button
                            className="bg-white text-primary border border-primary px-6 py-3 !rounded-button whitespace-nowrap hover:bg-gray-50 font-medium">View
                            All Courses</button>
                    </div>
                </div>
            </section>
            <footer className="bg-gray-900 text-white pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
                        <div>
                            <h3 className="text-2xl font-['Cinzel'] text-white mb-4"><b>The Investing League</b></h3>
                            <p className="text-gray-400 mb-4">We teach people how to grow wealth through knowledge and smart
                                investing.</p>
                            <div className="flex space-x-4">
                                <a href="https://www.facebook.com/share/1ATTX1K64W/" className="text-gray-400 hover:text-white">
                                    <div className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full">
                                        <i className="ri-facebook-fill"></i>
                                    </div>
                                </a>
                                <a href="https://youtube.com/@theinvestingleague?si=EM1rtfDUY7_YhfwZ"
                                    className="text-gray-400 hover:text-white">
                                    <div className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full">
                                        <i className="ri-youtube-fill"></i>
                                    </div>
                                </a>
                                <a href="https://www.instagram.com/the_investing_league?igsh=c3d3NWVsaDd3OWls&utm_source=ig_contact_invite"
                                    className="text-gray-400 hover:text-white">
                                    <div className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full">
                                        <i className="ri-instagram-fill"></i>
                                    </div>
                                </a>
                                <a href="https://www.linkedin.com/in/jai-shankar-b78511369"
                                    className="text-gray-400 hover:text-white">
                                    <div className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-full">
                                        <i className="ri-linkedin-fill"></i>
                                    </div>
                                </a>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-gray-400 hover:text-white"><Link to="/home">Home</Link></a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white"><Link to="/about">About Us</Link></a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white"><Link to="/course">Courses</Link></a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white"><Link to="/contact">Contact</Link></a></li>
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
                                    <span className="text-gray-400">Chennai, Tamil Nadu, India</span>
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
                                <Link to='/privacypolicy'><a className="text-gray-400 hover:text-white text-sm">Privacy Policy</a></Link>
                                <Link to='/terms'><a className="text-gray-400 hover:text-white text-sm">Terms of Service</a></Link>
                                <Link to='/cookies'><a className="text-gray-400 hover:text-white text-sm">Cookie Policy</a></Link>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Course;