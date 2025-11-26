# Technolife Auto Code Transfer Extension

این افزونه Chrome به طور خودکار کد تایید را از صفحه time-tunnel به صفحه payment منتقل می‌کند.

## نصب و راه‌اندازی

1. فایل‌های افزونه را در یک پوشه قرار دهید
2. آیکون‌های لازم را اضافه کنید (icon16.png, icon48.png, icon128.png)
3. وارد `chrome://extensions` شوید
4. حالت Developer را فعال کنید
5. روی "Load unpacked" کلیک کنید
6. پوشه افزونه را انتخاب کنید

## تنظیمات مورد نیاز

### برای صفحه Time-Tunnel (`content-time-tunnel.js`):

در خط 24، سلکتور input کد تایید را جایگزین کنید:
```javascript
const codeInput = document.querySelector('input[name="REPLACE_WITH_ACTUAL_SELECTOR"]');
```

مثال‌های ممکن:
- `input[name="verification_code"]`
- `input[id="code"]`
- `input.verification-input`
- `#verification-code-input`

### برای صفحه Payment (`content-payment.js`):

1. در خط 20، سلکتور input کد تایید را جایگزین کنید:
```javascript
const codeInput = document.querySelector('input[name="REPLACE_WITH_PAYMENT_INPUT_SELECTOR"]');
```

2. در خط 38، سلکتور دکمه ثبت را جایگزین کنید:
```javascript
const submitButton = document.querySelector('button[type="submit"].REPLACE_WITH_SUBMIT_BUTTON_SELECTOR');
```

مثال‌های ممکن برای دکمه:
- `button[type="submit"]`
- `button.submit-code-btn`
- `#submit-verification-code`
- `button:contains("ثبت کد")`
- `input[type="submit"]`

## نحوه کار

1. افزونه هر 50 میلی‌ثانیه صفحه time-tunnel را چک می‌کند
2. وقتی کدی در input پیدا شود، فوراً به background script ارسال می‌شود
3. background script کد را به صفحه payment می‌فرستد
4. صفحه payment کد را در input وارد کرده و دکمه ثبت را کلیک می‌کند

## ویژگی‌های کلیدی

- ✅ Latency بسیار کم (50ms چک)
- ✅ کار با چند تب همزمان
- ✅ تشخیص خودکار صفحات
- ✅ نمایش وضعیت در popup
- ✅ عملکرد خودکار بدون نیاز به کلیک

## فایل‌های افزونه

- `manifest.json` - تنظیمات افزونه
- `background.js` - مدیریت ارتباط بین تب‌ها
- `content-time-tunnel.js` - اسکریپت صفحه time-tunnel
- `content-payment.js` - اسکریپت صفحه payment
- `popup.html` - رابط کاربری popup
- `popup.js` - منطق popup

## نکات مهم

- حتماً سلکتورها را با inspect element بررسی و تنظیم کنید
- اگر صفحه dynamic load می‌شود، ممکن است نیاز به MutationObserver باشد
- برای debugging، کنسول developer tools را باز کنید
