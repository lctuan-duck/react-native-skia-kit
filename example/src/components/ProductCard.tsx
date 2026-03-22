import { Box, Text, useTheme } from 'react-native-skia-kit';
import type { Product } from '../data/mockData';
import { formatPrice } from '../data/mockData';

interface ProductCardProps {
  product: Product;
  width: number;
  onPress?: () => void;
}

/**
 * ProductCard — displays a menu item with image placeholder, name, price, and soldOut badge.
 * Uses flex layout — no manual x/y.
 */
export function ProductCard({ product, width, onPress }: ProductCardProps) {
  const theme = useTheme();
  const imageH = width * 0.65;

  return (
    <Box
      width={width} height={imageH + 52}
      borderRadius={12}
      color={theme.colors.surface}
      elevation={2}
      hitTestBehavior="opaque"
      onPress={onPress}
      flexDirection="column"
    >
      {/* Image placeholder */}
      <Box
        width={width - 8} height={imageH - 4}
        borderRadius={10}
        color={product.imageColor}
      />

      {/* Sold out badge — overlaid on image */}
      {product.soldOut && (
        <Box
          width={54} height={22}
          borderRadius={4}
          color="#16A34A"
          position="absolute" top={8} left={8}
          flexDirection="row" justifyContent="center" alignItems="center"
        >
          <Text text="Hết món" fontSize={11} fontWeight="bold" color="#ffffff" width={50} height={16} />
        </Box>
      )}

      {/* Product info */}
      <Box width={width} flexDirection="column" padding={8} gap={2}>
        <Text
          width={width - 16}
          text={product.name}
          fontSize={13}
          fontWeight="600"
          color={theme.colors.textBody}
          height={18}
        />
        <Text
          width={width - 16}
          text={formatPrice(product.price)}
          fontSize={13}
          fontWeight="bold"
          color={product.soldOut ? theme.colors.error : '#16A34A'}
          height={18}
        />
      </Box>
    </Box>
  );
}
