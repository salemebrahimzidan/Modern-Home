import { Link } from 'react-router-dom'

import { categories } from '../data/categories'

import { useLocale } from '../hooks/useLocale'

import { usePageSeo } from '../hooks/usePageSeo'

import { localized } from '../i18n/types'

import { getCategoryProductCount } from '../services/catalog'



export default function CategoriesPage() {

  const { locale, t } = useLocale()

  usePageSeo(t('categoriesPage.seoTitle'), t('categoriesPage.seoDescription'))



  return (

    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">

      <div className="mb-8">

        <p className="text-sm font-medium text-accent">{t('categoriesPage.eyebrow')}</p>

        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl md:text-4xl">

          {t('categoriesPage.title')}

        </h1>

        <p className="mt-2 text-muted">{t('categoriesPage.description')}</p>

      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

        {categories.map((category) => {

          const count = getCategoryProductCount(category.id)

          const name = localized(category.name, locale)

          return (

            <Link

              key={category.id}

              to={`/products?category=${category.slug}`}

              className="group overflow-hidden rounded-2xl border border-mist/70 bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"

            >

              <img

                src={category.image}

                alt={name}

                loading="lazy"

                className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105"

              />

              <div className="p-5">

                <h2 className="font-display text-xl font-semibold">{name}</h2>

                <p className="mt-2 text-sm leading-7 text-muted">

                  {category.description ? localized(category.description, locale) : null}

                </p>

                <p className="mt-3 text-sm font-medium text-accent">

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

