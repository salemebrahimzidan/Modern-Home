import { useState } from 'react'
import { FALLBACK_IMAGE } from '../../utils/images'

interface ProductGalleryProps {
  images: string[]
  alt: string
}

export default function ProductGallery({ images, alt }: ProductGalleryProps) {
  const safeImages =
    images.length > 0 ? images : [FALLBACK_IMAGE]
  const [active, setActive] = useState(0)
  const current = safeImages[Math.min(active, safeImages.length - 1)]

  return (
    <div>
      <div className="overflow-hidden rounded-3xl bg-mist">
        <img
          src={current}
          alt={alt}
          className="aspect-square w-full object-cover"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGE
          }}
        />
      </div>
      {safeImages.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {safeImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={[
                'h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2',
                active === index ? 'border-accent' : 'border-transparent',
              ].join(' ')}
              aria-label={`عرض الصورة ${index + 1}`}
            >
              <img src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
