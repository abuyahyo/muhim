package uz.abuyahyo.muhim.widget;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import java.util.Calendar;

// 4x2 glass panel — 6 vaqt to'liq grid.

public class PrayerWidgetProvider extends BaseGlassWidgetProvider {

    private static final int[] NAME_IDS = {
            R.id.name_fajr, R.id.name_sunrise, R.id.name_dhuhr,
            R.id.name_asr, R.id.name_maghrib, R.id.name_isha
    };
    private static final int[] TIME_IDS = {
            R.id.time_fajr, R.id.time_sunrise, R.id.time_dhuhr,
            R.id.time_asr, R.id.time_maghrib, R.id.time_isha
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        Calendar now = Calendar.getInstance();
        String date = DAYS[now.get(Calendar.DAY_OF_WEEK) - 1] + ", "
                + now.get(Calendar.DAY_OF_MONTH) + " " + MONTHS[now.get(Calendar.MONTH)];

        for (int id : appWidgetIds) {
            double lat = WidgetPrefs.lat(context, id);
            double lon = WidgetPrefs.lon(context, id);
            double[] values = timesArray(PrayerCalculator.calculate(now, lat, lon));
            int next = nextIndex(values, nowHour(now));
            boolean light = WidgetPrefs.isLight(context, id);
            int ink = ink(light);
            int mute = mute(light);
            int accent = accent(light);

            RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.prayer_widget);
            rv.setInt(R.id.widget_root, "setBackgroundResource", bgRes(light));
            rv.setTextViewText(R.id.title_city, WidgetPrefs.city(context, id));
            rv.setTextViewText(R.id.title_date, date);
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
