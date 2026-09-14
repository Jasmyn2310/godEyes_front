import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import {
  Camera,
  Mail,
  MapPin,
  Phone,
  Shield,
  Signal,
  Store,
} from 'lucide-react-native';
import { useAuthStore } from '@/features/auth/store/auth-store';
import {
  formatMediaUrl,
  UserProfile,
  vendorApiService,
} from '@/features/vendor/services/vendor-api.service';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, userToken, logout, setAuth } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [vendorType, setVendorType] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [fixedAddress, setFixedAddress] = useState<string>('');
  const [fixedLatitude, setFixedLatitude] = useState<string>('');
  const [fixedLongitude, setFixedLongitude] = useState<string>('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isFetchingGps, setIsFetchingGps] = useState<boolean>(false);

  const loadProfile = useCallback(async () => {
    if (!userToken) return;
    try {
      setIsLoading(true);
      const data = await vendorApiService.getProfile(userToken);
      setProfile(data);
      setName(data.name || '');
      setPhone(data.phone || '');
      setVendorType(data.vendorType || '');
      setPriceRange(data.priceRange || '');
      setDescription(data.description || '');
      setFixedAddress(data.fixedAddress || '');
      setFixedLatitude(data.fixedLatitude ? data.fixedLatitude.toString() : '');
      setFixedLongitude(data.fixedLongitude ? data.fixedLongitude.toString() : '');
    } catch {
      Alert.alert('Error', 'No se pudo cargar la información del perfil');
    } finally {
      setIsLoading(false);
    }
  }, [userToken]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se requiere acceso a las fotos para actualizar tu imagen');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleCaptureCurrentGps = async () => {
    try {
      setIsFetchingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso Requerido', 'Concede permisos de ubicación para capturar tu GPS');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setFixedLatitude(loc.coords.latitude.toFixed(6));
      setFixedLongitude(loc.coords.longitude.toFixed(6));

      Alert.alert(
        'GPS Capturado',
        `Coordenadas fijadas:\nLat: ${loc.coords.latitude.toFixed(6)}\nLng: ${loc.coords.longitude.toFixed(6)}`,
      );
    } catch {
      Alert.alert('Error', 'No se pudo obtener la posición satelital actual');
    } finally {
      setIsFetchingGps(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!userToken) return;

    try {
      setIsSaving(true);
      let uploadedPhotoUrl: string | undefined = undefined;

      if (photoUri) {
        uploadedPhotoUrl = await vendorApiService.uploadImage(userToken, photoUri);
      }

      const latNum = fixedLatitude.trim() ? parseFloat(fixedLatitude) : undefined;
      const lngNum = fixedLongitude.trim() ? parseFloat(fixedLongitude) : undefined;

      const updated = await vendorApiService.updateProfile(userToken, {
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        vendorType: vendorType.trim() || undefined,
        priceRange: priceRange.trim() || undefined,
        description: description.trim() || undefined,
        fixedAddress: fixedAddress.trim() || undefined,
        fixedLatitude: latNum,
        fixedLongitude: lngNum,
        photoUrl: uploadedPhotoUrl ?? profile?.photoUrl ?? undefined,
      });

      setProfile(updated);
      setIsEditing(false);
      setPhotoUri(null);

      if (user) {
        setAuth(userToken, {
          ...user,
          name: updated.name,
        });
      }

      Alert.alert('Éxito', 'Tu perfil y ubicación fija han sido actualizados');
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm('¿Estás seguro de que deseas salir de tu cuenta?') : true;
      if (confirmed) {
        logout();
        router.replace('/(auth)/login');
      }
      return;
    }

    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const isVendor = user?.role === 'vendor';
  const initial = profile?.name
    ? profile.name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
          <Pressable
            onPress={() => setIsEditing((prev) => !prev)}
            style={({ pressed }) => [
              styles.editToggleBtn,
              isEditing ? styles.editToggleBtnActive : null,
              pressed ? styles.buttonPressed : null,
            ]}
          >
            <Text style={isEditing ? styles.editToggleTextActive : styles.editToggleText}>
              {isEditing ? 'Cancelar' : 'Editar'}
            </Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0284C7" />
            <Text style={styles.centerText}>Cargando información de tu cuenta...</Text>
          </View>
        ) : (
          <>
            <View style={styles.avatarCard}>
              <Pressable
                onPress={isEditing ? handlePickPhoto : undefined}
                style={styles.avatarWrapper}
              >
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.avatarImage} contentFit="cover" />
                ) : profile?.photoUrl ? (
                  <Image
                    source={{ uri: formatMediaUrl(profile.photoUrl) }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>
                )}

                {isEditing ? (
                  <View style={styles.cameraBadge}>
                    <Camera size={14} color="#FFFFFF" />
                  </View>
                ) : null}
              </Pressable>

              <Text style={styles.userName}>{profile?.name || 'Nombre no registrado'}</Text>
              <View style={styles.roleBadge}>
                <Shield size={14} color="#0284C7" />
                <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'USUARIO'}</Text>
              </View>
            </View>

            {isEditing ? (
              <View style={styles.formCard}>
                <Text style={styles.cardHeaderTitle}>Editar Información Personal</Text>

                <Text style={styles.inputLabel}>Nombre Comercial / Titular</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. El Buen Sabor / Juan Pérez"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                />

                <Text style={styles.inputLabel}>Teléfono / WhatsApp</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. +51 987 654 321"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />

                {isVendor ? (
                  <>
                    <Text style={styles.inputLabel}>Tipo de Puesto / Categoría</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ej. Desayunos, Comida Rápida, Bebidas"
                      placeholderTextColor="#94A3B8"
                      value={vendorType}
                      onChangeText={setVendorType}
                    />

                    <Text style={styles.inputLabel}>Rango de Precios</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ej. S/ 5 - S/ 15"
                      placeholderTextColor="#94A3B8"
                      value={priceRange}
                      onChangeText={setPriceRange}
                    />

                    <Text style={styles.inputLabel}>Descripción del Negocio</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Describe tus especialidades, horarios o promociones..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      numberOfLines={3}
                      value={description}
                      onChangeText={setDescription}
                    />

                    <View style={styles.divider} />

                    <View style={styles.fixedLocationBox}>
                      <View style={styles.fixedLocationHeader}>
                        <MapPin size={20} color="#0284C7" />
                        <View style={styles.fixedLocationTitleGroup}>
                          <Text style={styles.fixedLocationTitle}>Ubicación Fija Registrada</Text>
                          <Text style={styles.fixedLocationSubtitle}>
                            Coordenadas de tu puesto permanente cuando no transmitas en vivo.
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        onPress={handleCaptureCurrentGps}
                        disabled={isFetchingGps}
                        style={({ pressed }) => [
                          styles.gpsCaptureBtn,
                          pressed ? styles.buttonPressed : null,
                        ]}
                      >
                        {isFetchingGps ? (
                          <ActivityIndicator size="small" color="#0284C7" />
                        ) : (
                          <Text style={styles.gpsCaptureBtnText}>
                            Capturar GPS Actual
                          </Text>
                        )}
                      </Pressable>

                      <View style={styles.coordsRow}>
                        <View style={styles.coordCol}>
                          <Text style={styles.inputLabel}>Latitud Fija</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="-13.1606"
                            placeholderTextColor="#94A3B8"
                            keyboardType="numeric"
                            value={fixedLatitude}
                            onChangeText={setFixedLatitude}
                          />
                        </View>
                        <View style={styles.coordCol}>
                          <Text style={styles.inputLabel}>Longitud Fija</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="-74.2258"
                            placeholderTextColor="#94A3B8"
                            keyboardType="numeric"
                            value={fixedLongitude}
                            onChangeText={setFixedLongitude}
                          />
                        </View>
                      </View>

                      <Text style={styles.inputLabel}>Dirección o Referencia Física</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ej. Puerta 3, frente al pabellón C, puesto 15"
                        placeholderTextColor="#94A3B8"
                        value={fixedAddress}
                        onChangeText={setFixedAddress}
                      />
                    </View>
                  </>
                ) : null}

                <Pressable
                  onPress={handleSaveProfile}
                  disabled={isSaving}
                  style={[styles.saveProfileBtn, isSaving ? styles.disabledBtn : null]}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveProfileBtnText}>Guardar Cambios</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.infoSection}>
                  <Text style={styles.cardHeaderTitle}>Información de la Cuenta</Text>

                  <View style={styles.infoRow}>
                    <View style={styles.iconWrapper}>
                      <Mail size={18} color="#64748B" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Correo Electrónico</Text>
                      <Text style={styles.infoValue}>{profile?.email || user?.email}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <View style={styles.iconWrapper}>
                      <Phone size={18} color="#64748B" />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Teléfono / Contacto</Text>
                      <Text style={styles.infoValue}>
                        {profile?.phone || 'Sin registrar (pulsa Editar)'}
                      </Text>
                    </View>
                  </View>

                  {isVendor ? (
                    <>
                      <View style={styles.infoRow}>
                        <View style={styles.iconWrapper}>
                          <Store size={18} color="#64748B" />
                        </View>
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Especialidad / Tipo</Text>
                          <Text style={styles.infoValue}>
                            {profile?.vendorType || 'No especificado'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.infoRow}>
                        <View style={styles.iconWrapper}>
                          <MapPin size={18} color="#0284C7" />
                        </View>
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Ubicación Fija Registrada</Text>
                          <Text style={styles.infoValue}>
                            {profile?.fixedAddress ||
                              (profile?.fixedLatitude
                                ? `${profile.fixedLatitude.toFixed(4)}, ${profile.fixedLongitude?.toFixed(4)}`
                                : 'Sin ubicación fija (pulsa Editar)')}
                          </Text>
                        </View>
                      </View>

                      {profile?.description ? (
                        <View style={styles.descriptionRow}>
                          <Text style={styles.infoLabel}>Descripción del Negocio</Text>
                          <Text style={styles.descriptionText}>{profile.description}</Text>
                        </View>
                      ) : null}
                    </>
                  ) : null}
                </View>

                {isVendor ? (
                  <View style={styles.beaconExplanationCard}>
                    <Signal size={20} color="#059669" />
                    <View style={styles.beaconExplanationContent}>
                      <Text style={styles.beaconExplanationTitle}>
                        ¿Transmisión en Vivo vs. Ubicación Fija?
                      </Text>
                      <Text style={styles.beaconExplanationText}>
                        • **Ubicación Fija:** Se muestra cuando tu baliza está apagada o no estás conectado.
                        {'\n'}• **Baliza en Vivo:** Al encenderla desde la pestaña "Mi Baliza", tus clientes verán tu movimiento satelital en tiempo real sobre el radar.
                      </Text>
                    </View>
                  </View>
                ) : null}
              </>
            )}

            <Pressable
              style={({ pressed }) => [styles.logoutButton, pressed ? styles.buttonPressed : null]}
              onPress={handleLogout}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
            >
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  editToggleBtnActive: {
    backgroundColor: '#DCFCE7',
  },
  editToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  editToggleTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  avatarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#E2E8F0',
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: 'bold',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0F172A',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  roleText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  fixedLocationBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 16,
  },
  fixedLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  fixedLocationTitleGroup: {
    flex: 1,
  },
  fixedLocationTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0369A1',
  },
  fixedLocationSubtitle: {
    fontSize: 12,
    color: '#0284C7',
    marginTop: 2,
    lineHeight: 16,
  },
  gpsCaptureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  gpsCaptureBtnText: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '700',
  },
  coordsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordCol: {
    flex: 1,
  },
  saveProfileBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveProfileBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
  },
  descriptionRow: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginTop: 4,
  },
  beaconExplanationCard: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    alignItems: 'flex-start',
    gap: 12,
  },
  beaconExplanationContent: {
    flex: 1,
  },
  beaconExplanationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 4,
  },
  beaconExplanationText: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 18,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 14,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
  },
  centerText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
  },
});
