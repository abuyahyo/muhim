package uz.abuyahyo.muhim.widget;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import java.util.Calendar;

// 2x2 glass — ҳижрий сана (katta kun raqami) + keyingi namoz.

public class HijriWidgetProvider extends BaseGlassWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        Calendar now = Calendar.getInstance();
        String[] days = days(context);
        String[] names = prayerNames(context);
        String[] hijriMonths = hijriMonths(context);

        for (int id : appWidgetIds) {
            double lat = WidgetPrefs.lat(context, id);
            double lon = WidgetPrefs.lon(context, id);
            double[] values = timesArray(times(context, id, now, lat, lon));
            int next = nextIndex(values, nowHour(now));

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
            boolean light = WidgetPrefs.isLight(context, id);

            RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_hijri);
            rv.setInt(R.id.widget_root, "setBackgroundResource", bgRes(light));
            int ink = ink(light);
            int mute = mute(light);
            rv.setTextViewText(R.id.hj_weekday, days[now.get(Calendar.DAY_OF_WEEK) - 1]);
            rv.setTextViewText(R.id.hj_day, String.valueOf(h[0]));
            rv.setTextViewText(R.id.hj_month, hijriMonths[h[1] - 1]);
            rv.setTextViewText(R.id.hj_year, h[2] + " ҳижрий · " + WidgetPrefs.city(context, id));
            rv.setTextViewText(R.id.hj_next, nextText);
            rv.setTextColor(R.id.hj_weekday, mute);
            rv.setTextColor(R.id.hj_day, ink);
            rv.setTextColor(R.id.hj_month, accent(light));
            rv.setTextColor(R.id.hj_year, mute);
            rv.setTextColor(R.id.hj_next, accent(light));
            rv.setOnClickPendingIntent(R.id.widget_root, siteIntent(context));
            manager.updateAppWidget(id, rv);
        }
    }
}
