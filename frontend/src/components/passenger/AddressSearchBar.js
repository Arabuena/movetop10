import React from 'react';
import { Autocomplete } from '@react-google-maps/api';

const AddressSearchBar = ({ placeholder, onPlaceSelect, value }) => {
  const [searchBox, setSearchBox] = React.useState(null);

  const handleLoad = (autocomplete) => {
    setSearchBox(autocomplete);
  };

  const handlePlaceChanged = () => {
    if (searchBox) {
      const place = searchBox.getPlace();
      if (place.geometry) {
        onPlaceSelect(place);
      }
    }
  };

  return (
    <div className="relative">
      <Autocomplete
        onLoad={handleLoad}
        onPlaceChanged={handlePlaceChanged}
        restrictions={{ country: 'br' }}
      >
        <input
          type="text"
          placeholder={placeholder}
          defaultValue={value}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
        />
      </Autocomplete>
    </div>
  );
};

export default AddressSearchBar; 