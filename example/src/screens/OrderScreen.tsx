import { useState } from 'react';
import { Box, Text, Chip, Icon, ScrollView, useTheme } from 'react-native-skia-kit';
import { ProductCard } from '../components/ProductCard';
import { categories, products } from '../data/mockData';

interface OrderScreenProps {
  width: number;
  height: number;
}

export function OrderScreen({ width, height }: OrderScreenProps) {
  const theme = useTheme();
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  const pad = 16;
  const appBarH = 56;
  const bottomNavH = 64;

  // Product grid config
  const gridGap = 12;
  const colCount = 2;
  const cardW = (width - pad * 2 - gridGap) / colCount;
  const cardH = cardW * 0.65 + 52;

  // Calculate content height
  const rowCount = Math.ceil(filteredProducts.length / colCount);
  const gridHeight = rowCount * (cardH + gridGap);
  const totalContentH = 120 + gridHeight + 40;

  return (
    <Box
      x={0}
      y={0}
      style={{ width, height: height - bottomNavH, flexDirection: 'column' }}
    >
      {/* ===== AppBar ===== */}
      <Box
        style={{
          width,
          height: appBarH,
          backgroundColor: '#16A34A',
          flexDirection: 'row',
          alignItems: 'center',
          padding: 14,
          gap: 14,
        }}
      >
        {/* Hamburger */}
        <Box style={{ width: 24, height: 24, flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
          <Box style={{ width: 22, height: 2.5, borderRadius: 2, backgroundColor: '#ffffff' }} />
          <Box style={{ width: 16, height: 2.5, borderRadius: 2, backgroundColor: '#ffffff' }} />
          <Box style={{ width: 22, height: 2.5, borderRadius: 2, backgroundColor: '#ffffff' }} />
        </Box>
        <Text text="Order" style={{ fontSize: 20, fontWeight: 'bold', color: '#ffffff', height: 24, width: 100 }} />
      </Box>

      {/* ===== Scrollable Content ===== */}
      <ScrollView
        x={0}
        y={appBarH}
        contentSize={totalContentH}
        physics="bouncing"
        style={{ width, height: height - appBarH - bottomNavH }}
      >
        {/* Search bar */}
        <Box
          x={pad}
          y={appBarH + 12}
          style={{
            width: width - pad * 2,
            height: 44,
            borderRadius: 10,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            flexDirection: 'row',
            alignItems: 'center',
            padding: 14,
            gap: 8,
          }}
        >
          <Text text="Tìm món" style={{ fontSize: 15, color: '#9CA3AF', height: 18, flex: 1 }} />
          <Icon name="search" size={18} color="#9CA3AF" />
        </Box>

        {/* Category chips */}
        <Box
          x={pad}
          y={appBarH + 68}
          style={{ width: width - pad * 2, flexDirection: 'row', gap: 8 }}
        >
          {categories.map((cat) => {
            const isActive = cat.id === activeCategory;
            return (
              <Chip
                key={cat.id}
                label={cat.label}
                selected={isActive}
                variant="solid"
                color="success"
                onPress={() => setActiveCategory(cat.id)}
                style={{ width: 74, height: 32 }}
              />
            );
          })}
        </Box>

        {/* Product grid — 2 columns with gap */}
        <Box
          x={pad}
          y={appBarH + 116}
          style={{
            width: width - pad * 2,
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: gridGap,
          }}
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              width={cardW}
            />
          ))}
        </Box>
      </ScrollView>
    </Box>
  );
}
