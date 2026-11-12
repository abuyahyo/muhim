package uz.abuyahyo.muhim.widget;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

import java.util.Calendar;

// 2x1 glass — Таҳажжуд ойнаси: кечанинг учдан бири (start — end).

public class TahajjudWidgetProvider extends BaseGlassWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        Calendar now = Calendar.getInstance();

        for (int id : appWidgetIds) {
            double lat = WidgetPrefs.lat(context, id);
            double lon = WidgetPrefs.lon(context, id);
            double[] win = tahajjudWindow(now, lat, lon);
            boolean light = WidgetPrefs.isLight(context, id);

            RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_tahajjud);
            rv.setInt(R.id.widget_root, "setBackgroundResource", bgRes(light));
            if (win != null) {
                rv.setTextViewText(R.id.tj_time,
                        PrayerCalculator.format(win[0]) + " — " + PrayerCalculator.format(win[1]));
            } else {
                rv.setTextViewText(R.id.tj_time, "--:--");
            }
            rv.setTextColor(R.id.tj_label, mute(light));
            rv.setTextColor(R.id.tj_time, ink(light));
            rv.setTextColor(R.id.tj_note, accent(light));
            rv.setOnClickPendingIntent(R.id.widget_root, siteIntent(context));
            manager.updateAppWidget(id, rv);
        }
    }
}
