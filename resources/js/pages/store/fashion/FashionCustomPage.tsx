import React from 'react';
import { Head } from '@inertiajs/react';
import StoreLayout from '@/layouts/StoreLayout';
import { FashionFooter } from '@/components/store/fashion';

interface FashionCustomPageProps {
  page: {
    id: number;
    title: string;
    content: string;
    slug: string;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    canonical_url?: string;
    index_in_search?: boolean;
  };
  store: any;
  storeContent?: any;
  cartCount?: number;
  wishlistCount?: number;
  isLoggedIn?: boolean;
  customPages?: Array<{
    id: number;
    name: string;
    href: string;
  }>;
}

export default function FashionCustomPage({
  page = {},
  store = {},
  storeContent = {},
  cartCount = 0,
  wishlistCount = 0,
  isLoggedIn = false,
  customPages = [],
}: FashionCustomPageProps) {
  if (!page || !page.title) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>{(page?.meta_title || page?.title || 'Page') + ' - ' + (store?.name || 'Store')}</title>
        {page?.meta_description && <meta name="description" content={page.meta_description} />}
        {page?.meta_keywords && <meta name="keywords" content={page.meta_keywords} />}
        {page?.canonical_url && <link rel="canonical" href={page.canonical_url} />}
        {page?.index_in_search === false && <meta name="robots" content="noindex,nofollow" />}
      </Head>

      <StoreLayout
        storeName={store?.name || 'Store'}
        logo={store?.logo}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        isLoggedIn={isLoggedIn}
        customPages={customPages.length > 0 ? customPages : undefined}
        storeContent={storeContent}
        storeId={store?.id}
        theme={store?.theme}
      >
        <div className="bg-black text-white py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-5xl font-thin tracking-wide mb-6">{page?.title || 'Page'}</h1>
              <div className="w-24 h-px bg-white/30 mx-auto"></div>
            </div>
          </div>
        </div>

        <div className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div
                className="prose prose-lg max-w-none font-light leading-relaxed text-gray-700"
                dangerouslySetInnerHTML={{ __html: page?.content || '' }}
                style={{
                  fontSize: '1.125rem',
                  lineHeight: '1.75',
                  fontWeight: '300'
                }}
              />
            </div>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}