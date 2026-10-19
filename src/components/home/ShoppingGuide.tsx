import { Link } from 'react-router-dom'
import { useLocale } from '../../hooks/useLocale'
import { openWhatsAppChat } from '../../utils/whatsapp'
export default function ShoppingGuide({ faqOnly = false }: { faqOnly?: boolean }) {
  const { locale } = useLocale()
  const ar = locale === 'ar'
  const steps = ar
    ? [
        ['اختار اللي يناسبك', 'تصفح الأقسام والخامات والمقاسات، وأضف اختياراتك للسلة.'],
        ['جهز طلبك على واتساب', 'راجع الكميات وأدخل بيانات التوصيل لإرسال رسالة منظمة.'],
        [
          'أكد التفاصيل مع المتجر',
          'تأكد من التوفر والسعر وتكلفة التوصيل وطريقة الدفع قبل الشراء.',
        ],
      ]
    : [
        [
          'Find your everyday essentials',
          'Explore categories, materials and sizes, then add your choices to the cart.',
        ],
        [
          'Prepare your WhatsApp order',
          'Review quantities and add your delivery details to prepare your message.',
        ],
        [
          'Confirm with the store',
          'Confirm availability, prices, delivery and payment before completing your purchase.',
        ],
      ]
  const questions = ar
    ? [
        [
          'إزاي أعمل طلب؟',
          'أضف المنتجات للسلة ثم أدخل بياناتك. افتح واتساب من صفحة السلة وراجع الرسالة وأرسلها للمتجر. فتح واتساب لا يؤكد الطلب تلقائياً.',
        ],
        [
          'التوصيل بكام وبيوصل في قد إيه؟',
          'تُحدد مناطق التوصيل والتكلفة والموعد مع المتجر حسب عنوانك. إجمالي السلة للمنتجات فقط ولا يشمل رسوم توصيل غير مؤكدة.',
        ],
        [
          'إيه طرق الدفع المتاحة؟',
          'طرق الدفع تُؤكد مع المتجر عند مراجعة الطلب. الموقع لا يستقبل دفعاً إلكترونياً ولا يعرض خيار دفع غير فعّال.',
        ],
        [
          'إيه شروط الاستبدال والاسترجاع؟',
          'اطلب شروط الاستبدال والاسترجاع من المتجر قبل تأكيد الشراء، بما فيها المدة وحالة المنتج وتكاليف الشحن إن وجدت.',
        ],
        [
          'هل الصور هي نفس المنتج الفعلي؟',
          'صور الكتالوج الحالي توضيحية. اطلب صورة فعلية وتأكد من اللون والخامة والمقاس وعدد القطع قبل الشراء.',
        ],
      ]
    : [
        [
          'How do I order?',
          'Add products to your cart, enter your details, then open WhatsApp. Review and send the message to the store. Opening WhatsApp does not confirm an order.',
        ],
        [
          'What are the delivery cost and timing?',
          'Confirm delivery areas, charges and timing with the store for your address. Cart totals include products only.',
        ],
        [
          'Which payment methods are available?',
          'Payment methods are confirmed with the store when your order is reviewed. This site does not take online payment.',
        ],
        [
          'What is the returns policy?',
          'Ask the store to confirm return and exchange periods, conditions and any shipping costs before purchase.',
        ],
        [
          'Do the photos show the actual products?',
          'Current catalog photography is illustrative. Ask for an actual photo and confirm color, material, size and pieces before purchasing.',
        ],
      ]
  return (
    <>
      {!faqOnly && (
        <>
        <section className="guide-section">
          <p className="eyebrow">{ar ? 'بخطوات بسيطة' : 'A simpler way to shop'}</p>
          <h2>{ar ? 'من اختيارك… لباب بيتك.' : 'From your wishlist to your home.'}</h2>
          <div className="guide-steps">
            {steps.map(([title, body], i) => (
              <div key={title}>
                <span>0{i + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="editorial-story">
          <img
            src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1400&q=85"
            alt={
              ar ? 'أوانٍ خزفية — صورة توضيحية' : 'Ceramic tableware — illustrative photo'
            }
            loading="lazy"
          />
          <div>
            <p className="eyebrow">{ar ? 'أكثر من أدوات مطبخ' : 'More than kitchenware'}</p>
            <h2>
              {ar
                ? 'المطبخ قلب البيت. والتفاصيل هي الروح.'
                : 'The kitchen is the heart of the home. The details are its soul.'}
            </h2>
            <p>
              {ar
                ? 'من أواني الطهي والتحضير، لأناقة التقديم والتنظيم. اكتشف تشكيلة تناسب مطبخك وطريقتك في الحياة.'
                : 'From preparing and cooking to serving and organizing, explore a collection shaped for the way you live.'}
            </p>
            <Link to="/products" className="editorial-text-link">
              {ar ? 'اختار تفاصيل مطبخك ←' : 'Explore the collection →'}
            </Link>
          </div>
        </section>
        </>
      )}
      <section className="guide-section shopping-faq" id="shopping-help">
        <div>
          <p className="eyebrow">{ar ? 'قبل ما تطلب' : 'Before you order'}</p>
          <h2>
            {ar ? 'إجابات تخلّي الاختيار أسهل.' : 'A little clarity. A better choice.'}
          </h2>
          <p>
            {ar
              ? 'تفاصيل واضحة، من أول تصفح لحد تأكيد الطلب.'
              : 'Clear details, from browsing to confirming your order.'}
          </p>
          <button className="editorial-text-link" onClick={() => openWhatsAppChat()}>
            {ar ? 'عندك سؤال تاني؟ تواصل معنا ↗' : 'Have another question? Contact us ↗'}
          </button>
        </div>
        <div>
          {questions.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  )
}
