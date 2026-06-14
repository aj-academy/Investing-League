export function TestimonialCard({
  name,
  role,
  quote,
}: {
  name: string;
  role: string;
  quote: string;
}) {
  return (
    <article className="mkt-testimonial-card">
      <p className="mkt-testimonial-quote">&ldquo;{quote}&rdquo;</p>
      <footer>
        <strong>{name}</strong>
        <span>{role}</span>
      </footer>
    </article>
  );
}
