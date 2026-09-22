منابع بررسی‌شده:
- /home/ubuntu/pocket-budget_helper/docs/communication/sharing/DOCS.md (Expo SDK 54، expo-sharing)
- /home/ubuntu/pocket-budget_helper/docs/system/print/DOCS.md (Expo SDK 54، expo-print)
- /home/ubuntu/pocket-budget_helper/docs/storage/filesystem/DOCS.md (Expo SDK 54، expo-file-system)

نکات اجرایی: برای PDF از Print.printToFileAsync({ html }) استفاده می‌شود و URI بهتر است با expo-sharing و mimeType=application/pdf به اشتراک گذاشته شود. برای اشتراک فایل باید Sharing.isAvailableAsync() بررسی شود. اشتراک فایل محلی روی وب محدود است؛ روی Android/iOS از URI محلی استفاده می‌شود و در وب پیام راهنما یا printAsync مرورگر مناسب است. برای فایل ماندگار می‌توان URI موقت را به documentDirectory منتقل کرد؛ برای گزارش‌های قابل بازتولید cacheDirectory هم کافی است. منبع رسمی داخلی Expo SDK Documentation در مسیرهای بالا است.
