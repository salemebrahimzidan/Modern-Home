import { Link } from 'react-router-dom'
import { storeConfig } from '../../config/store'
import { categories } from '../../data/categories'
import { openWhatsAppChat } from '../../utils/whatsapp'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#17110e] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-bold text-[#efd3be]">{storeConfig.name}</p>
          <p className="mt-3 text-sm leading-7 text-white/70">{storeConfig.description}</p>
        </div>

        <div>
          <p className="mb-4 font-semibold">روابط سريعة</p>
          <div className="flex flex-col gap-2 text-sm text-white/70">
            <Link to="/" className="hover:text-white">
              الرئيسية
            </Link>
            <Link to="/products" className="hover:text-white">
              المنتجات
            </Link>
            <Link to="/categories" className="hover:text-white">
              الأقسام
            </Link>
            <Link to="/offers" className="hover:text-white">
              العروض
            </Link>
            <Link to="/about" className="hover:text-white">
              من نحن
            </Link>
            <Link to="/contact" className="hover:text-white">
              تواصل معنا
            </Link>
          </div>
        </div>

        <div>
          <p className="mb-4 font-semibold">الأقسام</p>
          <div className="flex flex-col gap-2 text-sm text-white/70">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.slug}`}
                className="hover:text-white"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-4 font-semibold">تواصل معنا</p>
          <div className="space-y-2 text-sm text-white/70">
            <p>{storeConfig.address}</p>
            <p>{storeConfig.phone}</p>
            <p>{storeConfig.openingHours}</p>
            <button
              type="button"
              onClick={() => openWhatsAppChat()}
              className="mt-2 inline-flex rounded-xl bg-[#25D366] px-4 py-2 text-white hover:bg-[#1ebe57]"
            >
              واتساب
            </button>
            <div className="flex gap-4 pt-2">
              <a href={storeConfig.facebook} target="_blank" rel="noreferrer" className="hover:text-white">
                فيسبوك
              </a>
              <a
                href={storeConfig.instagram}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                إنستغرام
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {storeConfig.name}. جميع الحقوق محفوظة.
      </div>
    </footer>
  )
}
