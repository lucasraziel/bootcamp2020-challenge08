import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsInStorage = await AsyncStorage.getItem(
        '@goMarketPlace/products',
      );

      if (productsInStorage) {
        setProducts(JSON.parse(productsInStorage));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const productIndex: number | undefined = products.findIndex(
        item => item.id === id,
      );

      if (productIndex !== undefined) {
        const product = products[productIndex];
        const newProducts = products.filter(item => item.id !== product.id);
        newProducts.push({ ...product, quantity: product.quantity + 1 });
        setProducts(newProducts);
        AsyncStorage.setItem(
          '@goMarketPlace/products',
          JSON.stringify(newProducts),
        );
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const existItem = products.some(item => item.id === product.id);

      if (existItem) {
        increment(product.id);
        return;
      }

      product.quantity = 1;
      AsyncStorage.setItem(
        '@goMarketPlace/products',
        JSON.stringify([...products, product]),
      );
      setProducts([...products, product]);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex: number | undefined = products.findIndex(
        item => item.id === id,
      );

      if (productIndex !== undefined && products[productIndex].quantity > 0) {
        const product = products[productIndex];
        const newProducts = products.filter(item => item.id !== product.id);
        if (product.quantity > 1) {
          newProducts.push({ ...product, quantity: product.quantity - 1 });
        }
        setProducts(newProducts);
        AsyncStorage.setItem(
          '@goMarketPlace/products',
          JSON.stringify(newProducts),
        );
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
