package uz.abuyahyo.muhim.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;

import java.util.Calendar;
import java.util.Locale;
import android.content.res.Configuration;

// Barcha glass vidjetlar uchun umumiy asos: joy, ranglar, soat o'zgarganda
// yangilash va umumiy yordamchi hisoblar. Matnlar resurslardan olinadi
// (o'zbek/rus/ingliz).

abstract class BaseGlassWidgetProvider extends AppWidgetProvider {

    static final String SITE_URL = "https://abuyahyo.github.io/muhim/vaqtlar/";

    static final int COLOR_INK = 0xFFF8FAFC;
    static final int COLOR_MUTE = 0xFF94A3B8;
    static final int COLOR_ACCENT = 0xFF7DD3FC;
    static final int COLOR_DIM = 0xB3FFFFFF;
    static final int COLOR_WHITE = 0xFFFFFFFF;

    // Оқ mavzu uchun to'q matn ranglari.
    static final int COLOR_INK_LIGHT = 0xFF0F172A;
    static final int COLOR_MUTE_LIGHT = 0xFF64748B;
    static final int COLOR_ACCENT_LIGHT = 0xFF0369A1;

    // Tanlangan til bo'yicha resurslar konteksti ("system" — telefon tili).
    static Context localizedContext(Context c) {
        String lang = WidgetPrefs.language(c);
        if ("system".equals(lang)) return c;
        Locale locale = new Locale(lang);
        Configuration config = new Configuration(c.getResources().getConfiguration());
        config.setLocale(locale);
        return c.createConfigurationContext(config);
    }

    static String[] prayerNames(Context c) {
        return localizedContext(c).getResources().getStringArray(R.array.prayer_names);
    }

    static String[] months(Context c) {
        return localizedContext(c).getResources().getStringArray(R.array.greg_months);
    }

    static String[] days(Context c) {
        return localizedContext(c).getResources().getStringArray(R.array.weekdays);
    }

    static String[] hijriMonths(Context c) {
        return localizedContext(c).getResources().getStringArray(R.array.hijri_months);
    }

    static int bgRes(boolean light) {
        return light ? R.drawable.glass_bg_light : R.drawable.glass_bg;
    }

    // Fon: "glass" — standart shisha drawable, "solid"/"gradient" — foydalanuvchi
    // ranglari bilan bitmap (burchaklar + nozik chegara saqlanadi).
    static void applyBackground(Context c, RemoteViews rv, int appWidgetId, boolean light) {
        String style = WidgetPrefs.bgStyle(c, appWidgetId);
        if ("glass".equals(style)) {
            rv.setImageViewResource(R.id.bg_layer, bgRes(light));
            return;
        }
        int c1 = WidgetPrefs.color1(c, appWidgetId, light);
        int c2 = WidgetPrefs.color2(c, appWidgetId, light);
        rv.setImageViewBitmap(R.id.bg_layer, backgroundBitmap(c, style, c1, c2));
    }

