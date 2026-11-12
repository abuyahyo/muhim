package uz.abuyahyo.muhim.widget;

import android.Manifest;
import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProviderInfo;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

// Vidjet sozlamalari: shahar va shisha mavzusi (қорамой/оқ).
// Launcher vidjetni qo'shganda android:configure orqali ochiladi.

public class WidgetConfigActivity extends Activity {

    private static final String[][] CITIES = {
            {"Тошкент", "41.2995", "69.2401"},
            {"Самарқанд", "39.6542", "66.9597"},
            {"Бухоро", "39.7747", "64.4286"},
            {"Наманган", "40.9983", "71.6726"},
            {"Андижон", "40.7821", "72.3442"},
            {"Фаргона", "40.3864", "71.7864"},
            {"Нукус", "42.4531", "59.6103"},
            {"Қарши", "38.8611", "65.7847"},
            {"Урганч", "41.5345", "60.6249"},
            {"Жиззах", "40.1158", "67.8422"},
            {"Термиз", "37.2242", "67.2783"},
            {"Навоий", "40.0844", "65.3792"},
            {"Гулистон", "40.4897", "68.7842"},
            {"Қўқон", "40.5286", "70.9425"},
            {"Марғилон", "40.4711", "71.7247"},
            {"Чирчиқ", "41.4719", "69.5819"},
            {"Шаҳрисабз", "39.0578", "66.8342"},
            {"Хива", "41.3775", "60.3639"},
            {"Бекобод", "40.2208", "69.2697"},
            {"Олмалиқ", "40.8500", "69.5950"},
            {"Денов", "38.2833", "67.9000"},
            {"Мекка", "21.4225", "39.8262"},
            {"Мадина", "24.4686", "39.6142"}
    };

    private static final int PERMISSION_LOCATION = 1;

    private int appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID;

    private String selectedCity;
    private double selectedLat;
    private double selectedLon;
    private boolean lightTheme;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setResult(RESULT_CANCELED);

        Bundle extras = getIntent().getExtras();
        if (extras != null) {
            appWidgetId = extras.getInt(
                    AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        }
        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
            finish();
            return;
        }

        selectedCity = WidgetPrefs.city(this, appWidgetId);
        selectedLat = WidgetPrefs.lat(this, appWidgetId);
        selectedLon = WidgetPrefs.lon(this, appWidgetId);
        lightTheme = WidgetPrefs.isLight(this, appWidgetId);

