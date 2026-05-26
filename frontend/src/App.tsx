// App.tsx — Route definitions for Apilace
// Uncomment routes as pages are implemented

import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './router/ProtectedRoute'
import { AdminRoute } from './router/AdminRoute'
import MainLayout from './layouts/MainLayout'
import ScrollToTop from './components/ScrollToTop'

// -- Public pages --
import ShopPage from './pages/ShopPage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ContactPage from './pages/ContactPage'
//Google OAuth callback page (after redirect from Google)
import OAuthCallbackPage from './pages/OAuthCallbackPage'
// import LegalPage from './pages/LegalPage'
import NotFoundPage from './pages/NotFoundPage'

// -- Member pages --
import CheckoutSuccessPage from './pages/CheckoutSuccessPage'
import AccountPage from './pages/AccountPage'
import OrderDetailPage from './pages/OrderDetailPage'

// -- Admin pages --
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminProductFormPage from './pages/admin/AdminProductFormPage'
import AdminOrderDetailPage from './pages/admin/AdminOrderDetailPage'
import AdminStoresPage from './pages/admin/AdminStoresPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
// import AdminExportsPage from './pages/admin/AdminExportsPage'
// import AdminLegalPage from './pages/admin/AdminLegalPage'

export default function App() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route element={<MainLayout />}>

        {/* Public routes */}
        <Route path="/" element={<Navigate to="/boutique" replace />} />
        <Route path="/boutique" element={<ShopPage />} />
        <Route path="/boutique/:slug" element={<ProductPage />} />
        <Route path="/panier" element={<CartPage />} />
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/inscription" element={<RegisterPage />} />
        <Route path="/reinitialisation/:token" element={<ResetPasswordPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        {/* <Route path="/mentions-legales" element={<LegalPage type="MENTIONS_LEGALES" />} /> */}
        {/* <Route path="/cgv" element={<LegalPage type="CGV" />} /> */}
        {/* <Route path="/confidentialite" element={<LegalPage type="RGPD" />} /> */}

        {/* Member routes */}
        <Route path="/checkout/success" element={<ProtectedRoute><CheckoutSuccessPage /></ProtectedRoute>} />
        <Route path="/mon-compte" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
        <Route path="/mon-compte/commandes/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/produits" element={<AdminRoute><AdminProductsPage /></AdminRoute>} />
        <Route path="/admin/produits/nouveau" element={<AdminRoute><AdminProductFormPage /></AdminRoute>} />
        <Route path="/admin/produits/:id/modifier" element={<AdminRoute><AdminProductFormPage /></AdminRoute>} />
        <Route path="/admin/commandes/:id" element={<AdminRoute><AdminOrderDetailPage /></AdminRoute>} />
        <Route path="/admin/magasins" element={<AdminRoute><AdminStoresPage /></AdminRoute>} />
        <Route path="/admin/utilisateurs" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        {/* <Route path="/admin/exports" element={<AdminRoute><AdminExportsPage /></AdminRoute>} /> */}
        {/* <Route path="/admin/textes-legaux" element={<AdminRoute><AdminLegalPage /></AdminRoute>} /> */}

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />

      </Route>
    </Routes>
    </>
  )
}