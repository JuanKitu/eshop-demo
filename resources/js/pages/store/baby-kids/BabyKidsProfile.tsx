import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import StoreLayout from '@/layouts/StoreLayout';
import { generateStoreUrl } from '@/utils/store-url-helper';
import { User, Mail, Phone, MapPin, Edit3, Save, X, Heart, Star, Gift, Baby, Smile, Sparkles, Crown, Cake, Home, Globe, FileText, Lock, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BabyKidsProfileProps {
  user: any;
  store: any;
  storeContent?: any;
  cartCount?: number;
  wishlistCount?: number;
  isLoggedIn?: boolean;
  userName?: string;
  customPages?: any[];
  countries?: any[];
}

export default function BabyKidsProfile({
  user,
  store = {},
  storeContent,
  cartCount = 0,
  wishlistCount = 0,
  isLoggedIn = true,
  userName = '',
  customPages = [],
  countries = [],
}: BabyKidsProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const storeSlug = store.slug || 'demo';

  // Location states
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const { data, setData, post, processing, errors } = useForm({
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(generateStoreUrl('store.profile.update', store), {
      onSuccess: () => {
        setIsEditing(false);
      },
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
    setData('country', countryId);
    setData('state', '');
    setData('city', '');
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
    setData('state', stateId);
    setData('city', '');
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
        const country = countries.find(c => c.id.toString() === user.address.country || c.name === user.address.country);
        if (country) {
          const countryId = country.id.toString();
          if (data.country !== countryId) {
            setData('country', countryId);
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
                if (data.state !== stateId) {
                  setData('state', stateId);
                }
                
                setLoadingCities(true);
                const cityRes = await fetch((window as any).route('api.locations.cities', stateId));
                const cityData = await cityRes.json();
                const loadedCities = cityData.cities || [];
                setCities(loadedCities);
                
                if (user.address.city) {
                  const city = loadedCities.find((c: any) => c.id.toString() === user.address.city || c.name === user.address.city);
                  if (city && data.city !== city.id.toString()) {
                    setData('city', city.id.toString());
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

  return (
    <>
      <Head title={`My Profile - ${store.name}`} />
      
      <StoreLayout
        storeName={store.name}
        logo={store.logo}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        isLoggedIn={isLoggedIn}
        userName={userName}
        customPages={customPages}
        storeContent={storeContent}
        storeId={store.id}
        theme="baby-kids"
      >
        {/* Hero Section */}
        <div className="bg-pink-50 py-20 relative overflow-hidden">
          {/* Playful Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-32 h-32 bg-pink-200 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-24 h-24 bg-blue-200 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-yellow-200 rounded-full opacity-25 animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-1/3 right-1/3 w-20 h-20 bg-green-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>
          
          <div className="container mx-auto px-6 lg:px-12 relative z-10">
            <div className="text-center">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-800 mb-4">My Profile</h1>
              <div className="w-24 h-1 bg-pink-400 mx-auto rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="bg-gray-50 py-12">
          <div className="container mx-auto px-6 lg:px-12">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                    <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-10 w-10 text-white" />
                    </div>
                    
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                      {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.name || 'User'}
                    </h2>
                    <p className="text-gray-600 mb-6 text-sm">{user?.email}</p>
                    

                  </div>
                </div>

                {/* Profile Form */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                          <Edit3 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-800">
                            Profile Information
                          </h2>
                          <p className="text-sm text-gray-600">Keep your details up to date</p>
                        </div>
                      </div>
                      {!isEditing ? (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="bg-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-pink-600 transition-colors flex items-center space-x-2"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsEditing(false)}
                          className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors flex items-center space-x-2"
                        >
                          <X className="h-4 w-4" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>

                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* First Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              First Name
                            </label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <input
                                type="text"
                                value={data.first_name}
                                onChange={(e) => setData('first_name', e.target.value)}
                                disabled={!isEditing}
                                placeholder="Enter your first name"
                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none transition-colors ${
                                  isEditing 
                                    ? 'border-pink-300 focus:border-pink-500 bg-white' 
                                    : 'border-gray-200 bg-gray-50'
                                }`}
                              />
                            </div>
                            {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
                          </div>

                          {/* Last Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Last Name
                            </label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <input
                                type="text"
                                value={data.last_name}
                                onChange={(e) => setData('last_name', e.target.value)}
                                disabled={!isEditing}
                                placeholder="Enter your last name"
                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none transition-colors ${
                                  isEditing 
                                    ? 'border-pink-300 focus:border-pink-500 bg-white' 
                                    : 'border-gray-200 bg-gray-50'
                                }`}
                              />
                            </div>
                            {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
                          </div>

                          {/* Email */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email Address
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                disabled={!isEditing}
                                placeholder="your.email@example.com"
                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none transition-colors ${
                                  isEditing 
                                    ? 'border-blue-300 focus:border-blue-500 bg-white' 
                                    : 'border-gray-200 bg-gray-50'
                                }`}
                              />
                            </div>
                            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                          </div>

                          {/* Phone */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Phone Number
                            </label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <input
                                type="tel"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                disabled={!isEditing}
                                placeholder="(555) 123-4567"
                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none transition-colors ${
                                  isEditing 
                                    ? 'border-green-300 focus:border-green-500 bg-white' 
                                    : 'border-gray-200 bg-gray-50'
                                }`}
                              />
                            </div>
                            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                          </div>

                          {/* Address Row */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Address
                            </label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <input
                                type="text"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                disabled={!isEditing}
                                placeholder="123 Main Street"
                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none transition-colors ${
                                  isEditing 
                                    ? 'border-purple-300 focus:border-purple-500 bg-white' 
                                    : 'border-gray-200 bg-gray-50'
                                }`}
                              />
                            </div>
                            {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                          </div>

                          {/* Country & State */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Country
                            </label>
                            {isEditing ? (
                              <Select
                                value={data.country}
                                onValueChange={handleCountryChange}
                              >
                                <SelectTrigger className="w-full h-auto px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-200 transition-colors font-medium text-gray-800">
                                  <SelectValue placeholder="Select Country" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-100 rounded-lg shadow-xl">
                                  {countries?.map((country: any) => (
                                    <SelectItem key={country.id} value={country.id.toString()}>
                                      {country.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="relative">
                                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                  type="text"
                                  value={countries?.find(c => c.id.toString() === data.country || c.name === data.country)?.name || data.country || 'Not provided'}
                                  className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 font-medium"
                                  readOnly
                                />
                              </div>
                            )}
                            {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              State
                            </label>
                            {isEditing ? (
                              <Select
                                value={data.state}
                                onValueChange={handleStateChange}
                                disabled={!data.country || loadingStates}
                              >
                                <SelectTrigger className="w-full h-auto px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-200 transition-colors font-medium text-gray-800 disabled:opacity-50">
                                  <SelectValue placeholder={loadingStates ? 'Loading...' : 'Select State'} />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-100 rounded-lg shadow-xl">
                                  {states.map((state: any) => (
                                    <SelectItem key={state.id} value={state.id.toString()}>
                                      {state.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                  type="text"
                                  value={states.find(s => s.id.toString() === data.state || s.name === data.state)?.name || data.state || 'Not provided'}
                                  className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 font-medium"
                                  readOnly
                                />
                              </div>
                            )}
                            {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
                          </div>

                          {/* City & ZIP */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              City
                            </label>
                            {isEditing ? (
                              <Select
                                value={data.city}
                                onValueChange={(val) => setData('city', val)}
                                disabled={!data.state || loadingCities}
                              >
                                <SelectTrigger className="w-full h-auto px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-200 transition-colors font-medium text-gray-800 disabled:opacity-50">
                                  <SelectValue placeholder={loadingCities ? 'Loading...' : 'Select City'} />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-100 rounded-lg shadow-xl">
                                  {cities.map((city: any) => (
                                    <SelectItem key={city.id} value={city.id.toString()}>
                                      {city.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="relative">
                                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                  type="text"
                                  value={cities.find(c => c.id.toString() === data.city || c.name === data.city)?.name || data.city || 'Not provided'}
                                  className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 font-medium"
                                  readOnly
                                />
                              </div>
                            )}
                            {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ZIP Code
                            </label>
                            <div className="relative">
                              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <input
                                type="text"
                                value={data.postal_code}
                                onChange={(e) => setData('postal_code', e.target.value)}
                                disabled={!isEditing}
                                placeholder="12345"
                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none transition-colors ${
                                  isEditing 
                                    ? 'border-gray-300 focus:border-pink-500 bg-white' 
                                    : 'border-gray-200 bg-gray-50'
                                }`}
                              />
                            </div>
                            {errors.postal_code && <p className="mt-1 text-sm text-red-600">{errors.postal_code}</p>}
                          </div>
                        </div>

                        {isEditing && (
                          <div className="flex justify-end pt-6">
                            <button
                              type="submit"
                              disabled={processing}
                              className="bg-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-pink-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
                            >
                              <Save className="h-4 w-4" />
                              <span>{processing ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                          </div>
                        )}
                      </form>

                      {/* Password Section */}
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                              <Lock className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-800">Password</h3>
                              <p className="text-sm text-gray-600">Update your password</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowPasswordForm(!showPasswordForm)}
                            className="bg-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-600 transition-colors"
                          >
                            {showPasswordForm ? 'Cancel' : 'Change Password'}
                          </button>
                        </div>

                        {showPasswordForm && (
                          <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current Password
                              </label>
                              <input
                                type="password"
                                value={passwordForm.data.current_password}
                                onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                              </label>
                              <input
                                type="password"
                                value={passwordForm.data.password}
                                onChange={(e) => passwordForm.setData('password', e.target.value)}
                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm New Password
                              </label>
                              <input
                                type="password"
                                value={passwordForm.data.password_confirmation}
                                onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-purple-500"
                                required
                              />
                            </div>
                            <div className="flex justify-end pt-4">
                              <button
                                type="submit"
                                disabled={passwordForm.processing}
                                className="bg-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
                              >
                                {passwordForm.processing ? 'Updating...' : 'Update Password'}
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
        </div>
      </StoreLayout>
    </>
  );
}