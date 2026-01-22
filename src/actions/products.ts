'use server';

import { createClient } from '@/lib/supabase/server';
import { getProfile } from './auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  short_description: z.string().optional(),
  category_id: z.string().uuid().optional().nullable(),
  price_cents: z.number().int().min(0, 'Preço deve ser maior ou igual a 0'),
  compare_at_price_cents: z.number().int().min(0).optional().nullable(),
  sku: z.string().optional().nullable(),
  stock_quantity: z.number().int().min(0).default(0),
  track_inventory: z.boolean().default(true),
  allow_backorder: z.boolean().default(false),
  status: z.enum(['draft', 'active', 'inactive']).default('draft'),
  is_featured: z.boolean().default(false),
  meta_title: z.string().optional().nullable(),
  meta_description: z.string().optional().nullable(),
});

type ProductInput = z.infer<typeof productSchema>;

const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional().nullable(),
  image_url: z.string().url().optional().or(z.literal('')).nullable(),
  is_active: z.boolean().default(true),
});

type CategoryInput = z.infer<typeof categorySchema>;

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// =====================================================
// PRODUCTS
// =====================================================

export async function getProducts(filters?: {
  status?: string;
  category_id?: string;
  is_featured?: boolean;
}) {
  try {
    const profile = await getProfile();
    if (!profile) {
      return [];
    }

    const supabase = await createClient();

    let query = supabase
      .from('products')
      .select(`
        *,
        category:product_categories(*),
        images:product_images(*)
      `)
      .eq('church_id', profile.church_id)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters?.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getProduct(productId: string) {
  try {
    const profile = await getProfile();
    if (!profile) {
      return null;
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:product_categories(*),
        images:product_images(*)
      `)
      .eq('id', productId)
      .eq('church_id', profile.church_id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function getProductBySlug(slug: string) {
  try {
    const profile = await getProfile();
    if (!profile) {
      return null;
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:product_categories(*),
        images:product_images(*)
      `)
      .eq('slug', slug)
      .eq('church_id', profile.church_id)
      .single();

    if (error) {
      console.error('Error fetching product by slug:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    return null;
  }
}

export async function createProduct(input: ProductInput) {
  try {
    const profile = await getProfile();
    if (!profile) {
      return { success: false, error: 'Não autenticado' };
    }

    if (profile.role !== 'PASTOR') {
      return { success: false, error: 'Apenas pastores podem criar produtos' };
    }

    const validated = productSchema.parse(input);

    const supabase = await createClient();

    // Generate slug
    const slug = generateSlug(validated.name);

    // Check if slug exists
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('church_id', profile.church_id)
      .eq('slug', slug)
      .single();

    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        ...validated,
        slug: finalSlug,
        church_id: profile.church_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return { success: false, error: 'Erro ao criar produto' };
    }

    revalidatePath('/dashboard/loja');
    revalidatePath('/membro/loja');

    return { success: true, product };
  } catch (error) {
    console.error('Error creating product:', error);

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Erro ao criar produto' };
  }
}

export async function updateProduct(productId: string, input: Partial<ProductInput>) {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'PASTOR') {
      return { success: false, error: 'Não autorizado' };
    }

    const supabase = await createClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('church_id', profile.church_id)
      .single();

    if (!existing) {
      return { success: false, error: 'Produto não encontrado' };
    }

    // Update slug if name changed
    const updateData: Partial<ProductInput> & { slug?: string } = { ...input };
    if (input.name) {
      updateData.slug = generateSlug(input.name);
    }

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId);

    if (error) {
      console.error('Error updating product:', error);
      return { success: false, error: 'Erro ao atualizar produto' };
    }

    revalidatePath('/dashboard/loja');
    revalidatePath(`/dashboard/loja/${productId}`);
    revalidatePath('/membro/loja');

    return { success: true };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error: 'Erro ao atualizar produto' };
  }
}

export async function deleteProduct(productId: string) {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'PASTOR') {
      return { success: false, error: 'Não autorizado' };
    }

    const supabase = await createClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('church_id', profile.church_id)
      .single();

    if (!existing) {
      return { success: false, error: 'Produto não encontrado' };
    }

    const { error } = await supabase.from('products').delete().eq('id', productId);

    if (error) {
      console.error('Error deleting product:', error);
      return { success: false, error: 'Erro ao excluir produto' };
    }

    revalidatePath('/dashboard/loja');
    revalidatePath('/membro/loja');

    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: 'Erro ao excluir produto' };
  }
}

// =====================================================
// PRODUCT IMAGES
// =====================================================

export async function addProductImage(productId: string, imageUrl: string, altText?: string) {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'PASTOR') {
      return { success: false, error: 'Não autorizado' };
    }

    const supabase = await createClient();

    // Verify product ownership
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('church_id', profile.church_id)
      .single();

    if (!product) {
      return { success: false, error: 'Produto não encontrado' };
    }

    // Get next order index
    const { data: images } = await supabase
      .from('product_images')
      .select('order_index')
      .eq('product_id', productId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextIndex = images && images.length > 0 ? images[0].order_index + 1 : 0;

    // Check if this is the first image
    const { count } = await supabase
      .from('product_images')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId);

    const isPrimary = count === 0;

    const { data: image, error } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        url: imageUrl,
        alt_text: altText,
        order_index: nextIndex,
        is_primary: isPrimary,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding product image:', error);
      return { success: false, error: 'Erro ao adicionar imagem' };
    }

    revalidatePath('/dashboard/loja');
    revalidatePath(`/dashboard/loja/${productId}`);
    revalidatePath('/membro/loja');

    return { success: true, image };
  } catch (error) {
    console.error('Error adding product image:', error);
    return { success: false, error: 'Erro ao adicionar imagem' };
  }
}