        setContentView(buildUi());
    }

    private View buildUi() {
        int pad = dp(16);

        TextView title = new TextView(this);
        title.setText("Виджет созламалари");
        title.setTextSize(18);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setTextColor(Color.WHITE);
        title.setPadding(pad, pad, pad, dp(4));

        TextView subtitle = new TextView(this);
        subtitle.setText("Шаҳарни танланг:");
        subtitle.setTextSize(14);
        subtitle.setTextColor(0xB3FFFFFF);
        subtitle.setPadding(pad, dp(8), pad, dp(4));

        LinearLayout list = new LinearLayout(this);
        list.setOrientation(LinearLayout.VERTICAL);

        Button gps = new Button(this, null, android.R.attr.borderlessButtonStyle);
        gps.setText("📍 Менинг жойлашувим");
        gps.setAllCaps(false);
        gps.setTextSize(15);
        gps.setTextColor(0xFF7DD3FC);
        gps.setGravity(Gravity.START | Gravity.CENTER_VERTICAL);
        gps.setPadding(pad, dp(10), pad, dp(10));
        gps.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                requestMyLocation();
            }
        });
        list.addView(gps);

        for (final String[] c : CITIES) {
            Button b = new Button(this, null, android.R.attr.borderlessButtonStyle);
            b.setText(c[0]);
            b.setAllCaps(false);
            b.setTextSize(15);
            b.setTextColor(Color.WHITE);
            b.setGravity(Gravity.START | Gravity.CENTER_VERTICAL);
            b.setPadding(pad, dp(10), pad, dp(10));
            b.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    selectedCity = c[0];
                    selectedLat = Double.parseDouble(c[1]);
                    selectedLon = Double.parseDouble(c[2]);
                    saveAndFinish();
                }
            });
            if (c[0].equals(selectedCity)) {
                b.setTextColor(0xFF7DD3FC);
                b.setText("✓ " + c[0]);
            }
            list.addView(b);
        }

        TextView themeLabel = new TextView(this);
        themeLabel.setText("Шиша ранги:");
        themeLabel.setTextSize(14);
        themeLabel.setTextColor(0xB3FFFFFF);
        themeLabel.setPadding(pad, dp(16), pad, dp(4));

        LinearLayout themeRow = new LinearLayout(this);
        themeRow.setOrientation(LinearLayout.HORIZONTAL);
        themeRow.setPadding(pad, 0, pad, pad);
        themeRow.addView(themeButton("Қорамой", false));
        themeRow.addView(themeButton("Оқ", true));

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.addView(title);
        root.addView(subtitle);

        ScrollView scroll = new ScrollView(this);
        scroll.addView(list);
        scroll.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        root.addView(scroll);
        root.addView(themeLabel);
        root.addView(themeRow);

        ScrollView outer = new ScrollView(this);
        outer.addView(root, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        outer.setBackground(glassBackground());

        return outer;
    }

    private Button themeButton(String label, boolean light) {
        Button b = new Button(this, null, android.R.attr.borderlessButtonStyle);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextColor(lightTheme == light ? 0xFF7DD3FC : Color.WHITE);
        b.setTypeface(lightTheme == light ? Typeface.DEFAULT_BOLD : Typeface.DEFAULT);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, dp(44), 1f);
        lp.setMargins(dp(4), 0, dp(4), 0);
        b.setLayoutParams(lp);
        b.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                lightTheme = light;
                setContentView(buildUi());
            }
        });
        return b;
    }

    private Drawable glassBackground() {
        GradientDrawable base = new GradientDrawable();
        base.setColor(0xE60B1220);
        base.setCornerRadius(dp(20));
        GradientDrawable border = new GradientDrawable();
        border.setColor(Color.TRANSPARENT);
        border.setCornerRadius(dp(20));
        border.setStroke(dp(1), 0x26FFFFFF);
        return new LayerDrawable(new Drawable[] { base, border });
    }

    private void requestMyLocation() {
        if (Build.VERSION.SDK_INT >= 23
                && checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
                        != PackageManager.PERMISSION_GRANTED
                && checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)
                        != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[] {
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION }, PERMISSION_LOCATION);
            return;
        }
        useMyLocation();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode == PERMISSION_LOCATION) {
            for (int r : grantResults) {
                if (r == PackageManager.PERMISSION_GRANTED) {
                    useMyLocation();
                    return;
                }
            }
            toast("Рухсат берилмади");
        }
    }

    private void useMyLocation() {
        Location best = null;
        try {
            LocationManager lm = (LocationManager) getSystemService(LOCATION_SERVICE);
            for (String provider : lm.getProviders(false)) {
                Location loc = lm.getLastKnownLocation(provider);
                if (loc != null && (best == null || loc.getTime() > best.getTime())) {
                    best = loc;
                }
            }
        } catch (SecurityException e) {
            toast("Рухсат берилмади");
            return;
        } catch (Exception e) {
            best = null;
        }
        if (best == null) {
            toast("Жойлашув топилмади — GPS'ни ёқиб, харитадан фойдаланинг");
            return;
        }
        selectedLat = best.getLatitude();
        selectedLon = best.getLongitude();
        selectedCity = resolveCityName(selectedLat, selectedLon);
        saveAndFinish();
    }

    private String resolveCityName(double lat, double lon) {
        try {
            java.util.List<android.location.Address> addrs =
                    new Geocoder(this).getFromLocation(lat, lon, 1);
            if (addrs != null && !addrs.isEmpty()) {
                android.location.Address a = addrs.get(0);
                if (a.getLocality() != null) return a.getLocality();
                if (a.getSubAdminArea() != null) return a.getSubAdminArea();
                if (a.getAdminArea() != null) return a.getAdminArea();
            }
        } catch (Exception ignored) {
        }
        return "Менинг жойим";
    }

    private void toast(String text) {
        android.widget.Toast.makeText(this, text, android.widget.Toast.LENGTH_SHORT).show();
    }

    private void saveAndFinish() {
        WidgetPrefs.save(this, appWidgetId, selectedLat, selectedLon, selectedCity, lightTheme);

        AppWidgetManager mgr = AppWidgetManager.getInstance(this);
        AppWidgetProviderInfo info = mgr.getAppWidgetInfo(appWidgetId);
        if (info != null) {
            Intent update = new Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE)
                    .setComponent(info.provider);
            update.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, new int[] { appWidgetId });
            sendBroadcast(update);
        }

        Intent result = new Intent();
        result.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        setResult(RESULT_OK, result);
        finish();
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }
}
