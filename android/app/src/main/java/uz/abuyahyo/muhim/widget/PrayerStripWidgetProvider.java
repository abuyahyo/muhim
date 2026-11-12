package uz.abuyahyo.muhim.widget;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import java.util.Calendar;

// 4x1 glass lenta — 6 vaqt bitta qatorda, keyingisi ko'k.

public class PrayerStripWidgetProvider extends BaseGlassWidgetProvider {

    private static final int[] NAME_IDS = {
            R.id.strip_name_fajr, R.id.strip_name_sunrise, R.id.strip_name_dhuhr,
            R.id.strip_name_asr, R.id.strip_name_maghrib, R.id.strip_name_isha
    };
    private static final int[] TIME_IDS = {
            R.id.strip_time_fajr, R.id.strip_time_sunrise, R.id.strip_time_dhuhr,
            R.id.strip_time_asr, R.id.strip_time_maghrib, R.id.strip_time_isha
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        Calendar now = Calendar.getInstance();

        for (int id : appWidgetIds) {
            double lat = WidgetPrefs.lat(context, id);
            double lon = WidgetPrefs.lon(context, id);
            double[] values = timesArray(times(context, id, now, lat, lon));
            int next = nextIndex(values, nowHour(now));
            boolean light = WidgetPrefs.isLight(context, id);
            int ink = ink(light);
            int mute = mute(light);
            int accent = accent(light);

            RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_strip);
            applyBackground(context, rv, id, light);
            for (int i = 0; i < values.length; i++) {
                rv.setTextViewText(TIME_IDS[i], PrayerCalculator.format(values[i]));
                boolean isNext = (i == next);
                rv.setTextColor(TIME_IDS[i], isNext ? accent : ink);
                rv.setTextColor(NAME_IDS[i], isNext ? accent : mute);
            }
            rv.setOnClickPendingIntent(R.id.widget_root, siteIntent(context));
            manager.updateAppWidget(id, rv);
        }
    }
}
