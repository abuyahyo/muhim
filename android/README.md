# Муҳим — Android vidjetlar

Uy ekranida ko'rinadigan **glassmorphism uslubidagi** namoz vaqtlari vidjetlari.
Web-saytdagi `vaqtlar/prayer.js` algoritmi (PrayTimes.org, MWL + Hanafiy Asr)
Java'ga ko'chirilgan — vaqtlar to'liq oflayn hisoblanadi.

## Vidjetlar (4 xil)
| Vidjet | O'lcham | Mazmun |
|---|---|---|
| Намоз вақтлари | 4×2 | 6 vaqt to'liq panelda, keyingisi ko'k |
| Намоз вақтлари (лента) | 4×1 | 6 vaqt bitta qatorda |
| Кейинги намоз | 2×1 | Faqat keyingi namoz — katta soat |
| Сана ва намоз | 2×2 | Sana + joy + keyingi namoz |

Glass uslub: yarim shaffof qatlamli fon, yorug'lik gradienti, nozik oq chegara,
katta radiusli burchaklar. Haqiqiy blur Android RemoteViews'da mavjud emas —
wallpaper ustida muzlatilgan shisha effekti beradi.

## Umumiy
- Har 30 daqiqada + sana/soat o'zgarganda avtomatik yangilanadi
- Bosilganda web-saytning Вақтлар bo'limi ochiladi
- v1.1: joy qat'iy — Тошкент (41.2995, 69.2401)

## Build
GitHub Actions (`android.yml`) har push'da APK yasaydi —
repo → Actions → android → Artifacts → `muhim-widget-apk`.

Lokal build: `gradle -p android assembleDebug`

## O'rnatish
`app-debug.apk` ni telefonda ochib o'rnatish (noma'lum manbalarga ruxsat kerak bo'lishi mumkin).
Vidjet qo'yish: uy ekranida bo'sh joyni bosib turib → Widgets → Муҳим виджет.

## Kelajak uchun
- Shahar tanlash (config activity)
- Release signing (keystore)
- Hijriy sana vidjeti
- Rang mavzularini tanlash
