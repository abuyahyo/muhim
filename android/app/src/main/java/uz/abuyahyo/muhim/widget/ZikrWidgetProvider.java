package uz.abuyahyo.muhim.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

import java.util.Locale;

// 2x2 glass — zikr hisoblagich (Sajda uslubi): bosganda sanaydi.
// 33 Субҳаналлоҳ + 33 Алҳамдулиллоҳ + 34 Аллоҳу акбар = 100, so'ng yangi davra.
// ↺ tugma — nolga qaytarish.

public class ZikrWidgetProvider extends BaseGlassWidgetProvider {

    static final String ACTION_TAP = "uz.abuyahyo.muhim.widget.ZIKR_TAP";
    static final String ACTION_RESET = "uz.abuyahyo.muhim.widget.ZIKR_RESET";
    private static final int[] DHIKR_LABELS = {
            R.string.dhikr_1, R.string.dhikr_2, R.string.dhikr_3
    };
    private static final int[] CYCLE_SIZE = { 33, 33, 34 };

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            boolean light = WidgetPrefs.isLight(context, id);
            int total = WidgetPrefs.zikrCount(context, id);

            int cycle = Math.min(total / 33, 2);
            int inCycle = total - (cycle == 2 ? 66 : cycle * 33);
            String count = String.format(Locale.US, "%02d/%d",
                    inCycle + 1, CYCLE_SIZE[cycle]);

            RemoteViews rv = new RemoteViews(context.getPackageName(), R.layout.widget_zikr);
            rv.setInt(R.id.widget_root, "setBackgroundResource", bgRes(light));
            rv.setTextViewText(R.id.zk_name, context.getString(DHIKR_LABELS[cycle]));
            rv.setTextViewText(R.id.zk_count, count);
            rv.setTextViewText(R.id.zk_round, context.getString(R.string.dhikr_round,
                    (total / 100) + 1));
            rv.setTextColor(R.id.zk_name, accent(light));
            rv.setTextColor(R.id.zk_count, ink(light));
            rv.setTextColor(R.id.zk_round, mute(light));
            rv.setTextColor(R.id.zk_reset, mute(light));
            rv.setOnClickPendingIntent(R.id.widget_root,
                    actionIntent(context, ACTION_TAP, id, id));
            rv.setOnClickPendingIntent(R.id.zk_reset,
                    actionIntent(context, ACTION_RESET, id, 100000 + id));
            manager.updateAppWidget(id, rv);
        }
    }

    private PendingIntent actionIntent(Context context, String action, int appWidgetId, int req) {
        Intent i = new Intent(context, ZikrWidgetProvider.class)
                .setAction(action)
                .putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        return PendingIntent.getBroadcast(context, req, i,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (!ACTION_TAP.equals(action) && !ACTION_RESET.equals(action)) return;

        int id = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID,
                AppWidgetManager.INVALID_APPWIDGET_ID);
        if (id == AppWidgetManager.INVALID_APPWIDGET_ID) return;

        int total = WidgetPrefs.zikrCount(context, id);
        if (ACTION_RESET.equals(action)) {
            total = 0;
        } else {
            total = (total + 1) % 100;
        }
        WidgetPrefs.saveZikr(context, id, total);

        AppWidgetManager mgr = AppWidgetManager.getInstance(context);
        onUpdate(context, mgr, new int[] { id });
    }

    @Override
    public void onDeleted(Context context, int[] appWidgetIds) {
        super.onDeleted(context, appWidgetIds);
        for (int id : appWidgetIds) {
            WidgetPrefs.deleteZikr(context, id);
        }
    }

    static ComponentName component(Context context) {
        return new ComponentName(context, ZikrWidgetProvider.class);
    }
}
