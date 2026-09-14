import { API_BASE_URL, ENDPOINTS } from '@/core/config/api.config';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  photoUrl: string | null;
  vendorType: string | null;
  priceRange: string | null;
  phone: string | null;
  description: string | null;
  fixedLatitude: number | null;
  fixedLongitude: number | null;
  fixedAddress: string | null;
  role: string;
}

export interface CategoryItem {
  id: string;
  vendorId: string;
  name: string;
  createdAt: string;
}

export interface ProductItem {
  id: string;
  vendorId: string;
  categoryId: string | null;
  categoryName: string | null;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
}

export interface PromotionItem {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  discountPercent: number | null;
  promoPrice: number | null;
  isActive: boolean;
  validUntil: string | null;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  vendorId: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
}

export interface SalesSummary {
  todayTotal: number;
  todayCount: number;
  weekTotal: number;
  monthTotal: number;
  averageTicket: number;
}

export interface VendorDetailResponse {
  id: string;
  name: string | null;
  photoUrl: string | null;
  type: string | null;
  priceRange: string | null;
  phone: string | null;
  description: string | null;
  fixedAddress: string | null;
  fixedLatitude: number | null;
  fixedLongitude: number | null;
  currentLat: number | null;
  currentLng: number | null;
  locationType: 'realtime' | 'fixed' | 'none';
  isLive: boolean;
  categories: { id: string; name: string }[];
  products: {
    id: string;
    categoryId: string | null;
    categoryName: string | null;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    isAvailable: boolean;
  }[];
  promotions: {
    id: string;
    title: string;
    description: string;
    discountPercent: number | null;
    promoPrice: number | null;
    isActive: boolean;
    validUntil: string | null;
  }[];
}

export function formatMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }
  return `${API_BASE_URL}/${url}`;
}

export const vendorApiService = {
  async getProfile(token: string): Promise<UserProfile> {
    const response = await fetch(ENDPOINTS.users.profile, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al cargar perfil');
    }

    return response.json();
  },

  async updateProfile(token: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await fetch(ENDPOINTS.users.profile, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar perfil');
    }

    return response.json();
  },

  async uploadImage(token: string, fileUri: string): Promise<string> {
    const formData = new FormData();
    const filename = fileUri.split('/').pop() || `img_${Date.now()}.jpg`;
    const extension = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';

    const filePayload = {
      uri: fileUri,
      name: filename,
      type: mimeType,
    } as unknown as Blob;

    formData.append('file', filePayload);

    const response = await fetch(ENDPOINTS.uploads.image, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Error al subir imagen');
    }

    const json = (await response.json()) as { url: string };
    return json.url;
  },

  async getCategories(token: string): Promise<CategoryItem[]> {
    const response = await fetch(ENDPOINTS.catalog.categories, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener categorías');
    }

    return response.json();
  },

  async createCategory(token: string, name: string): Promise<CategoryItem> {
    const response = await fetch(ENDPOINTS.catalog.categories, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error('Error al crear categoría');
    }

    return response.json();
  },

  async deleteCategory(token: string, id: string): Promise<void> {
    const response = await fetch(`${ENDPOINTS.catalog.categories}/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al eliminar categoría');
    }
  },

  async getProducts(token: string): Promise<ProductItem[]> {
    const response = await fetch(ENDPOINTS.catalog.products, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener productos');
    }

    return response.json();
  },

  async createProduct(
    token: string,
    data: {
      name: string;
      description?: string;
      price: number;
      categoryId?: string;
      imageUrl?: string;
      isAvailable?: boolean;
    },
  ): Promise<ProductItem> {
    const response = await fetch(ENDPOINTS.catalog.products, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Error al crear producto');
    }

    return response.json();
  },

  async updateProduct(
    token: string,
    id: string,
    data: Partial<{
      name: string;
      description?: string;
      price: number;
      categoryId?: string;
      imageUrl?: string;
      isAvailable?: boolean;
    }>,
  ): Promise<ProductItem> {
    const response = await fetch(`${ENDPOINTS.catalog.products}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar producto');
    }

    return response.json();
  },

  async deleteProduct(token: string, id: string): Promise<void> {
    const response = await fetch(`${ENDPOINTS.catalog.products}/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al eliminar producto');
    }
  },

  async getPromotions(token: string): Promise<PromotionItem[]> {
    const response = await fetch(ENDPOINTS.promotions, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener promociones');
    }

    return response.json();
  },

  async createPromotion(
    token: string,
    data: {
      title: string;
      description: string;
      discountPercent?: number;
      promoPrice?: number;
      isActive?: boolean;
      validUntil?: string;
    },
  ): Promise<PromotionItem> {
    const response = await fetch(ENDPOINTS.promotions, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Error al crear promoción');
    }

    return response.json();
  },

  async updatePromotion(
    token: string,
    id: string,
    data: Partial<{
      title: string;
      description: string;
      discountPercent?: number;
      promoPrice?: number;
      isActive?: boolean;
      validUntil?: string;
    }>,
  ): Promise<PromotionItem> {
    const response = await fetch(`${ENDPOINTS.promotions}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar promoción');
    }

    return response.json();
  },

  async deletePromotion(token: string, id: string): Promise<void> {
    const response = await fetch(`${ENDPOINTS.promotions}/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al eliminar promoción');
    }
  },

  async recordSale(
    token: string,
    data: {
      productId?: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalAmount: number;
      notes?: string;
    },
  ): Promise<SaleItem> {
    const response = await fetch(ENDPOINTS.sales.base, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Error al registrar venta');
    }

    return response.json();
  },

  async getSales(token: string): Promise<SaleItem[]> {
    const response = await fetch(ENDPOINTS.sales.base, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener ventas');
    }

    return response.json();
  },

  async getSalesSummary(token: string): Promise<SalesSummary> {
    const response = await fetch(ENDPOINTS.sales.summary, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener resumen de ventas');
    }

    return response.json();
  },

  async getVendorDetail(vendorId: string): Promise<VendorDetailResponse> {
    const response = await fetch(ENDPOINTS.vendors.detail(vendorId));

    if (!response.ok) {
      throw new Error('Error al consultar detalle del puesto');
    }

    return response.json();
  },
};
