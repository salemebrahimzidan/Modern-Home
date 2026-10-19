import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Loading from './components/common/Loading'
import MainLayout from './components/layout/MainLayout'
import { RequireAuth } from './components/auth/Guards'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { CatalogProvider } from './context/CatalogContext'
import { LocaleProvider, useLocale } from './context/LocaleContext'
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
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Account = lazy(() => import('./pages/Account'))
const Orders = lazy(() => import('./pages/Orders'))
const OrderDetails = lazy(() => import('./pages/OrderDetails'))

function AppRoutes() {
  const { t } = useLocale()

  return (
    <MainLayout>
      <Suspense fallback={<Loading label={t('common.loadingPage')} />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:slug" element={<ProductDetails />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/account"
            element={
              <RequireAuth>
                <Account />
              </RequireAuth>
            }
          />
          <Route
            path="/account/orders"
            element={
              <RequireAuth>
                <Orders />
              </RequireAuth>
            }
          />
          <Route
            path="/account/orders/:id"
            element={
              <RequireAuth>
                <OrderDetails />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </MainLayout>
  )
}

export default function App() {
  return (
    <LocaleProvider>
      <ToastProvider>
        <AuthProvider>
          <CatalogProvider>
            <CartProvider>
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </CartProvider>
          </CatalogProvider>
        </AuthProvider>
      </ToastProvider>
    </LocaleProvider>
  )
}
