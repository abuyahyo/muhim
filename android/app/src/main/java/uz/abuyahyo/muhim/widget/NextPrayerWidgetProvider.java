package uz.abuyahyo.muhim.widget;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.os.Build;
import android.view.View;
import android.widget.RemoteViews;

import java.util.Calendar;

// 2x1 glass — keyingi namoz: nom + katta soat.
// Bugungi vaqt hammasi o'tgan bo'lsa — ertangi Бомдод.

public class NextPrayerWidgetProvider extends BaseGlassWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        Calendar now = Calendar.getInstance();
        String[] names = prayerNames(context);

        for (int id : appWidgetIds) {
            double lat = WidgetPrefs.lat(context, id);
            double lon = WidgetPrefs.lon(context, id);
            double[] values = timesArray(times(context, id, now, lat, lon));
            int next = nextIndex(values, nowHour(now));
            boolean light = WidgetPrefs.isLight(context, id);

            String name;
            double time;
            if (next >= 0) {
                name = names[next];
                time = values[next];
            } else {
                Calendar tomorrow = (Calendar) now.clone();
                tomorrow.add(Calendar.DAY_OF_MONTH, 1);
                time = times(context, id, tomorrow, lat, lon).fajr;
                name = names[0];
            }

            RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_next_prayer);
            applyBackground(context, rv, id, light);
            rv.setTextViewText(R.id.np_name, name);
            rv.setTextViewText(R.id.np_time, PrayerCalculator.format(time));
            rv.setTextColor(R.id.np_name, mute(light));
            rv.setTextColor(R.id.np_time, mute(light));

            // Jonli countdown — Sajda uslubi (API 24+; Chronometer o'zi tiksaydi).
            double remainingH = (time - nowHour(now) + 24.0) % 24.0;
            long remainingMs = (long) (remainingH * 3600000.0);
            if (Build.VERSION.SDK_INT >= 24) {
                rv.setViewVisibility(R.id.np_countdown, View.VISIBLE);
                rv.setChronometer(R.id.np_countdown,
                        android.os.SystemClock.elapsedRealtime() + remainingMs, null, true);
                rv.setChronometerCountDown(R.id.np_countdown, true);
                rv.setTextColor(R.id.np_countdown, ink(light));
            } else {
                rv.setViewVisibility(R.id.np_countdown, View.GONE);
            }

            rv.setOnClickPendingIntent(R.id.widget_root, siteIntent(context));
            manager.updateAppWidget(id, rv);
        }
    }
}
