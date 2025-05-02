import React, { useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { MapPinIcon } from '@heroicons/react/24/outline';

const PlacesAutocomplete = ({ value, onChange, placeholder, className }) => {
  const inputRef = useRef();

  const handlePlaceSelect = () => {
    const autocomplete = inputRef.current;
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    console.log('Place selected:', place);

    if (place && place.geometry && place.geometry.location) {
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        address: place.formatted_address
      };
      console.log('Sending location:', location);
      onChange(location);
    }
  };

  return (
    <div className="relative">
      <MapPinIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
      <Autocomplete
        onLoad={ref => {
          inputRef.current = ref;
          console.log('Autocomplete loaded:', ref);
        }}
        onPlaceChanged={handlePlaceSelect}
        options={{
          componentRestrictions: { country: 'br' },
          fields: ['geometry', 'formatted_address']
        }}
      >
        <input
          type="text"
          defaultValue={value}
          placeholder={placeholder}
          className={className}
        />
      </Autocomplete>
    </div>
  );
};

export default PlacesAutocomplete; 