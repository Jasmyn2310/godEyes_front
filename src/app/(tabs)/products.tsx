import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  PackagePlus,
  Store,
  Trash2,
  X,
} from 'lucide-react-native';
import { useAuthStore } from '@/features/auth/store/auth-store';
import {
  CategoryItem,
  formatMediaUrl,
  ProductItem,
  vendorApiService,
} from '@/features/vendor/services/vendor-api.service';

interface ProductCardProps {
  readonly item: ProductItem;
  readonly onToggleAvailability: (item: ProductItem) => void;
  readonly onDelete: (item: ProductItem) => void;
}

const ProductRow = React.memo<ProductCardProps>(({ item, onToggleAvailability, onDelete }) => {
  return (
    <View style={styles.card}>
      {item.imageUrl ? (
        <Image
          source={{ uri: formatMediaUrl(item.imageUrl) }}
          style={styles.cardImage}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Store size={26} color="#94A3B8" />
        </View>
      )}

      <View style={styles.cardContent}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.cardPrice}>S/ {item.price.toFixed(2)}</Text>
        </View>

        {item.description ? (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.cardMetaRow}>
          {item.categoryName ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{item.categoryName}</Text>
            </View>
          ) : (
            <View style={styles.categoryBadgeEmpty}>
              <Text style={styles.categoryBadgeEmptyText}>Sin categoría</Text>
            </View>
          )}

          <View style={styles.cardActions}>
            <Switch
              value={item.isAvailable}
              onValueChange={() => onToggleAvailability(item)}
              trackColor={{ false: '#CBD5E1', true: '#BAE6FD' }}
              thumbColor={item.isAvailable ? '#0284C7' : '#94A3B8'}
            />
            <Pressable
              onPress={() => onDelete(item)}
              style={({ pressed }) => [styles.deleteBtn, pressed ? styles.buttonPressed : null]}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`Eliminar producto ${item.name}`}
            >
              <Trash2 size={16} color="#EF4444" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
});