export async function deleteProductImage(imageId: string) {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'PASTOR') {
      return { success: false, error: 'Não autorizado' };
    }

    const supabase = await createClient();

    // Verify ownership through product
    const { data: image } = await supabase
      .from('product_images')
      .select('product_id, products!inner(church_id)')
      .eq('id', imageId)
      .single();

    if (!image || (image.products as { church_id: string }).church_id !== profile.church_id) {
      return { success: false, error: 'Imagem não encontrada' };
    }

    const { error } = await supabase.from('product_images').delete().eq('id', imageId);

    if (error) {
      console.error('Error deleting product image:', error);
      return { success: false, error: 'Erro ao excluir imagem' };
    }

    revalidatePath('/dashboard/loja');
    revalidatePath('/membro/loja');

    return { success: true };
  } catch (error) {
    console.error('Error deleting product image:', error);
    return { success: false, error: 'Erro ao excluir imagem' };
  }
}

export async function setPrimaryImage(imageId: string) {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'PASTOR') {
      return { success: false, error: 'Não autorizado' };
    }

    const supabase = await createClient();

    // Get image and verify ownership
    const { data: image } = await supabase
      .from('product_images')
      .select('product_id, products!inner(church_id)')
      .eq('id', imageId)
      .single();

    if (!image || (image.products as { church_id: string }).church_id !== profile.church_id) {
      return { success: false, error: 'Imagem não encontrada' };
    }

    // Remove primary from all images of this product
    await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', image.product_id);

    // Set this image as primary
    const { error } = await supabase
      .from('product_images')
      .update({ is_primary: true })
      .eq('id', imageId);

    if (error) {
      console.error('Error setting primary image:', error);
      return { success: false, error: 'Erro ao definir imagem principal' };
    }

    revalidatePath('/dashboard/loja');
    revalidatePath('/membro/loja');

    return { success: true };
  } catch (error) {
    console.error('Error setting primary image:', error);
    return { success: false, error: 'Erro ao definir imagem principal' };
  }
}

// =====================================================
// PRODUCT CATEGORIES
// =====================================================

export async function getProductCategories() {
  try {
    const profile = await getProfile();
    if (!profile) return [];

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('church_id', profile.church_id)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export async function createProductCategory(input: CategoryInput) {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'PASTOR') {
      return { success: false, error: 'Não autorizado' };
    }

    const validated = categorySchema.parse(input);

    const supabase = await createClient();

    const slug = generateSlug(validated.name);

    // Get next order index
    const { data: categories } = await supabase
      .from('product_categories')
      .select('order_index')
      .eq('church_id', profile.church_id)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextIndex = categories && categories.length > 0 ? categories[0].order_index + 1 : 0;

    const { data: category, error } = await supabase
      .from('product_categories')
      .insert({
        ...validated,
        slug,
        order_index: nextIndex,
        church_id: profile.church_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return { success: false, error: 'Erro ao criar categoria' };
    }

    revalidatePath('/dashboard/loja/categorias');
    revalidatePath('/membro/loja');

    return { success: true, category };
  } catch (error) {
    console.error('Error creating category:', error);

    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }

    return { success: false, error: 'Erro ao criar categoria' };
  }
}

export async function updateProductCategory(categoryId: string, input: Partial<CategoryInput>) {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'PASTOR') {
      return { success: false, error: 'Não autorizado' };
    }

    const supabase = await createClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from('product_categories')
      .select('id')
      .eq('id', categoryId)
      .eq('church_id', profile.church_id)
      .single();

    if (!existing) {
      return { success: false, error: 'Categoria não encontrada' };
    }

    const updateData: Partial<CategoryInput> & { slug?: string } = { ...input };
    if (input.name) {
      updateData.slug = generateSlug(input.name);
    }

    const { error } = await supabase
      .from('product_categories')
      .update(updateData)
      .eq('id', categoryId);

    if (error) {
      console.error('Error updating category:', error);
      return { success: false, error: 'Erro ao atualizar categoria' };
    }

    revalidatePath('/dashboard/loja/categorias');
    revalidatePath('/membro/loja');

    return { success: true };
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error: 'Erro ao atualizar categoria' };
  }
}

export async function deleteProductCategory(categoryId: string) {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== 'PASTOR') {
      return { success: false, error: 'Não autorizado' };
    }

    const supabase = await createClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from('product_categories')
      .select('id')
      .eq('id', categoryId)
      .eq('church_id', profile.church_id)
      .single();

    if (!existing) {
      return { success: false, error: 'Categoria não encontrada' };
    }

    const { error } = await supabase.from('product_categories').delete().eq('id', categoryId);

    if (error) {
      console.error('Error deleting category:', error);
      return { success: false, error: 'Erro ao excluir categoria' };
    }

    revalidatePath('/dashboard/loja/categorias');
    revalidatePath('/membro/loja');

    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: 'Erro ao excluir categoria' };
  }
}
