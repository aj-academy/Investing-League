import React from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader } from './SiteHeader';
import { ContactForm } from './ContactForm';
import { buildWhatsAppUrl } from '../lib/whatsapp';

function Contact({ openLogin, openSignup }) {
  const whatsappDirect = buildWhatsAppUrl(
    "Hello The Investing League team, I would like to get in touch. Thank you."
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <SiteHeader active="contact" onLogin={openLogin} onSignup={openSignup} />

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Contact us</h1>
            <div className="w-20 h-1 bg-primary mx-auto mb-6" />
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Send your question on WhatsApp — we reply from our team chat. No backend forms or database.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Message us</h2>
              <ContactForm />
            </div>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-semibold text-gray-900 mb-2">WhatsApp</h3>
                <p className="text-gray-600 text-sm mb-4">Fastest way for syllabus and enrollment.</p>
                <a
                  href={whatsappDirect}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-500 text-white px-5 py-2 rounded hover:bg-green-600"
                >
                  <i className="ri-whatsapp-line" />
                  Chat on WhatsApp
                </a>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md text-gray-700 space-y-3">
                <p><i className="ri-map-pin-line text-primary mr-2" /> Chennai, Tamil Nadu, India</p>
                <p><i className="ri-mail-line text-primary mr-2" /> info@investingleague.info</p>
                <p><i className="ri-phone-line text-primary mr-2" /> +91 93614 89738</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            <div>
              <h3 className="text-2xl font-['Cinzel'] text-white mb-4"><b>The Investing League</b></h3>
              <p className="text-gray-400 mb-4">We teach people how to grow wealth through knowledge and smart investing.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/home" className="text-gray-400 hover:text-white">Home</Link></li>
                <li><Link to="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
                <li><Link to="/course" className="text-gray-400 hover:text-white">Courses</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} The Investing League. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Contact;
