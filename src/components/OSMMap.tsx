import React, { useRef, useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export interface MapVendor {
  id: string;
  name: string;
  photoUrl?: string | null;
  type?: string | null;
  lat: number;
  lng: number;
  locationType?: 'realtime' | 'fixed';
  isLive?: boolean;
}

interface OSMMapProps {
  initialRegion?: {
    latitude: number;
    longitude: number;
  };
  vendors?: MapVendor[];
  focusVendor?: MapVendor | null;
  onSelectVendor?: (vendorId: string) => void;
  style?: StyleProp<ViewStyle>;
}

export const OSMMap = ({
  initialRegion,
  vendors = [],
  focusVendor,
  onSelectVendor,
  style,
}: OSMMapProps) => {
  const webViewRef = useRef<WebView>(null);
  const lat = focusVendor ? focusVendor.lat : initialRegion?.latitude || -13.1606;
  const lng = focusVendor ? focusVendor.lng : initialRegion?.longitude || -74.2258;
  const zoom = focusVendor ? 17 : 15;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { padding: 0; margin: 0; background-color: #f0f0f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          html, body, #map { height: 100%; width: 100vw; }
          .custom-popup .leaflet-popup-content-wrapper { border-radius: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 4px; }
          .custom-popup .leaflet-popup-content { margin: 8px 10px; line-height: 1.4; }
          .live-marker { background: #10B981; border: 2.5px solid #FFFFFF; border-radius: 50%; box-shadow: 0 0 10px rgba(16,185,129,0.7); }
          .fixed-marker { background: #0284C7; border: 2.5px solid #FFFFFF; border-radius: 50%; box-shadow: 0 0 8px rgba(2,132,199,0.5); }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], ${zoom});
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          const userIcon = L.divIcon({
            html: '<div style="background-color:#3B82F6;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,0.4);"></div>',
            className: '',
            iconSize: [20, 20]
          });
          L.marker([${lat}, ${lng}], { icon: userIcon }).addTo(map).bindPopup('<b>Tu Ubicación</b>');

          let markers = {};

          function renderPopupHtml(vendor) {
            const isLive = vendor.isLive || vendor.locationType === 'realtime';
            const badgeBg = isLive ? '#DCFCE7' : '#E0F2FE';
            const badgeColor = isLive ? '#15803D' : '#0369A1';
            const badgeText = isLive ? '🟢 EN VIVO' : '🔵 PUESTO FIJO';

            return \`
              <div style="min-width:140px;">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px;">
                  <strong style="font-size:14px;color:#0F172A;">\${vendor.name}</strong>
                </div>
                <span style="display:inline-block;background:\${badgeBg};color:\${badgeColor};font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;margin-bottom:6px;">\${badgeText}</span>
                <button onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:'SELECT_VENDOR', vendorId:'\${vendor.id}'}))" style="display:block;width:100%;background:#0284C7;color:#FFFFFF;border:none;border-radius:8px;padding:7px 10px;font-size:12px;font-weight:700;cursor:pointer;margin-top:4px;">Ver Catálogo y Perfil</button>
              </div>
            \`;
          }

          function syncVendorMarkers(vendorList) {
            if (!Array.isArray(vendorList)) return;
            vendorList.forEach(vendor => {
              const isLive = vendor.isLive || vendor.locationType === 'realtime';
              const markerColor = isLive ? '#10B981' : '#0284C7';

              if (markers[vendor.id]) {
                markers[vendor.id].setLatLng([vendor.lat, vendor.lng]);
                markers[vendor.id].setPopupContent(renderPopupHtml(vendor));
              } else {
                const avatarHtml = vendor.photoUrl 
                  ? \`<img src="\${vendor.photoUrl}" style="width:28px;height:28px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.4);object-fit:cover;" />\`
                  : \`<div style="background-color:\${markerColor};width:16px;height:16px;border-radius:50%;border:2.5px solid white;box-shadow:0 0 6px rgba(0,0,0,0.4);"></div>\`;

                const vendorIcon = L.divIcon({
                  html: avatarHtml,
                  className: '',
                  iconSize: vendor.photoUrl ? [32, 32] : [20, 20]
                });
                
                const marker = L.marker([vendor.lat, vendor.lng], { icon: vendorIcon })
                  .addTo(map)
                  .bindPopup(renderPopupHtml(vendor), { className: 'custom-popup' });

                markers[vendor.id] = marker;
              }
            });
          }

          window.syncVendorMarkers = syncVendorMarkers;
          window.focusVendorOnMap = function(vendor) {
            if (!vendor) return;
            map.setView([vendor.lat, vendor.lng], 17);
            if (markers[vendor.id]) {
              markers[vendor.id].openPopup();
            }
          };

          const initialVendors = ${JSON.stringify(vendors)};
          syncVendorMarkers(initialVendors);

          function handleIncomingMessage(event) {
            try {
              const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
              if (data.type === 'UPDATE_VENDORS') {
                syncVendorMarkers(data.payload);
              } else if (data.type === 'FOCUS_VENDOR') {
                window.focusVendorOnMap(data.payload);
              }
            } catch(e) {}
          }

          window.addEventListener('message', handleIncomingMessage);
          document.addEventListener('message', handleIncomingMessage);
        </script>
      </body>
    </html>
  `;

  const pushVendorsToMap = () => {
    if (webViewRef.current && vendors.length > 0) {
      const payloadString = JSON.stringify(vendors);
      webViewRef.current.injectJavaScript(`
        if (window.syncVendorMarkers) {
          window.syncVendorMarkers(${payloadString});
        }
        true;
      `);
    }
  };

  useEffect(() => {
    pushVendorsToMap();
  }, [vendors]);

  useEffect(() => {
    if (webViewRef.current && focusVendor) {
      const payloadString = JSON.stringify(focusVendor);
      webViewRef.current.injectJavaScript(`
        if (window.focusVendorOnMap) {
          window.focusVendorOnMap(${payloadString});
        }
        true;
      `);
    }
  }, [focusVendor]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data) as { type: string; vendorId: string };
      if (data.type === 'SELECT_VENDOR' && onSelectVendor) {
        onSelectVendor(data.vendorId);
      }
    } catch {}
  };

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
        onLoadEnd={pushVendorsToMap}
        onMessage={handleMessage}
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
