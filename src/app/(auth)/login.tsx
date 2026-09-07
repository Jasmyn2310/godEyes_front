import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react-native';
import { useAuthStore } from '@/features/auth/store/auth-store';
import { BrandLogo } from '@/shared/ui/brand-logo';
import { ENDPOINTS } from '@/core/config/api.config';

interface LoginResponsePayload {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    name?: string | null;
  };
  message?: string | string[];
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { setAuth } = useAuthStore();

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu correo electrónico y contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(ENDPOINTS.auth.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
        }),
      });

      const data = (await response.json()) as LoginResponsePayload;

      if (!response.ok) {
        const errorMessage = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || 'Credenciales inválidas. Verifica tus datos.';
        Alert.alert('Acceso Denegado', errorMessage);
        return;
      }

      setAuth(data.accessToken, data.user);
      router.replace('/(tabs)');
    } catch {
      Alert.alert(
        'Error de conexión',
        'No se pudo establecer conexión con el servidor. Verifica tu red e inténtalo nuevamente.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillCredentials = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
  };

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerSection}>
            <BrandLogo size={80} />
          </View>

          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <Text style={styles.welcomeTitle}>Iniciar Sesión</Text>
              <Text style={styles.welcomeSubtitle}>
                Accede con tus credenciales de monitoreo
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <View
                style={[
                  styles.inputWrapper,
                  isEmailFocused ? styles.inputWrapperFocused : null,
                ]}
              >
                <Mail
                  size={18}
                  color={isEmailFocused ? '#0284C7' : '#94A3B8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="ejemplo@godeyes.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.inputLabel}>Contraseña</Text>
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  isPasswordFocused ? styles.inputWrapperFocused : null,
                ]}
              >
                <Lock
                  size={18}
                  color={isPasswordFocused ? '#0284C7' : '#94A3B8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.passwordToggle}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#64748B" />
                  ) : (
                    <Eye size={18} color="#64748B" />
                  )}
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleLogin}
              disabled={isLoading || !isFormValid}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Iniciar sesión"
              style={({ pressed }) => [
                styles.submitButton,
                !isFormValid || isLoading ? styles.submitButtonDisabled : null,
                pressed && isFormValid && !isLoading ? styles.submitButtonPressed : null,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.submitButtonText}>Entrar al Sistema</Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </View>
              )}
            </Pressable>

            <View style={styles.demoCredentialsBox}>
              <Text style={styles.demoTitle}>ACCESO RÁPIDO DE PRUEBA</Text>
              <View style={styles.demoButtonsRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.demoChip,
                    pressed ? styles.demoChipPressed : null,
                  ]}
                  onPress={() => handleFillCredentials('admin@godeyes.com', 'admin123')}
                >
                  <Text style={styles.demoChipText}>Admin</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.demoChip,
                    pressed ? styles.demoChipPressed : null,
                  ]}
                  onPress={() => handleFillCredentials('vendor0@godeyes.test', 'vendor123')}
                >
                  <Text style={styles.demoChipText}>Vendedor</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>¿Aún no tienes cuenta? </Text>
            <Pressable
              onPress={() => router.push('/(auth)/register')}
              accessible={true}
              accessibilityRole="link"
              accessibilityLabel="Ir a registro"
            >
              <Text style={styles.footerLink}>Crear cuenta</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeader: {
    marginBottom: 22,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 50,
  },
  inputWrapperFocused: {
    borderColor: '#0284C7',
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    height: '100%',
  },
  passwordToggle: {
    padding: 4,
    marginLeft: 6,
  },
  submitButton: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonPressed: {
    backgroundColor: '#0369A1',
    transform: [{ scale: 0.99 }],
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  demoCredentialsBox: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  demoChip: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  demoChipPressed: {
    backgroundColor: '#E0F2FE',
  },
  demoChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0284C7',
  },
});
