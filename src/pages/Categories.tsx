import { Link } from 'react-router-dom'
import { categories } from '../data/categories'
import { usePageSeo } from '../hooks/usePageSeo'
import { getCategoryProductCount } from '../services/catalog'

export default function CategoriesPage() {
  usePageSeo('الأقسام', 'تصفح أقسام أدوات ومستلزمات المطبخ.')

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-medium text-accent">التصنيفات</p>
        <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">أقسام المطبخ</h1>
        <p className="mt-2 text-muted">اختر القسم المناسب لتصفح المنتجات المرتبطة به.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((category) => {
          const count = getCategoryProductCount(category.id)
          return (
            <Link
              key={category.id}
              to={`/products?category=${category.slug}`}
              className="group overflow-hidden rounded-2xl border border-mist/70 bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <img
                src={category.image}
                alt={category.name}
                loading="lazy"
                className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="p-5">
                <h2 className="font-display text-xl font-semibold">{category.name}</h2>
                <p className="mt-2 text-sm leading-7 text-muted">{category.description}</p>
                <p className="mt-3 text-sm font-medium text-accent">{count} منتج</p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
