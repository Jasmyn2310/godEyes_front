import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import {
  Clock,
  MapPin,
  Phone,
  Signal,
  Sparkles,
  Star,
  Store,
  Tag,
  X,
} from 'lucide-react-native';
import {
  formatMediaUrl,
  vendorApiService,
  VendorDetailResponse,
} from '../services/vendor-api.service';

interface VendorDetailModalProps {
  readonly vendorId: string | null;
  readonly distanceText?: string | null;
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onFocusOnMap?: (lat: number, lng: number) => void;
}

type TabType = 'products' | 'promotions' | 'info';

export const VendorDetailModal: React.FC<VendorDetailModalProps> = ({
  vendorId,
  distanceText,
  visible,
  onClose,
  onFocusOnMap,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [vendorDetail, setVendorDetail] = useState<VendorDetailResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !vendorId) {
      setVendorDetail(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setErrorMsg(null);

    vendorApiService
      .getVendorDetail(vendorId)
      .then((data) => {
        if (isMounted) {
          setVendorDetail(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setErrorMsg(err instanceof Error ? err.message : 'Error al cargar puesto');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [visible, vendorId]);

  const filteredProducts = useMemo(() => {
    if (!vendorDetail) return [];
    if (selectedCategory === 'Todos') return vendorDetail.products;
    return vendorDetail.products.filter(
      (p) => p.categoryName?.toLowerCase() === selectedCategory.toLowerCase(),
    );
  }, [vendorDetail, selectedCategory]);

  const handleCallPhone = () => {
    if (vendorDetail?.phone) {
      void Linking.openURL(`tel:${vendorDetail.phone}`);
    }
  };

  const handleLocate = () => {
    if (vendorDetail?.currentLat && vendorDetail?.currentLng && onFocusOnMap) {
      onClose();
      onFocusOnMap(vendorDetail.currentLat, vendorDetail.currentLng);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.dragIndicator} />

          <View style={styles.modalHeader}>
            <View style={styles.headerTitles}>
              <Text style={styles.vendorName} numberOfLines={1}>
                {vendorDetail?.name || 'Cargando puesto...'}
              </Text>
              <Text style={styles.vendorType}>
                {vendorDetail?.type || 'Puesto Comercial'}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed ? styles.buttonPressed : null]}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Cerrar detalle de puesto"
            >
              <X size={20} color="#64748B" />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0284C7" />
              <Text style={styles.loadingText}>Obteniendo catálogo e información...</Text>
            </View>
          ) : errorMsg ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : vendorDetail ? (
            <>
              <View style={styles.profileSummaryCard}>
                <Image
                  source={{ uri: formatMediaUrl(vendorDetail.photoUrl) }}
                  style={styles.vendorAvatar}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.summaryInfo}>
                  <View style={styles.badgesRow}>
                    {vendorDetail.isLive ? (
                      <View style={styles.liveBadge}>
                        <Signal size={12} color="#10B981" />
                        <Text style={styles.liveBadgeText}>EN VIVO (GPS)</Text>
                      </View>
                    ) : (
                      <View style={styles.fixedBadge}>
                        <MapPin size={12} color="#0284C7" />
                        <Text style={styles.fixedBadgeText}>PUESTO FIJO</Text>
                      </View>
                    )}
                    <View style={styles.ratingBadge}>
                      <Star size={12} color="#F59E0B" fill="#F59E0B" />
                      <Text style={styles.ratingText}>4.9</Text>
                    </View>
                  </View>

                  {distanceText ? (
                    <Text style={styles.distanceInfo}>
                      <MapPin size={13} color="#64748B" /> A {distanceText} de tu ubicación
                    </Text>
                  ) : null}

                  {vendorDetail.phone ? (
                    <View style={styles.phoneRow}>
                      <Text style={styles.phoneText}>{vendorDetail.phone}</Text>
                      <Pressable
                        onPress={handleCallPhone}
                        style={({ pressed }) => [styles.phoneCallIconBtn, pressed ? styles.buttonPressed : null]}
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel={`Llamar al ${vendorDetail.phone}`}
                      >
                        <Phone size={14} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.tabsRow}>
                <Pressable
                  onPress={() => setActiveTab('products')}
                  style={[styles.tabButton, activeTab === 'products' ? styles.tabButtonActive : null]}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === 'products' ? styles.tabButtonTextActive : null,
                    ]}
                  >
                    Productos ({vendorDetail.products.length})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setActiveTab('promotions')}
                  style={[styles.tabButton, activeTab === 'promotions' ? styles.tabButtonActive : null]}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === 'promotions' ? styles.tabButtonTextActive : null,
                    ]}
                  >
                    Promociones ({vendorDetail.promotions.length})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setActiveTab('info')}
                  style={[styles.tabButton, activeTab === 'info' ? styles.tabButtonActive : null]}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === 'info' ? styles.tabButtonTextActive : null,
                    ]}
                  >
                    Ubicación
                  </Text>
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {activeTab === 'products' ? (
                  <View style={styles.tabContentContainer}>
                    {vendorDetail.categories.length > 0 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesBar}
                      >
                        {['Todos', ...vendorDetail.categories.map((c) => c.name)].map((cat) => (
                          <Pressable
                            key={cat}
                            onPress={() => setSelectedCategory(cat)}
                            style={[
                              styles.catChip,
                              selectedCategory === cat ? styles.catChipActive : null,
                            ]}
                          >
                            <Text
                              style={[
                                styles.catChipText,
                                selectedCategory === cat ? styles.catChipTextActive : null,
                              ]}
                            >
                              {cat}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    ) : null}

                    {filteredProducts.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Tag size={36} color="#CBD5E1" />
                        <Text style={styles.emptyTitle}>Sin productos registrados</Text>
                        <Text style={styles.emptySubtitle}>
                          Este puesto aún no ha publicado productos en esta categoría.
                        </Text>
                      </View>
                    ) : (
                      filteredProducts.map((product) => (
                        <View key={product.id} style={styles.productCard}>
                          {product.imageUrl ? (
                            <Image
                              source={{ uri: formatMediaUrl(product.imageUrl) }}
                              style={styles.productImage}
                              contentFit="cover"
                              transition={200}
                            />
                          ) : (
                            <View style={styles.productImagePlaceholder}>
                              <Store size={24} color="#94A3B8" />
                            </View>
                          )}
                          <View style={styles.productInfo}>
                            <View style={styles.productHeader}>
                              <Text style={styles.productName}>{product.name}</Text>
                              <Text style={styles.productPrice}>
                                S/ {product.price.toFixed(2)}
                              </Text>
                            </View>
                            {product.description ? (
                              <Text style={styles.productDescription} numberOfLines={2}>
                                {product.description}
                              </Text>
                            ) : null}
                            {product.categoryName ? (
                              <View style={styles.productCatBadge}>
                                <Text style={styles.productCatBadgeText}>
                                  {product.categoryName}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                ) : activeTab === 'promotions' ? (
                  <View style={styles.tabContentContainer}>
                    {vendorDetail.promotions.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Sparkles size={36} color="#CBD5E1" />
                        <Text style={styles.emptyTitle}>Sin promociones vigentes</Text>
                        <Text style={styles.emptySubtitle}>
                          El puesto no tiene ofertas activas en este momento.
                        </Text>
                      </View>
                    ) : (
                      vendorDetail.promotions.map((promo) => (
                        <View key={promo.id} style={styles.promoCard}>
                          <View style={styles.promoHeader}>
                            <View style={styles.promoTitleGroup}>
                              <Sparkles size={18} color="#F59E0B" />
                              <Text style={styles.promoTitle}>{promo.title}</Text>
                            </View>
                            {promo.discountPercent ? (
                              <View style={styles.discountBadge}>
                                <Text style={styles.discountBadgeText}>
                                  -{promo.discountPercent}%
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.promoDescription}>{promo.description}</Text>
                          {promo.promoPrice ? (
                            <View style={styles.promoPriceRow}>
                              <Text style={styles.promoPriceLabel}>Precio Especial:</Text>
                              <Text style={styles.promoPriceValue}>
                                S/ {promo.promoPrice.toFixed(2)}
                              </Text>
                            </View>
                          ) : null}
                          {promo.validUntil ? (
                            <View style={styles.promoExpiryRow}>
                              <Clock size={12} color="#94A3B8" />
                              <Text style={styles.promoExpiryText}>
                                Válido hasta: {new Date(promo.validUntil).toLocaleDateString()}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      ))
                    )}
                  </View>
                ) : (
                  <View style={styles.tabContentContainer}>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoCardTitle}>Ubicación y Referencias</Text>
                      <View style={styles.infoRow}>
                        <MapPin size={18} color="#0284C7" />
                        <Text style={styles.infoText}>
                          {vendorDetail.fixedAddress || 'Sin dirección fija registrada'}
                        </Text>
                      </View>

                      {vendorDetail.description ? (
                        <View style={styles.descriptionSection}>
                          <Text style={styles.descriptionLabel}>Sobre el puesto:</Text>
                          <Text style={styles.descriptionText}>
                            {vendorDetail.description}
                          </Text>
                        </View>
                      ) : null}

                      {onFocusOnMap && vendorDetail.currentLat && vendorDetail.currentLng ? (
                        <Pressable
                          onPress={handleLocate}
                          style={({ pressed }) => [
                            styles.locateActionBtn,
                            pressed ? styles.buttonPressed : null,
                          ]}
                          accessible
                          accessibilityRole="button"
                          accessibilityLabel="Centrar en el Mapa General"
                        >
                          <Text style={styles.locateActionBtnText}>
                            Centrar en el Mapa General
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                )}
              </ScrollView>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    minHeight: '65%',
    paddingBottom: 24,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitles: {
    flex: 1,
    marginRight: 12,
  },
  vendorName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  vendorType: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  profileSummaryCard: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    alignItems: 'center',
  },
  vendorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  summaryInfo: {
    flex: 1,
    marginLeft: 14,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  fixedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fixedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  distanceInfo: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  phoneText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  phoneCallIconBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#0284C7',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  tabContentContainer: {
    gap: 12,
  },
  categoriesBar: {
    gap: 8,
    paddingBottom: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  catChipActive: {
    backgroundColor: '#0284C7',
  },
  catChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  catChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    alignItems: 'center',
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  productImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0284C7',
    marginLeft: 8,
  },
  productDescription: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  productCatBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  productCatBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  promoCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 16,
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  promoTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
    flex: 1,
  },
  discountBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  promoDescription: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
    marginBottom: 8,
  },
  promoPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  promoPriceLabel: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
  },
  promoPriceValue: {
    fontSize: 16,
    color: '#B45309',
    fontWeight: '800',
  },
  promoExpiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  promoExpiryText: {
    fontSize: 11,
    color: '#92400E',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  descriptionSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  locateActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  locateActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
