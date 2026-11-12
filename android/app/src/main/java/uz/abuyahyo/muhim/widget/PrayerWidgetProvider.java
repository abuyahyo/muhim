package uz.abuyahyo.muhim.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

import java.util.Calendar;

// Uy ekranidagi namoz vaqtlari vidjeti.
// Har soatda, sana/soz o'zgarganda va qurilma qayta yuklanganda yangilanadi.
// Bosilganda web-saytning Вақтлар bo'limi ochiladi. v1: joy — Тошкент (fixed).

public class PrayerWidgetProvider extends AppWidgetProvider {

    private static final double LAT = 41.2995;
    private static final double LON = 69.2401;
    private static final String CITY = "Тошкент";
    private static final String SITE_URL = "https://abuyahyo.github.io/muhim/vaqtlar/";

    private static final int[] NAME_IDS = {
            R.id.name_fajr, R.id.name_sunrise, R.id.name_dhuhr,
            R.id.name_asr, R.id.name_maghrib, R.id.name_isha
    };
    private static final int[] TIME_IDS = {
            R.id.time_fajr, R.id.time_sunrise, R.id.time_dhuhr,
            R.id.time_asr, R.id.time_maghrib, R.id.time_isha
    };

    private static final String[] MONTHS = {
            "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
            "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    };
    private static final String[] DAYS = {
            "Якшанба", "Душанба", "Сешанба", "Чоршанба", "Пайшанба", "Жума", "Шанба"
    };

    private static final int COLOR_INK = 0xFFF8FAFC;
    private static final int COLOR_MUTE = 0xFF94A3B8;
    private static final int COLOR_ACCENT = 0xFF7DD3FC;

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        Calendar now = Calendar.getInstance();
        PrayerCalculator.Times t = PrayerCalculator.calculate(now, LAT, LON);
        double[] values = { t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha };

        double nowH = now.get(Calendar.HOUR_OF_DAY)
                + now.get(Calendar.MINUTE) / 60.0
                + now.get(Calendar.SECOND) / 3600.0;
        int nextIndex = -1;
        for (int i = 0; i < values.length; i++) {
            if (!Double.isNaN(values[i]) && values[i] > nowH) { nextIndex = i; break; }
        }

        String date = DAYS[now.get(Calendar.DAY_OF_WEEK) - 1] + ", "
                + now.get(Calendar.DAY_OF_MONTH) + " "
                + MONTHS[now.get(Calendar.MONTH)];

        PendingIntent pi = PendingIntent.getActivity(
                context, 0,
                new Intent(Intent.ACTION_VIEW, Uri.parse(SITE_URL)),
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        for (int id : appWidgetIds) {
            RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.prayer_widget);
            rv.setTextViewText(R.id.title_city, CITY);
            rv.setTextViewText(R.id.title_date, date);
            for (int i = 0; i < values.length; i++) {
                rv.setTextViewText(TIME_IDS[i], PrayerCalculator.format(values[i]));
                int color = (i == nextIndex) ? COLOR_ACCENT : COLOR_INK;
                rv.setTextColor(TIME_IDS[i], color);
                rv.setTextColor(NAME_IDS[i], (i == nextIndex) ? COLOR_ACCENT : COLOR_MUTE);
            }
            rv.setOnClickPendingIntent(R.id.widget_root, pi);
            manager.updateAppWidget(id, rv);
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
