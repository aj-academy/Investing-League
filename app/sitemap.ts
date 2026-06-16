import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/marketing/blogPosts";
import { COURSES } from "@/lib/marketing/siteData";
import { SITE_URL } from "@/lib/marketing/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/courses",
    "/decision-lab",
    "/plans",
    "/about",
    "/contact",
    "/privacy",
    "/blog",
    "/terms",
  ];

  const now = new Date();

  return [
    ...staticRoutes.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    })),
    ...COURSES.map((course) => ({
      url: `${SITE_URL}/courses/${course.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...BLOG_POSTS.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
