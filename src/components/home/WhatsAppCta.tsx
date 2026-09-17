import { MessageCircle } from 'lucide-react'
import { storeConfig } from '../../config/store'
import WhatsAppButton from '../common/WhatsAppButton'

export default function WhatsAppCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-gradient-to-l from-ink via-ink to-[#3a2418] px-6 py-10 text-white sm:flex-row sm:items-center sm:px-10">
        <div>
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            محتاج مساعدة في اختيار المنتج المناسب؟
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-7 text-white/70">
            تواصل معنا على واتساب وسنساعدك في اختيار أداة المطبخ الأنسب لمعرضك أو منزلك.
            الرقم قابل للتعديل من إعدادات المتجر ({storeConfig.whatsapp}).
          </p>
        </div>
        <WhatsAppButton
          label="تواصل معنا على واتساب"
          className="bg-[#25D366] hover:bg-[#1ebe57]"
          size="lg"
        />
        <span className="sr-only">
          <MessageCircle />
        </span>
      </div>
    </section>
  )
}
