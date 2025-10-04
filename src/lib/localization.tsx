/**
 * Arabic Localization and Saudi-specific UI/UX improvements
 * Supports both Arabic and English with proper RTL handling
 */

import { createContext, useContext, useState, ReactNode } from 'react'

// Supported languages
export type Language = 'ar' | 'en'
export type Direction = 'rtl' | 'ltr'

interface LocalizationContextType {
  language: Language
  direction: Direction
  t: (key: string) => string
  setLanguage: (lang: Language) => void
}

// Arabic translations for NPHIES healthcare system
const translations = {
  ar: {
    // App Title
    'app.title': 'مساعد الرعاية الصحية',
    'app.subtitle': 'دعم التأمين الصحي على مدار الساعة',
    
    // Navigation
    'nav.chat': 'المحادثة',
    'nav.coverage': 'التغطية',
    'nav.claims': 'المطالبات',
    'nav.policies': 'الوثائق',
    'nav.enrollment': 'التسجيل',
    
    // Chat Interface
    'chat.title': 'مساعد نفيس',
    'chat.subtitle': 'دعم الرعاية الصحية المدعوم بالذكاء الاصطناعي',
    'chat.typing': 'يكتب...',
    'chat.online': 'متصل',
    'chat.placeholder': 'اسأل عن أهلية نفيس، التحقق من المطالبات، أو الامتثال...',
    'chat.welcome': 'مرحباً! أنا مساعد نفيس المحسن. أستطيع المساعدة في فحص الأهلية، التحقق من المطالبات، المساعدة في الترخيص المسبق، وإرشادات الامتثال. كيف يمكنني مساعدتك اليوم؟',
    
    // Quick Actions
    'action.eligibility': 'فحص أهلية المريض',
    'action.validate': 'التحقق من بيانات المطالبة',
    'action.preauth': 'طلب ترخيص مسبق',
    'action.status': 'حالة نظام نفيس',
    'action.diagnosis': 'التحقق من رموز التشخيص',
    
    // Claims Tracker
    'claims.title': 'متتبع المطالبات المحسن',
    'claims.subtitle': 'التحقق من المطالبات المدعوم بالذكاء الاصطناعي ومراقبة الامتثال لنفيس',
    'claims.search': 'البحث برقم المطالبة، مقدم الخدمة، أو نوع الخدمة...',
    'claims.details': 'تفاصيل المطالبة',
    'claims.select': 'اختر مطالبة لعرض تفاصيل التحقق بالذكاء الاصطناعي',
    'claims.validateAll': 'التحقق من الكل',
    'claims.overview': 'نظرة عامة على المطالبات',
    'claims.validation': 'التحقق بالذكاء الاصطناعي',
    'claims.insights': 'التحليلات',
    
    // Claim Status
    'status.submitted': 'مُرسل',
    'status.under_review': 'قيد المراجعة',
    'status.approved': 'مُعتمد',
    'status.paid': 'مدفوع',
    'status.denied': 'مرفوض',
    'status.appeal': 'استئناف',
    'status.ai_validating': 'التحقق بالذكاء الاصطناعي',
    'status.ready_for_nphies': 'جاهز لنفيس',
    
    // Financial Terms
    'financial.claimed': 'المبلغ المطالب به:',
    'financial.approved': 'المبلغ المعتمد:',
    'financial.responsibility': 'مسؤوليتك:',
    'financial.insurance_pays': 'يدفع التأمين:',
    'financial.service_date': 'تاريخ الخدمة:',
    'financial.provider': 'مقدم الخدمة:',
    'financial.amount': 'المبلغ:',
    'financial.score': 'نقاط الذكاء الاصطناعي:',
    
    // AI Validation
    'ai.score': 'نقاط التحقق بالذكاء الاصطناعي',
    'ai.insights': 'رؤى الذكاء الاصطناعي',
    'ai.readiness': 'جاهزية نفيس',
    'ai.validating': 'التحقق بالذكاء الاصطناعي جارٍ...',
    'ai.validated': 'تم التحقق بنفيس',
    'ai.summary': 'ملخص التحقق',
    'ai.actions': 'إجراءات الذكاء الاصطناعي',
    
    // NPHIES Status
    'nphies.title': 'حالة نفيس',
    'nphies.api': 'واجهة برمجة تطبيقات نفيس',
    'nphies.eligibility': 'خدمة الأهلية',
    'nphies.claims': 'خدمة المطالبات',
    'nphies.preauth': 'خدمة الترخيص المسبق',
    'nphies.online': 'متصل',
    'nphies.available': 'متاح',
    'nphies.maintenance': 'صيانة',
    'nphies.offline': 'غير متصل',
    
    // Recent Activity
    'activity.title': 'النشاط الأخير',
    'activity.pending_claims': 'المطالبات المعلقة',
    'activity.preauth_requests': 'طلبات الترخيص المسبق',
    'activity.validation_errors': 'أخطاء التحقق',
    'activity.last_check': 'آخر فحص أهلية',
    
    // Validation Errors
    'error.patient_id': 'تنسيق رقم الهوية الوطنية غير صحيح. يجب أن يكون 10 أرقام.',
    'error.insurance_id': 'تنسيق رقم وثيقة التأمين غير صحيح.',
    'error.provider_id': 'تنسيق رقم مقدم الخدمة غير صحيح. يجب أن يكون 7 أرقام.',
    'error.service_date': 'تاريخ الخدمة غير صحيح أو مفقود.',
    'error.diagnosis_code': 'رمز التشخيص غير صحيح. استخدم رموز ICD-10 الحالية.',
    'error.service_code': 'رمز الخدمة غير صحيح.',
    'error.network': 'لا يمكن الاتصال بخدمة نفيس. يرجى المحاولة مرة أخرى لاحقاً.',
    'error.timeout': 'انتهت مهلة الطلب. الخدمة تستغرق وقتاً أطول من المعتاد للاستجابة.',
    
    // Common Terms
    'common.loading': 'جارٍ التحميل...',
    'common.search': 'بحث',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.submit': 'إرسال',
    'common.edit': 'تعديل',
    'common.delete': 'حذف',
    'common.close': 'إغلاق',
    'common.back': 'رجوع',
    'common.next': 'التالي',
    'common.previous': 'السابق',
    'common.yes': 'نعم',
    'common.no': 'لا',
    'common.ok': 'موافق',
    'common.error': 'خطأ',
    'common.success': 'نجح',
    'common.warning': 'تحذير',
    'common.info': 'معلومات',
    'common.help': 'مساعدة',
    'common.settings': 'الإعدادات',
    'common.logout': 'تسجيل الخروج',
    'common.login': 'تسجيل الدخول',
    
    // Dates and Times
    'date.today': 'اليوم',
    'date.yesterday': 'أمس',
    'date.tomorrow': 'غداً',
    'date.this_week': 'هذا الأسبوع',
    'date.last_week': 'الأسبوع الماضي',
    'date.this_month': 'هذا الشهر',
    'date.last_month': 'الشهر الماضي',
    
    // Healthcare Specific Terms
    'health.patient': 'المريض',
    'health.provider': 'مقدم الخدمة',
    'health.hospital': 'المستشفى',
    'health.clinic': 'العيادة',
    'health.pharmacy': 'الصيدلية',
    'health.doctor': 'الطبيب',
    'health.nurse': 'الممرض/ة',
    'health.treatment': 'العلاج',
    'health.diagnosis': 'التشخيص',
    'health.prescription': 'الوصفة الطبية',
    'health.appointment': 'الموعد',
    'health.emergency': 'طوارئ',
    'health.insurance': 'التأمين الصحي',
    'health.coverage': 'التغطية',
    'health.copayment': 'المبلغ التكميلي',
    'health.deductible': 'المبلغ المحسوم',
    
    // Saudi Arabian Context
    'saudi.cchi': 'مجلس الضمان الصحي التعاوني',
    'saudi.nphies': 'المنصة الوطنية للمعلومات الصحية وتبادل الخدمات',
    'saudi.vision2030': 'رؤية السعودية 2030',
    'saudi.moh': 'وزارة الصحة',
    'saudi.national_id': 'رقم الهوية الوطنية',
    'saudi.iqama': 'رقم الإقامة',
    'saudi.riyal': 'ريال سعودي',
  },
  en: {
    // English translations (existing ones)
    'app.title': 'HealthCare Assistant',
    'app.subtitle': '24/7 Insurance Support',
    'nav.chat': 'Chat',
    'nav.coverage': 'Coverage',
    'nav.claims': 'Claims',
    'nav.policies': 'Policies',
    'nav.enrollment': 'Enroll',
    'chat.title': 'NPHIES Assistant',
    'chat.subtitle': 'AI-Powered Healthcare Support',
    'chat.typing': 'Typing...',
    'chat.online': 'Online',
    'chat.placeholder': 'Ask about NPHIES eligibility, claims validation, or compliance...',
    'chat.welcome': "Hello! I'm your enhanced NPHIES Healthcare Assistant. I can help with eligibility checks, claims validation, pre-authorization assistance, and NPHIES compliance guidance. How can I assist you today?",
    'action.eligibility': 'Check Patient Eligibility',
    'action.validate': 'Validate Claim Data',
    'action.preauth': 'Submit Pre-Authorization',
    'action.status': 'Check NPHIES Status',
    'action.diagnosis': 'Validate Diagnosis Codes',
    'claims.title': 'Enhanced Claims Tracker',
    'claims.subtitle': 'AI-powered claims validation and NPHIES compliance monitoring',
    'claims.search': 'Search by claim number, provider, or service type...',
    'claims.details': 'Claim Details',
    'claims.select': 'Select a claim to view AI validation details',
    'claims.validateAll': 'Validate All',
    'claims.overview': 'Claims Overview',
    'claims.validation': 'AI Validation',
    'claims.insights': 'Analytics',
    'status.submitted': 'Submitted',
    'status.under_review': 'Under Review',
    'status.approved': 'Approved',
    'status.paid': 'Paid',
    'status.denied': 'Denied',
    'status.appeal': 'Appeal',
    'status.ai_validating': 'AI Validating',
    'status.ready_for_nphies': 'Ready for NPHIES',
    // Add all other English translations here
    'financial.claimed': 'Amount Claimed:',
    'financial.approved': 'Amount Approved:',
    'financial.responsibility': 'Your Responsibility:',
    'financial.insurance_pays': 'Insurance Pays:',
    'ai.score': 'AI Validation Score',
    'ai.insights': 'AI Insights',
    'common.loading': 'Loading...',
    'common.search': 'Search',
    'common.save': 'Save',
    'common.submit': 'Submit',
    'error.network': 'Cannot connect to NPHIES service. Please try again later.',
    'error.timeout': 'Request timeout. The service is taking too long to respond.',
  }
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined)

