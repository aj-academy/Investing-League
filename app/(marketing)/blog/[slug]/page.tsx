import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { CTAButton } from "@/components/marketing/ui/CTAButton";
import { BLOG_POSTS, getBlogPost } from "@/lib/marketing/blogPosts";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Blog" };
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <MarketingShell active="home">
      <section className="mkt-hero mkt-hero--compact">
        <div className="mkt-container mkt-prose-narrow">
          <p className="mkt-muted-text">{post.date} · {post.readMinutes} min read</p>
          <h1 className="mkt-hero-title">{post.title}</h1>
          <p className="mkt-hero-lead">{post.excerpt}</p>
        </div>
      </section>
      <section className="mkt-section">
        <div className="mkt-container mkt-legal-doc">
          {post.body.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="mkt-muted-text">{paragraph}</p>
          ))}
          <div className="mkt-legal-actions">
            <CTAButton href="/blog" variant="outline">All articles</CTAButton>
            <CTAButton href="/courses" variant="gold">Explore courses</CTAButton>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