    private static android.graphics.Bitmap backgroundBitmap(Context c, String style,
                                                            int c1, int c2) {
        float density = c.getResources().getDisplayMetrics().density;
        int w = Math.round(320 * density);
        int h = Math.round(200 * density);
        android.graphics.Bitmap bmp = android.graphics.Bitmap
                .createBitmap(w, h, android.graphics.Bitmap.Config.ARGB_8888);
        android.graphics.Canvas canvas = new android.graphics.Canvas(bmp);
        float radius = 22 * density;

        android.graphics.Paint fill = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
        if ("gradient".equals(style)) {
            fill.setShader(new android.graphics.LinearGradient(
                    0, 0, w * 0.6f, h, c1, c2, android.graphics.Shader.TileMode.CLAMP));
        } else {
            fill.setColor(c1);
        }
        android.graphics.RectF rect = new android.graphics.RectF(0, 0, w, h);
        canvas.drawRoundRect(rect, radius, radius, fill);

        android.graphics.Paint sheen = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
        sheen.setShader(new android.graphics.LinearGradient(
                0, 0, 0, h, 0x24FFFFFF, 0x08FFFFFF, android.graphics.Shader.TileMode.CLAMP));
        canvas.drawRoundRect(rect, radius, radius, sheen);

        android.graphics.Paint border = new android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG);
        border.setStyle(android.graphics.Paint.Style.STROKE);
        border.setStrokeWidth(1 * density);
        border.setColor(0x26FFFFFF);
        canvas.drawRoundRect(rect, radius, radius, border);
        return bmp;
    }

    static int ink(boolean light) {
        return light ? COLOR_INK_LIGHT : COLOR_INK;
    }

    static int mute(boolean light) {
        return light ? COLOR_MUTE_LIGHT : COLOR_MUTE;
    }

    static int accent(boolean light) {
        return light ? COLOR_ACCENT_LIGHT : COLOR_ACCENT;
    }

    static double nowHour(Calendar c) {
        return c.get(Calendar.HOUR_OF_DAY)
                + c.get(Calendar.MINUTE) / 60.0
                + c.get(Calendar.SECOND) / 3600.0;
    }

    // Bugungi 6 vaqt orasidan hozirgidan keyingi birinchisi. -1 — hammasi o'tgan.
    static int nextIndex(double[] values, double nowH) {
        for (int i = 0; i < values.length; i++) {
            if (!Double.isNaN(values[i]) && values[i] > nowH) return i;
        }
        return -1;
    }

    static double[] timesArray(PrayerCalculator.Times t) {
        return new double[] { t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha };
    }

    // Vidjetning shahri va usul sozlamalari bilan hisoblash.
    static PrayerCalculator.Times times(Context c, int appWidgetId, Calendar date,
                                        double lat, double lon) {
        return PrayerCalculator.calculate(date, lat, lon, WidgetPrefs.opts(c, appWidgetId));
    }

    // Таҳажжуд ойнаси — кечанинг учдан бири (maghrib -> fajr orasida).
    // {start, end} soatlarda; hozir tunda bo'lsa kechagi maghrib -> bugungi fajr,
    // aks holda bugungi maghrib -> ertangi fajr. null — hisoblanmadi.
    static double[] tahajjudWindow(Context c, int appWidgetId, Calendar now,
                                   double lat, double lon) {
        PrayerCalculator.Times today = times(c, appWidgetId, now, lat, lon);
        if (Double.isNaN(today.fajr) || Double.isNaN(today.maghrib)) return null;
        double maghrib;
        double fajr;
        if (nowHour(now) < today.fajr) {
            Calendar yesterday = (Calendar) now.clone();
            yesterday.add(Calendar.DAY_OF_MONTH, -1);
            maghrib = times(c, appWidgetId, yesterday, lat, lon).maghrib;
            fajr = today.fajr;
        } else {
            Calendar tomorrow = (Calendar) now.clone();
            tomorrow.add(Calendar.DAY_OF_MONTH, 1);
            maghrib = today.maghrib;
            fajr = times(c, appWidgetId, tomorrow, lat, lon).fajr;
        }
        if (Double.isNaN(maghrib) || Double.isNaN(fajr)) return null;
        double night = (fajr + 24 - maghrib) % 24;
        double start = (maghrib + night * 2.0 / 3.0) % 24;
        return new double[] { start, fajr };
    }

    static PendingIntent siteIntent(Context context) {
        return PendingIntent.getActivity(
                context, 0,
                new Intent(context, MainActivity.class),
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    @Override
    public void onDeleted(Context context, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            WidgetPrefs.delete(context, id);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        boolean clockChanged =
                "android.intent.action.TIMEZONE_CHANGED".equals(action)
                        || "android.intent.action.TIME_SET".equals(action)
                        || "android.intent.action.DATE_CHANGED".equals(action);
        if (clockChanged) {
            AppWidgetManager mgr = AppWidgetManager.getInstance(context);
            onUpdate(context, mgr, mgr.getAppWidgetIds(new ComponentName(context, getClass())));
        }
    }
}
