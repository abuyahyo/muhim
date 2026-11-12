package uz.abuyahyo.muhim.widget;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import java.util.Calendar;

// 2x1 glass — keyingi namoz: nom + katta soat.
// Bugungi vaqt hammasi o'tgan bo'lsa — ertangi Бомдод.

public class NextPrayerWidgetProvider extends BaseGlassWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        Calendar now = Calendar.getInstance();

        for (int id : appWidgetIds) {
            double lat = WidgetPrefs.lat(context, id);
            double lon = WidgetPrefs.lon(context, id);
            double[] values = timesArray(PrayerCalculator.calculate(now, lat, lon));
            int next = nextIndex(values, nowHour(now));
            boolean light = WidgetPrefs.isLight(context, id);

            String name;
            double time;
            if (next >= 0) {
                name = PRAYER_NAMES[next];
                time = values[next];
            } else {
                Calendar tomorrow = (Calendar) now.clone();
                tomorrow.add(Calendar.DAY_OF_MONTH, 1);
                time = PrayerCalculator.calculate(tomorrow, lat, lon).fajr;
                name = PRAYER_NAMES[0];
            }

            RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_next_prayer);
            rv.setInt(R.id.widget_root, "setBackgroundResource", bgRes(light));
            rv.setTextViewText(R.id.np_name, name);
            rv.setTextViewText(R.id.np_time, PrayerCalculator.format(time));
            rv.setTextColor(R.id.np_name, mute(light));
            rv.setTextColor(R.id.np_time, ink(light));
            rv.setOnClickPendingIntent(R.id.widget_root, siteIntent(context));
            manager.updateAppWidget(id, rv);
        }
    }
}
