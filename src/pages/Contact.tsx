import { Clock3, MapPin, Phone } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import Button from '../components/common/Button'
import WhatsAppButton from '../components/common/WhatsAppButton'
import { storeConfig } from '../config/store'
import { usePageSeo } from '../hooks/usePageSeo'
import { useToast } from '../context/ToastContext'
import { openWhatsApp } from '../utils/whatsapp'

export default function Contact() {
  usePageSeo('تواصل معنا', 'تواصل مع معرض Modern Home لأدوات المطبخ عبر الهاتف أو واتساب.')
  const { showToast } = useToast()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !phone.trim() || !message.trim()) {
      showToast('يرجى تعبئة جميع الحقول', 'error')
      return
    }
    openWhatsApp(
      `رسالة تواصل من الموقع:\nالاسم: ${name}\nالهاتف: ${phone}\nالرسالة:\n${message}`,
    )
    showToast('سيتم فتح واتساب لإرسال رسالتك')
    setName('')
    setPhone('')
    setMessage('')
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-10 max-w-2xl">
        <p className="text-sm font-medium text-accent">نحن هنا لمساعدتك</p>
        <h1 className="mt-2 font-display text-4xl font-bold">تواصل معنا</h1>
        <p className="mt-3 text-muted">
          تواصل عبر الهاتف أو واتساب أو النموذج أدناه. جميع بيانات المتجر قابلة للتعديل من
          ملف الإعدادات.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <InfoRow icon={<Phone size={18} />} label="الهاتف" value={storeConfig.phone} />
          <InfoRow
            icon={<MapPin size={18} />}
            label="العنوان"
            value={storeConfig.address}
          />
          <InfoRow
            icon={<Clock3 size={18} />}
            label="ساعات العمل"
            value={storeConfig.openingHours}
          />
          <WhatsAppButton fullWidth size="lg" />
          <div className="flex gap-4 text-sm">
            <a
              href={storeConfig.facebook}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              فيسبوك
            </a>
            <a
              href={storeConfig.instagram}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              إنستغرام
            </a>
          </div>

          <div className="overflow-hidden rounded-2xl border border-dashed border-mist bg-mist/40">
            {storeConfig.mapEmbedUrl ? (
              <iframe
                title="خريطة المتجر"
                src={storeConfig.mapEmbedUrl}
                className="h-64 w-full border-0"
                loading="lazy"
              />
            ) : (
              <div className="flex h-64 items-center justify-center p-6 text-center text-sm text-muted">
                مكان مخصص لخريطة Google Maps.
                <br />
                أضف الرابط في `src/config/store.ts` لاحقاً.
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-mist/70 bg-surface p-6 shadow-card"
        >
          <h2 className="font-display text-2xl font-semibold">أرسل رسالة</h2>
          <label className="block text-sm">
            الاسم
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2.5 outline-none focus:border-accent"
              required
            />
          </label>
          <label className="block text-sm">
            الهاتف
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2.5 outline-none focus:border-accent"
              required
            />
          </label>
          <label className="block text-sm">
            الرسالة
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-xl border border-mist bg-paper px-3 py-2.5 outline-none focus:border-accent"
              required
            />
          </label>
          <Button type="submit" fullWidth size="lg">
            إرسال عبر واتساب
          </Button>
        </form>
      </div>
    </section>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-mist/70 bg-surface p-4 shadow-card">
      <div className="rounded-xl bg-accent-soft p-2 text-accent">{icon}</div>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-1 font-medium">{value}</p>
      </div>
    </div>
  )
}