export default function VendorProductsScreen() {
  const { userToken } = useAuthStore();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [isSavingCategory, setIsSavingCategory] = useState<boolean>(false);

  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [productName, setProductName] = useState<string>('');
  const [productPrice, setProductPrice] = useState<string>('');
  const [productDescription, setProductDescription] = useState<string>('');
  const [productCategoryId, setProductCategoryId] = useState<string | undefined>(undefined);
  const [productImageUri, setProductImageUri] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!userToken) return;
    try {
      setIsLoading(true);
      const [cats, prods] = await Promise.all([
        vendorApiService.getCategories(userToken),
        vendorApiService.getProducts(userToken),
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setIsLoading(false);
    }
  }, [userToken]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'Todos') return products;
    return products.filter(
      (p) => p.categoryName?.toLowerCase() === selectedCategory.toLowerCase(),
    );
  }, [products, selectedCategory]);

  const handleCreateCategory = async () => {
    if (!userToken || !newCategoryName.trim()) {
      Alert.alert('Atención', 'Ingresa el nombre de la categoría');
      return;
    }

    try {
      setIsSavingCategory(true);
      const created = await vendorApiService.createCategory(userToken, newCategoryName.trim());
      setCategories((prev) => [...prev, created]);
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
    } catch {
      Alert.alert('Error', 'No se pudo crear la categoría');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = (cat: CategoryItem) => {
    Alert.alert(
      'Eliminar Categoría',
      `¿Deseas eliminar "${cat.name}"? Los productos quedarán sin categoría asignada.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!userToken) return;
            try {
              await vendorApiService.deleteCategory(userToken, cat.id);
              setCategories((prev) => prev.filter((c) => c.id !== cat.id));
              if (selectedCategory === cat.name) {
                setSelectedCategory('Todos');
              }
              void loadData();
            } catch {
              Alert.alert('Error', 'No se pudo eliminar la categoría');
            }
          },
        },
      ],
    );
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se requiere acceso a las fotos para seleccionar la imagen del producto');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setProductImageUri(result.assets[0].uri);
    }
  };

  const handleCreateProduct = async () => {
    if (!userToken) return;
    if (!productName.trim()) {
      Alert.alert('Atención', 'Ingresa el nombre del producto');
      return;
    }
    const priceNum = parseFloat(productPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Atención', 'Ingresa un precio válido mayor a 0');
      return;
    }

    try {
      setIsSavingProduct(true);
      let uploadedUrl: string | undefined = undefined;

      if (productImageUri) {
        uploadedUrl = await vendorApiService.uploadImage(userToken, productImageUri);
      }

      await vendorApiService.createProduct(userToken, {
        name: productName.trim(),
        description: productDescription.trim() || undefined,
        price: priceNum,
        categoryId: productCategoryId,
        imageUrl: uploadedUrl,
        isAvailable: true,
      });

      setProductName('');
      setProductPrice('');
      setProductDescription('');
      setProductCategoryId(undefined);
      setProductImageUri(null);
      setIsProductModalOpen(false);

      void loadData();
    } catch {
      Alert.alert('Error', 'No se pudo registrar el producto');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleToggleAvailability = useCallback(
    async (item: ProductItem) => {
      if (!userToken) return;
      const nextState = !item.isAvailable;
      setProducts((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, isAvailable: nextState } : p)),
      );

      try {
        await vendorApiService.updateProduct(userToken, item.id, {
          isAvailable: nextState,
        });
      } catch {
        setProducts((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, isAvailable: !nextState } : p)),
        );
      }
    },
    [userToken],
  );

  const handleDeleteProduct = useCallback(
    (item: ProductItem) => {
      Alert.alert('Eliminar Producto', `¿Deseas eliminar "${item.name}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!userToken) return;
            try {
              await vendorApiService.deleteProduct(userToken, item.id);
              setProducts((prev) => prev.filter((p) => p.id !== item.id));
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          },
        },
      ]);
    },
    [userToken],
  );

  const renderItem = useCallback(
    ({ item }: { item: ProductItem }) => (
      <ProductRow
        item={item}
        onToggleAvailability={handleToggleAvailability}
        onDelete={handleDeleteProduct}
      />
    ),
    [handleToggleAvailability, handleDeleteProduct],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Store size={22} color="#0284C7" />
          <View>
            <Text style={styles.title}>Mis Productos</Text>
            <Text style={styles.subtitle}>
              {products.length} productos registrados en tu catálogo
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => setIsProductModalOpen(true)}
          style={({ pressed }) => [styles.addProductBtn, pressed ? styles.buttonPressed : null]}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Crear nuevo producto"
        >
          <Text style={styles.addProductBtnText}>Nuevo</Text>
        </Pressable>
      </View>

      <View style={styles.categoriesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          <Pressable
            onPress={() => setSelectedCategory('Todos')}
            style={[
              styles.categoryChip,
              selectedCategory === 'Todos' ? styles.categoryChipActive : null,
            ]}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === 'Todos' ? styles.categoryChipTextActive : null,
              ]}
            >
              Todos ({products.length})
            </Text>
          </Pressable>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategory(cat.name)}
                onLongPress={() => handleDeleteCategory(cat)}
                style={[styles.categoryChip, isSelected ? styles.categoryChipActive : null]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected ? styles.categoryChipTextActive : null,
                  ]}
                >
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => setIsCategoryModalOpen(true)}
            style={styles.addCategoryChip}
          >
            <Text style={styles.addCategoryChipText}>+ Categoría</Text>
          </Pressable>
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.centerText}>Cargando catálogo...</Text>
        </View>
      ) : (
        <FlashList
          data={filteredProducts}
          renderItem={renderItem}
          estimatedItemSize={110}
          keyExtractor={(item: ProductItem) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <PackagePlus size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No hay productos registrados</Text>
              <Text style={styles.emptySubtitle}>
                Crea categorías y agrega productos con foto de tu celular para que tus clientes puedan descubrirlos.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={isCategoryModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsCategoryModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Nueva Categoría</Text>
            <Text style={styles.dialogSubtitle}>
              Ejemplo: Bebidas calientes, Sandwiches, Desayunos, Postres
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre de la categoría"
              placeholderTextColor="#94A3B8"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
            />

            <View style={styles.dialogActions}>
              <Pressable
                onPress={() => setIsCategoryModalOpen(false)}
                style={styles.dialogCancelBtn}
              >
                <Text style={styles.dialogCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateCategory}
                disabled={isSavingCategory}
                style={[styles.dialogConfirmBtn, isSavingCategory ? styles.disabledBtn : null]}
              >
                {isSavingCategory ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.dialogConfirmText}>Crear</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isProductModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsProductModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Nuevo Producto</Text>
              <Pressable onPress={() => setIsProductModalOpen(false)}>
                <X size={22} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Foto del Producto</Text>
              <Pressable
                onPress={handlePickImage}
                style={styles.imagePickerBox}
              >
                {productImageUri ? (
                  <Image
                    source={{ uri: productImageUri }}
                    style={styles.pickedImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <Camera size={32} color="#0284C7" />
                    <Text style={styles.imagePickerText}>
                      Seleccionar imagen desde tu dispositivo
                    </Text>
                  </View>
                )}
              </Pressable>

              <Text style={styles.inputLabel}>Nombre del Producto *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Hamburguesa Doble Queso"
                placeholderTextColor="#94A3B8"
                value={productName}
                onChangeText={setProductName}
              />

              <Text style={styles.inputLabel}>Precio (S/) *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                value={productPrice}
                onChangeText={setProductPrice}
              />

              <Text style={styles.inputLabel}>Categoría</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalCategoryPicker}>
                <Pressable
                  onPress={() => setProductCategoryId(undefined)}
                  style={[
                    styles.pickerChip,
                    productCategoryId === undefined ? styles.pickerChipActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.pickerChipText,
                      productCategoryId === undefined ? styles.pickerChipTextActive : null,
                    ]}
                  >
                    Sin categoría
                  </Text>
                </Pressable>
                {categories.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => setProductCategoryId(c.id)}
                    style={[
                      styles.pickerChip,
                      productCategoryId === c.id ? styles.pickerChipActive : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pickerChipText,
                        productCategoryId === c.id ? styles.pickerChipTextActive : null,
                      ]}
                    >
                      {c.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Descripción (Opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ingredientes, porciones, detalles..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={productDescription}
                onChangeText={setProductDescription}
              />

              <Pressable
                onPress={handleCreateProduct}
                disabled={isSavingProduct}
                style={[styles.saveProductBtn, isSavingProduct ? styles.disabledBtn : null]}
              >
                {isSavingProduct ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveProductBtnText}>Guardar Producto</Text>
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
  addProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addProductBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  categoriesSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  categoryChipActive: {
    backgroundColor: '#0284C7',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  addCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0284C7',
    borderStyle: 'dashed',
    backgroundColor: '#F0F9FF',
  },
  addCategoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardImage: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  cardImagePlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0284C7',
    marginLeft: 8,
  },
  cardDescription: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  categoryBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  categoryBadgeEmpty: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryBadgeEmptyText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtn: {
    width: 32,
    height: 32,
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  dialogSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  dialogCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  dialogCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  dialogConfirmBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  dialogConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sheetContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
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
    height: 80,
    textAlignVertical: 'top',
  },
  imagePickerBox: {
    borderWidth: 1.5,
    borderColor: '#0284C7',
    borderStyle: 'dashed',
    borderRadius: 16,
    overflow: 'hidden',
    height: 140,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickedImage: {
    width: '100%',
    height: '100%',
  },
  imagePickerPlaceholder: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
    textAlign: 'center',
  },
  modalCategoryPicker: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  pickerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  pickerChipActive: {
    backgroundColor: '#0284C7',
  },
  pickerChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  pickerChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  saveProductBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveProductBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
