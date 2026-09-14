import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { FlashList } from '@shopify/flash-list';
import {
  CheckCircle2,
  Minus,
  Plus,
  Receipt,
  ShoppingBag,
  TrendingUp,
  X,
} from 'lucide-react-native';
import { useAuthStore } from '@/features/auth/store/auth-store';
import {
  ProductItem,
  SaleItem,
  SalesSummary,
  vendorApiService,
} from '@/features/vendor/services/vendor-api.service';

interface SaleRowProps {
  readonly item: SaleItem;
}

const SaleRow = React.memo<SaleRowProps>(({ item }) => {
  const timeStr = new Date(item.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.saleCard}>
      <View style={styles.saleIconBox}>
        <Receipt size={20} color="#059669" />
      </View>
      <View style={styles.saleInfo}>
        <Text style={styles.saleTitle} numberOfLines={1}>
          {item.productName}
        </Text>
        <Text style={styles.saleSubtitle}>
          {item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'} × S/ {item.unitPrice.toFixed(2)} • {timeStr}
        </Text>
      </View>
      <Text style={styles.saleTotal}>+S/ {item.totalAmount.toFixed(2)}</Text>
    </View>
  );
});

export default function VendorSalesScreen() {
  const { userToken } = useAuthStore();
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isNewSaleOpen, setIsNewSaleOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [customName, setCustomName] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const loadSalesData = useCallback(async () => {
    if (!userToken) return;
    try {
      setIsLoading(true);
      const [sum, salesList, prods] = await Promise.all([
        vendorApiService.getSalesSummary(userToken),
        vendorApiService.getSales(userToken),
        vendorApiService.getProducts(userToken),
      ]);
      setSummary(sum);
      setSales(salesList);
      setProducts(prods.filter((p) => p.isAvailable));
    } catch {
      Alert.alert('Error', 'No se pudieron sincronizar las ventas');
    } finally {
      setIsLoading(false);
    }
  }, [userToken]);

  useEffect(() => {
    void loadSalesData();
  }, [loadSalesData]);

  const computedTotal = useMemo(() => {
    const price = selectedProduct ? selectedProduct.price : parseFloat(unitPrice) || 0;
    return price * quantity;
  }, [selectedProduct, unitPrice, quantity]);

  const handleSelectCatalogProduct = (prod: ProductItem) => {
    setSelectedProduct(prod);
    setCustomName(prod.name);
    setUnitPrice(prod.price.toString());
  };

  const handleClearSelectedProduct = () => {
    setSelectedProduct(null);
    setCustomName('');
    setUnitPrice('');
  };

  const handleRecordSale = async () => {
    if (!userToken) return;
    const name = selectedProduct ? selectedProduct.name : customName.trim();
    if (!name) {
      Alert.alert('Atención', 'Selecciona un producto o ingresa su nombre');
      return;
    }

    const priceNum = selectedProduct ? selectedProduct.price : parseFloat(unitPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Atención', 'Ingresa un precio unitario válido');
      return;
    }

    try {
      setIsRecording(true);
      await vendorApiService.recordSale(userToken, {
        productId: selectedProduct?.id,
        productName: name,
        quantity,
        unitPrice: priceNum,
        totalAmount: computedTotal,
      });

      setSelectedProduct(null);
      setCustomName('');
      setUnitPrice('');
      setQuantity(1);
      setIsNewSaleOpen(false);

      void loadSalesData();
    } catch {
      Alert.alert('Error', 'No se pudo registrar la venta');
    } finally {
      setIsRecording(false);
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: SaleItem }) => <SaleRow item={item} />,
    [],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TrendingUp size={22} color="#059669" />
          <View>
            <Text style={styles.title}>Registro de Ventas</Text>
            <Text style={styles.subtitle}>
              Control financiero y cálculo diario de ingresos
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => setIsNewSaleOpen(true)}
          style={({ pressed }) => [styles.newSaleBtn, pressed ? styles.buttonPressed : null]}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Registrar nueva venta"
        >
          <Text style={styles.newSaleBtnText}>Vender</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        <View style={styles.summaryHeroCard}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroLabel}>Total Vendido Hoy</Text>
              <Text style={styles.heroAmount}>
                S/ {summary?.todayTotal ? summary.todayTotal.toFixed(2) : '0.00'}
              </Text>
            </View>
            <View style={styles.heroBadge}>
              <CheckCircle2 size={16} color="#059669" />
              <Text style={styles.heroBadgeText}>
                {summary?.todayCount ?? 0} {summary?.todayCount === 1 ? 'venta' : 'ventas'}
              </Text>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Ticket Promedio</Text>
              <Text style={styles.metricValue}>
                S/ {summary?.averageTicket ? summary.averageTicket.toFixed(2) : '0.00'}
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Esta Semana</Text>
              <Text style={styles.metricValue}>
                S/ {summary?.weekTotal ? summary.weekTotal.toFixed(2) : '0.00'}
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Este Mes</Text>
              <Text style={styles.metricValue}>
                S/ {summary?.monthTotal ? summary.monthTotal.toFixed(2) : '0.00'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transacciones Recientes</Text>
          <Text style={styles.sectionSubtitle}>
            Últimos registros de venta en el sistema
          </Text>
        </View>

        {isLoading && sales.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loadingText}>Cálculo de transacciones en curso...</Text>
          </View>
        ) : sales.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ShoppingBag size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Sin ventas registradas hoy</Text>
            <Text style={styles.emptySubtitle}>
              Presiona el botón "+ Vender" para registrar una venta rápida de tus productos.
            </Text>
          </View>
        ) : (
          <View style={styles.salesListContainer}>
            {sales.map((sale) => (
              <SaleRow key={sale.id} item={sale} />
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={isNewSaleOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsNewSaleOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Registrar Venta Rápida</Text>
                <Text style={styles.sheetSubtitle}>
                  Selecciona un producto o ingresa importe libre
                </Text>
              </View>
              <Pressable onPress={() => setIsNewSaleOpen(false)}>
                <X size={22} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
              {products.length > 0 ? (
                <>
                  <Text style={styles.inputLabel}>Seleccionar de tu catálogo:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.catalogScroll}
                  >
                    {products.map((p) => {
                      const isSelected = selectedProduct?.id === p.id;
                      return (
                        <Pressable
                          key={p.id}
                          onPress={() => handleSelectCatalogProduct(p)}
                          style={[
                            styles.productChip,
                            isSelected ? styles.productChipSelected : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.productChipName,
                              isSelected ? styles.productChipTextSelected : null,
                            ]}
                          >
                            {p.name}
                          </Text>
                          <Text
                            style={[
                              styles.productChipPrice,
                              isSelected ? styles.productChipPriceSelected : null,
                            ]}
                          >
                            S/ {p.price.toFixed(2)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </>
              ) : null}

              {selectedProduct ? (
                <View style={styles.selectedBanner}>
                  <View style={styles.selectedBannerLeft}>
                    <ShoppingBag size={18} color="#059669" />
                    <Text style={styles.selectedBannerText} numberOfLines={1}>
                      {selectedProduct.name} (S/ {selectedProduct.price.toFixed(2)})
                    </Text>
                  </View>
                  <Pressable onPress={handleClearSelectedProduct}>
                    <X size={18} color="#64748B" />
                  </Pressable>
                </View>
              ) : (
                <>
                  <Text style={styles.inputLabel}>Nombre del Producto / Concepto *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. Sandwich de Pollo / Menú"
                    placeholderTextColor="#94A3B8"
                    value={customName}
                    onChangeText={setCustomName}
                  />

                  <Text style={styles.inputLabel}>Precio Unitario (S/) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    keyboardType="decimal-pad"
                    value={unitPrice}
                    onChangeText={setUnitPrice}
                  />
                </>
              )}

              <Text style={styles.inputLabel}>Cantidad</Text>
              <View style={styles.quantityRow}>
                <Pressable
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={styles.qtyBtn}
                >
                  <Minus size={20} color="#334155" />
                </Pressable>
                <Text style={styles.qtyText}>{quantity}</Text>
                <Pressable
                  onPress={() => setQuantity((q) => q + 1)}
                  style={styles.qtyBtn}
                >
                  <Plus size={20} color="#334155" />
                </Pressable>
              </View>

              <View style={styles.totalCalculationCard}>
                <Text style={styles.totalCalcLabel}>Importe Total a Cobrar:</Text>
                <Text style={styles.totalCalcValue}>
                  S/ {computedTotal.toFixed(2)}
                </Text>
              </View>

              <Pressable
                onPress={handleRecordSale}
                disabled={isRecording}
                style={[styles.recordBtn, isRecording ? styles.disabledBtn : null]}
              >
                {isRecording ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.recordBtnText}>
                    Confirmar Venta • S/ {computedTotal.toFixed(2)}
                  </Text>
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
  newSaleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  newSaleBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#059669',
    marginTop: 4,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  salesListContainer: {
    gap: 10,
  },
  saleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  saleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  saleSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  saleTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
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
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
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
  sheetSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sheetBody: {
    paddingTop: 14,
    paddingBottom: 20,
  },
  catalogScroll: {
    gap: 8,
    paddingVertical: 6,
  },
  productChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productChipSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  productChipName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  productChipTextSelected: {
    color: '#FFFFFF',
  },
  productChipPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
  },
  productChipPriceSelected: {
    color: '#D1FAE5',
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
  },
  selectedBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  selectedBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
    flex: 1,
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
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 10,
  },
  qtyBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qtyText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    minWidth: 40,
    textAlign: 'center',
  },
  totalCalculationCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  totalCalcLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  totalCalcValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#059669',
    marginTop: 4,
  },
  recordBtn: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  recordBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
