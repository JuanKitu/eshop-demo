import React from 'react';
import { Head } from '@inertiajs/react';
import StoreLayout from '@/layouts/StoreLayout';
import { BeautyFooter } from '@/components/store/beauty-cosmetics';

interface BeautyCustomPageProps {
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

export default function BeautyCustomPage({
  page = {},
  store = {},
  storeContent = {},
  cartCount = 0,
  wishlistCount = 0,
  isLoggedIn = false,
  customPages = [],
}: BeautyCustomPageProps) {
  return (
    <>
      <Head>
        <title>{(page?.meta_title || page?.title || 'Page') + ' - ' + (store?.name || 'Store')}</title>
        {page?.meta_description && <meta name="description" content={page.meta_description} />}
        {page?.meta_keywords && <meta name="keywords" content={page.meta_keywords} />}
        {page?.canonical_url && <link rel="canonical" href={page.canonical_url} />}
        {!page?.index_in_search && <meta name="robots" content="noindex,nofollow" />}
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
        {/* Hero Section */}
        <div className="bg-rose-50 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-5xl font-light text-gray-900 mb-6">{page?.title || 'Page'}</h1>
              <div className="w-16 h-px bg-rose-600 mx-auto"></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div
                className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: page?.content || '' }}
                style={{
                  fontSize: '1.125rem',
                  lineHeight: '1.75'
                }}
              />
            </div>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}