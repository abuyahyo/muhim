# Муҳим — Android vidjetlar

Uy ekranida ko'rinadigan **glassmorphism uslubidagi** namoz vaqtlari vidjetlari.
Web-saytdagi `vaqtlar/prayer.js` algoritmi (PrayTimes.org, MWL + Hanafiy Asr)
va `kunlar/hijri.js` ҳижрий algoritmi Java'ga ko'chirilgan — hammasi to'liq oflayn.

## Vidjetlar (5 xil)
| Vidjet | O'lcham | Mazmun |
|---|---|---|
| Намоз вақтлари | 4×2 | 6 vaqt to'liq panelda, keyingisi ko'k |
| Намоз вақтлари (лента) | 4×1 | 6 vaqt bitta qatorda |
| Кейинги намоз | 2×1 | Faqat keyingi namoz — katta soat |
| Сана ва намоз | 2×2 | Sana + ҳижрий + joy + keyingi namoz |
| Ҳижрий сана | 2×2 | Ҳижрий kun/oy/yil + keyingi namoz |

Glass uslub: yarim shaffof qatlamli fon, yorug'lik gradienti, nozik oq chegara,
katta radiusli burchaklar. Haqiqiy blur Android RemoteViews'da mavjud emas —
wallpaper ustida muzlatilgan shisha effekti beradi.

## Sozlash
Vidjetni uy ekraniga qo'shganda **sozlash oynasi** ochiladi:
- **Shahar** — 16 O'zbekiston shahri + Мекка/Мадина (oflayn ro'yxat, koordinatalar bilan)
- **Shisha rangi** — Қорамой yoki Оқ

Har bir vidjet o'z sozlamasini alohida eslab qoladi. Vidjetni o'chirganda
sozlamalar ham tozalanadi.

## Umumiy
- Har 30 daqiqada + sana/soat o'zgarganda avtomatik yangilanadi
- Bosilganda web-saytning Вақтлар bo'limi ochiladi

## Build
GitHub Actions (`android.yml`) har push'da APK yasaydi —
repo → Actions → android → Artifacts → `muhim-widget-apk`.

Lokal build: `gradle -p android assembleDebug`

### Release imzolash (ixtiyoriy)
CI'da release APK'ni imzolash uchun repo Secrets'ga qo'shing:
- `APK_KEYSTORE_BASE64` — keystore (.jks) faylining base64 (`base64 -w0 muhim.jks`)
- `APK_KEYSTORE_PASSWORD`, `APK_KEY_ALIAS`, `APK_KEY_PASSWORD`

Bu o'zgaruvchilar bo'lmasa — imzosiz (unsigned) release build chiqadi.

Keystore yaratish (bir marta, Java bor mashinada):
`keytool -genkeypair -v -keystore muhim.jks -alias muhim -keyalg RSA -keysize 2048 -validity 10000`

## O'rnatish
`app-debug.apk` ni telefonda ochib o'rnatish (noma'lum manbalarga ruxsat kerak bo'lishi mumkin).
Vidjet qo'yish: uy ekranida bo'sh joyni bosib turib → Widgets → Муҳим виджет.

## Kelajak uchun
- Shaharning aniqroq ro'yxati / GPS asosida joylashuv
- Tahajjud oynasi vidjeti
