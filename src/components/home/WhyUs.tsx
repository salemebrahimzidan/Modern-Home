import { BadgeCheck, Headset, Layers3, Wallet } from 'lucide-react'

const features = [
  {
    icon: BadgeCheck,
    title: 'منتجات عالية الجودة',
    description: 'أواني وأدوات مطبخ مختارة لتتحمل الاستخدام اليومي.',
  },
  {
    icon: Wallet,
    title: 'أسعار مناسبة',
    description: 'قيمة واضحة وعروض دورية على أساسيات المطبخ.',
  },
  {
    icon: Layers3,
    title: 'تشكيلة كبيرة',
    description: 'من أواني الطهي إلى التخزين والخبز والتقديم.',
  },
  {
    icon: Headset,
    title: 'خدمة عملاء سريعة',
    description: 'دعم عبر الهاتف وواتساب لمساعدتك قبل الطلب.',
  },
]

export default function WhyUs() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <p className="text-sm font-medium text-accent">لماذا نحن</p>
        <h2 className="mt-1 font-display text-3xl font-bold">تجربة شراء بسيطة وموثوقة</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-mist/70 bg-surface p-6 text-center shadow-card"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <feature.icon size={22} />
            </div>
            <h3 className="font-display text-lg font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm leading-7 text-muted">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
