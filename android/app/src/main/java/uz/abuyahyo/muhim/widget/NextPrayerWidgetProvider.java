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
        double[] values = timesArray(PrayerCalculator.calculate(now, LAT, LON));
        int next = nextIndex(values, nowHour(now));

        String name;
        double time;
        if (next >= 0) {
            name = PRAYER_NAMES[next];
            time = values[next];
        } else {
            Calendar tomorrow = (Calendar) now.clone();
            tomorrow.add(Calendar.DAY_OF_MONTH, 1);
            time = PrayerCalculator.calculate(tomorrow, LAT, LON).fajr;
            name = PRAYER_NAMES[0];
        }

        for (int id : appWidgetIds) {
            RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_next_prayer);
            rv.setTextViewText(R.id.np_name, name);
            rv.setTextViewText(R.id.np_time, PrayerCalculator.format(time));
            rv.setOnClickPendingIntent(R.id.widget_root, siteIntent(context));
            manager.updateAppWidget(id, rv);
        }
    }
}
