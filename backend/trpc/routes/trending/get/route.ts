import { publicProcedure } from '../../../create-context';
import { supabase } from '../../../../../lib/supabase';

export const getTrendingProductsProcedure = publicProcedure.query(async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_trending', true)
      .order('trending_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get trending error:', error);
      throw new Error(`Failed to fetch trending products: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching trending products:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch trending products');
  }
});