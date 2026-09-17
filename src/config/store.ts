export const storeConfig = {
  name: 'Modern Home',
  nameEn: 'Modern Home Kitchen',
  tagline: 'كل احتياجات مطبخك في مكان واحد',
  description:
    'معرض متخصص في أدوات ومستلزمات المطبخ: أواني طهي، أدوات تحضير، تخزين، خَبز وتقديم — جودة عملية وأسعار واضحة.',
  whatsapp: '+201021747975',
  phone: '01021747975',
  email: 'hello@modern-home.example',
  address: 'شارع المثال، القاهرة، مصر',
  openingHours: 'السبت – الخميس: 10 ص – 10 م',
  facebook: 'https://facebook.com',
  instagram: 'https://instagram.com',
  currency: 'EGP',
  currencyLabel: 'ج.م',
  mapEmbedUrl: '',
  about: {
    vision:
      'أن نكون الوجهة الأولى لمن يبحث عن أدوات مطبخ عملية وأنيقة من معرض متخصص يمكن زيارته أو الطلب منه عبر واتساب.',
    quality:
      'نختار أواني الطهي وأدوات المطبخ بعناية مع التركيز على المتانة وسهولة الاستخدام والمظهر الراقي.',
    variety:
      'من الحلل والطاسات إلى أدوات التحضير والتخزين والخبز والتقديم — تشكيلة تغطي احتياجات المطبخ اليومية.',
    service:
      'فريق المعرض جاهز لمساعدتك في اختيار المنتج المناسب عبر الهاتف أو واتساب قبل إتمام طلبك.',
  },
} as const

export type StoreConfig = typeof storeConfig
