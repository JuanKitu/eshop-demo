import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AccountLayout from '@/layouts/AccountLayout';
import { generateStoreUrl } from '@/utils/store-url-helper';

import { Mail, Phone, MapPin, Lock, Eye, EyeOff, User, Calendar } from 'lucide-react';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: {
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

interface ProfileProps {
  user: User;
  store: any;
  storeContent?: any;
  theme?: string;
  cartCount?: number;
  wishlistCount?: number;
  isLoggedIn?: boolean;
  customer?: any;
  customPages?: Array<{
    id: number;
    name: string;
    href: string;
  }>;
  countries?: any[];
}

export default function Profile({
  user,
  store = {},
  storeContent,
  theme = 'default',
  cartCount = 0,
  wishlistCount = 0,
  isLoggedIn = true,
  customer,
  customPages = [],
  countries = [],
}: ProfileProps) {
  // Get theme-specific components
  const actualTheme = store?.theme || theme;
  
  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY CONDITIONAL LOGIC
  const [ThemeProfilePage, setThemeProfilePage] = React.useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  
  // Location states
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  
  // Profile form
  const profileForm = useForm({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    phone: user.phone || '',
    date_of_birth: user.date_of_birth || '',
    gender: user.gender || '',
    address: user.address?.address || '',
    city: user.address?.city || '',
    state: user.address?.state || '',
    postal_code: user.address?.postal_code || '',
    country: user.address?.country || 'United States',
  });

  // Password form
  const passwordForm = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  
  React.useEffect(() => {
    const loadThemeProfilePage = async () => {
      if (actualTheme === 'default' || actualTheme === 'home-accessories') {
        setThemeProfilePage(null);
        setIsLoading(false);
        return;
      }
      
      try {
        let profilePageModule;
        switch (actualTheme) {
          case 'beauty-cosmetics':
            profilePageModule = await import('@/pages/store/beauty-cosmetics/BeautyProfile');
            break;
          case 'fashion':
            profilePageModule = await import('@/pages/store/fashion/FashionProfile');
            break;
          case 'electronics':
            profilePageModule = await import('@/pages/store/electronics/ElectronicsProfile');
            break;
          case 'jewelry':
            profilePageModule = await import('@/pages/store/jewelry/JewelryProfile');
            break;
          case 'watches':
            profilePageModule = await import('@/pages/store/watches/WatchesProfile');
            break;
          case 'furniture-interior':
            profilePageModule = await import('@/pages/store/furniture-interior/FurnitureProfile');
            break;
          case 'cars-automotive':
            profilePageModule = await import('@/pages/store/cars-automotive/CarsProfile');
            break;
          case 'baby-kids':
            profilePageModule = await import('@/pages/store/baby-kids/BabyKidsProfile');
            break;
          case 'perfume-fragrances':
            profilePageModule = await import('@/pages/store/perfume-fragrances/PerfumeProfile');
            break;
          default:
            setThemeProfilePage(null);
            setIsLoading(false);
            return;
        }
        setThemeProfilePage(() => profilePageModule.default);
      } catch (error) {
        console.error('Failed to load theme profile page:', error);
        setThemeProfilePage(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadThemeProfilePage();
  }, [actualTheme]);
  

  // Fetch states when country changes
  const handleCountryChange = async (countryId: string) => {
    profileForm.setData('country', countryId);
    profileForm.setData('state', '');
    profileForm.setData('city', '');
    setStates([]);
    setCities([]);

    if (countryId) {
      setLoadingStates(true);
      try {
        const url = (window as any).route('api.locations.states', countryId);
        const response = await fetch(url);
        const data = await response.json();
        setStates(data.states || []);
      } catch (error) {
        console.error('Failed to load states:', error);
      } finally {
        setLoadingStates(false);
      }
    }
  };

  // Fetch cities when state changes
  const handleStateChange = async (stateId: string) => {
    profileForm.setData('state', stateId);
    profileForm.setData('city', '');
    setCities([]);

    if (stateId) {
      setLoadingCities(true);
      try {
        const url = (window as any).route('api.locations.cities', stateId);
        const response = await fetch(url);
        const data = await response.json();
        setCities(data.cities || []);
      } catch (error) {
        console.error('Failed to load cities:', error);
      } finally {
        setLoadingCities(false);
      }
    }
  };

  // Initial load of states/cities if address exists
  React.useEffect(() => {
    const initializeLocations = async () => {
      if (user.address?.country) {
        // Find country ID if name was stored
        const country = countries.find(c => c.id.toString() === user.address.country || c.name === user.address.country);
        if (country) {
          const countryId = country.id.toString();
          // Important: update form if it was using name
          if (profileForm.data.country !== countryId) {
             profileForm.setData('country', countryId);
          }
          
          setLoadingStates(true);
          try {
            const stateRes = await fetch((window as any).route('api.locations.states', countryId));
            const stateData = await stateRes.json();
            const loadedStates = stateData.states || [];
            setStates(loadedStates);

            if (user.address.state) {
              const state = loadedStates.find((s: any) => s.id.toString() === user.address.state || s.name === user.address.state);
              if (state) {
                const stateId = state.id.toString();
                if (profileForm.data.state !== stateId) {
                  profileForm.setData('state', stateId);
                }
                
                setLoadingCities(true);
                const cityRes = await fetch((window as any).route('api.locations.cities', stateId));
                const cityData = await cityRes.json();
                const loadedCities = cityData.cities || [];
                setCities(loadedCities);
                
                if (user.address.city) {
                  const city = loadedCities.find((c: any) => c.id.toString() === user.address.city || c.name === user.address.city);
                  if (city && profileForm.data.city !== city.id.toString()) {
                    profileForm.setData('city', city.id.toString());
                  }
                }
              }
            }
          } catch (error) {
            console.error('Failed to initialize locations:', error);
          } finally {
            setLoadingStates(false);
            setLoadingCities(false);
          }
        }
      }
    };

    if (activeTab === 'profile') {
      initializeLocations();
    }
  }, [activeTab]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileForm.post(generateStoreUrl('store.profile.update', store));
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    passwordForm.post(generateStoreUrl('store.profile.password', store), {
      onSuccess: () => {
        passwordForm.reset();
      }
    });
  };

  // 3. Conditional Rendering - MOVED TO END TO COMPLY WITH RULES OF HOOKS
  if (isLoading) {
    return null;
  }
  
  if (ThemeProfilePage) {
    return (
      <ThemeProfilePage
        user={user}
        store={store}
        storeContent={storeContent}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        isLoggedIn={isLoggedIn}
        customPages={customPages}
        countries={countries}
      />
    );
  }

  return (
    <>
      <Head title={`My Profile - ${store.name}`} />
      
      <AccountLayout
        title="My Profile"
        description="Manage your account information and password"
        activeTab="profile"
        store={store}
        storeContent={storeContent}
        theme={theme}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        isLoggedIn={isLoggedIn}
        userName={customer?.full_name || `${user.first_name} ${user.last_name}`}
        customPages={customPages}
      >
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Personal Information
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'password'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Change Password
              </button>
            </nav>
          </div>
          
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="p-6">
              <form onSubmit={handleProfileSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        id="first_name"
                        type="text"
                        value={profileForm.data.first_name}
                        onChange={(e) => profileForm.setData('first_name', e.target.value)}
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          profileForm.errors.first_name ? 'border-red-500' : 'border-gray-300'
                        } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                        required
                      />
                    </div>
                    {profileForm.errors.first_name && (
                      <p className="mt-1 text-sm text-red-600">{profileForm.errors.first_name}</p>
                    )}
                  </div>
                  
                  {/* Last Name */}
                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        id="last_name"
                        type="text"
                        value={profileForm.data.last_name}
                        onChange={(e) => profileForm.setData('last_name', e.target.value)}
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          profileForm.errors.last_name ? 'border-red-500' : 'border-gray-300'
                        } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                        required
                      />
                    </div>
                    {profileForm.errors.last_name && (
                      <p className="mt-1 text-sm text-red-600">{profileForm.errors.last_name}</p>
                    )}
                  </div>
                  
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        id="email"
                        type="email"
                        value={profileForm.data.email}
                        onChange={(e) => profileForm.setData('email', e.target.value)}
                        className={`block w-full pl-10 pr-3 py-2 border ${
                          profileForm.errors.email ? 'border-red-500' : 'border-gray-300'
                        } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                        required
                      />
                    </div>
                    {profileForm.errors.email && (
                      <p className="mt-1 text-sm text-red-600">{profileForm.errors.email}</p>
                    )}
                  </div>
                  
                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        id="phone"
                        type="tel"
                        value={profileForm.data.phone}
                        onChange={(e) => profileForm.setData('phone', e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                  
                  {/* Date of Birth */}
                  <div>
                    <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        id="date_of_birth"
                        type="date"
                        value={profileForm.data.date_of_birth}
                        onChange={(e) => profileForm.setData('date_of_birth', e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                  
                  {/* Gender */}
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      id="gender"
                      value={profileForm.data.gender}
                      onChange={(e) => profileForm.setData('gender', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                  
                  {/* Address */}
                  <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        id="address"
                        type="text"
                        value={profileForm.data.address}
                        onChange={(e) => profileForm.setData('address', e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                  
                  {/* Country */}
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select
                      id="country"
                      value={profileForm.data.country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className={`block w-full px-3 py-2 border ${
                        profileForm.errors.country ? 'border-red-500' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                    >
                      <option value="">Select Country</option>
                      {countries?.map((country: any) => (
                        <option key={country.id} value={country.id}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                    {profileForm.errors.country && (
                       <p className="mt-1 text-sm text-red-600">{profileForm.errors.country}</p>
                    )}
                  </div>

                  {/* State */}
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      State / Province
                    </label>
                    <select
                      id="state"
                      value={profileForm.data.state}
                      onChange={(e) => handleStateChange(e.target.value)}
                      disabled={!profileForm.data.country || loadingStates}
                      className={`block w-full px-3 py-2 border ${
                        profileForm.errors.state ? 'border-red-500' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-50`}
                    >
                      <option value="">{loadingStates ? 'Loading...' : 'Select State'}</option>
                      {states.map((state: any) => (
                        <option key={state.id} value={state.id}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                    {profileForm.errors.state && (
                      <p className="mt-1 text-sm text-red-600">{profileForm.errors.state}</p>
                    )}
                  </div>

                  {/* City */}
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <select
                      id="city"
                      value={profileForm.data.city}
                      onChange={(e) => profileForm.setData('city', e.target.value)}
                      disabled={!profileForm.data.state || loadingCities}
                      className={`block w-full px-3 py-2 border ${
                         profileForm.errors.city ? 'border-red-500' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-gray-50`}
                    >
                      <option value="">{loadingCities ? 'Loading...' : 'Select City'}</option>
                      {cities.map((city: any) => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                    {profileForm.errors.city && (
                      <p className="mt-1 text-sm text-red-600">{profileForm.errors.city}</p>
                    )}
                  </div>
                  
                  {/* Postal Code */}
                  <div>
                    <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP / Postal Code
                    </label>
                    <input
                      id="postal_code"
                      type="text"
                      value={profileForm.data.postal_code}
                      onChange={(e) => profileForm.setData('postal_code', e.target.value)}
                      className={`block w-full px-3 py-2 border ${
                        profileForm.errors.postal_code ? 'border-red-500' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                    />
                    {profileForm.errors.postal_code && (
                      <p className="mt-1 text-sm text-red-600">{profileForm.errors.postal_code}</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={profileForm.processing}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                  >
                    {profileForm.processing ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="p-6">
              <form onSubmit={handlePasswordSubmit}>
                {/* Current Password */}
                <div className="mb-6">
                  <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id="current_password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.data.current_password}
                      onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                      className={`block w-full pl-10 pr-10 py-2 border ${
                        passwordForm.errors.current_password ? 'border-red-500' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-500"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordForm.errors.current_password && (
                    <p className="mt-1 text-sm text-red-600">{passwordForm.errors.current_password}</p>
                  )}
                </div>
                
                {/* New Password */}
                <div className="mb-6">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id="password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.data.password}
                      onChange={(e) => passwordForm.setData('password', e.target.value)}
                      className={`block w-full pl-10 pr-10 py-2 border ${
                        passwordForm.errors.password ? 'border-red-500' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-500"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordForm.errors.password && (
                    <p className="mt-1 text-sm text-red-600">{passwordForm.errors.password}</p>
                  )}
                </div>
                
                {/* Confirm Password */}
                <div className="mb-6">
                  <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id="password_confirmation"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.data.password_confirmation}
                      onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                      className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-500"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={passwordForm.processing}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                  >
                    {passwordForm.processing ? 'Updating...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </AccountLayout>
    </>
  );
}