import arabicReshaper from 'arabic-persian-reshaper'
import fontkit from '@pdf-lib/fontkit'
import bidiFactory from 'bidi-js'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib'
import { storeConfig } from '../config/store'
import type { Locale } from '../i18n/types'
import type { OrderPayload } from '../types/order'
import { formatOrderAmount, formatOrderNumber } from './currency'
import { formatOrderDate } from './orderReference'

const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 36
const FOOTER_TOP = 72
const CONTENT_W = PAGE_W - MARGIN * 2

const ivory = rgb(250 / 255, 249 / 255, 245 / 255)
const ink = rgb(48 / 255, 59 / 255, 44 / 255)
const olive = rgb(75 / 255, 87 / 255, 62 / 255)
const mist = rgb(227 / 255, 229 / 255, 218 / 255)
const muted = rgb(115 / 255, 121 / 255, 109 / 255)
const panel = rgb(237 / 255, 236 / 255, 226 / 255)
const strip = rgb(233 / 255, 236 / 255, 223 / 255)
const paper = rgb(250 / 255, 249 / 255, 245 / 255)

const bidi = bidiFactory()

export interface OrderPdfInput {
  payload: OrderPayload
  reference: string
  issuedAt: Date
  locale: Locale
  fonts: {
    regular: ArrayBuffer
    semibold: ArrayBuffer
  }
}

interface Column {
  label: string
  width: number
  align: 'start' | 'end'
  kind: 'name' | 'qty' | 'unit' | 'total'
}

function visual(text: string, dir: 'rtl' | 'ltr'): string {
  const reshaped = arabicReshaper.ArabicShaper.convertArabic(text)
  if (dir === 'ltr' && !/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text)) return text
  return bidi.getReorderedString(reshaped, bidi.getEmbeddingLevels(reshaped, dir))
}

/** pdf-lib shapes through fontkit, which would reverse this text again. Draw the prepared glyphs in order. */
function fontkitWithoutArabicReorder(base: typeof fontkit): typeof fontkit {
  return {
    ...base,
    create(buffer: Uint8Array) {
      const created = base.create(buffer)
      const glyphsForString = created.glyphsForString.bind(created)
      created.layout = ((text: string) => {
        const glyphs = glyphsForString(text)
        return {
          glyphs,
          positions: glyphs.map((glyph) => ({
            xAdvance: glyph.advanceWidth,
            yAdvance: 0,
            xOffset: 0,
            yOffset: 0,
          })),
        }
      }) as typeof created.layout
      return created
    },
  }
}

function measure(text: string, font: PDFFont, size: number, dir: 'rtl' | 'ltr'): number {
  const shown = visual(text, dir)
  return shown ? font.widthOfTextAtSize(shown, size) : 0
}

function drawText(
  page: PDFPage,
  text: string,
  edge: number,
  baseline: number,
  size: number,
  font: PDFFont,
  color: RGB,
  dir: 'rtl' | 'ltr',
  align: 'left' | 'right',
) {
  const shown = visual(text, dir)
  if (!shown) return
  const width = font.widthOfTextAtSize(shown, size)
  page.drawText(shown, {
    x: align === 'right' ? edge - width : edge,
    y: baseline,
    size,
    font,
    color,
  })
}

function wrapLogical(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
  dir: 'rtl' | 'ltr',
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const lines: string[] = []
  let current = ''
  const fits = (value: string) => measure(value, font, size, dir) <= maxWidth

  const breakLong = (word: string): string[] => {
    const parts: string[] = []
    let chunk = ''
    for (const char of word) {
      const trial = chunk + char
      if (fits(trial)) chunk = trial
      else {
        if (chunk) parts.push(chunk)
        chunk = char
      }
    }
    if (chunk) parts.push(chunk)
    return parts
  }

  for (const word of words) {
    const trial = current ? `${current} ${word}` : word
    if (fits(trial)) {
      current = trial
      continue
    }
    if (current) lines.push(current)
    if (fits(word)) {
      current = word
      continue
    }
    const pieces = breakLong(word)
    lines.push(...pieces.slice(0, -1))
    current = pieces[pieces.length - 1] ?? ''
  }
  if (current) lines.push(current)
  return lines.length > 0 ? lines : ['']
}

