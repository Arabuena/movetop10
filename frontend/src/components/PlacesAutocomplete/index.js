import React, { useEffect, useRef } from 'react';
import logger from '../../utils/logger';

const PlacesAutocomplete = ({ onPlaceSelected }) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (!window.google) {
      logger.error('Google Maps não carregado');
      return;
    }

    const element = document.createElement('div');
    element.className = 'place-autocomplete-container';
    inputRef.current.parentNode.appendChild(element);

    autocompleteRef.current = new window.google.maps.places.PlaceAutocompleteElement({
      container: element,
      fields: ['formatted_address', 'geometry', 'name'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.formatted_address
        };
        onPlaceSelected(location);
      }
    });

    return () => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    };
  }, [onPlaceSelected]);

  return <div ref={inputRef} className="places-input" />;
};

export default PlacesAutocomplete; 