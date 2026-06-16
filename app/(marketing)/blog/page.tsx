import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { SectionHeader } from "@/components/marketing/ui/SectionHeader";
import { BLOG_POSTS } from "@/lib/marketing/blogPosts";
import { PAGE_SEO } from "@/lib/marketing/seo";

export const metadata: Metadata = {
  title: PAGE_SEO.blog.title,
  description: PAGE_SEO.blog.description,
};

export default function BlogPage() {
  return (
    <MarketingShell active="home">
      <section className="mkt-section">
        <div className="mkt-container">
          <SectionHeader
            title="Finance Learning Blog"
            subtitle="Practical articles on personal finance, market discipline, and responsible learning."
          />
          <div className="mkt-blog-list">
            {BLOG_POSTS.map((post) => (
              <article key={post.slug} className="mkt-blog-card">
                <p className="mkt-blog-meta">
                  {post.date} · {post.readMinutes} min read
                </p>
                <h2>
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="mkt-muted-text">{post.excerpt}</p>
                <Link href={`/blog/${post.slug}`} className="mkt-link-secondary">
                  Read article →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
