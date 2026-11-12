package uz.abuyahyo.muhim.widget;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import java.util.Calendar;

// 2x2 glass — sana (katta kun raqami) + joy + keyingi namoz.

public class DateWidgetProvider extends BaseGlassWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        Calendar now = Calendar.getInstance();
        double[] values = timesArray(PrayerCalculator.calculate(now, LAT, LON));
        int next = nextIndex(values, nowHour(now));

        String nextText;
        if (next >= 0) {
            nextText = PRAYER_NAMES[next] + " · " + PrayerCalculator.format(values[next]);
        } else {
            Calendar tomorrow = (Calendar) now.clone();
            tomorrow.add(Calendar.DAY_OF_MONTH, 1);
            nextText = PRAYER_NAMES[0] + " · " + PrayerCalculator.format(PrayerCalculator.calculate(tomorrow, LAT, LON).fajr);
        }

        for (int id : appWidgetIds) {
            RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_date);
            rv.setTextViewText(R.id.dt_weekday, DAYS[now.get(Calendar.DAY_OF_WEEK) - 1]);
            rv.setTextViewText(R.id.dt_day, String.valueOf(now.get(Calendar.DAY_OF_MONTH)));
            rv.setTextViewText(R.id.dt_month, MONTHS[now.get(Calendar.MONTH)]);
            rv.setTextViewText(R.id.dt_city, CITY);
            rv.setTextViewText(R.id.dt_next, nextText);
            rv.setOnClickPendingIntent(R.id.widget_root, siteIntent(context));
            manager.updateAppWidget(id, rv);
        }
    }
}
