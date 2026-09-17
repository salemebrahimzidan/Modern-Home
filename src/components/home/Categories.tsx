import { Link } from 'react-router-dom'
import { categories } from '../../data/categories'
import { getCategoryProductCount } from '../../services/catalog'

export default function CategoriesSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent">الأقسام</p>
          <h2 className="mt-1 font-display text-3xl font-bold">تسوق حسب احتياج المطبخ</h2>
        </div>
        <Link to="/categories" className="text-sm text-muted hover:text-accent">
          عرض الكل
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => {
          const count = getCategoryProductCount(category.id)
          return (
            <Link
              key={category.id}
              to={`/products?category=${category.slug}`}
              className="group overflow-hidden rounded-2xl border border-mist/70 bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div className="overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="font-display text-base font-semibold">{category.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-6 text-muted">
                  {category.description}
                </p>
                <p className="mt-2 text-xs font-medium text-accent">{count} منتج</p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
