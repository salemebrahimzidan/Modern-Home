import { storeConfig } from '../config/store'
import { usePageSeo } from '../hooks/usePageSeo'

export default function About() {
  usePageSeo('من نحن', storeConfig.description)

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="text-sm font-medium text-accent">قصتنا</p>
      <h1 className="mt-2 font-display text-4xl font-bold">من نحن</h1>
      <p className="mt-5 leading-8 text-muted">{storeConfig.description}</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <AboutCard title="رؤيتنا" body={storeConfig.about.vision} />
        <AboutCard title="جودة المنتجات" body={storeConfig.about.quality} />
        <AboutCard title="تنوع التشكيلة" body={storeConfig.about.variety} />
        <AboutCard title="خدمة العملاء" body={storeConfig.about.service} />
      </div>
    </section>
  )
}

function AboutCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-mist/70 bg-surface p-6 shadow-card">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted">{body}</p>
    </article>
  )
}
