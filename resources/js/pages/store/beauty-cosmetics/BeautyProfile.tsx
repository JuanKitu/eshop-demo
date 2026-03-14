import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import StoreLayout from '@/layouts/StoreLayout';
import { generateStoreUrl } from '@/utils/store-url-helper';
import { BeautyFooter } from '@/components/store/beauty-cosmetics';
import { User, Mail, Phone, MapPin, Lock, Heart, Sparkles, Calendar, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BeautyProfileProps {
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    date_of_birth?: string;
    gender?: string;
    address?: {
      address: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  store: any;
  cartCount?: number;
  wishlistCount?: number;
  isLoggedIn?: boolean;
  customPages?: Array<{
    id: number;
    name: string;
    href: string;
  }>;
  countries?: any[];
}

export default function BeautyProfile({
  user,
  store = {},
  cartCount = 0,
  wishlistCount = 0,
  isLoggedIn = false,
  customPages = [],
  countries = [],
}: BeautyProfileProps) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Location states
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const profileForm = useForm({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || '',
    address: user?.address?.address || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    postal_code: user?.address?.postal_code || '',
    country: user?.address?.country || '',
  });
  
  const passwordForm = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileForm.post(generateStoreUrl('store.profile.update', store), {
      onSuccess: () => {
        setIsEditing(false);
      }
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    passwordForm.post(generateStoreUrl('store.profile.password', store), {
      onSuccess: () => {
        setShowPasswordForm(false);
        passwordForm.reset();
      }
    });
  };

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
  useEffect(() => {
    const initializeLocations = async () => {
      if (user?.address?.country) {
        const country = countries.find(c => c.id.toString() === user.address?.country || c.name === user.address?.country);
        if (country) {
          const countryId = country.id.toString();
          if (profileForm.data.country !== countryId) {
            profileForm.setData('country', countryId);
          }
          
          setLoadingStates(true);
          try {
            const stateRes = await fetch((window as any).route('api.locations.states', countryId));
            const stateData = await stateRes.json();
            const loadedStates = stateData.states || [];
            setStates(loadedStates);

            if (user.address?.state) {
              const state = loadedStates.find((s: any) => s.id.toString() === user.address?.state || s.name === user.address?.state);
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
                
                if (user.address?.city) {
                  const city = loadedCities.find((c: any) => c.id.toString() === user.address?.city || c.name === user.address?.city);
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

    initializeLocations();
  }, [user.address]);

  const getCountryName = () => {
    if (!user.address?.country) return 'Not provided';
    const country = countries.find(c => c.id.toString() === user.address?.country || c.name === user.address?.country);
    return country ? country.name : user.address?.country;
  };

  const getStateName = () => {
    if (!user.address?.state) return 'Not provided';
    const state = states.find(s => s.id.toString() === user.address?.state || s.name === user.address?.state);
    return state ? state.name : user.address?.state;
  };

  const getCityName = () => {
    if (!user.address?.city) return 'Not provided';
    const city = cities.find(c => c.id.toString() === user.address?.city || c.name === user.address?.city);
    return city ? city.name : user.address?.city;
  };
  
  return (
    <>
      <Head title={`My Profile - ${store.name}`} />
      
      <StoreLayout
        storeName={store.name}
        logo={store.logo}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        isLoggedIn={isLoggedIn}
        customPages={customPages}
        storeId={store.id}
        customFooter={<BeautyFooter storeName={store.name} logo={store.logo} />}
      >
        <div className="bg-rose-50 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-500 mb-8 shadow-2xl">
                <User className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl lg:text-6xl font-light text-gray-900 mb-6">
                Beauty Profile
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Manage your beauty journey and account preferences
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden">
                <div className="bg-rose-500 p-8">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mr-6">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-light text-white">{user.first_name} {user.last_name}</h2>
                      <p className="text-white/80">Beauty Enthusiast</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="space-y-12">
                    {/* Personal Information */}
                    <div>
                      <div className="flex items-center mb-8">
                        <Sparkles className="h-6 w-6 text-rose-500 mr-3" />
                        <h3 className="text-2xl font-light text-gray-900">Personal Information</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-rose-50 rounded-2xl p-6">
                          <label className="block text-sm font-medium text-gray-500 mb-3">
                            First Name
                          </label>
                          <div className="relative">
                            {isEditing ? (
                              <input
                                type="text"
                                value={profileForm.data.first_name}
                                onChange={(e) => profileForm.setData('first_name', e.target.value)}
                                className="w-full px-4 py-3 bg-white rounded-xl border-2 border-rose-200 focus:outline-none focus:border-rose-500 transition-colors"
                                required
                              />
                            ) : (
                              <input
                                type="text"
                                value={user.first_name}
                                className="w-full px-4 py-3 bg-white rounded-xl border-2 border-rose-200 focus:outline-none focus:border-rose-500 transition-colors"
                                readOnly
                              />
                            )}
                            <User className="absolute right-4 top-3 h-5 w-5 text-rose-400" />
                          </div>
                          {profileForm.errors.first_name && (
                            <p className="mt-1 text-sm text-red-600">{profileForm.errors.first_name}</p>
                          )}
                        </div>
                        
                        <div className="bg-rose-50 rounded-2xl p-6">
                          <label className="block text-sm font-medium text-gray-500 mb-3">
                            Last Name
                          </label>
                          <div className="relative">
                            {isEditing ? (
                              <input
                                type="text"
                                value={profileForm.data.last_name}
                                onChange={(e) => profileForm.setData('last_name', e.target.value)}
                                className="w-full px-4 py-3 bg-white rounded-xl border-2 border-rose-200 focus:outline-none focus:border-rose-500 transition-colors"
                                required
                              />
                            ) : (
                              <input
                                type="text"
                                value={user.last_name}
                                className="w-full px-4 py-3 bg-white rounded-xl border-2 border-rose-200 focus:outline-none focus:border-rose-500 transition-colors"
                                readOnly
                              />
                            )}
                            <User className="absolute right-4 top-3 h-5 w-5 text-rose-400" />
                          </div>
                          {profileForm.errors.last_name && (
                            <p className="mt-1 text-sm text-red-600">{profileForm.errors.last_name}</p>
                          )}
                        </div>

                        {user.date_of_birth && (
                          <div className="bg-rose-50 rounded-2xl p-6">
                            <label className="block text-sm font-medium text-gray-500 mb-3">
                              Date of Birth
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={user.date_of_birth}
                                className="w-full px-4 py-3 bg-white rounded-xl border-2 border-rose-200 focus:outline-none focus:border-rose-500 transition-colors"
                                readOnly
                              />
                              <Calendar className="absolute right-4 top-3 h-5 w-5 text-rose-400" />
                            </div>
                          </div>
                        )}

                        {user.gender && (
                          <div className="bg-rose-50 rounded-2xl p-6">
                            <label className="block text-sm font-medium text-gray-500 mb-3">
                              Gender
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={user.gender}
                                className="w-full px-4 py-3 bg-white rounded-xl border-2 border-rose-200 focus:outline-none focus:border-rose-500 transition-colors"
                                readOnly
                              />
                              <Heart className="absolute right-4 top-3 h-5 w-5 text-rose-400" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <div className="flex items-center mb-8">
                        <Mail className="h-6 w-6 text-rose-500 mr-3" />
                        <h3 className="text-2xl font-light text-gray-900">Contact Information</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-rose-50 rounded-2xl p-6">
                          <label className="block text-sm font-medium text-gray-500 mb-3">
                            Email Address
                          </label>
                          <div className="relative">
                            {isEditing ? (
                              <input
                                type="email"
                                value={profileForm.data.email}
                                onChange={(e) => profileForm.setData('email', e.target.value)}
                                className="w-full px-4 py-3 bg-white rounded-xl border-2 border-rose-200 focus:outline-none focus:border-rose-500 transition-colors"
                                required
                              />
                            ) : (
                              <input
                                type="email"
                                value={user.email}
                                className="w-full px-4 py-3 bg-white rounded-xl border-2 border-rose-200 focus:outline-none focus:border-rose-500 transition-colors"
                                readOnly
                              />
                            )}
                            <Mail className="absolute right-4 top-3 h-5 w-5 text-rose-400" />
                          </div>
                          {profileForm.errors.email && (
                            <p className="mt-1 text-sm text-red-600">{profileForm.errors.email}</p>
                          )}
                        </div>
                        
                        <div className="bg-rose-50 rounded-2xl p-6">
                          <label className="block text-sm font-medium text-gray-500 mb-3">
                            Phone Number
                          </label>
                          <div className="relative">
                            {isEditing ? (
                              <input
                                type="tel"
                                value={profileForm.data.phone}
                                onChange={(e) => profileForm.setData('phone', e.target.value)}
                                className="w-full px-4 py-3 bg-white rounded-xl border-2 border-rose-200 focus:outline-none focus:border-rose-500 transition-colors"
                                placeholder="Enter phone number"
                              />
                            ) : (
                              <input
                                type="tel"
                                value={user.phone || 'Not provided'}
                                className="w-full px-4 py-3 bg-white rounded-xl border-2 border-rose-200 focus:outline-none focus:border-rose-500 transition-colors"
                                readOnly
                              />
                            )}
                            <Phone className="absolute right-4 top-3 h-5 w-5 text-rose-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                      <div>
                        <div className="flex items-center mb-8">
                          <MapPin className="h-6 w-6 text-rose-500 mr-3" />
                          <h3 className="text-2xl font-light text-gray-900">Address Information</h3>
                        </div>
                        <div className="space-y-6">
                          <div className="bg-rose-50 rounded-2xl p-6">
                            <label className="block text-sm font-medium text-gray-500 mb-3">
                              Street Address
                            </label>
                            <div className="relative">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={profileForm.data.address}
                                  onChange={(e) => profileForm.setData('address', e.target.value)}
                                  className="w-full px-4 py-3 bg-white rounded-xl border-2 border-rose-200 focus:outline-none focus:border-rose-500 transition-colors"
                                  placeholder="123 Main Street"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={user.address?.address || 'Not provided'}
                                  className="w-full px-4 py-3 bg-white rounded-xl border-2 border-rose-200 focus:outline-none focus:border-rose-500 transition-colors"
                                  readOnly
                                />
                              )}
                              <MapPin className="absolute right-4 top-3 h-5 w-5 text-rose-400" />
                            </div>
                            {profileForm.errors.address && (
                              <p className="mt-1 text-sm text-red-600">{profileForm.errors.address}</p>
                            )}
                          </div>
                          
                          {isEditing ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Country */}
                              <div className="bg-rose-50 rounded-2xl p-6">
                                <label className="block text-sm font-medium text-gray-500 mb-3">
                                  Country
                                </label>
                                <Select
                                  value={profileForm.data.country}
                                  onValueChange={handleCountryChange}
                                >
                                  <SelectTrigger className="w-full h-auto px-4 py-3 bg-white rounded-xl border-2 border-rose-200 focus:outline-none transition-colors font-light text-base">
                                    <SelectValue placeholder="Select Country" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white border-rose-100 rounded-xl shadow-xl">
                                    {countries.map((country: any) => (
                                      <SelectItem key={country.id} value={country.id.toString()}>
                                        {country.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {profileForm.errors.country && (
                                  <p className="mt-1 text-sm text-red-600">{profileForm.errors.country}</p>
                                )}
                              </div>

                              {/* State */}
                              <div className="bg-rose-50 rounded-2xl p-6">
                                <label className="block text-sm font-medium text-gray-500 mb-3">
                                  State
                                </label>
                                <Select
                                  value={profileForm.data.state}
                                  onValueChange={handleStateChange}
                                  disabled={!profileForm.data.country || loadingStates}
                                >
                                  <SelectTrigger className="w-full h-auto px-4 py-3 bg-white rounded-xl border-2 border-rose-200 focus:outline-none transition-colors font-light text-base disabled:opacity-50">
                                    <SelectValue placeholder={loadingStates ? "Loading..." : "Select State"} />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white border-rose-100 rounded-xl shadow-xl">
                                    {states.map((state: any) => (
                                      <SelectItem key={state.id} value={state.id.toString()}>
                                        {state.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {profileForm.errors.state && (
                                  <p className="mt-1 text-sm text-red-600">{profileForm.errors.state}</p>
                                )}
                              </div>

                              {/* City */}
                              <div className="bg-rose-50 rounded-2xl p-6">
                                <label className="block text-sm font-medium text-gray-500 mb-3">
                                  City
                                </label>
                                <Select
                                  value={profileForm.data.city}
                                  onValueChange={(val) => profileForm.setData('city', val)}
                                  disabled={!profileForm.data.state || loadingCities}
                                >
                                  <SelectTrigger className="w-full h-auto px-4 py-3 bg-white rounded-xl border-2 border-rose-200 focus:outline-none transition-colors font-light text-base disabled:opacity-50">
                                    <SelectValue placeholder={loadingCities ? "Loading..." : "Select City"} />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white border-rose-100 rounded-xl shadow-xl">
                                    {cities.map((city: any) => (
                                      <SelectItem key={city.id} value={city.id.toString()}>
                                        {city.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {profileForm.errors.city && (
                                  <p className="mt-1 text-sm text-red-600">{profileForm.errors.city}</p>
                                )}
                              </div>

                              {/* ZIP */}
                              <div className="bg-rose-50 rounded-2xl p-6">
                                <label className="block text-sm font-medium text-gray-500 mb-3">
                                  Postal Code
                                </label>
                                <input
                                  type="text"
                                  value={profileForm.data.postal_code}
                                  onChange={(e) => profileForm.setData('postal_code', e.target.value)}
                                  className="w-full px-4 py-3 bg-white rounded-xl border-2 border-rose-200 focus:outline-none focus:border-rose-500 transition-colors"
                                  placeholder="12345"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              <div className="bg-rose-50 rounded-2xl p-6">
                                <label className="block text-sm font-medium text-gray-500 mb-3">
                                  Country
                                </label>
                                <input
                                  type="text"
                                  value={getCountryName()}
                                  className="w-full px-4 py-3 bg-white rounded-xl border-2 border-rose-200 focus:outline-none transition-colors font-light"
                                  readOnly
                                />
                              </div>

                              <div className="bg-rose-50 rounded-2xl p-6">
                                <label className="block text-sm font-medium text-gray-500 mb-3">
                                  State
                                </label>
                                <input
                                  type="text"
                                  value={getStateName()}
                                  className="w-full px-4 py-3 bg-white rounded-xl border-2 border-rose-200 focus:outline-none transition-colors font-light"
                                  readOnly
                                />
                              </div>

                              <div className="bg-rose-50 rounded-2xl p-6">
                                <label className="block text-sm font-medium text-gray-500 mb-3">
                                  City
                                </label>
                                <input
                                  type="text"
                                  value={getCityName()}
                                  className="w-full px-4 py-3 bg-white rounded-xl border-2 border-rose-200 focus:outline-none transition-colors font-light"
                                  readOnly
                                />
                              </div>
                              
                              <div className="bg-rose-50 rounded-2xl p-6">
                                <label className="block text-sm font-medium text-gray-500 mb-3">
                                  Postal Code
                                </label>
                                <input
                                  type="text"
                                  value={user.address?.postal_code || 'Not provided'}
                                  className="w-full px-4 py-3 bg-white rounded-xl border-2 border-rose-200 focus:outline-none transition-colors font-light"
                                  readOnly
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4 pt-8">
                      {isEditing ? (
                        <>
                          <button 
                            onClick={handleProfileSubmit}
                            disabled={profileForm.processing}
                            className="bg-rose-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-rose-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50"
                          >
                            <Sparkles className="h-5 w-5" />
                            {profileForm.processing ? 'Saving...' : 'Save Profile'}
                          </button>
                          <button 
                            onClick={() => setIsEditing(false)}
                            className="border-2 border-rose-200 text-rose-600 px-8 py-4 rounded-full font-semibold hover:border-rose-300 hover:bg-rose-50 transition-colors flex items-center gap-2"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => setIsEditing(true)}
                            className="bg-rose-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-rose-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
                          >
                            <User className="h-5 w-5" />
                            Edit Profile
                          </button>
                          <button 
                            onClick={() => setShowPasswordForm(!showPasswordForm)}
                            className="border-2 border-rose-200 text-rose-600 px-8 py-4 rounded-full font-semibold hover:border-rose-300 hover:bg-rose-50 transition-colors flex items-center gap-2"
                          >
                            <Lock className="h-5 w-5" />
                            {showPasswordForm ? 'Cancel' : 'Change Password'}
                          </button>
                        </>
                      )}
                    </div>
                    
                    {/* Password Change Form */}
                    {showPasswordForm && (
                      <div className="bg-rose-50 rounded-3xl p-8">
                        <div className="flex items-center mb-8">
                          <Lock className="h-6 w-6 text-rose-500 mr-3" />
                          <h3 className="text-2xl font-light text-gray-900">Change Password</h3>
                        </div>
                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                          <div className="bg-white rounded-2xl p-6">
                            <label className="block text-sm font-medium text-gray-500 mb-3">
                              Current Password
                            </label>
                            <input
                              type="password"
                              value={passwordForm.data.current_password}
                              onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border-2 border-rose-200 focus:outline-none focus:border-rose-500 transition-colors"
                              required
                            />
                          </div>
                          
                          <div className="bg-white rounded-2xl p-6">
                            <label className="block text-sm font-medium text-gray-500 mb-3">
                              New Password
                            </label>
                            <input
                              type="password"
                              value={passwordForm.data.password}
                              onChange={(e) => passwordForm.setData('password', e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border-2 border-rose-200 focus:outline-none focus:border-rose-500 transition-colors"
                              required
                            />
                          </div>
                          
                          <div className="bg-white rounded-2xl p-6">
                            <label className="block text-sm font-medium text-gray-500 mb-3">
                              Confirm New Password
                            </label>
                            <input
                              type="password"
                              value={passwordForm.data.password_confirmation}
                              onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border-2 border-rose-200 focus:outline-none focus:border-rose-500 transition-colors"
                              required
                            />
                          </div>
                          
                          <div className="flex gap-4">
                            <button 
                              type="submit"
                              disabled={passwordForm.processing}
                              className="bg-rose-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-lg hover:shadow-xl flex items-center gap-2"
                            >
                              <Lock className="h-5 w-5" />
                              {passwordForm.processing ? 'Updating...' : 'Update Password'}
                            </button>
                            <button 
                              type="button"
                              onClick={() => setShowPasswordForm(false)}
                              className="border-2 border-rose-200 text-rose-600 px-8 py-4 rounded-full font-semibold hover:border-rose-300 hover:bg-rose-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}