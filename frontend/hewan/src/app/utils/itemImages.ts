const FALLBACK_IMAGES = {
  pet: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
  product: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400',
  grooming: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
};

export const getItemImage = (type: string | undefined, item: any) => {
  const image =
    type === 'pet'
      ? item?.images?.[0] || item?.image
      : item?.image || item?.images?.[0];

  if (typeof image === 'string' && image.trim()) {
    return image;
  }

  if (type === 'pet') return FALLBACK_IMAGES.pet;
  if (type === 'grooming') return FALLBACK_IMAGES.grooming;
  return FALLBACK_IMAGES.product;
};

export const getFallbackItemImage = (type: string | undefined) => {
  if (type === 'pet') return FALLBACK_IMAGES.pet;
  if (type === 'grooming') return FALLBACK_IMAGES.grooming;
  return FALLBACK_IMAGES.product;
};
