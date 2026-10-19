import { storeConfig } from '../../config/store'
import { useLocale } from '../../hooks/useLocale'
import { openWhatsAppChat } from '../../utils/whatsapp'

export default function WhatsAppCta() {
  const { locale } = useLocale()
  const ar = locale === 'ar'

  return (
    <section className="contact-cta">
      <div>
        <p className="eyebrow">{ar ? 'مساعدة في الاختيار' : 'Help choosing'}</p>
        <h2>
          {ar ? 'محتاج مساعدة في اختيار المنتج المناسب؟' : 'Need help choosing the right piece?'}
        </h2>
        <p>
          {ar
            ? `تواصل معنا على واتساب وسنساعدك في اختيار أداة المطبخ الأنسب. الرقم من إعدادات المتجر (${storeConfig.phone}).`
            : `Message the store on WhatsApp and we will help you choose. The number comes from the store settings (${storeConfig.phone}).`}
        </p>
        <button type="button" className="editorial-button" onClick={() => openWhatsAppChat()}>
          {ar ? 'تواصل معنا على واتساب' : 'Contact us on WhatsApp'}
        </button>
      </div>
    </section>
  )
}