function columnsFor(locale: Locale): Column[] {
  const ar = locale === 'ar'
  const currency = ar ? 'ج.م' : 'EGP'
  const name: Column = { label: ar ? 'المنتج' : 'Product', width: 247, align: 'start', kind: 'name' }
  const qty: Column = { label: ar ? 'الكمية' : 'Qty', width: 58, align: 'end', kind: 'qty' }
  const unit: Column = {
    label: ar ? `سعر الوحدة (${currency})` : `Unit price (${currency})`,
    width: 112,
    align: 'end',
    kind: 'unit',
  }
  const total: Column = {
    label: ar ? `الإجمالي (${currency})` : `Line total (${currency})`,
    width: CONTENT_W - 247 - 58 - 112,
    align: 'end',
    kind: 'total',
  }
  return ar ? [total, unit, qty, name] : [name, qty, unit, total]
}

function trackedLabel(text: string) {
  return text.split('').join(' ')
}

export async function buildOrderPdf(input: OrderPdfInput): Promise<Uint8Array> {
  const { payload, reference, issuedAt, locale, fonts } = input
  const dir = locale === 'ar' ? 'rtl' : 'ltr'
  const ar = dir === 'rtl'
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkitWithoutArabicReorder(fontkit))
  doc.setTitle(`${ar ? 'ملخص طلب' : 'Order summary'} ${reference}`)
  doc.setAuthor(storeConfig.name)
  doc.setSubject(ar ? 'ملخص طلب' : 'Order summary')
  doc.setCreator('Modern Home')

  const regular = await doc.embedFont(fonts.regular, { subset: true })
  const semibold = await doc.embedFont(fonts.semibold, { subset: true })
  const times = await doc.embedFont(StandardFonts.TimesRoman)
  const cols = columnsFor(locale)
  const dateLabel = formatOrderDate(issuedAt, locale)
  const pages: PDFPage[] = []

  let page = doc.addPage([PAGE_W, PAGE_H])
  pages.push(page)
  let cursor = 0

  const paintPage = (target: PDFPage) => {
    target.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: ivory })
  }

  const drawHeader = (target: PDFPage, continued: boolean) => {
    const height = continued ? 46 : 92
    target.drawRectangle({
      x: 0,
      y: PAGE_H - height,
      width: PAGE_W,
      height,
      color: ink,
    })
    target.drawRectangle({
      x: 0,
      y: PAGE_H - height - 4,
      width: PAGE_W,
      height: 4,
      color: olive,
    })

    const title = ar ? 'ملخص طلب' : 'Order summary'
    const titleSize = continued ? 14 : 20
    const titleWidth = measure(title, semibold, titleSize, dir)
    const titleBaseline = PAGE_H - (continued ? 28 : 52)
    if (ar) {
      drawText(target, title, MARGIN + titleWidth, titleBaseline, titleSize, semibold, paper, dir, 'right')
    } else {
      drawText(target, title, PAGE_W - MARGIN - titleWidth, titleBaseline, titleSize, semibold, paper, dir, 'left')
    }

    const brand = storeConfig.name
    const brandSize = continued ? 13 : 22
    const brandWidth = times.widthOfTextAtSize(brand, brandSize)
    const brandX = ar ? PAGE_W - MARGIN - brandWidth : MARGIN
    const brandY = PAGE_H - (continued ? 29 : 46)
    target.drawText(brand, { x: brandX, y: brandY, size: brandSize, font: times, color: paper })
    if (!continued) {
      const subtitle = trackedLabel('KITCHEN & LIVING')
      const subtitleWidth = times.widthOfTextAtSize(subtitle, 8)
      target.drawText(subtitle, {
        x: ar ? PAGE_W - MARGIN - subtitleWidth : MARGIN,
        y: brandY - 16,
        size: 8,
        font: times,
        color: rgb(233 / 255, 236 / 255, 223 / 255),
      })
    }

    return PAGE_H - height - 4 - 26
  }

  const newPage = (continued: boolean) => {
    page = doc.addPage([PAGE_W, PAGE_H])
    pages.push(page)
    paintPage(page)
    cursor = drawHeader(page, continued)
  }

  const ensure = (height: number) => {
    if (cursor - height < FOOTER_TOP) newPage(true)
  }

  paintPage(page)
  cursor = drawHeader(page, false)

  const referenceLine = ar ? `رقم الطلب: ${reference}` : `Order no. ${reference}`
  const dateLine = ar ? `التاريخ: ${dateLabel}` : `Date: ${dateLabel}`
  if (ar) {
    drawText(page, referenceLine, PAGE_W - MARGIN, cursor, 11, regular, ink, dir, 'right')
    drawText(page, dateLine, MARGIN, cursor, 11, regular, ink, dir, 'left')
  } else {
    drawText(page, referenceLine, MARGIN, cursor, 11, regular, ink, dir, 'left')
    drawText(page, dateLine, PAGE_W - MARGIN, cursor, 11, regular, ink, dir, 'right')
  }
  cursor -= 18
  page.drawRectangle({ x: MARGIN, y: cursor, width: CONTENT_W, height: 0.6, color: mist })
  cursor -= 18

  const drawInfoPanel = (title: string, rows: Array<{ label: string; value: string }>) => {
    const labelWidth = 78
    const valueWidth = CONTENT_W - 28 - labelWidth
    const prepared = rows.map((row) => ({
      label: row.label,
      lines: wrapLogical(row.value, regular, 11, valueWidth, dir),
    }))
    const titleHeight = 22
    const rowHeights = prepared.map((row) => Math.max(row.lines.length, 1) * 15)
    const bodyHeight = rowHeights.reduce((sum, height) => sum + height, 0)
    const panelHeight = 14 + titleHeight + bodyHeight + 8
    ensure(panelHeight)
    const top = cursor
    page.drawRectangle({
      x: MARGIN,
      y: top - panelHeight,
      width: CONTENT_W,
      height: panelHeight,
      color: panel,
      borderColor: mist,
      borderWidth: 0.8,
    })
    const titleBaseline = top - 20
    drawText(
      page,
      title,
      ar ? PAGE_W - MARGIN - 14 : MARGIN + 14,
      titleBaseline,
      12,
      semibold,
      ink,
      dir,
      ar ? 'right' : 'left',
    )
    let rowTop = titleBaseline - 18
    for (const row of prepared) {
      const labelBaseline = rowTop
      const labelEdge = ar ? PAGE_W - MARGIN - 14 : MARGIN + 14
      drawText(page, row.label, labelEdge, labelBaseline, 10, regular, muted, dir, ar ? 'right' : 'left')
      const valueEdge = ar ? PAGE_W - MARGIN - 14 - labelWidth : MARGIN + 14 + labelWidth
      row.lines.forEach((line, index) => {
        drawText(
          page,
          line,
          valueEdge,
          labelBaseline - index * 15,
          11,
          regular,
          ink,
          dir,
          ar ? 'right' : 'left',
        )
      })
      rowTop -= Math.max(row.lines.length, 1) * 15
    }
    cursor = top - panelHeight - 14
  }

  drawInfoPanel(ar ? 'بيانات التوصيل' : 'Delivery details', [
    { label: ar ? 'الاسم' : 'Name', value: payload.customer.name.trim() },
    { label: ar ? 'الهاتف' : 'Phone', value: payload.customer.phone.trim() },
    { label: ar ? 'العنوان' : 'Address', value: payload.customer.address.trim() },
  ])

  const notes = payload.customer.notes?.trim()
  if (notes) {
    const noteLines = wrapLogical(notes, regular, 11, CONTENT_W - 28, dir)
    const noteHeight = 36 + noteLines.length * 15
    ensure(Math.min(noteHeight, 120))
    let remaining = [...noteLines]
    while (remaining.length > 0) {
      const room = cursor - FOOTER_TOP - 36
      const fitCount = Math.max(1, Math.floor(room / 15))
      const slice = remaining.slice(0, fitCount)
      remaining = remaining.slice(slice.length)
      const boxHeight = 28 + slice.length * 15 + 10
      if (cursor - boxHeight < FOOTER_TOP) {
        newPage(true)
      }
      const top = cursor
      page.drawRectangle({
        x: MARGIN,
        y: top - boxHeight,
        width: CONTENT_W,
        height: boxHeight,
        color: panel,
        borderColor: mist,
        borderWidth: 0.8,
      })
      drawText(
        page,
        ar ? 'ملاحظات' : 'Notes',
        ar ? PAGE_W - MARGIN - 14 : MARGIN + 14,
        top - 18,
        12,
        semibold,
        ink,
        dir,
        ar ? 'right' : 'left',
      )
      slice.forEach((line, index) => {
        drawText(
          page,
          line,
          ar ? PAGE_W - MARGIN - 14 : MARGIN + 14,
          top - 36 - index * 15,
          11,
          regular,
          ink,
          dir,
          ar ? 'right' : 'left',
        )
      })
      cursor = top - boxHeight - 14
    }
  }

  const drawTableHeader = () => {
    ensure(28)
    page.drawRectangle({
      x: MARGIN,
      y: cursor - 22,
      width: CONTENT_W,
      height: 26,
      color: strip,
    })
    let x = MARGIN
    const baseline = cursor - 14
    for (const column of cols) {
      const align = column.align === 'end' || (ar && column.kind === 'name') ? 'right' : 'left'
      const textEdge = align === 'right' ? x + column.width - 8 : x + 8
      drawText(page, column.label, textEdge, baseline, 9, semibold, ink, dir, align)
      x += column.width
    }
    cursor -= 30
  }

  drawTableHeader()

  const lines = payload.items.map((item) => {
    const quantity = item.quantity
    const unit = item.price
    const lineTotal = unit * quantity
    return { name: item.name, quantity, unit, lineTotal }
  })
  const grandTotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)

  for (const line of lines) {
    const nameColumn = cols.find((column) => column.kind === 'name')!
    const nameLines = wrapLogical(line.name, regular, 11, nameColumn.width - 16, dir)
    const rowHeight = Math.max(nameLines.length * 15 + 10, 28)
    if (cursor - rowHeight < FOOTER_TOP) {
      newPage(true)
      drawTableHeader()
    }
    let x = MARGIN
    const baseline = cursor - 16
    const values: Record<Column['kind'], string> = {
      name: line.name,
      qty: String(line.quantity),
      unit: formatOrderNumber(line.unit),
      total: formatOrderNumber(line.lineTotal),
    }
    for (const column of cols) {
      if (column.kind === 'name') {
        nameLines.forEach((nameLine, index) => {
          drawText(
            page,
            nameLine,
            ar ? x + column.width - 8 : x + 8,
            baseline - index * 15,
            11,
            regular,
            ink,
            dir,
            ar ? 'right' : 'left',
          )
        })
      } else {
        drawText(
          page,
          values[column.kind],
          x + column.width - 8,
          baseline,
          11,
          regular,
          ink,
          'ltr',
          'right',
        )
      }
      x += column.width
    }
    cursor -= rowHeight
    page.drawRectangle({ x: MARGIN, y: cursor + 4, width: CONTENT_W, height: 0.5, color: mist })
  }

  const subtotalLabel = ar ? 'إجمالي المنتجات' : 'Products subtotal'
  const subtotalValue = formatOrderAmount(grandTotal, locale)
  const deliveryNote = ar
    ? 'تكلفة التوصيل تُؤكد مع المتجر حسب العنوان، ولا تدخل في إجمالي المنتجات.'
    : 'Delivery charges are confirmed with the store for your address and are not included in the product subtotal.'
  const noteLines = wrapLogical(deliveryNote, regular, 9, CONTENT_W, dir)
  const summaryHeight = 52 + noteLines.length * 13
  ensure(summaryHeight)
  cursor -= 8
  page.drawRectangle({
    x: MARGIN,
    y: cursor - 40,
    width: CONTENT_W,
    height: 42,
    color: olive,
  })
  drawText(
    page,
    subtotalLabel,
    ar ? PAGE_W - MARGIN - 14 : MARGIN + 14,
    cursor - 26,
    13,
    semibold,
    paper,
    dir,
    ar ? 'right' : 'left',
  )
  drawText(
    page,
    subtotalValue,
    ar ? MARGIN + 14 + measure(subtotalValue, semibold, 14, dir) : PAGE_W - MARGIN - 14,
    cursor - 26,
    14,
    semibold,
    paper,
    dir,
    ar ? 'right' : 'right',
  )
  cursor -= 56
  noteLines.forEach((line, index) => {
    drawText(
      page,
      line,
      ar ? PAGE_W - MARGIN : MARGIN,
      cursor - index * 13,
      9,
      regular,
      muted,
      dir,
      ar ? 'right' : 'left',
    )
  })

  const disclaimer = ar
    ? 'هذا المستند ملخص طلب فقط، وليس فاتورة ضريبية أو إيصال دفع.'
    : 'This document is an order summary only, not a tax invoice or a payment receipt.'
  const contact = `${storeConfig.phone}  |  WhatsApp ${storeConfig.whatsapp}`

  pages.forEach((target, index) => {
    target.drawRectangle({
      x: MARGIN,
      y: 50,
      width: CONTENT_W,
      height: 0.6,
      color: mist,
    })
    drawText(
      target,
      storeConfig.name,
      ar ? PAGE_W - MARGIN : MARGIN,
      36,
      9,
      semibold,
      ink,
      'ltr',
      ar ? 'right' : 'left',
    )
    drawText(target, contact, ar ? PAGE_W - MARGIN : MARGIN, 24, 8, regular, muted, 'ltr', ar ? 'right' : 'left')
    const disclaimerLines = wrapLogical(disclaimer, regular, 8, CONTENT_W - (pages.length > 1 ? 48 : 0), dir)
    disclaimerLines.slice(0, 2).forEach((line, lineIndex) => {
      drawText(
        target,
        line,
        ar ? PAGE_W - MARGIN : MARGIN,
        12 - lineIndex * 10,
        8,
        regular,
        muted,
        dir,
        ar ? 'right' : 'left',
      )
    })
    if (pages.length > 1) {
      const pageLabel = `${index + 1} / ${pages.length}`
      drawText(
        target,
        pageLabel,
        ar ? MARGIN : PAGE_W - MARGIN,
        36,
        8,
        regular,
        muted,
        'ltr',
        ar ? 'left' : 'right',
      )
    }
  })

  return doc.save()
}

export async function loadOrderPdfFonts(): Promise<OrderPdfInput['fonts']> {
  const [regular, semibold] = await Promise.all([
    fetch('/fonts/IBMPlexSansArabic-Regular.ttf').then((response) => {
      if (!response.ok) throw new Error('Missing Arabic font')
      return response.arrayBuffer()
    }),
    fetch('/fonts/IBMPlexSansArabic-SemiBold.ttf').then((response) => {
      if (!response.ok) throw new Error('Missing Arabic font')
      return response.arrayBuffer()
    }),
  ])
  return { regular, semibold }
}

export function savePdfFile(bytes: Uint8Array, filename: string) {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  const blob = new Blob([copy], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2500)
}

export async function downloadOrderPdf(input: Omit<OrderPdfInput, 'fonts'>) {
  const fonts = await loadOrderPdfFonts()
  const bytes = await buildOrderPdf({ ...input, fonts })
  savePdfFile(bytes, `Modern-Home-${input.reference}.pdf`)
}
