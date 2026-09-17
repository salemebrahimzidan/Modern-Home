import type { Category } from '../types/category'
import type { LocalizedText } from '../i18n/types'
import { unsplashPhoto } from '../utils/images'

const L = (ar: string, en: string): LocalizedText => ({ ar, en })

function cover(id: string): string {
  return unsplashPhoto(id, { width: 900, height: 700 })
}

export const categories: Category[] = [
  {
    id: 1,
    name: L('أواني الطهي', 'Cookware'),
    slug: 'cookware',
    image: cover('photo-1556909114-f6e7ad7d3136'),
    description: L(
      'حلل، طاسات، قدور ضغط وأطقم طهي يومية.',
      'Pots, pans, pressure cookers, and everyday cookware sets.',
    ),
  },
  {
    id: 2,
    name: L('أدوات المطبخ', 'Kitchen tools'),
    slug: 'kitchen-tools',
    image: cover('photo-1610701596007-11502861dcfa'),
    description: L(
      'سكاكين، ألواح تقطيع، ملاعق وأدوات طبخ أساسية.',
      'Knives, cutting boards, spoons, and essential cooking tools.',
    ),
  },
  {
    id: 3,
    name: L('تحضير الطعام', 'Food prep'),
    slug: 'food-prep',
    image: cover('photo-1556911220-bff31c812dba'),
    description: L(
      'مصافي، قطّاعات، أوعية خلط وأدوات قياس.',
      'Colanders, choppers, mixing bowls, and measuring tools.',
    ),
  },
  {
    id: 4,
    name: L('تخزين وتنظيم', 'Storage & organization'),
    slug: 'kitchen-storage',
    image: cover('photo-1588854337221-4cf9fa960bba'),
    description: L(
      'علب حفظ، برطمانات توابل ومنظمات أدراج وثلاجة.',
      'Food containers, spice jars, and drawer and fridge organizers.',
    ),
  },
  {
    id: 5,
    name: L('الخَبز', 'Baking'),
    slug: 'baking',
    image: cover('photo-1486427944299-d1955d23e34d'),
    description: L(
      'صواني فرن، قوالب كيك، سيليكون وشوبك.',
      'Baking trays, cake molds, silicone bakeware, and rolling pins.',
    ),
  },
  {
    id: 6,
    name: L('أدوات التقديم', 'Serving'),
    slug: 'serving',
    image: cover('photo-1578500494198-246f612d3b3d'),
    description: L(
      'أطباق، صواني تقديم، أكواب وأطقم سفرة.',
      'Plates, serving trays, cups, and tableware sets.',
    ),
  },
  {
    id: 7,
    name: L('إكسسوارات المطبخ', 'Kitchen accessories'),
    slug: 'kitchen-accessories',
    image: cover('photo-1556909172-54557c7e4fb7'),
    description: L(
      'قفازات فرن، مريلة، فوط وإكسسوارات يومية.',
      'Oven gloves, aprons, towels, and everyday accessories.',
    ),
  },
  {
    id: 8,
    name: L('التنظيف والتنظيم', 'Cleaning & organization'),
    slug: 'cleaning-organization',
    image: cover('photo-1581578731548-c64695cc6952'),
    description: L(
      'حامل أطباق، فرش تنظيف ومنظم حوض المطبخ.',
      'Dish racks, cleaning brushes, and sink organizers.',
    ),
  },
]
