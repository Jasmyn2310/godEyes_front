import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FlashList } from '@shopify/flash-list';
import {
  Clock,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react-native';
import { useAuthStore } from '@/features/auth/store/auth-store';
import {
  PromotionItem,
  vendorApiService,
} from '@/features/vendor/services/vendor-api.service';

interface PromoCardProps {
  readonly item: PromotionItem;
  readonly onToggleActive: (item: PromotionItem) => void;
  readonly onDelete: (item: PromotionItem) => void;
}

const PromoRow = React.memo<PromoCardProps>(({ item, onToggleActive, onDelete }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleGroup}>
          <Sparkles size={18} color="#D97706" />
          <Text style={styles.promoTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </View>

        {item.discountPercent ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>-{item.discountPercent}%</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.promoDescription}>{item.description}</Text>

      {item.promoPrice ? (
        <View style={styles.promoPriceRow}>
          <Text style={styles.promoPriceLabel}>Precio Especial:</Text>
          <Text style={styles.promoPriceValue}>S/ {item.promoPrice.toFixed(2)}</Text>
        </View>
      ) : null}

      {item.validUntil ? (
        <View style={styles.expiryRow}>
          <Clock size={13} color="#94A3B8" />
          <Text style={styles.expiryText}>
            Vigente hasta: {new Date(item.validUntil).toLocaleDateString()}
          </Text>
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <View style={styles.statusGroup}>
          <Switch
            value={item.isActive}
            onValueChange={() => onToggleActive(item)}
            trackColor={{ false: '#CBD5E1', true: '#FDE68A' }}
            thumbColor={item.isActive ? '#D97706' : '#94A3B8'}
          />
          <Text style={[styles.statusText, item.isActive ? styles.statusActive : null]}>
            {item.isActive ? 'Activa' : 'Pausada'}
          </Text>
        </View>

        <Pressable
          onPress={() => onDelete(item)}
          style={({ pressed }) => [styles.deleteBtn, pressed ? styles.buttonPressed : null]}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Eliminar promoción ${item.title}`}
        >
          <Trash2 size={16} color="#EF4444" />
        </Pressable>
      </View>
    </View>
  );
});

export default function VendorPromotionsScreen() {
  const { userToken } = useAuthStore();
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<string>('');
  const [promoPrice, setPromoPrice] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const loadPromotions = useCallback(async () => {
    if (!userToken) return;
    try {
      setIsLoading(true);
      const list = await vendorApiService.getPromotions(userToken);
      setPromotions(list);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las promociones');
    } finally {
      setIsLoading(false);
    }
  }, [userToken]);

  useEffect(() => {
    void loadPromotions();
  }, [loadPromotions]);

  const handleCreate = async () => {
    if (!userToken) return;
    if (!title.trim()) {
      Alert.alert('Atención', 'Ingresa el título de la promoción');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Atención', 'Ingresa la descripción o términos');
      return;
    }

    try {
      setIsSaving(true);
      const parsedDiscount = discountPercent.trim() ? parseFloat(discountPercent) : undefined;
      const parsedPrice = promoPrice.trim() ? parseFloat(promoPrice) : undefined;

      await vendorApiService.createPromotion(userToken, {
        title: title.trim(),
        description: description.trim(),
        discountPercent: parsedDiscount,
        promoPrice: parsedPrice,
        isActive: true,
      });

      setTitle('');
      setDescription('');
      setDiscountPercent('');
      setPromoPrice('');
      setIsModalOpen(false);

      void loadPromotions();
    } catch {
      Alert.alert('Error', 'No se pudo crear la promoción');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = useCallback(
    async (item: PromotionItem) => {
      if (!userToken) return;
      const nextState = !item.isActive;
      setPromotions((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, isActive: nextState } : p)),
      );

      try {
        await vendorApiService.updatePromotion(userToken, item.id, {
          isActive: nextState,
        });
      } catch {
        setPromotions((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, isActive: !nextState } : p)),
        );
      }
    },
    [userToken],
  );

  const handleDelete = useCallback(
    (item: PromotionItem) => {
      Alert.alert('Eliminar Promoción', `¿Deseas eliminar "${item.title}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!userToken) return;
            try {
              await vendorApiService.deletePromotion(userToken, item.id);
              setPromotions((prev) => prev.filter((p) => p.id !== item.id));
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la promoción');
            }
          },
        },
      ]);
    },
    [userToken],
  );

  const renderItem = useCallback(
    ({ item }: { item: PromotionItem }) => (
      <PromoRow
        item={item}
        onToggleActive={handleToggleActive}
        onDelete={handleDelete}
      />
    ),
    [handleToggleActive, handleDelete],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Sparkles size={22} color="#D97706" />
          <View>
            <Text style={styles.title}>Mis Promociones</Text>
            <Text style={styles.subtitle}>
              Publica ofertas visibles al instante para tus clientes
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => setIsModalOpen(true)}
          style={({ pressed }) => [styles.addBtn, pressed ? styles.buttonPressed : null]}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Crear nueva promoción"
        >
          <Text style={styles.addBtnText}>Crear</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D97706" />
          <Text style={styles.centerText}>Cargando promociones...</Text>
        </View>
      ) : (
        <FlashList
          data={promotions}
          renderItem={renderItem}
          estimatedItemSize={140}
          keyExtractor={(item: PromotionItem) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Tag size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No tienes promociones activas</Text>
              <Text style={styles.emptySubtitle}>
                Crea ofertas como "2x1", descuentos especiales o combos para atraer más clientes.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Nueva Promoción</Text>
              <Pressable onPress={() => setIsModalOpen(false)}>
                <X size={22} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Título de la Oferta *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Combo Mañanero 2x1"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Descripción y Condiciones *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ej. Café pasado + sandwich mixto todos los lunes a viernes"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />

              <View style={styles.twoCols}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Descuento (%)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. 20"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={discountPercent}
                    onChangeText={setDiscountPercent}
                  />
                </View>

                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Precio Especial (S/)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. 9.50"
                    placeholderTextColor="#94A3B8"
                    keyboardType="decimal-pad"
                    value={promoPrice}
                    onChangeText={setPromoPrice}
                  />
                </View>
              </View>

              <Pressable
                onPress={handleCreate}
                disabled={isSaving}
                style={[styles.saveBtn, isSaving ? styles.disabledBtn : null]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Publicar Promoción</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D97706',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  discountBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  promoDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  promoPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  promoPriceLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  promoPriceValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  expiryText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  statusActive: {
    color: '#D97706',
    fontWeight: '700',
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  centerText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#334155',
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetBody: {
    paddingTop: 14,
    paddingBottom: 20,
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
  twoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  saveBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
