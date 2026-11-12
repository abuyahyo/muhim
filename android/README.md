# Муҳим — Android vidjet

Uy ekranida ko'rinadigan namoz vaqtlari vidjeti. Web-saytdagi
`vaqtlar/prayer.js` algoritmi (PrayTimes.org, MWL + Hanafiy Asr) Java'ga
ko'chirilgan — vaqtlar to'liq oflayn hisoblanadi.

## Xususiyatlar
- 6 vaqt: Бомдод, Қуёш, Пешин, Аср, Шом, Хуфтон
- Keyingi vaqt ko'k rang bilan ajratiladi
- Har soatda va sana/soat o'zgarganda avtomatik yangilanadi
- Bosilganda web-saytning Вақтлар bo'limi ochiladi
- v1: joy qat'iy — Тошкент (41.2995, 69.2401)

## Build
GitHub Actions (`android.yml`) har push'da APK yasaydi —
repo → Actions → android → Artifacts → `muhim-widget-apk`.

Lokal build: `gradle -p android assembleDebug`

## O'rnatish
`app-debug.apk` ni telefonda ochib o'rnatish (noma'lum manbalarga ruxsat berish kerak bo'lishi mumkin).
Vidjetni qo'yish: uy ekranida bo'sh joyni bosib turib → Widgets → Муҳим виджет.

## Kelajak uchun
- Shahar tanlash (config activity)
- Release signing (keystore)
- Тахажжуд oynasi
