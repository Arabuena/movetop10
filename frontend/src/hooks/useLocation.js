export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let watchId;

    const getLocation = async () => {
      try {
        // Primeiro tenta o método de alta precisão
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
            setError(null);
          },
          (err) => {
            console.error('Geolocation error:', err);
            // Tenta método alternativo em caso de erro
            fallbackLocation();
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      } catch (err) {
        console.error('Geolocation setup error:', err);
        fallbackLocation();
      }
    };

    getLocation();

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  return { location, error };
}; 