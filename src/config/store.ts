import type { LocalizedText } from '../i18n/types'

const L = (ar: string, en: string): LocalizedText => ({ ar, en })

export const storeConfig = {
  name: 'Modern Home',
  nameEn: 'Modern Home Kitchen',
  tagline: L(
    'كل احتياجات مطبخك في مكان واحد',
    'Everything your kitchen needs in one place',
  ),
  description: L(
    'معرض متخصص في أدوات ومستلزمات المطبخ: أواني طهي، أدوات تحضير، تخزين، خَبز وتقديم — جودة عملية وأسعار واضحة.',
    'A showroom specialized in kitchen tools and supplies: cookware, prep tools, storage, baking, and serving — practical quality and clear prices.',
  ),
  whatsapp: '+201021747975',
  phone: '01021747975',
  email: 'hello@modern-home.example',
  address: L('شارع المثال، القاهرة، مصر', 'Example Street, Cairo, Egypt'),
  openingHours: L(
    'السبت – الخميس: 10 ص – 10 م',
    'Sat – Thu: 10 AM – 10 PM',
  ),
  facebook: 'https://facebook.com',
  instagram: 'https://instagram.com',
  currency: 'EGP',
  currencyLabel: L('ج.م', 'EGP'),
  mapEmbedUrl: '',
  about: {
    vision: L(
      'أن نكون الوجهة الأولى لمن يبحث عن أدوات مطبخ عملية وأنيقة من معرض متخصص يمكن زيارته أو الطلب منه عبر واتساب.',
      'To be the first destination for practical, elegant kitchen tools from a showroom you can visit or order from on WhatsApp.',
    ),
    quality: L(
      'نختار أواني الطهي وأدوات المطبخ بعناية مع التركيز على المتانة وسهولة الاستخدام والمظهر الراقي.',
      'We carefully select cookware and kitchen tools with a focus on durability, ease of use, and refined looks.',
    ),
    variety: L(
      'من الحلل والطاسات إلى أدوات التحضير والتخزين والخبز والتقديم — تشكيلة تغطي احتياجات المطبخ اليومية.',
      'From pots and pans to prep, storage, baking, and serving — a selection that covers everyday kitchen needs.',
    ),
    service: L(
      'فريق المعرض جاهز لمساعدتك في اختيار المنتج المناسب عبر الهاتف أو واتساب قبل إتمام طلبك.',
      'Our showroom team is ready to help you choose the right product by phone or WhatsApp before you order.',
    ),
  },
} as const

export type StoreConfig = typeof storeConfig
