# Modern Home — معرض أدوات المطبخ

موقع عرض وبيع أدوات ومستلزمات المطبخ (React + TypeScript + Vite) بواجهة عربية RTL وطلب عبر واتساب بدون دفع إلكتروني.

## التشغيل

```bash
cd homeware-store
npm install
npm run dev
```

افتح العنوان الذي يظهر في الطرفية (عادة `http://localhost:5173`).

## أوامر أخرى

```bash
npm run build    # بناء الإنتاج
npm run preview  # معاينة البناء
npm run lint     # فحص الكود
npm run format   # تنسيق Prettier
```

## إعدادات يجب تعديلها يدوياً

عدّل الملف:

`src/config/store.ts`

- رقم واتساب (`whatsapp`)
- الهاتف
- العنوان
- ساعات العمل
- روابط فيسبوك / إنستغرام
- رابط خريطة Google Maps (`mapEmbedUrl`) اختياري

الألوان مركزية في `src/index.css` داخل كتلة `@theme`.

## البنية

- `src/data` — بيانات تجريبية للمنتجات والأقسام
- `src/services/catalog.ts` — طبقة بيانات قابلة للاستبدال بـ API لاحقاً
- `src/context` — السلة + الإشعارات
- `src/utils/whatsapp.ts` — إنشاء رسالة الطلب وفتح واتساب
- `src/pages/Offers.tsx` — صفحة العروض