interface LocalizationProviderProps {
  children: ReactNode
  defaultLanguage?: Language
}

export function LocalizationProvider({ children, defaultLanguage = 'en' }: LocalizationProviderProps) {
  const [language, setLanguage] = useState<Language>(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('healthcare-app-language')
    if (saved && (saved === 'ar' || saved === 'en')) {
      return saved as Language
    }
    
    // Check browser language
    const browserLang = navigator.language.toLowerCase()
    if (browserLang.startsWith('ar')) {
      return 'ar'
    }
    
    return defaultLanguage
  })

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr'

  const t = (key: string): string => {
    const langTranslations = translations[language]
    return (langTranslations as Record<string, string>)[key] || key
  }

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('healthcare-app-language', lang)
    
    // Update document direction and lang attribute
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }

  // Set initial document attributes
  document.documentElement.dir = direction
  document.documentElement.lang = language

  const value: LocalizationContextType = {
    language,
    direction,
    t,
    setLanguage: handleSetLanguage,
  }

  return (
    <LocalizationContext.Provider value={value}>
      <div dir={direction} className={`${direction === 'rtl' ? 'font-arabic' : 'font-latin'}`}>
        {children}
      </div>
    </LocalizationContext.Provider>
  )
}

export function useLocalization() {
  const context = useContext(LocalizationContext)
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider')
  }
  return context
}

