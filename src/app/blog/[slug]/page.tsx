import type { Metadata } from 'next';
import { BlogArticlePage } from '@/components/blog-article-page';

export const metadata: Metadata = { title: 'VALÉRE Journal', description: 'Статии и модно вдъхновение от VALÉRE.' };
export default function ArticlePage() { return <BlogArticlePage/>; }
