import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import StoreLayout from '@/layouts/StoreLayout';
import { generateStoreUrl } from '@/utils/store-url-helper';
import { User, Mail, Phone, MapPin, Lock, Clock, Shield, Edit3, Save, X, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WatchesProfileProps {
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

export default function WatchesProfile({
  user,
  store = {},
  storeContent,
  cartCount = 0,
  wishlistCount = 0,
  isLoggedIn = false,
  customPages = [],
  countries = [],
}: WatchesProfileProps) {
  // Location states
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
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
        setCities(data.city || data.cities || []);
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
                const loadedCities = cityData.city || cityData.cities || [];
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
        theme="watches"
      >
        {/* Hero Section */}
        <section className="relative h-96 flex items-center overflow-hidden bg-slate-900">
          <div className="absolute inset-0 bg-slate-900/80"></div>
          <div className="relative z-10 w-full">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl">
                <div className="mb-6">
                  <span className="bg-amber-500 text-slate-900 px-6 py-2 text-sm font-medium tracking-wider uppercase">
                    Account
                  </span>
                </div>
                <h1 className="text-6xl font-light text-white mb-6 leading-none tracking-tight">
                  My Profile
                </h1>
                <p className="text-xl text-slate-300 font-light leading-relaxed max-w-2xl">
                  Manage your luxury timepiece collection preferences and account details
                </p>
              </div>
            </div>
          </div>
          <div className="absolute top-1/4 left-12 w-px h-24 bg-amber-500"></div>
          <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-amber-500 rounded-full"></div>
        </section>

        <div className="bg-slate-50 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {/* Profile Header Card */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 mb-8 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center">
                      <User className="w-12 h-12 text-slate-900" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-light mb-2">
                        {isEditing ? profileForm.data.first_name + ' ' + profileForm.data.last_name : user.first_name + ' ' + user.last_name}
                      </h2>
                      <p className="text-slate-300 text-lg">{user.email}</p>
                      <div className="flex items-center mt-2">
                        <Clock className="w-4 h-4 text-amber-500 mr-2" />
                        <span className="text-sm text-slate-400">Member since {new Date().getFullYear()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    {!isEditing ? (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="bg-amber-500 text-slate-900 px-6 py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </button>
                    ) : (
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="border border-slate-400 text-white px-6 py-3 rounded-lg font-medium hover:border-slate-300 transition-colors flex items-center"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Personal Information */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                    <div className="flex items-center mb-8">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-4">
                        <User className="w-5 h-5 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-medium text-slate-900">Personal Details</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                          <input
                            type="text"
                            value={isEditing ? profileForm.data.first_name : user.first_name}
                            onChange={(e) => profileForm.setData('first_name', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                              isEditing 
                                ? 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200' 
                                : 'border-slate-200 bg-slate-50'
                            }`}
                            readOnly={!isEditing}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                          <input
                            type="text"
                            value={isEditing ? profileForm.data.last_name : user.last_name}
                            onChange={(e) => profileForm.setData('last_name', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                              isEditing 
                                ? 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200' 
                                : 'border-slate-200 bg-slate-50'
                            }`}
                            readOnly={!isEditing}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
                        <input
                          type="date"
                          value={isEditing ? profileForm.data.date_of_birth : user.date_of_birth || ''}
                          onChange={(e) => profileForm.setData('date_of_birth', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                            isEditing 
                              ? 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200' 
                              : 'border-slate-200 bg-slate-50'
                          }`}
                          readOnly={!isEditing}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                        {isEditing ? (
                          <Select
                            value={profileForm.data.gender}
                            onValueChange={(val) => profileForm.setData('gender', val)}
                          >
                            <SelectTrigger className="w-full h-auto px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500 transition-colors font-medium text-slate-800">
                              <SelectValue placeholder="Select Gender" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-100 rounded-lg shadow-xl">
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <input
                            type="text"
                            value={user.gender || 'Not specified'}
                            className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 font-medium"
                            readOnly
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                    <div className="flex items-center mb-8">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-4">
                        <Mail className="w-5 h-5 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-medium text-slate-900">Contact Information</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                        <input
                          type="email"
                          value={isEditing ? profileForm.data.email : user.email}
                          onChange={(e) => profileForm.setData('email', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                            isEditing 
                              ? 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200' 
                              : 'border-slate-200 bg-slate-50'
                          }`}
                          readOnly={!isEditing}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={isEditing ? profileForm.data.phone : user.phone || ''}
                          onChange={(e) => profileForm.setData('phone', e.target.value)}
                          placeholder={!isEditing && !user.phone ? 'Not provided' : ''}
                          className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                            isEditing 
                              ? 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200' 
                              : 'border-slate-200 bg-slate-50'
                          }`}
                          readOnly={!isEditing}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                    <div className="flex items-center mb-8">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-4">
                        <MapPin className="w-5 h-5 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-medium text-slate-900">Address Information</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Street Address</label>
                          <input
                            type="text"
                            value={isEditing ? profileForm.data.address : user.address?.address || ''}
                            onChange={(e) => profileForm.setData('address', e.target.value)}
                            placeholder={!isEditing && !user.address?.address ? 'Not provided' : ''}
                            className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                              isEditing 
                                ? 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200' 
                                : 'border-slate-200 bg-slate-50'
                            }`}
                            readOnly={!isEditing}
                          />
                        </div>
                        
                        {/* Country & State */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
                          {isEditing ? (
                            <Select
                              value={profileForm.data.country}
                              onValueChange={handleCountryChange}
                            >
                              <SelectTrigger className="w-full h-auto px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500 transition-colors font-medium text-slate-800">
                                <SelectValue placeholder="Select Country" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-slate-100 rounded-lg shadow-xl">
                                {countries.map((country: any) => (
                                  <SelectItem key={country.id} value={country.id.toString()}>
                                    {country.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <input
                              type="text"
                              value={countries.find(c => c.id.toString() === user.address?.country || c.name === user.address?.country)?.name || user.address?.country || 'Not provided'}
                              className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 font-medium"
                              readOnly
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">State/Province</label>
                          {isEditing ? (
                            <Select
                              value={profileForm.data.state}
                              onValueChange={handleStateChange}
                              disabled={!profileForm.data.country || loadingStates}
                            >
                              <SelectTrigger className="w-full h-auto px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500 transition-colors font-medium text-slate-800 disabled:opacity-50">
                                <SelectValue placeholder={loadingStates ? "Loading..." : "Select State"} />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-slate-100 rounded-lg shadow-xl">
                                {states.map((state: any) => (
                                  <SelectItem key={state.id} value={state.id.toString()}>
                                    {state.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <input
                              type="text"
                              value={states.find(s => s.id.toString() === user.address?.state || s.name === user.address?.state)?.name || user.address?.state || 'Not provided'}
                              className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 font-medium"
                              readOnly
                            />
                          )}
                        </div>

                        {/* City & Postal Code */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                          {isEditing ? (
                            <Select
                              value={profileForm.data.city}
                              onValueChange={(val) => profileForm.setData('city', val)}
                              disabled={!profileForm.data.state || loadingCities}
                            >
                              <SelectTrigger className="w-full h-auto px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500 transition-colors font-medium text-slate-800 disabled:opacity-50">
                                <SelectValue placeholder={loadingCities ? "Loading..." : "Select City"} />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-slate-100 rounded-lg shadow-xl">
                                {cities.map((city: any) => (
                                  <SelectItem key={city.id} value={city.id.toString()}>
                                    {city.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <input
                              type="text"
                              value={cities.find(c => c.id.toString() === user.address?.city || c.name === user.address?.city)?.name || user.address?.city || 'Not provided'}
                              className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 font-medium"
                              readOnly
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Postal Code</label>
                          <input
                            type="text"
                            value={isEditing ? profileForm.data.postal_code : user.address?.postal_code || ''}
                            onChange={(e) => profileForm.setData('postal_code', e.target.value)}
                            placeholder={!isEditing && !user.address?.postal_code ? 'Not provided' : ''}
                            className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                              isEditing 
                                ? 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200' 
                                : 'border-slate-200 bg-slate-50'
                            }`}
                            readOnly={!isEditing}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Save Button */}
                {isEditing && (
                  <div className="mt-8 flex justify-center">
                    <button 
                      type="submit"
                      disabled={profileForm.processing}
                      className="bg-amber-500 text-slate-900 px-8 py-4 rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center text-lg"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      {profileForm.processing ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </form>

              {/* Security Section */}
              <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-4">
                      <Shield className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="text-xl font-medium text-slate-900">Security Settings</h3>
                  </div>
                  <button 
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="border border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-medium hover:border-amber-500 hover:text-amber-600 transition-colors flex items-center"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {showPasswordForm ? 'Cancel' : 'Change Password'}
                  </button>
                </div>
                
                {showPasswordForm && (
                  <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-200">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                      <input
                        type="password"
                        value={passwordForm.data.current_password}
                        onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                      <input
                        type="password"
                        value={passwordForm.data.password}
                        onChange={(e) => passwordForm.setData('password', e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                      <input
                        type="password"
                        value={passwordForm.data.password_confirmation}
                        onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-3 flex justify-center mt-4">
                      <button 
                        type="submit"
                        disabled={passwordForm.processing}
                        className="bg-amber-500 text-slate-900 px-8 py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        {passwordForm.processing ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </StoreLayout>
    </>
  );
}