// Language Switcher Component
export function LanguageSwitcher() {
  const { language, setLanguage } = useLocalization()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          language === 'en'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
      >
        English
      </button>
      <button
        onClick={() => setLanguage('ar')}
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          language === 'ar'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
      >
        العربية
      </button>
    </div>
  )
}

// RTL-aware component wrapper
interface RTLWrapperProps {
  children: ReactNode
  className?: string
}

export function RTLWrapper({ children, className = '' }: RTLWrapperProps) {
  const { direction } = useLocalization()
  
  return (
    <div 
      className={`${className} ${direction === 'rtl' ? 'rtl-layout' : 'ltr-layout'}`}
      dir={direction}
    >
      {children}
    </div>
  )
}

// Hook for formatted numbers (Saudi Riyal)
export function useFormatCurrency() {
  const { language } = useLocalization()
  
  return (amount: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(amount)
  }
}

// Hook for formatted dates (Arabic/English)
export function useFormatDate() {
  const { language } = useLocalization()
  
  return (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date'
    }
    
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    }
    
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-SA', defaultOptions).format(dateObj)
  }
}

// Saudi ID validation with proper error messages
export function validateSaudiID(id: string, language: Language): { isValid: boolean; error?: string } {
  if (!id || id.length !== 10) {
    return {
      isValid: false,
      error: language === 'ar' 
        ? 'رقم الهوية الوطنية يجب أن يكون 10 أرقام'
        : 'National ID must be 10 digits'
    }
  }
  
  if (!/^[0-9]{10}$/.test(id)) {
    return {
      isValid: false,
      error: language === 'ar'
        ? 'رقم الهوية الوطنية يجب أن يحتوي على أرقام فقط'
        : 'National ID must contain only numbers'
    }
  }
  
  // Saudi ID validation algorithm (simplified)
  const digits = id.split('').map(Number)
  let sum = 0
  
  for (let i = 0; i < 9; i++) {
    if (i % 2 === 0) {
      const doubled = digits[i] * 2
      sum += doubled > 9 ? doubled - 9 : doubled
    } else {
      sum += digits[i]
    }
  }
  
  const checkDigit = (10 - (sum % 10)) % 10
  
  if (checkDigit !== digits[9]) {
    return {
      isValid: false,
      error: language === 'ar'
        ? 'رقم الهوية الوطنية غير صحيح'
        : 'Invalid National ID number'
    }
  }
  
  return { isValid: true }
}

// Export default translations for direct use
export { translations }