import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ENDPOINTS } from '@/core/config/api.config';

export interface PlanItem {
  id: string;
  name: string;
  price: number;
  description: string;
  isPopular: boolean;
}

const DEFAULT_PLANS: PlanItem[] = [
  {
    id: 'plan-basic',
    name: 'Plan Básico',
    price: 0,
    description: 'Aparece en el mapa, Actualiza tu ubicación manual, Perfil básico',
    isPopular: false,
  },
  {
    id: 'plan-premium',
    name: 'Plan Premium',
    price: 4.99,
    description: 'Todo lo del plan básico, Seguimiento en tiempo real automático, Destacado en las búsquedas, Catálogo de productos con fotos',
    isPopular: true,
  },
];

export default function PlansScreen() {
  const [plans, setPlans] = useState<PlanItem[]>(DEFAULT_PLANS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadPlans(): Promise<void> {
      try {
        const response = await fetch(ENDPOINTS.subscriptions.plans);
        if (response.ok) {
          const data = (await response.json()) as PlanItem[];
          if (Array.isArray(data) && data.length > 0) {
            setPlans(data);
          }
        }
      } catch (error) {
        setPlans(DEFAULT_PLANS);
      } finally {
        setIsLoading(false);
      }
    }

    void loadPlans();
  }, []);

  const handleSubscribe = (planName: string) => {
    Alert.alert('Simulación de Pago', `Has seleccionado el ${planName}. En el futuro esto abrirá la pasarela de pagos.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Planes para Vendedores</Text>
        <Text style={styles.subHeader}>Aumenta tu visibilidad y llega a más clientes</Text>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          plans.map((plan) => {
            const features = plan.description.split(',').map((f) => f.trim());
            const isPremium = plan.isPopular || plan.price > 0;

            return (
              <View
                key={plan.id}
                style={[styles.card, isPremium ? styles.premiumCard : undefined]}
              >
                {plan.isPopular && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>RECOMENDADO</Text>
                  </View>
                )}
                <Text style={[styles.planName, isPremium ? styles.whiteText : undefined]}>
                  {plan.name}
                </Text>
                <Text style={[styles.planPrice, isPremium ? styles.whiteText : undefined]}>
                  {plan.price === 0 ? 'Gratis' : `$${plan.price.toFixed(2)} / mes`}
                </Text>
                <View style={styles.featuresList}>
                  {features.map((feature, idx) => (
                    <Text
                      key={`${plan.id}-feat-${idx}`}
                      style={[styles.feature, isPremium ? styles.lightGrayText : undefined]}
                    >
                      ✓ {feature}
                    </Text>
                  ))}
                </View>
                <TouchableOpacity
                  style={isPremium ? styles.buttonSolid : styles.buttonOutline}
                  onPress={() => handleSubscribe(plan.name)}
                >
                  <Text style={isPremium ? styles.buttonSolidText : styles.buttonOutlineText}>
                    {plan.price === 0 ? 'Plan Actual' : 'Suscribirse Ahora'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  premiumCard: {
    backgroundColor: '#1E3A8A', // Tailwind blue-900
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -12,
    right: 24,
    backgroundColor: '#F59E0B', // Tailwind amber-500
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 24,
  },
  featuresList: {
    gap: 12,
    marginBottom: 24,
  },
  feature: {
    fontSize: 16,
    color: '#4B5563',
  },
  buttonOutline: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonOutlineText: {
    color: '#4B5563',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonSolid: {
    backgroundColor: '#3B82F6', // Tailwind blue-500
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSolidText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loaderContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteText: {
    color: '#FFFFFF',
  },
  lightGrayText: {
    color: '#E5E7EB',
  },
});
