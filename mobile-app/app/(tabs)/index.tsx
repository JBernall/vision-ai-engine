import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';

const BACKEND_URL = 'http://YOUR_LOCAL_IP:3000/identify'; 

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface ScanResult {
  place: string;
  address: string;
  ai_description?: string;
  debug?: {
    angleDiff: number;
  };
}

export default function App() {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission denied');
        return;
      }

      await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 1 },
        (loc) => {
          setLocation(loc.coords);
        }
      );

      await Location.watchHeadingAsync((obj) => {
        setHeading(obj.trueHeading || obj.magHeading);
      });
    })();
  }, []);

  const handleScan = async () => {
    if (!location || heading === null) {
      Alert.alert("Wait", "Calibrating sensors...");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const payload = {
        lat: location.latitude,
        lng: location.longitude,
        heading: heading
      };

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      
      if (json.status === 'success' && json.data.found) {
        setResult(json.data);
      } else {
        setResult({ 
          place: "Nothing relevant found", 
          address: json.data?.message || "No targets in sight",
          debug: { angleDiff: 0 }
        });
      }

    } catch (error) {
      console.error(error);
      Alert.alert("Connection Error", "Could not reach the server. Check IP and Backend.");
    } finally {
      setLoading(false);
    }
  };

  let text = 'Waiting for GPS...';
  if (errorMsg) text = errorMsg;
  else if (location && heading !== null) text = `Heading: ${Math.round(heading)}°`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔭 Vision AI</Text>
      
      <View style={styles.card}>
        <Text style={styles.sensorData}>{text}</Text>
        {location && (
          <Text style={styles.coords}>
            Lat: {location.latitude.toFixed(4)} | Lng: {location.longitude.toFixed(4)}
          </Text>
        )}
      </View>

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.placeName}>{result.place}</Text>
          
          {result.ai_description && (
            <View style={styles.aiContainer}>
                <Text style={styles.aiLabel}>🤖 Vision AI says:</Text>
                <Text style={styles.aiText}>"{result.ai_description}"</Text>
            </View>
          )}

          <Text style={styles.address}>{result.address}</Text>
          {result.debug && (
            <Text style={styles.debug}>Offset: {result.debug.angleDiff}°</Text>
          )}
        </View>
      )}

      <TouchableOpacity 
        style={[styles.button, (!location || loading) && styles.buttonDisabled]} 
        onPress={handleScan}
        disabled={!location || loading}
      >
        {loading ? (
            <ActivityIndicator color="#fff" /> 
        ) : (
            <Text style={styles.buttonText}>SCAN TARGET</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 40 },
  card: { backgroundColor: '#1e1e1e', padding: 20, borderRadius: 15, width: '100%', alignItems: 'center', marginBottom: 20 },
  sensorData: { color: '#00d4ff', fontSize: 24, fontWeight: 'bold' },
  coords: { color: '#888', marginTop: 5 },
  aiContainer: { backgroundColor: '#252525', padding: 15, borderRadius: 10, marginVertical: 15, borderLeftWidth: 3, borderLeftColor: '#00d4ff', width: '100%' },
  aiLabel: { color: '#00d4ff', fontSize: 12, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase' },
  aiText: { color: '#eee', fontSize: 16, fontStyle: 'italic', lineHeight: 22 },
  button: { backgroundColor: '#00d4ff', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, width: '100%', alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#333' },
  buttonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  resultBox: { marginTop: 20, padding: 20, backgroundColor: '#2a2a2a', borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 20 },
  placeName: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  address: { color: '#bbb', marginTop: 10, textAlign: 'center', fontSize: 12 },
  debug: { color: '#555', fontSize: 10, marginTop: 10 }
});