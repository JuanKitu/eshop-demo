import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import StoreLayout from '@/layouts/StoreLayout';
import { generateStoreUrl } from '@/utils/store-url-helper';
import { FashionFooter } from '@/components/store/fashion';
import { User, Mail, Phone, MapPin, Lock, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FashionProfileProps {
  user: any;
  store: any;
  storeContent?: any;
  cartCount?: number;
  wishlistCount?: number;
  isLoggedIn?: boolean;
  customPages?: any[];
  countries?: any[];
}

export default function FashionProfile({
  user,
  store = {},
  storeContent,
  cartCount = 0,
  wishlistCount = 0,
  isLoggedIn = false,
  customPages = [],
  countries = [],
}: FashionProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // Location states
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const profileForm = useForm({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || '',
    address: user?.address?.address || '',
    city: user.address?.city || '',
    state: user.address?.state || '',
    postal_code: user.address?.postal_code || '',
    country: user.address?.country || '',
  });

  const passwordForm = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const getCountryName = () => {
    if (!user.address?.country) return 'Not provided';
    const country = countries.find(c => c.id.toString() === user.address.country.toString() || c.name === user.address.country);
    if (country) return country.name;
    return user.address.country;
  };

  const getStateName = () => {
    if (!user.address?.state) return 'Not provided';
    const state = states.find(s => s.id.toString() === user.address.state.toString() || s.name === user.address.state);
    if (state) return state.name;
    
    // If it looks like an ID and we are loading or haven't fetched yet, show Loading...
    const isId = /^\d+$/.test(user.address.state.toString());
    if (isId && (loadingStates || states.length === 0)) return 'Loading...';
    
    return user.address.state;
  };

  const getCityName = () => {
    if (!user.address?.city) return 'Not provided';
    const city = cities.find(c => c.id.toString() === user.address.city.toString() || c.name === user.address.city);
    if (city) return city.name;
    
    const isId = /^\d+$/.test(user.address.city.toString());
    if (isId && (loadingCities || cities.length === 0)) return 'Loading...';
    
    return user.address.city;
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
  React.useEffect(() => {
    const initializeLocations = async () => {
      if (user.address?.country) {
        const country = countries.find(c => c.id.toString() === user.address.country || c.name === user.address.country);
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

    initializeLocations();
  }, [user.address]);

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
        <div className="bg-black text-white py-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-5xl font-thin tracking-wide mb-6">My Profile</h1>
              <p className="text-white/70 font-light text-lg">
                Manage your account information
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="bg-gray-50 p-8">
                <form onSubmit={handleProfileSubmit} className="space-y-8">
                  {/* Personal Information */}
                  <div>
                    <h2 className="text-2xl font-thin mb-6 tracking-wide text-black">Personal Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-light tracking-widest uppercase text-gray-700 mb-3">
                          First Name
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={isEditing ? profileForm.data.first_name : user.first_name}
                            onChange={(e) => profileForm.setData('first_name', e.target.value)}
                            className={`w-full px-0 py-3 border-0 border-b-2 bg-transparent focus:outline-none focus:border-black transition-colors font-light ${
                              isEditing ? 'border-gray-400' : 'border-gray-200 cursor-default'
                            }`}
                            readOnly={!isEditing}
                            required
                          />
                          <User className="absolute right-0 top-3 h-5 w-5 text-gray-400" />
                        </div>
                        {profileForm.errors.first_name && <p className="mt-1 text-xs text-red-600">{profileForm.errors.first_name}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-light tracking-widest uppercase text-gray-700 mb-3">
                          Last Name
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={isEditing ? profileForm.data.last_name : user.last_name}
                            onChange={(e) => profileForm.setData('last_name', e.target.value)}
                            className={`w-full px-0 py-3 border-0 border-b-2 bg-transparent focus:outline-none focus:border-black transition-colors font-light ${
                              isEditing ? 'border-gray-400' : 'border-gray-200 cursor-default'
                            }`}
                            readOnly={!isEditing}
                            required
                          />
                          <User className="absolute right-0 top-3 h-5 w-5 text-gray-400" />
                        </div>
                        {profileForm.errors.last_name && <p className="mt-1 text-xs text-red-600">{profileForm.errors.last_name}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h2 className="text-2xl font-thin mb-6 tracking-wide text-black">Contact Information</h2>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-light tracking-widest uppercase text-gray-700 mb-3">
                          Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            value={isEditing ? profileForm.data.email : user.email}
                            onChange={(e) => profileForm.setData('email', e.target.value)}
                            className={`w-full px-0 py-3 border-0 border-b-2 bg-transparent focus:outline-none focus:border-black transition-colors font-light ${
                              isEditing ? 'border-gray-400' : 'border-gray-200 cursor-default'
                            }`}
                            readOnly={!isEditing}
                            required
                          />
                          <Mail className="absolute right-0 top-3 h-5 w-5 text-gray-400" />
                        </div>
                        {profileForm.errors.email && <p className="mt-1 text-xs text-red-600">{profileForm.errors.email}</p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-light tracking-widest uppercase text-gray-700 mb-3">
                          Phone Number
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            value={isEditing ? profileForm.data.phone : (user.phone || 'Not provided')}
                            onChange={(e) => profileForm.setData('phone', e.target.value)}
                            className={`w-full px-0 py-3 border-0 border-b-2 bg-transparent focus:outline-none focus:border-black transition-colors font-light ${
                              isEditing ? 'border-gray-400' : 'border-gray-200 cursor-default'
                            }`}
                            readOnly={!isEditing}
                          />
                          <Phone className="absolute right-0 top-3 h-5 w-5 text-gray-400" />
                        </div>
                        {profileForm.errors.phone && <p className="mt-1 text-xs text-red-600">{profileForm.errors.phone}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div>
                    <h2 className="text-2xl font-thin mb-6 tracking-wide text-black">Address Information</h2>
                    <div className="space-y-6">
                      {/* Full Width Address */}
                      <div>
                        <label className="block text-sm font-light tracking-widest uppercase text-gray-700 mb-3">
                          Street Address
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={isEditing ? profileForm.data.address : (user.address?.address || 'Not provided')}
                            onChange={(e) => profileForm.setData('address', e.target.value)}
                            className={`w-full px-0 py-3 border-0 border-b-2 bg-transparent focus:outline-none focus:border-black transition-colors font-light ${
                              isEditing ? 'border-gray-400' : 'border-gray-200 cursor-default'
                            }`}
                            readOnly={!isEditing}
                            placeholder="Enter your street address"
                          />
                          <MapPin className="absolute right-0 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                        </div>
                        {profileForm.errors.address && <p className="mt-1 text-xs text-red-600">{profileForm.errors.address}</p>}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                        {/* Country */}
                        <div>
                          <label className="block text-sm font-light tracking-widest uppercase text-gray-700 mb-3">
                            Country
                          </label>
                          <div className="relative">
                            {isEditing ? (
                              <Select
                                value={profileForm.data.country}
                                onValueChange={(value) => handleCountryChange(value)}
                              >
                                <SelectTrigger 
                                  className="w-full h-auto px-0 py-3 border-0 border-b-2 border-gray-400 bg-transparent rounded-none focus:ring-0 focus:border-black transition-colors font-light text-base"
                                >
                                  <SelectValue placeholder="Select Country" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-100 rounded-none shadow-xl">
                                  {countries?.map((c: any) => (
                                    <SelectItem 
                                      key={c.id} 
                                      value={c.id.toString()}
                                      className="font-light hover:bg-gray-50 focus:bg-gray-50"
                                    >
                                      {c.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <input
                                type="text"
                                value={getCountryName()}
                                className="w-full px-0 py-3 border-0 border-b-2 border-gray-200 bg-transparent focus:outline-none transition-colors font-light cursor-default"
                                readOnly
                              />
                            )}
                          </div>
                          {profileForm.errors.country && <p className="mt-1 text-xs text-red-600">{profileForm.errors.country}</p>}
                        </div>

                        {/* State */}
                        <div>
                          <label className="block text-sm font-light tracking-widest uppercase text-gray-700 mb-3">
                            State
                          </label>
                          <div className="relative">
                            {isEditing ? (
                              <Select
                                value={profileForm.data.state}
                                onValueChange={(value) => handleStateChange(value)}
                                disabled={!profileForm.data.country || loadingStates}
                              >
                                <SelectTrigger 
                                  className="w-full h-auto px-0 py-3 border-0 border-b-2 border-gray-400 bg-transparent rounded-none focus:ring-0 focus:border-black transition-colors font-light text-base disabled:opacity-50"
                                >
                                  <SelectValue placeholder={loadingStates ? 'Loading...' : 'Select State'} />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-100 rounded-none shadow-xl">
                                  {states.map((s: any) => (
                                    <SelectItem 
                                      key={s.id} 
                                      value={s.id.toString()}
                                      className="font-light hover:bg-gray-50 focus:bg-gray-50"
                                    >
                                      {s.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <input
                                type="text"
                                value={getStateName()}
                                className="w-full px-0 py-3 border-0 border-b-2 border-gray-200 bg-transparent focus:outline-none transition-colors font-light cursor-default"
                                readOnly
                              />
                            )}
                          </div>
                          {profileForm.errors.state && <p className="mt-1 text-xs text-red-600">{profileForm.errors.state}</p>}
                        </div>

                        {/* City */}
                        <div>
                          <label className="block text-sm font-light tracking-widest uppercase text-gray-700 mb-3">
                            City
                          </label>
                          <div className="relative">
                            {isEditing ? (
                              <Select
                                value={profileForm.data.city}
                                onValueChange={(value) => profileForm.setData('city', value)}
                                disabled={!profileForm.data.state || loadingCities}
                              >
                                <SelectTrigger 
                                  className="w-full h-auto px-0 py-3 border-0 border-b-2 border-gray-400 bg-transparent rounded-none focus:ring-0 focus:border-black transition-colors font-light text-base disabled:opacity-50"
                                >
                                  <SelectValue placeholder={loadingCities ? 'Loading...' : 'Select City'} />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-gray-100 rounded-none shadow-xl">
                                  {cities.map((c: any) => (
                                    <SelectItem 
                                      key={c.id} 
                                      value={c.id.toString()}
                                      className="font-light hover:bg-gray-50 focus:bg-gray-50"
                                    >
                                      {c.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <input
                                type="text"
                                value={getCityName()}
                                className="w-full px-0 py-3 border-0 border-b-2 border-gray-200 bg-transparent focus:outline-none transition-colors font-light cursor-default"
                                readOnly
                              />
                            )}
                          </div>
                          {profileForm.errors.city && <p className="mt-1 text-xs text-red-600">{profileForm.errors.city}</p>}
                        </div>

                        {/* Postal Code */}
                        <div>
                          <label className="block text-sm font-light tracking-widest uppercase text-gray-700 mb-3">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            value={isEditing ? profileForm.data.postal_code : (user.address?.postal_code || 'Not provided')}
                            onChange={(e) => profileForm.setData('postal_code', e.target.value)}
                            className={`w-full px-0 py-3 border-0 border-b-2 bg-transparent focus:outline-none focus:border-black transition-colors font-light ${
                              isEditing ? 'border-gray-400' : 'border-gray-200 cursor-default'
                            }`}
                            readOnly={!isEditing}
                            placeholder="ZIP/Postal Code"
                          />
                          {profileForm.errors.postal_code && <p className="mt-1 text-xs text-red-600">{profileForm.errors.postal_code}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-8 flex space-x-4">
                    {isEditing ? (
                      <>
                        <button 
                          type="submit"
                          disabled={profileForm.processing}
                          className="bg-black text-white px-8 py-3 font-light tracking-wide uppercase text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                          {profileForm.processing ? 'Saving...' : 'Save Profile'}
                        </button>
                        <button 
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="border border-gray-300 px-8 py-3 font-light tracking-wide uppercase text-sm hover:border-black transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          type="button"
                          onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                          className="bg-black text-white px-8 py-3 font-light tracking-wide uppercase text-sm hover:bg-gray-800 transition-colors"
                        >
                          Edit Profile
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => { e.preventDefault(); setShowPasswordForm(!showPasswordForm); }}
                          className="border border-gray-300 px-8 py-3 font-light tracking-wide uppercase text-sm hover:border-black transition-colors"
                        >
                          {showPasswordForm ? 'Cancel' : 'Change Password'}
                        </button>
                      </>
                    )}
                  </div>
                </form>
                  
                  {/* Password Change Form */}
                  {showPasswordForm && (
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <h2 className="text-2xl font-thin mb-6 tracking-wide">Change Password</h2>
                      <form onSubmit={handlePasswordSubmit} className="space-y-6">
                        <div>
                          <label className="block text-sm font-light tracking-widest uppercase text-gray-700 mb-3">
                            Current Password
                          </label>
                          <input
                            type="password"
                            value={passwordForm.data.current_password}
                            onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                            className="w-full px-0 py-3 border-0 border-b-2 border-gray-200 bg-transparent focus:outline-none focus:border-black transition-colors font-light"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-light tracking-widest uppercase text-gray-700 mb-3">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={passwordForm.data.password}
                            onChange={(e) => passwordForm.setData('password', e.target.value)}
                            className="w-full px-0 py-3 border-0 border-b-2 border-gray-200 bg-transparent focus:outline-none focus:border-black transition-colors font-light"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-light tracking-widest uppercase text-gray-700 mb-3">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={passwordForm.data.password_confirmation}
                            onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                            className="w-full px-0 py-3 border-0 border-b-2 border-gray-200 bg-transparent focus:outline-none focus:border-black transition-colors font-light"
                            required
                          />
                        </div>
                        
                        <div className="flex space-x-4">
                          <button 
                            type="submit"
                            disabled={passwordForm.processing}
                            className="bg-black text-white px-8 py-3 font-light tracking-wide uppercase text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 border-0 focus:outline-none focus:ring-0"
                            style={{ backgroundColor: '#000000', color: '#ffffff' }}
                          >
                            {passwordForm.processing ? 'Updating...' : 'Update Password'}
                          </button>
                          <button 
                            type="button"
                            onClick={() => setShowPasswordForm(false)}
                            className="border border-gray-300 px-8 py-3 font-light tracking-wide uppercase text-sm hover:border-black transition-colors"
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
      </StoreLayout>
    </>
  );
}