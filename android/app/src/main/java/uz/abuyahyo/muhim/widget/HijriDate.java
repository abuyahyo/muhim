package uz.abuyahyo.muhim.widget;

import java.util.Calendar;

// Milodiy -> ҳижрий sana konvertatsiyasi (kunlar/hijri.js'dagi tabulyar
// algoritmning aynan Java ko'chirmasi). Oy nomlari resurslarda
// (R.array.hijri_months).

final class HijriDate {

    private HijriDate() {
    }

    static int[] from(Calendar c) {
        // kunlar/hijri.js: mahalliy sana UTC tush vaqti sifatida olinadi —
        // shu tufayli kun davomida istalgan vaqtda bir xil JD chiqadi.
        Calendar noon = Calendar.getInstance(java.util.TimeZone.getTimeZone("UTC"));
        noon.clear();
        noon.set(c.get(Calendar.YEAR), c.get(Calendar.MONTH), c.get(Calendar.DAY_OF_MONTH), 12, 0, 0);
        long jd = noon.getTimeInMillis() / 86400000L + 2440588;

        long l = jd - 1948440 + 10632;
        long n = Math.floorDiv(l - 1, 10631);
        long l2 = l - 10631 * n + 354;
        long j = (long) Math.floor((10985 - l2) / 5316.0) * (long) Math.floor((50.0 * l2) / 17719)
                + (long) Math.floor(l2 / 5670.0) * (long) Math.floor((43.0 * l2) / 15238);
        long l3 = l2 - (long) Math.floor((30 - j) / 15.0) * (long) Math.floor((17719.0 * j) / 50)
                - (long) Math.floor(j / 16.0) * (long) Math.floor((15238.0 * j) / 43) + 29;
        int month = (int) Math.floor((24.0 * l3) / 709);
        int day = (int) (l3 - (long) Math.floor((709.0 * month) / 24));
        int year = (int) (30 * n + j - 30);
        return new int[] { day, month, year };
    }
}
