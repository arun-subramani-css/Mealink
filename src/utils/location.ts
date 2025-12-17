export const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    const data = await response.json();
    
    // Try to create a readable location name
    if (data.locality && data.city) {
      return `${data.locality}, ${data.city}`;
    } else if (data.city && data.countryName) {
      return `${data.city}, ${data.countryName}`;
    } else if (data.display_name) {
      // Extract the most relevant parts from display_name
      const parts = data.display_name.split(', ');
      if (parts.length >= 2) {
        return `${parts[0]}, ${parts[1]}`;
      }
      return data.display_name;
    } else {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};