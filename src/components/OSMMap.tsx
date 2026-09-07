import React, { useRef, useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

interface Vendor {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface OSMMapProps {
  initialRegion?: {
    latitude: number;
    longitude: number;
  };
  vendors?: Vendor[];
  focusVendor?: Vendor | null;
  style?: StyleProp<ViewStyle>;
}

export const OSMMap = ({ initialRegion, vendors = [], focusVendor, style }: OSMMapProps) => {
  const webViewRef = useRef<WebView>(null);
  const lat = focusVendor ? focusVendor.lat : initialRegion?.latitude || -12.0464;
  const lng = focusVendor ? focusVendor.lng : initialRegion?.longitude || -77.0428;
  const zoom = focusVendor ? 17 : 15;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { padding: 0; margin: 0; background-color: #f0f0f0; }
          html, body, #map { height: 100%; width: 100vw; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map').setView([${lat}, ${lng}], ${zoom});
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          // User Marker
          const userIcon = L.divIcon({
            html: '<div style="background-color:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 5px rgba(0,0,0,0.5);"></div>',
            className: '',
            iconSize: [22, 22]
          });
          L.marker([${lat}, ${lng}], { icon: userIcon }).addTo(map).bindPopup('Tú');

          let markers = {};

          document.addEventListener('message', function(event) {
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'UPDATE_VENDORS') {
                const updatedVendors = data.payload;
                
                updatedVendors.forEach(vendor => {
                  if (markers[vendor.id]) {
                    markers[vendor.id].setLatLng([vendor.lat, vendor.lng]);
                  } else {
                    const avatarHtml = vendor.photoUrl 
                      ? \`<img src="\${vendor.photoUrl}" style="width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.4);object-fit:cover;" />\`
                      : \`<div style="background-color:#10b981;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.4);"></div>\`;

                    const vendorIcon = L.divIcon({
                      html: avatarHtml,
                      className: '',
                      iconSize: vendor.photoUrl ? [28, 28] : [18, 18]
                    });
                    
                    const marker = L.marker([vendor.lat, vendor.lng], { icon: vendorIcon })
                      .addTo(map)
                      .bindPopup(vendor.name);
                    markers[vendor.id] = marker;
                  }
                });
              } else if (data.type === 'FOCUS_VENDOR') {
                const vendor = data.payload;
                map.setView([vendor.lat, vendor.lng], 17);
                if (markers[vendor.id]) {
                  markers[vendor.id].openPopup();
                }
              }
            } catch(e) {}
          });
        </script>
      </body>
    </html>
  `;

  useEffect(() => {
    if (webViewRef.current && vendors.length > 0) {
      const message = JSON.stringify({ type: 'UPDATE_VENDORS', payload: vendors });
      webViewRef.current.injectJavaScript(`
        document.dispatchEvent(new MessageEvent('message', {data: '${message}'}));
        true;
      `);
    }
  }, [vendors]);

  useEffect(() => {
    if (webViewRef.current && focusVendor) {
      const message = JSON.stringify({ type: 'FOCUS_VENDOR', payload: focusVendor });
      webViewRef.current.injectJavaScript(`
        document.dispatchEvent(new MessageEvent('message', {data: '${message}'}));
        true;
      `);
    }
  }, [focusVendor]);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        allowFileAccess={false}
        allowUniversalAccessFromFileURLs={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
