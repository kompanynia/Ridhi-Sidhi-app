import { z } from 'zod';
import { publicProcedure } from '../../../create-context';
import { supabase } from '../../../../../lib/supabase';

export const updateTrendingProductsProcedure = publicProcedure
  .input(z.object({
    productIds: z.array(z.string()).max(5)
  }))
  .mutation(async ({ input }) => {
    try {
      // First, clear all trending products
      const { error: clearError } = await supabase
        .from('products')
        .update({ 
          is_trending: false, 
          trending_order: null 
        })
        .not('id', 'is', null);

      if (clearError) {
        console.error('Clear trending error:', clearError);
        throw new Error(`Failed to clear trending products: ${clearError.message}`);
      }

      // Then, set trending status for selected products
      if (input.productIds.length > 0) {
        for (let i = 0; i < input.productIds.length; i++) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ 
              is_trending: true, 
              trending_order: i + 1 
            })
            .eq('id', input.productIds[i]);

          if (updateError) {
            console.error(`Update trending error for ${input.productIds[i]}:`, updateError);
            throw new Error(`Failed to update trending product ${input.productIds[i]}: ${updateError.message}`);
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating trending products:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update trending products');
    }
  });