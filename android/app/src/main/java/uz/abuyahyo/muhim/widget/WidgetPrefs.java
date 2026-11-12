package uz.abuyahyo.muhim.widget;

import android.content.Context;
import android.content.SharedPreferences;

// Har bir vidjet uchun alohida sozlamalar (shahar, mavzu).
// SharedPreferences'da vidjet id'si bilan saqlanadi.

final class WidgetPrefs {

    static final double DEFAULT_LAT = 41.2995;
    static final double DEFAULT_LON = 69.2401;

    private static final String PREFS = "muhim_widgets";
    private static final String THEME_DARK = "dark";
    private static final String THEME_LIGHT = "light";

    private WidgetPrefs() {
    }

    private static SharedPreferences prefs(Context context) {
        return context.getApplicationContext()
                .getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static double lat(Context context, int appWidgetId) {
        if (prefs(context).contains("lat_" + appWidgetId)) {
            return prefs(context).getFloat("lat_" + appWidgetId, (float) DEFAULT_LAT);
        }
        Double app = appLat(context);
        return app != null ? app : DEFAULT_LAT;
    }

    static double lon(Context context, int appWidgetId) {
        if (prefs(context).contains("lon_" + appWidgetId)) {
            return prefs(context).getFloat("lon_" + appWidgetId, (float) DEFAULT_LON);
        }
        Double app = appLon(context);
        return app != null ? app : DEFAULT_LON;
    }

    static String city(Context context, int appWidgetId) {
        String saved = prefs(context).getString("city_" + appWidgetId, null);
        if (saved != null) return saved;
        String app = prefs(context).getString("app_city", null);
        return app != null ? app
                : BaseGlassWidgetProvider.localizedContext(context)
                        .getString(R.string.widget_city_default);
    }

    // Ilova darajasidagi joylashuv — barcha vidjetlarning standarti.
    static Double appLat(Context context) {
        if (!prefs(context).contains("app_lat")) return null;
        return (double) prefs(context).getFloat("app_lat", (float) DEFAULT_LAT);
    }

    static Double appLon(Context context) {
        if (!prefs(context).contains("app_lon")) return null;
        return (double) prefs(context).getFloat("app_lon", (float) DEFAULT_LON);
    }

    static void saveAppLocation(Context context, double lat, double lon, String city) {
        prefs(context).edit()
                .putFloat("app_lat", (float) lat)
                .putFloat("app_lon", (float) lon)
                .putString("app_city", city)
                .apply();
    }

    // Til — butun ilova uchun (vidjetlar ham). "system" — telefon tili.
    static String language(Context context) {
        return prefs(context).getString("language", "system");
    }

    static void saveLanguage(Context context, String language) {
        prefs(context).edit().putString("language", language).apply();
    }

    static boolean isLight(Context context, int appWidgetId) {
        return THEME_LIGHT.equals(prefs(context).getString("theme_" + appWidgetId, THEME_DARK));
    }

    static String method(Context context, int appWidgetId) {
        return prefs(context).getString("method_" + appWidgetId, "MWL");
    }

    static boolean isShafi(Context context, int appWidgetId) {
        return prefs(context).getBoolean("shafi_" + appWidgetId, false);
    }

    static PrayerCalculator.Options opts(Context context, int appWidgetId) {
        PrayerCalculator.Options o;
        switch (method(context, appWidgetId)) {
            case "Egypt":   o = PrayerCalculator.Options.egypt(); break;
            case "Karachi": o = PrayerCalculator.Options.karachi(); break;
            case "Makkah":  o = PrayerCalculator.Options.makkah(); break;
            case "ISNA":    o = PrayerCalculator.Options.isna(); break;
            default:        o = PrayerCalculator.Options.mwl(); break;
        }
        return o.withMadhab(isShafi(context, appWidgetId));
    }

    static void save(Context context, int appWidgetId, double lat, double lon,
                     String city, boolean light, String method, boolean shafi) {
        prefs(context).edit()
                .putFloat("lat_" + appWidgetId, (float) lat)
                .putFloat("lon_" + appWidgetId, (float) lon)
                .putString("city_" + appWidgetId, city)
                .putString("theme_" + appWidgetId, light ? THEME_LIGHT : THEME_DARK)
                .putString("method_" + appWidgetId, method)
                .putBoolean("shafi_" + appWidgetId, shafi)
                .apply();
    }

    static void delete(Context context, int appWidgetId) {
        prefs(context).edit()
                .remove("lat_" + appWidgetId)
                .remove("lon_" + appWidgetId)
                .remove("city_" + appWidgetId)
                .remove("theme_" + appWidgetId)
                .remove("method_" + appWidgetId)
                .remove("shafi_" + appWidgetId)
                .apply();
    }
}
