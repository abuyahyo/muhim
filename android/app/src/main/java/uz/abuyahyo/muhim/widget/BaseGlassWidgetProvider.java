package uz.abuyahyo.muhim.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;

import java.util.Calendar;

// Barcha glass vidjetlar uchun umumiy asos: joy, ranglar, soat o'zgarganda
// yangilash va umumiy yordamchi hisoblar.

abstract class BaseGlassWidgetProvider extends AppWidgetProvider {

    static final double LAT = 41.2995;
    static final double LON = 69.2401;
    static final String CITY = "Тошкент";
    static final String SITE_URL = "https://abuyahyo.github.io/muhim/vaqtlar/";

    static final String[] MONTHS = {
            "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
            "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    };
    static final String[] DAYS = {
            "Якшанба", "Душанба", "Сешанба", "Чоршанба", "Пайшанба", "Жума", "Шанба"
    };
    static final String[] PRAYER_NAMES = {
            "Бомдод", "Қуёш", "Пешин", "Аср", "Шом", "Хуфтон"
    };

    static final int COLOR_INK = 0xFFF8FAFC;
    static final int COLOR_MUTE = 0xFF94A3B8;
    static final int COLOR_ACCENT = 0xFF7DD3FC;
    static final int COLOR_DIM = 0xB3FFFFFF;
    static final int COLOR_WHITE = 0xFFFFFFFF;

    // Оқ mavzu uchun to'q matn ranglari.
    static final int COLOR_INK_LIGHT = 0xFF0F172A;
    static final int COLOR_MUTE_LIGHT = 0xFF64748B;
    static final int COLOR_ACCENT_LIGHT = 0xFF0369A1;

    static int bgRes(boolean light) {
        return light ? R.drawable.glass_bg_light : R.drawable.glass_bg;
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

    static PendingIntent siteIntent(Context context) {
        return PendingIntent.getActivity(
                context, 0,
                new Intent(Intent.ACTION_VIEW, Uri.parse(SITE_URL)),
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
