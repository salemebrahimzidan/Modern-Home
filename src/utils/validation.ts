export function isValidEgyptianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '')
  return /^(?:\+?20|0)?1[0125]\d{8}$/.test(cleaned)
}

export function validateCustomerForm(input: {
  name: string
  phone: string
  address: string
}): Partial<Record<'name' | 'phone' | 'address', string>> {
  const errors: Partial<Record<'name' | 'phone' | 'address', string>> = {}

  if (!input.name.trim()) {
    errors.name = 'الاسم مطلوب'
  }

  if (!input.phone.trim()) {
    errors.phone = 'رقم الهاتف مطلوب'
  } else if (!isValidEgyptianPhone(input.phone)) {
    errors.phone = 'يرجى إدخال رقم هاتف مصري صحيح'
  }

  if (!input.address.trim()) {
    errors.address = 'العنوان مطلوب'
  }

  return errors
}
