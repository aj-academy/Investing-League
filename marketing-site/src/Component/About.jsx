import React from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader } from './SiteHeader';

function About({ openLogin, openSignup }) {
    return (
        <div className='bg-gray-50'>
            <SiteHeader active="about" onLogin={openLogin} onSignup={openSignup} />
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
                                <button
                                    className="bg-primary text-white px-6 py-3 !rounded-button whitespace-nowrap hover:bg-primary/90 font-medium">Start
                                    Learning Now</button>
                                <button
                                    className="bg-white text-primary border border-primary px-6 py-3 !rounded-button whitespace-nowrap hover:bg-gray-50 font-medium"><a>Explore
                                        Courses</a></button>
                            </div>
                        </div>
                        <div className="md:w-1/2 flex justify-end">
                            <img src="/group.jpg" alt="People learning about investing"
                                className="rounded-lg shadow-lg object-cover object-top max-w-full h-auto" />
                        </div>
                    </div>
                </div>
            </section>
            {/* Footer */}
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
                            <ul className="space-y-2">
                                <li><a href="#" className="text-gray-400 hover:text-white whitespace-nowrap">Money Made Simple</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white whitespace-nowrap">Foundation of Wealth</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white whitespace-nowrap">The Wealth Builder</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white whitespace-nowrap">Income Accelerator</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white whitespace-nowrap">Market Warrior</a></li>
                            </ul>
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

export default About;