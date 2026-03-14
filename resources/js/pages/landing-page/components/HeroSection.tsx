import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '@/utils/image-helper';

interface HeroSectionProps {
  brandColor?: string;
  settings: any;
  sectionData: {
    title?: string;
    subtitle?: string;
    announcement_text?: string;
    primary_button_text?: string;
    secondary_button_text?: string;
    image?: string;
    layout?: string;
    height?: number;
    stats?: Array<{value: string; label: string}>;
    card?: {
      name: string;
      title: string;
      company: string;
      initials: string;
    };
  };
}

export default function HeroSection({ settings, sectionData, brandColor = '#3b82f6' }: HeroSectionProps) {
  const { t } = useTranslation();
  
  const { props } = usePage<any>();
  const globalSettings = props.globalSettings || {};
  const registrationEnabled = globalSettings.registrationEnabled === 'true' || globalSettings.registrationEnabled === true || globalSettings.registrationEnabled === '1' || globalSettings.registrationEnabled === undefined;

  const [imageError, setImageError] = React.useState(false);
  const heroImage = sectionData.image ? getImageUrl(sectionData.image) : null;
  
  // Get colors from settings
  const colors = settings?.config_sections?.colors || { primary: brandColor, secondary: '#059669', accent: '#065f46' };
  const primaryColor = colors.primary || brandColor;
  const secondaryColor = colors.secondary || '#059669';
  const accentColor = colors.accent || '#065f46';

  // Layout styles
  const layout = sectionData.layout || 'image-right';
  const customHeight = sectionData.height ? `${sectionData.height}px` : '100vh';

  // Base layout classes
  let containerClasses = "grid gap-8 sm:gap-12 lg:gap-16 items-center";
  let contentClasses = "space-y-6 sm:space-y-8";
  let imageContainerClasses = "relative";
  let sectionClasses = "pt-16 bg-gray-50 flex items-center";

  // Apply layout logic
  switch (layout) {
    case 'image-left':
      containerClasses += " lg:grid-cols-2";
      contentClasses += " text-center lg:text-left order-2 lg:order-2";
      imageContainerClasses += " order-1 lg:order-1";
      break;
    case 'full-width':
      containerClasses = "flex flex-col items-center justify-center text-center space-y-12";
      contentClasses += " max-w-4xl mx-auto";
      imageContainerClasses = "w-full max-w-5xl mx-auto relative";
      break;
    case 'centered':
      containerClasses = "flex flex-col items-center justify-center text-center space-y-12";
      contentClasses += " max-w-3xl mx-auto";
      imageContainerClasses = "w-full max-w-3xl mx-auto relative";
      break;
    case 'image-right':
    default:
      containerClasses += " lg:grid-cols-2";
      contentClasses += " text-center lg:text-left";
      break;
  }

  return (
    <section 
      id="hero" 
      className={sectionClasses}
      style={{ minHeight: customHeight, height: sectionData.height ? customHeight : 'auto' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 w-full flex-1 flex flex-col justify-center">
        <div className={containerClasses}>
          {/* Content Area */}
          <div className={contentClasses}>
            {sectionData.announcement_text && (
              <div 
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${layout === 'centered' || layout === 'full-width' ? 'mx-auto' : ''}`}
                style={{ 
                  backgroundColor: `${accentColor}15`, 
                  color: accentColor,
                  borderColor: `${accentColor}30`
                }}
              >
                {sectionData.announcement_text}
              </div>
            )}
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight" role="banner" aria-label="Main heading">
              {sectionData.title || 'Launch Your Online Store in Minutes'}
            </h1>
            
            <p className={`text-lg md:text-xl text-gray-600 leading-relaxed font-medium ${layout === 'centered' || layout === 'full-width' ? 'mx-auto' : 'max-w-2xl'}`}>
              {sectionData.subtitle || 'Create, customize, and manage multiple online stores with our powerful e-commerce platform.'}
            </p>
            
            <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 ${layout === 'centered' || layout === 'full-width' ? 'justify-center' : 'justify-center lg:justify-start'}`}>
              {registrationEnabled && (
                <Link
                  href={route('register')}
                  className="text-white px-8 py-4 rounded-lg transition-colors font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = secondaryColor}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = primaryColor}
                  aria-label="Start free trial - Register for StoreGo"
                >
                  {sectionData.primary_button_text || t('Start Free Trial')}
                  <ArrowRight size={18} />
                </Link>
              )}
              <Link
                href={route('login')}
                className="border px-8 py-4 rounded-lg transition-colors font-semibold text-base flex items-center justify-center gap-2 hover:bg-gray-50"
                style={{ borderColor: primaryColor, color: primaryColor }}
                aria-label="Login to existing StoreGo account"
              >
                <Play size={18} />
                {sectionData.secondary_button_text || 'Login'}
              </Link>
            </div>

            {sectionData.stats && sectionData.stats.length > 0 && (
              <div className={`grid sm:grid-cols-3 grid-cols-1 gap-4 sm:gap-6 lg:gap-8 pt-8 sm:pt-12 ${layout === 'centered' || layout === 'full-width' ? 'max-w-3xl mx-auto' : ''}`}>
                {sectionData.stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div 
                      className="text-3xl md:text-4xl font-bold"
                      style={{ color: index === 0 ? primaryColor : index === 1 ? secondaryColor : accentColor }}
                    >
                      {stat.value}
                    </div>
                    <div className="text-gray-600 font-medium text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Image / Card Area */}
          <div className={imageContainerClasses}>
            {heroImage && sectionData.image && !imageError ? (
              <div className="relative">
                <img 
                  src={heroImage} 
                  alt="Hero" 
                  className={`w-full h-auto rounded-2xl shadow-xl ${layout === 'centered' ? 'max-w-2xl mx-auto' : ''}`}
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm mx-auto border border-gray-200 relative z-10">
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                      <span className="text-white text-2xl">🏪</span>
                    </div>
                    <div 
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-3 border-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1.5"></div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {sectionData.card?.name || t('Sample Store')}
                    </h3>
                    <p className="text-gray-900 font-semibold">
                      {sectionData.card?.title || t('Premium Theme')}
                    </p>
                    <p className="text-gray-500">
                      {sectionData.card?.company || t('Multi-Store Platform')}
                    </p>
                  </div>
                  
                  <div className="flex justify-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border">
                      <span className="text-gray-600 text-sm">🛒</span>
                    </div>
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border">
                      <span className="text-gray-600 text-sm">🎨</span>
                    </div>
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border">
                      <span className="text-gray-600 text-sm">📱</span>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-gray-50 rounded-xl border">
                    <div className="w-24 h-24 bg-white rounded-lg mx-auto flex items-center justify-center shadow-sm border">
                      <div className="w-16 h-16 rounded flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                        <span className="text-white text-xs font-bold">{t("STORE")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Simple Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-gray-200 rounded-full opacity-50 z-0"></div>
            <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gray-300 rounded-full opacity-40 z-0"></div>
          </div>
        </div>
      </div>
    </section>
  );
}