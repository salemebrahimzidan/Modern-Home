import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Loading from './components/common/Loading'
import MainLayout from './components/layout/MainLayout'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'

const Home = lazy(() => import('./pages/Home'))
const Products = lazy(() => import('./pages/Products'))
const ProductDetails = lazy(() => import('./pages/ProductDetails'))
const Categories = lazy(() => import('./pages/Categories'))
const Offers = lazy(() => import('./pages/Offers'))
const Cart = lazy(() => import('./pages/Cart'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const NotFound = lazy(() => import('./pages/NotFound'))

export default function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <BrowserRouter>
          <MainLayout>
            <Suspense fallback={<Loading label="جاري تحميل الصفحة..." />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:slug" element={<ProductDetails />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/offers" element={<Offers />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </MainLayout>
        </BrowserRouter>
      </CartProvider>
    </ToastProvider>
  )
}
