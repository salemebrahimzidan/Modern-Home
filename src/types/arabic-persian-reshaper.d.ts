declare module 'arabic-persian-reshaper' {
  interface ArabicShaperApi {
    convertArabic(text: string): string
  }

  const reshaper: {
    ArabicShaper: ArabicShaperApi
  }

  export default reshaper
}
