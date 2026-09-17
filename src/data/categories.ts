import type { Category } from '../types/category'
import { unsplashPhoto } from '../utils/images'

function cover(id: string): string {
  return unsplashPhoto(id, { width: 900, height: 700 })
}

export const categories: Category[] = [
  {
    id: 1,
    name: 'أواني الطهي',
    slug: 'cookware',
    image: cover('photo-1556909114-f6e7ad7d3136'),
    description: 'حلل، طاسات، قدور ضغط وأطقم طهي يومية.',
  },
  {
    id: 2,
    name: 'أدوات المطبخ',
    slug: 'kitchen-tools',
    image: cover('photo-1610701596007-11502861dcfa'),
    description: 'سكاكين، ألواح تقطيع، ملاعق وأدوات طبخ أساسية.',
  },
  {
    id: 3,
    name: 'تحضير الطعام',
    slug: 'food-prep',
    image: cover('photo-1556911220-bff31c812dba'),
    description: 'مصافي، قطّاعات، أوعية خلط وأدوات قياس.',
  },
  {
    id: 4,
    name: 'تخزين وتنظيم',
    slug: 'kitchen-storage',
    image: cover('photo-1588854337221-4cf9fa960bba'),
    description: 'علب حفظ، برطمانات توابل ومنظمات أدراج وثلاجة.',
  },
  {
    id: 5,
    name: 'الخَبز',
    slug: 'baking',
    image: cover('photo-1486427944299-d1955d23e34d'),
    description: 'صواني فرن، قوالب كيك، سيليكون وشوبك.',
  },
  {
    id: 6,
    name: 'أدوات التقديم',
    slug: 'serving',
    image: cover('photo-1578500494198-246f612d3b3d'),
    description: 'أطباق، صواني تقديم، أكواب وأطقم سفرة.',
  },
  {
    id: 7,
    name: 'إكسسوارات المطبخ',
    slug: 'kitchen-accessories',
    image: cover('photo-1556909172-54557c7e4fb7'),
    description: 'قفازات فرن، مريلة، فوط وإكسسوارات يومية.',
  },
  {
    id: 8,
    name: 'التنظيف والتنظيم',
    slug: 'cleaning-organization',
    image: cover('photo-1581578731548-c64695cc6952'),
    description: 'حامل أطباق، فرش تنظيف ومنظم حوض المطبخ.',
  },
]
