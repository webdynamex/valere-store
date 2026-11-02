import type { Metadata } from 'next';
import { BlogListing } from '@/components/blog-listing';

export const metadata: Metadata = { title: 'Журнал | VALÉRE', description: 'VALÉRE Journal — стил, идеи за комбинации, находки и модно вдъхновение.' };
export default function BlogPage() { return <BlogListing/>; }
