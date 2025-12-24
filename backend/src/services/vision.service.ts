import axios from 'axios';

interface GooglePlace {
    name: string;
    vicinity: string;
    geometry: {
        location: {
            lat: number;
            lng: number;
        }
    };
    types: string[];
}

const PRIORITY_TYPES = [
    'tourist_attraction',
    'point_of_interest',
    'museum',
    'church',
    'place_of_worship',
    'landmark',
    'historical_landmark',
    'art_gallery',
    'park',
    'town_square',
    'sculpture',
    'monument'
];

const IGNORED_TYPES = [
    'gas_station',
    'atm',
    'parking',
    'car_wash',
    'laundry'
];

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLng = toRad(lng2 - lng1);
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);

    const y = Math.sin(dLng) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);

    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export const visionService = {
    identifyTarget: async (userLat: number, userLng: number, userHeading: number) => {
        if (!process.env.GOOGLE_API_KEY) {
            throw new Error("Missing GOOGLE_API_KEY in .env file");
        }

        const url = 'https://places.googleapis.com/v1/places:searchNearby';

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': process.env.GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.types'
            }
        };

        const body = {
            locationRestriction: {
                circle: {
                    center: {
                        latitude: userLat,
                        longitude: userLng
                    },
                    radius: 80.0
                }
            },
            languageCode: 'en'
        };

        try {
            const response = await axios.post(url, body, config);
            const rawPlaces = response.data.places;

            if (!rawPlaces || rawPlaces.length === 0) {
                return { found: false, message: "No interesting landmarks nearby." };
            }

            const places: GooglePlace[] = rawPlaces.map((p: any) => ({
                name: p.displayName?.text || 'Unknown',
                vicinity: p.formattedAddress || '',
                geometry: {
                    location: {
                        lat: p.location.latitude,
                        lng: p.location.longitude
                    }
                },
                types: p.types || []
            }));

            const candidates = places
                .map(place => {
                    const placeLat = place.geometry.location.lat;
                    const placeLng = place.geometry.location.lng;

                    const bearingToPlace = calculateBearing(userLat, userLng, placeLat, placeLng);

                    let angleDiff = Math.abs(bearingToPlace - userHeading);
                    if (angleDiff > 180) angleDiff = 360 - angleDiff;

                    const isTouristArgs = place.types.some(t => PRIORITY_TYPES.includes(t));
                    const isIgnored = place.types.some(t => IGNORED_TYPES.includes(t));

                    let score = angleDiff;

                    if (isTouristArgs) {
                        score -= 25;
                    }
                    
                    if (isIgnored) {
                        score += 20;
                    }

                    return { ...place, angleDiff, score, isTouristArgs };
                })
                .filter(p => p.angleDiff < 60); 

            candidates.sort((a, b) => a.score - b.score);

            const bestMatch = candidates[0];

            if (!bestMatch) {
                return {
                    found: false,
                    message: "Nothing relevant in your field of view.",
                };
            }

            if (bestMatch.angleDiff > 50) {
                 return {
                    found: false,
                    message: "Nearby landmarks, but not in your view.",
                };
            }

            return {
                found: true,
                place: bestMatch.name,
                address: bestMatch.vicinity,
                type: bestMatch.isTouristArgs ? 'landmark' : 'standard',
                debug: {
                    angleDiff: Math.round(bestMatch.angleDiff),
                    score: Math.round(bestMatch.score)
                }
            };
        } catch (error: any) {
            console.error("Error in vision.service", error?.response?.data || error.message);
            throw new Error("Failed to connect to Google Maps");
        }
    }
};