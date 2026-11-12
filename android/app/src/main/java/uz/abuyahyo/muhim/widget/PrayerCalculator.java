package uz.abuyahyo.muhim.widget;

// Namoz vaqtlarini hisoblash — PrayTimes.org formulasi.
// Web-saytdagi vaqtlar/prayer.js algoritmining aynan Java ko'chirmasi:
// MWL usuli (Fajr 18°, Isha 17°), Hanafiy Asr faktori (soya = 2 balandlik).
// Barcha vaqtlar "fixed hour" (0..24) formatida qaytadi; NaN — hisoblab bo'lmaydi.

public final class PrayerCalculator {

    private PrayerCalculator() {}

    public static final class Times {
        public final double fajr;
        public final double sunrise;
        public final double dhuhr;
        public final double asr;
        public final double maghrib;
        public final double isha;

        Times(double fajr, double sunrise, double dhuhr, double asr, double maghrib, double isha) {
            this.fajr = fajr;
            this.sunrise = sunrise;
            this.dhuhr = dhuhr;
            this.asr = asr;
            this.maghrib = maghrib;
            this.isha = isha;
        }
    }

    private static final double FAJR_ANGLE = 18.0;
    private static final double ISHA_ANGLE = 17.0;
    private static final double SUNRISE_ANGLE = 0.833;
    private static final int ASR_FACTOR = 2; // Hanafiy

    private static double dToR(double d) { return d * Math.PI / 180.0; }
    private static double rToD(double r) { return r * 180.0 / Math.PI; }
    private static double sinD(double d) { return Math.sin(dToR(d)); }
    private static double cosD(double d) { return Math.cos(dToR(d)); }
    private static double tanD(double d) { return Math.tan(dToR(d)); }
    private static double asinD(double x) { return rToD(Math.asin(x)); }
    private static double acosD(double x) { return rToD(Math.acos(x)); }
    private static double atan2D(double y, double x) { return rToD(Math.atan2(y, x)); }
    private static double acotD(double x) { return rToD(Math.atan(1.0 / x)); }

    private static double fixHour(double h) {
        h -= 24.0 * Math.floor(h / 24.0);
        return h < 0 ? h + 24.0 : h;
    }

    private static double fixAngle(double a) {
        a -= 360.0 * Math.floor(a / 360.0);
        return a < 0 ? a + 360.0 : a;
    }

    // Yulian kun — Grigj sana uchun (UT 0h).
    private static double julianDay(int year, int month, int day) {
        if (month <= 2) { year -= 1; month += 12; }
        int a = year / 100;
        int b = 2 - a + a / 4;
        return Math.floor(365.25 * (year + 4716))
                + Math.floor(30.6001 * (month + 1))
                + day + b - 1524.5;
    }

    // Quyosh deklaratsiyasi va "equation of time" (soatlarda). {decl, eqt}
    private static double[] sunPosition(double jd) {
        double d = jd - 2451545.0;
        double g = fixAngle(357.529 + 0.98560028 * d);
        double q = fixAngle(280.459 + 0.98564736 * d);
        double l = fixAngle(q + 1.915 * sinD(g) + 0.020 * sinD(2 * g));
        double e = 23.439 - 0.00000036 * d;
        double ra = atan2D(cosD(e) * sinD(l), cosD(l)) / 15.0;
        double eqt = q / 15.0 - fixHour(ra);
        double decl = asinD(sinD(e) * sinD(l));
        return new double[] { decl, eqt };
    }

    // Quyosh gorizontaldan `angle` gradus pastda bo'lganidagi vaqt — tushdan farq (soat).
    // ccw — tushdan oldin (Fajr/Quyosh), cw — tushdan keyin (Asr/Shom/Isha). NaN — konvergensiya yo'q.
    private static double sunAngleTime(double angle, double lat, double decl, boolean ccw) {
        double cosT = (-sinD(angle) - sinD(lat) * sinD(decl)) / (cosD(lat) * cosD(decl));
        if (cosT < -1.0 || cosT > 1.0) return Double.NaN;
        double t = acosD(cosT) / 15.0;
        return ccw ? -t : t;
    }

    private static double asrTime(double lat, double decl) {
        double angle = -acotD(ASR_FACTOR + tanD(Math.abs(lat - decl)));
        return sunAngleTime(angle, lat, decl, false);
    }

    // date — mahalliy kalendar kuni (soat maydonlari e'tiborga olinmaydi).
    public static Times calculate(java.util.Calendar date, double lat, double lon) {
        long offsetMillis = date.get(java.util.Calendar.ZONE_OFFSET)
                + date.get(java.util.Calendar.DST_OFFSET);
        double tz = offsetMillis / 3600000.0;

        double jd = julianDay(
                date.get(java.util.Calendar.YEAR),
                date.get(java.util.Calendar.MONTH) + 1,
                date.get(java.util.Calendar.DAY_OF_MONTH));
        double[] sun = sunPosition(jd);
        double decl = sun[0];
        double eqt = sun[1];

        double dhuhr = 12.0 - eqt - lon / 15.0 + tz;
        double fajr = dhuhr + sunAngleTime(FAJR_ANGLE, lat, decl, true);
        double sunrise = dhuhr + sunAngleTime(SUNRISE_ANGLE, lat, decl, true);
        double asr = dhuhr + asrTime(lat, decl);
        double sunset = dhuhr + sunAngleTime(SUNRISE_ANGLE, lat, decl, false);
        double maghrib = sunset;
        double isha = dhuhr + sunAngleTime(ISHA_ANGLE, lat, decl, false);

        return new Times(fajr, sunrise, dhuhr, asr, maghrib, isha);
    }

    // Fixed hour (0..24) → "HH:mm". NaN → "--:--".
    public static String format(double h) {
        if (Double.isNaN(h)) return "--:--";
        h = fixHour(h);
        int hr = (int) Math.floor(h);
        int min = (int) Math.floor((h - hr) * 60.0);
        return String.format(java.util.Locale.US, "%02d:%02d", hr, min);
    }
}
