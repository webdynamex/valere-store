export type BlogStatus = 'draft' | 'published';

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: string;
  status: BlogStatus;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  createdAt?: { seconds?: number };
  updatedAt?: { seconds?: number };
  publishedAt?: { seconds?: number };
};
