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
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import { BrandLogo } from '@/shared/ui/brand-logo';
import { ENDPOINTS } from '@/core/config/api.config';

interface RegisterResponsePayload {
  id?: string;
  email?: string;
  message?: string | string[];
}

export default function RegisterScreen() {
  const [role, setRole] = useState<'vendor' | 'client'>('vendor');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleRegister = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanPassword) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu correo electrónico y contraseña.');
      return;
    }

    if (cleanPassword.length < 6) {
      Alert.alert('Contraseña corta', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(ENDPOINTS.auth.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: cleanName || undefined,
          email: cleanEmail,
          password: cleanPassword,
          role,
        }),
      });

      const data = (await response.json()) as RegisterResponsePayload;

      if (!response.ok) {
        const errorMessage = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || 'No se pudo completar el registro.';
        Alert.alert('Error de registro', errorMessage);
        return;
      }

      Alert.alert(
        '¡Registro Exitoso!',
        'Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión en GodEyes.',
        [
          {
            text: 'Ingresar Ahora',
            onPress: () => router.replace('/(auth)/login'),
          },
        ],
      );
    } catch {
      Alert.alert(
        'Error de conexión',
        'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = email.trim().length > 0 && password.trim().length >= 6;

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
            <BrandLogo size={100} subtitle="Crear Cuenta en la Plataforma" />
          </View>

          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Registro</Text>
              <Text style={styles.cardSubtitle}>
                Completa tus datos para crear una nueva cuenta
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Tipo de cuenta</Text>
              <View style={styles.roleSelectorRow}>
                <Pressable
                  onPress={() => setRole('vendor')}
                  style={[
                    styles.roleChoiceBtn,
                    role === 'vendor' ? styles.roleChoiceBtnActive : null,
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Cuenta de Vendedor"
                >
                  <Text
                    style={[
                      styles.roleChoiceText,
                      role === 'vendor' ? styles.roleChoiceTextActive : null,
                    ]}
                  >
                    Vendedor
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setRole('client')}
                  style={[
                    styles.roleChoiceBtn,
                    role === 'client' ? styles.roleChoiceBtnClientActive : null,
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Cuenta de Cliente"
                >
                  <Text
                    style={[
                      styles.roleChoiceText,
                      role === 'client' ? styles.roleChoiceTextActive : null,
                    ]}
                  >
                    Cliente
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Nombre completo</Text>
              <View
                style={[
                  styles.inputWrapper,
                  isNameFocused ? styles.inputWrapperFocused : null,
                ]}
              >
                <User
                  size={18}
                  color={isNameFocused ? '#0284C7' : '#94A3B8'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ej. Juan Pérez"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setIsNameFocused(true)}
                  onBlur={() => setIsNameFocused(false)}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
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
              <Text style={styles.inputLabel}>Contraseña (mínimo 6 caracteres)</Text>
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
              onPress={handleRegister}
              disabled={isLoading || !isFormValid}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Registrar cuenta"
              style={({ pressed }) => [
                styles.submitButton,
                !isFormValid || isLoading ? styles.submitButtonDisabled : null,
                pressed && isFormValid && !isLoading ? styles.submitButtonPressed : null,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Registrarme</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
            <Pressable
              onPress={() => router.back()}
              accessible={true}
              accessibilityRole="link"
              accessibilityLabel="Volver a inicio de sesión"
            >
              <Text style={styles.footerLink}>Inicia sesión</Text>
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
    marginBottom: 24,
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
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 16,
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
    marginTop: 10,
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
  roleSelectorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  roleChoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  roleChoiceBtnActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  roleChoiceBtnClientActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  roleChoiceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  roleChoiceTextActive: {
    color: '#FFFFFF',
  },
});
