import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import StoreLayout from '@/layouts/StoreLayout';
import { generateStoreUrl } from '@/utils/store-url-helper';
import { ElectronicsFooter } from '@/components/store/electronics';
import { User, Mail, Phone, MapPin, Lock, Edit, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ElectronicsProfileProps {
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
  storeContent?: any;
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

export default function ElectronicsProfile({
  user,
  store = {},
  storeContent,
  cartCount = 0,
  wishlistCount = 0,
  isLoggedIn = false,
  customPages = [],
  countries = [],
}: ElectronicsProfileProps) {
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
  
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    passwordForm.post(generateStoreUrl('store.profile.password', store), {
      onSuccess: () => {
        setShowPasswordForm(false);
        passwordForm.reset();
      }
    });
  };
  
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileForm.post(generateStoreUrl('store.profile.update', store), {
      onSuccess: () => {
        setIsEditing(false);
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
        storeContent={storeContent}
        storeId={store.id}
        theme={store.theme}
      >
        <div className="bg-gray-50 min-h-screen">
          {/* Header */}
          <section className="bg-slate-900 text-white py-16">
            <div className="container mx-auto px-4 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <User className="w-8 h-8" />
              </div>
              <h1 className="text-4xl font-bold mb-4">My Profile</h1>
              <p className="text-xl text-blue-100">Manage your account information</p>
            </div>
          </section>

          {/* Profile Content */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Profile Card */}
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User className="w-10 h-10 text-blue-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {user.first_name} {user.last_name}
                      </h2>
                      <p className="text-gray-600 mb-6">{user.email}</p>
                      <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        <Edit className="w-4 h-4 inline mr-2" />
                        {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                      </button>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Personal Information */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      <div className="bg-blue-600 text-white p-6">
                        <h3 className="text-xl font-bold">Personal Information</h3>
                      </div>
                      <div className="p-6">
                        {isEditing ? (
                          <form onSubmit={handleProfileSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  First Name
                                </label>
                                <input
                                  type="text"
                                  value={profileForm.data.first_name}
                                  onChange={(e) => profileForm.setData('first_name', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  required
                                />
                                {profileForm.errors.first_name && (
                                  <p className="mt-1 text-sm text-red-600">{profileForm.errors.first_name}</p>
                                )}
                              </div>
                              
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Last Name
                                </label>
                                <input
                                  type="text"
                                  value={profileForm.data.last_name}
                                  onChange={(e) => profileForm.setData('last_name', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  required
                                />
                                {profileForm.errors.last_name && (
                                  <p className="mt-1 text-sm text-red-600">{profileForm.errors.last_name}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-4">
                              <button 
                                type="submit"
                                disabled={profileForm.processing}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                              >
                                {profileForm.processing ? 'Saving...' : 'Save Changes'}
                              </button>
                              <button 
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                First Name
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={user.first_name}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
                                  readOnly
                                />
                                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Last Name
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={user.last_name}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
                                  readOnly
                                />
                                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      <div className="bg-slate-900 text-white p-6">
                        <h3 className="text-xl font-bold">Contact Information</h3>
                      </div>
                      <div className="p-6 space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Email Address
                          </label>
                          <div className="relative">
                            {isEditing ? (
                              <input
                                type="email"
                                value={profileForm.data.email}
                                onChange={(e) => profileForm.setData('email', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              />
                            ) : (
                              <input
                                type="email"
                                value={user.email}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
                                readOnly
                              />
                            )}
                            <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          </div>
                          {profileForm.errors.email && (
                            <p className="mt-1 text-sm text-red-600">{profileForm.errors.email}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <div className="relative">
                            {isEditing ? (
                              <input
                                type="tel"
                                value={profileForm.data.phone}
                                onChange={(e) => profileForm.setData('phone', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter phone number"
                              />
                            ) : (
                              <input
                                type="tel"
                                value={user.phone || 'Not provided'}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
                                readOnly
                              />
                            )}
                            <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      <div className="bg-blue-600 text-white p-6">
                        <h3 className="text-xl font-bold flex items-center">
                          <MapPin className="w-5 h-5 mr-2" />
                          Address Information
                        </h3>
                      </div>
                      <div className="p-6">
                        {isEditing ? (
                          <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Street Address
                                </label>
                                <input
                                  type="text"
                                  value={profileForm.data.address}
                                  onChange={(e) => profileForm.setData('address', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="123 Main Street"
                                />
                                {profileForm.errors.address && (
                                  <p className="mt-1 text-sm text-red-600">{profileForm.errors.address}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Country */}
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Country
                                </label>
                                <Select
                                  value={profileForm.data.country}
                                  onValueChange={handleCountryChange}
                                >
                                  <SelectTrigger className="w-full px-4 py-6 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                                    <SelectValue placeholder="Select Country" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white border-gray-200">
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
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  State
                                </label>
                                <Select
                                  value={profileForm.data.state}
                                  onValueChange={handleStateChange}
                                  disabled={!profileForm.data.country || loadingStates}
                                >
                                  <SelectTrigger className="w-full px-4 py-6 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50">
                                    <SelectValue placeholder={loadingStates ? "Loading..." : "Select State"} />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white border-gray-200">
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
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  City
                                </label>
                                <Select
                                  value={profileForm.data.city}
                                  onValueChange={(val) => profileForm.setData('city', val)}
                                  disabled={!profileForm.data.state || loadingCities}
                                >
                                  <SelectTrigger className="w-full px-4 py-6 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-50">
                                    <SelectValue placeholder={loadingCities ? "Loading..." : "Select City"} />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white border-gray-200">
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
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Postal Code
                                </label>
                                <input
                                  type="text"
                                  value={profileForm.data.postal_code}
                                  onChange={(e) => profileForm.setData('postal_code', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="12345"
                                />
                              </div>
                            </div>
                            
                            <div className="flex pt-4">
                              <button 
                                onClick={handleProfileSubmit}
                                disabled={profileForm.processing}
                                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                              >
                                {profileForm.processing ? 'Saving...' : 'Update Address'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Address
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={user.address?.address || 'Not provided'}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
                                  readOnly
                                />
                                <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Country
                                </label>
                                <input
                                  type="text"
                                  value={getCountryName()}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
                                  readOnly
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  State
                                </label>
                                <input
                                  type="text"
                                  value={getStateName()}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
                                  readOnly
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  City
                                </label>
                                <input
                                  type="text"
                                  value={getCityName()}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
                                  readOnly
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Postal Code
                                </label>
                                <input
                                  type="text"
                                  value={user.address?.postal_code || 'Not provided'}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
                                  readOnly
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Password Section */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      <div className="bg-slate-900 text-white p-6">
                        <h3 className="text-xl font-bold flex items-center">
                          <Lock className="w-5 h-5 mr-2" />
                          Security
                        </h3>
                      </div>
                      <div className="p-6">
                        {!showPasswordForm ? (
                          <button 
                            onClick={() => setShowPasswordForm(true)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                          >
                            Change Password
                          </button>
                        ) : (
                          <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Current Password
                              </label>
                              <input
                                type="password"
                                value={passwordForm.data.current_password}
                                onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                New Password
                              </label>
                              <input
                                type="password"
                                value={passwordForm.data.password}
                                onChange={(e) => passwordForm.setData('password', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Confirm New Password
                              </label>
                              <input
                                type="password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                              />
                            </div>
                            
                            <div className="flex space-x-4">
                              <button 
                                type="submit"
                                disabled={passwordForm.processing}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                              >
                                {passwordForm.processing ? 'Updating...' : 'Update Password'}
                              </button>
                              <button 
                                type="button"
                                onClick={() => setShowPasswordForm(false)}
                                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </StoreLayout>
    </>
  );
}