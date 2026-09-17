import { Link } from 'react-router-dom'

import { categories } from '../../data/categories'

import { useLocale } from '../../hooks/useLocale'

import { localized } from '../../i18n/types'

import { getCategoryProductCount } from '../../services/catalog'



export default function CategoriesSection() {

  const { locale, t } = useLocale()



  return (

    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">

      <div className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-4">

        <div className="min-w-0">

          <p className="text-sm font-medium text-accent">{t('home.categoriesEyebrow')}</p>

          <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">

            {t('home.categoriesTitle')}

          </h2>

        </div>

        <Link to="/categories" className="shrink-0 self-start text-sm text-muted hover:text-accent sm:self-auto">

          {t('common.viewAll')}

        </Link>

      </div>

      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">

        {categories.map((category) => {

          const count = getCategoryProductCount(category.id)

          const name = localized(category.name, locale)

          return (

            <Link

              key={category.id}

              to={`/products?category=${category.slug}`}

              className="group min-w-0 overflow-hidden rounded-2xl border border-mist/70 bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"

            >

              <div className="overflow-hidden">

                <img

                  src={category.image}

                  alt={name}

                  loading="lazy"

                  className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"

                />

              </div>

              <div className="p-3 sm:p-4">

                <h3 className="font-display text-sm font-semibold sm:text-base">{name}</h3>

                <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted sm:text-xs sm:leading-6">

                  {category.description ? localized(category.description, locale) : null}

                </p>

                <p className="mt-2 text-[11px] font-medium text-accent sm:text-xs">

                  {t('common.productCount', { count })}

                </p>

              </div>

            </Link>

          )

        })}

      </div>

    </section>

  )

}

