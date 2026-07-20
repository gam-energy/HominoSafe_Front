// سنسورهای مختلف خانه هوشمند سالمندان
export type SmartSensorType =
  | 'motion'          // سنسور حرکت
  | 'presence'        // حضور/عدم حضور
  | 'door'            // باز/بسته شدن درب
  | 'bed'             // در بستر بودن/نبودن
  | 'location'        // موقعیت داخل خانه
  | 'fall_detector'   // تشخیص احتمالی سقوط
  | 'activity_pattern'; // تغییر در الگوی فعالیت روزانه


// شدت هشدار
export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';


// داده‌ی مرتبط با سنسور
export interface SensorReading {
  sensor_id: string;
  sensor_type: SmartSensorType;
  value: any;          // مقدار خوانده‌شده (برای هر سنسور متفاوت)
  timestamp: string;
}


// انواع الگوهای هشدار (Behaviors)
export type BehaviorAlertType =
  | 'no_activity'               // عدم فعالیت طولانی
  | 'night_activity'            // فعالیت غیرمعمول در شب
  | 'long_bed_stay'             // مدت طولانی در تخت
  | 'unexpected_exit'           // خروج غیرمعمول از خانه
  | 'possible_fall'             // احتمال سقوط
  | 'routine_change'            // تغییر در روند روزانه
  | 'sensor_event';             // رویداد مستقیم سنسور (مثلاً باز شدن درب)


// داده‌ی تخصصی هشدار
export interface AlertDetails {
  duration?: number;           // مدت زمان وضعیت
  confidence?: number;         // میزان اطمینان
  pattern_name?: string;       // نام الگوی رفتاری (در صورت وجود)
  sensor_readings?: SensorReading[];  // داده‌ی سنسورها
}


// ساختار جدید Alert
export interface AlertData {
  sensor: any;
  id: string;
  alert_type: BehaviorAlertType;
  message: string;

  severity: AlertSeverity;
  timestamp: string;

  location?: string;
  read?: boolean;

  related_sensors?: SmartSensorType[];  // کدام سنسورها درگیر بودند
  details?: AlertDetails;               // داده‌ی تخصصی هشدار

  // برای سازگاری با ساختار قدیمی UI اگر لازم شود
  sensor_icon?: React.ReactNode;
}
