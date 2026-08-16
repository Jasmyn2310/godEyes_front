import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';

export default function PlansScreen() {
  const handleSubscribe = (planName: string) => {
    // Aquí iría la integración con Stripe o pasarela de pagos
    Alert.alert('Simulación de Pago', `Has seleccionado el ${planName}. En el futuro esto abrirá la pasarela de pagos.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Planes para Vendedores</Text>
        <Text style={styles.subHeader}>Aumenta tu visibilidad y llega a más clientes</Text>

        {/* Plan Gratuito */}
        <View style={styles.card}>
          <Text style={styles.planName}>Plan Básico</Text>
          <Text style={styles.planPrice}>Gratis</Text>
          <View style={styles.featuresList}>
            <Text style={styles.feature}>✓ Aparece en el mapa</Text>
            <Text style={styles.feature}>✓ Actualiza tu ubicación manual</Text>
            <Text style={styles.feature}>✓ Perfil básico</Text>
          </View>
          <TouchableOpacity style={styles.buttonOutline} onPress={() => handleSubscribe('Plan Básico')}>
            <Text style={styles.buttonOutlineText}>Plan Actual</Text>
          </TouchableOpacity>
        </View>

        {/* Plan Premium */}
        <View style={[styles.card, styles.premiumCard]}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>RECOMENDADO</Text>
          </View>
          <Text style={[styles.planName, { color: 'white' }]}>Plan Premium</Text>
          <Text style={[styles.planPrice, { color: 'white' }]}>$4.99 / mes</Text>
          <View style={styles.featuresList}>
            <Text style={[styles.feature, { color: '#E5E7EB' }]}>✓ Todo lo del plan básico</Text>
            <Text style={[styles.feature, { color: '#E5E7EB' }]}>✓ Seguimiento en tiempo real automático</Text>
            <Text style={[styles.feature, { color: '#E5E7EB' }]}>✓ Destacado en las búsquedas</Text>
            <Text style={[styles.feature, { color: '#E5E7EB' }]}>✓ Catálogo de productos con fotos</Text>
          </View>
          <TouchableOpacity style={styles.buttonSolid} onPress={() => handleSubscribe('Plan Premium')}>
            <Text style={styles.buttonSolidText}>Suscribirse Ahora</Text>
          </TouchableOpacity>
        </View>
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
});
