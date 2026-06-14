"use client";

import { useState } from "react";
import {
  buildLeadInquiryMessage,
  openWhatsApp,
} from "@/lib/marketing/whatsapp";
import { GENERAL_INTEREST_OPTIONS } from "@/lib/marketing/courses";

// TODO: Integrate lead capture to Supabase or CRM when approved — currently WhatsApp-only.
export function ContactEnquiryForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !interest) {
      alert("Please enter your name, phone, and interest.");
      return;
    }
    openWhatsApp(
      buildLeadInquiryMessage({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        interest,
        message: message.trim(),
      })
    );
  };

  return (
    <form className="mkt-contact-form" onSubmit={handleSubmit}>
      <div className="mkt-form-row">
        <label htmlFor="contact-name" className="mkt-field-label">Name</label>
        <input
          id="contact-name"
          type="text"
          required
          className="mkt-field-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
        />
      </div>
      <div className="mkt-form-row">
        <label htmlFor="contact-phone" className="mkt-field-label">Phone</label>
        <input
          id="contact-phone"
          type="tel"
          required
          className="mkt-field-input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 …"
        />
      </div>
      <div className="mkt-form-row">
        <label htmlFor="contact-email" className="mkt-field-label">Email</label>
        <input
          id="contact-email"
          type="email"
          className="mkt-field-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
        />
      </div>
      <div className="mkt-form-row">
        <label htmlFor="contact-interest" className="mkt-field-label">
          Interested in
        </label>
        <select
          id="contact-interest"
          required
          className="mkt-field-input"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
        >
          <option value="" disabled>Select an option</option>
          {GENERAL_INTEREST_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div className="mkt-form-row">
        <label htmlFor="contact-message" className="mkt-field-label">Message</label>
        <textarea
          id="contact-message"
          rows={4}
          className="mkt-field-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your learning goals…"
        />
      </div>
      <button type="submit" className="mkt-btn mkt-btn-primary mkt-btn-block">
        Continue on WhatsApp
      </button>
    </form>
  );
}
