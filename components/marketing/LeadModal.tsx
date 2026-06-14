"use client";

import { INTEREST_OPTIONS } from "@/lib/marketing/courses";
import { buildLeadInquiryMessage, openWhatsApp } from "@/lib/marketing/whatsapp";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type LeadModalOptions = {
  interest?: string;
  showMessage?: boolean;
  title?: string;
};

type LeadModalContextValue = {
  openLeadModal: (options?: LeadModalOptions) => void;
};

const LeadModalContext = createContext<LeadModalContextValue | null>(null);

function LeadModalDialog({
  options,
  onClose,
}: {
  options: LeadModalOptions;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState(options.interest ?? "");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setInterest(options.interest ?? "");
    setMessage("");
  }, [options.interest, options.showMessage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !interest) {
      alert("Please enter your name, email, and select an option.");
      return;
    }
    openWhatsApp(
      buildLeadInquiryMessage({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        interest,
        message: options.showMessage ? message : undefined,
      })
    );
    onClose();
  };

  return (
    <div className="mkt-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="mkt-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-modal-title"
      >
        <button type="button" className="mkt-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 id="lead-modal-title" className="text-xl font-bold mb-1">
          {options.title ?? "Get in touch"}
        </h2>
        <p className="text-sm mb-6">
          Share your details — we&apos;ll open WhatsApp with your message ready to send.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="lead-name" className="mkt-field-label">Full name</label>
            <input
              id="lead-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mkt-field-input"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label htmlFor="lead-email" className="mkt-field-label">Email</label>
            <input
              id="lead-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mkt-field-input"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label htmlFor="lead-phone" className="mkt-field-label">Contact / WhatsApp</label>
            <input
              id="lead-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mkt-field-input"
              placeholder="+91 …"
            />
          </div>
          <div>
            <label htmlFor="lead-interest" className="mkt-field-label">Interested in</label>
            <select
              id="lead-interest"
              required
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              className="mkt-field-input"
            >
              <option value="" disabled>Select an option</option>
              {INTEREST_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          {options.showMessage && (
            <div>
              <label htmlFor="lead-message" className="mkt-field-label">Message</label>
              <textarea
                id="lead-message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mkt-field-input"
                placeholder="How can we help you?"
              />
            </div>
          )}
          <button type="submit" className="mkt-btn mkt-btn-primary mkt-btn-block">
            Continue on WhatsApp
          </button>
        </form>
      </div>
    </div>
  );
}

export function LeadModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<LeadModalOptions>({});

  const openLeadModal = useCallback((opts?: LeadModalOptions) => {
    setOptions(opts ?? {});
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openLeadModal }), [openLeadModal]);

  return (
    <LeadModalContext.Provider value={value}>
      {children}
      {open && <LeadModalDialog options={options} onClose={() => setOpen(false)} />}
    </LeadModalContext.Provider>
  );
}

export function useLeadModal() {
  const ctx = useContext(LeadModalContext);
  if (!ctx) throw new Error("useLeadModal must be used within LeadModalProvider");
  return ctx;
}

export function LeadInquiryButton({
  children,
  className,
  interest,
  showMessage,
  title,
  id,
}: {
  children: ReactNode;
  className?: string;
  interest?: string;
  showMessage?: boolean;
  title?: string;
  id?: string;
}) {
  const { openLeadModal } = useLeadModal();

  return (
    <button
      type="button"
      id={id}
      className={className}
      onClick={() => openLeadModal({ interest, showMessage, title })}
    >
      {children}
    </button>
  );
}
