package uz.abuyahyo.muhim.widget;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import java.util.Calendar;

// 2x2 glass — sana (katta kun raqami) + ҳижрий + joy + keyingi namoz.

public class DateWidgetProvider extends BaseGlassWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        Calendar now = Calendar.getInstance();
        String[] days = days(context);
        String[] months = months(context);
        String[] names = prayerNames(context);
        String[] hijriMonths = hijriMonths(context);

        for (int id : appWidgetIds) {
            double lat = WidgetPrefs.lat(context, id);
            double lon = WidgetPrefs.lon(context, id);
            double[] values = timesArray(times(context, id, now, lat, lon));
            int next = nextIndex(values, nowHour(now));
            boolean light = WidgetPrefs.isLight(context, id);
            int ink = ink(light);
            int mute = mute(light);
            int accent = accent(light);

            String nextText;
            if (next >= 0) {
                nextText = names[next] + " · " + PrayerCalculator.format(values[next]);
            } else {
                Calendar tomorrow = (Calendar) now.clone();
                tomorrow.add(Calendar.DAY_OF_MONTH, 1);
                nextText = names[0] + " · "
                        + PrayerCalculator.format(times(context, id, tomorrow, lat, lon).fajr);
            }

            int[] h = HijriDate.from(now);

            RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_date);
            rv.setInt(R.id.widget_root, "setBackgroundResource", bgRes(light));
            rv.setTextViewText(R.id.dt_weekday, days[now.get(Calendar.DAY_OF_WEEK) - 1]);
            rv.setTextViewText(R.id.dt_day, String.valueOf(now.get(Calendar.DAY_OF_MONTH)));
            rv.setTextViewText(R.id.dt_month, months[now.get(Calendar.MONTH)]
                    + " · " + h[0] + " " + hijriMonths[h[1] - 1]);
            rv.setTextViewText(R.id.dt_city, WidgetPrefs.city(context, id));
            rv.setTextViewText(R.id.dt_next, nextText);
            rv.setTextColor(R.id.dt_weekday, mute);
            rv.setTextColor(R.id.dt_day, ink);
            rv.setTextColor(R.id.dt_month, accent);
            rv.setTextColor(R.id.dt_city, mute);
            rv.setTextColor(R.id.dt_next, accent);
            rv.setOnClickPendingIntent(R.id.widget_root, siteIntent(context));
            manager.updateAppWidget(id, rv);
        }
    }
}
