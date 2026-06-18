import { FOUNDER } from "@/lib/marketing/compliance";

export function FounderSection({ large }: { large?: boolean }) {
  return (
    <div className={`mkt-founder-card${large ? " mkt-founder-card--large" : ""}`}>
      <img
        src={FOUNDER.photo}
        alt={FOUNDER.photoAlt}
        className={`mkt-founder-photo${large ? " mkt-founder-photo--large" : ""}`}
      />
      <div>
        <p className="mkt-founder-eyebrow">{FOUNDER.title}</p>
        <strong className="mkt-founder-name">{FOUNDER.name}</strong>
        <ul className="mkt-founder-list">
          {FOUNDER.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mkt-founder-quote">{FOUNDER.quote}</p>
      </div>
    </div>
  );
}
