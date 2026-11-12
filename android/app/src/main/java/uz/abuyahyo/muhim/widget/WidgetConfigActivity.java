package uz.abuyahyo.muhim.widget;

import android.Manifest;
import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProviderInfo;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
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
import android.view.animation.DecelerateInterpolator;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import java.util.Locale;

// Vidjet sozlamalari: shahar, shisha mavzusi (қорамой/оқ), hisoblash usuli
// va Asr mazhabi. Launcher vidjetni qo'shganda android:configure orqali
// ochiladi. Barcha matnlar resurslardan (o'zbek/rus/ingliz).

public class WidgetConfigActivity extends Activity {

    private static final int PERMISSION_LOCATION = 1;

    private static final String[] METHOD_IDS = {"MWL", "Egypt", "Karachi", "Makkah", "ISNA"};
    private static final int[] METHOD_LABELS = {
            R.string.method_mwl, R.string.method_egypt, R.string.method_karachi,
            R.string.method_makkah, R.string.method_isna
    };

    private int appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID;

    private String selectedCity;
    private double selectedLat;
    private double selectedLon;
    private boolean lightTheme;
    private String selectedMethod;
    private boolean selectedShafi;

    private static final int[] PALETTE = {
            0xE60B1220, 0xE61E293B, 0xE6314066, 0xE6134E4A,
            0xE614532D, 0xE64C1D95, 0xE67C2D12, 0xE6000000
    };

    private String selectedBg = "glass";
    private int selectedC1;
    private int selectedC2;

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
        selectedMethod = WidgetPrefs.method(this, appWidgetId);
        selectedShafi = WidgetPrefs.isShafi(this, appWidgetId);
        selectedBg = WidgetPrefs.bgStyle(this, appWidgetId);
        selectedC1 = WidgetPrefs.color1(this, appWidgetId, lightTheme);
        selectedC2 = WidgetPrefs.color2(this, appWidgetId, lightTheme);

        applyLocaleOverride();
        View ui = buildUi();
        setContentView(ui);
        playOpenAnimation(ui);
    }

    // Sozlash oynasi ochilganda bloklar web'dagidek navbatma-navbat, pastdan ko'tarilib paydo bo'ladi.
    private void playOpenAnimation(View outer) {
        outer.setAlpha(0f);
        outer.setTranslationY(dp(18));
        outer.animate().alpha(1f).translationY(0f)
                .setDuration(240)
                .setInterpolator(new DecelerateInterpolator(1.6f))
                .start();

        if (!(outer instanceof ViewGroup)) return;
        ViewGroup inner = (ViewGroup) ((ViewGroup) outer).getChildAt(0);
        long delay = 60;
        for (int i = 0; i < inner.getChildCount(); i++) {
            View child = inner.getChildAt(i);
            child.setAlpha(0f);
            child.setTranslationY(dp(12));
            child.animate().alpha(1f).translationY(0f)
                    .setStartDelay(delay)
                    .setDuration(240)
                    .setInterpolator(new DecelerateInterpolator(1.6f))
                    .start();
            delay += 40;
        }
    }

    // API < 33'da config oynasi matnini tanlangan tilda ko'rsatish.
    private void applyLocaleOverride() {
        String lang = WidgetPrefs.language(this);
        if ("system".equals(lang)) return;
        Locale locale = new Locale(lang);
        Locale.setDefault(locale);
        Configuration config = new Configuration();
        config.setLocale(locale);
        getBaseContext().getResources().updateConfiguration(
                config, getBaseContext().getResources().getDisplayMetrics());
    }

    private void selectLanguage(String lang) {
        WidgetPrefs.saveLanguage(this, lang);
        if (Build.VERSION.SDK_INT >= 33) {
            android.app.LocaleManager lm = getSystemService(android.app.LocaleManager.class);
            if (lm != null) {
                if ("system".equals(lang)) {
                    lm.setApplicationLocales(android.os.LocaleList.getEmptyLocaleList());
                } else {
                    lm.setApplicationLocales(new android.os.LocaleList(new Locale(lang)));
                }
            }
            setContentView(buildUi());
        } else {
            recreate();
        }
        refreshAllWidgets();
    }

    private void refreshAllWidgets() {
        AppWidgetManager mgr = AppWidgetManager.getInstance(this);
        Class<?>[] providers = {
                PrayerWidgetProvider.class, NextPrayerWidgetProvider.class,
                PrayerStripWidgetProvider.class, DateWidgetProvider.class,
                HijriWidgetProvider.class, TahajjudWidgetProvider.class,
                ZikrWidgetProvider.class
        };
        for (Class<?> p : providers) {
            int[] ids = mgr.getAppWidgetIds(new ComponentName(this, p));
            if (ids.length > 0) {
                Intent update = new Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE)
                        .setComponent(new ComponentName(this, p));
                update.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
                sendBroadcast(update);
            }
        }
    }

    private View buildUi() {
        int pad = dp(16);

        TextView title = new TextView(this);
        title.setText(R.string.config_title);
        title.setTextSize(18);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setTextColor(Color.WHITE);
        title.setPadding(pad, pad, pad, dp(4));

        TextView subtitle = new TextView(this);
        subtitle.setText(R.string.config_pick_city);
        subtitle.setTextSize(14);
        subtitle.setTextColor(0xB3FFFFFF);
        subtitle.setPadding(pad, dp(8), pad, dp(4));

        LinearLayout list = new LinearLayout(this);
        list.setOrientation(LinearLayout.VERTICAL);

        TextView langLabel = new TextView(this);
        langLabel.setText(R.string.config_language);
        langLabel.setTextSize(14);
        langLabel.setTextColor(0xB3FFFFFF);
        langLabel.setPadding(pad, dp(4), pad, dp(4));
        list.addView(langLabel);

        String currentLang = WidgetPrefs.language(this);
        LinearLayout langRow = new LinearLayout(this);
        langRow.setOrientation(LinearLayout.HORIZONTAL);
        langRow.setPadding(pad, 0, pad, dp(8));
        langRow.addView(optionButton(getString(R.string.config_lang_system),
                "system".equals(currentLang), new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        selectLanguage("system");
                    }
                }));
        langRow.addView(optionButton(getString(R.string.config_lang_uz),
                "uz".equals(currentLang), new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        selectLanguage("uz");
                    }
                }));
        langRow.addView(optionButton(getString(R.string.config_lang_ru),
                "ru".equals(currentLang), new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        selectLanguage("ru");
                    }
                }));
        langRow.addView(optionButton(getString(R.string.config_lang_en),
                "en".equals(currentLang), new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        selectLanguage("en");
                    }
                }));
        list.addView(langRow);

        Button gps = new Button(this, null, android.R.attr.borderlessButtonStyle);
        gps.setText(R.string.config_my_location);
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

        String[] cityNames = getResources().getStringArray(R.array.city_names);
        String[] cityLats = getResources().getStringArray(R.array.city_lats);
        String[] cityLons = getResources().getStringArray(R.array.city_lons);
        for (int i = 0; i < cityNames.length; i++) {
            final String name = cityNames[i];
            final double lat = Double.parseDouble(cityLats[i]);
            final double lon = Double.parseDouble(cityLons[i]);
            Button b = new Button(this, null, android.R.attr.borderlessButtonStyle);
            b.setText(name);
            b.setAllCaps(false);
            b.setTextSize(15);
            b.setTextColor(Color.WHITE);
            b.setGravity(Gravity.START | Gravity.CENTER_VERTICAL);
            b.setPadding(pad, dp(10), pad, dp(10));
            b.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    selectedCity = name;
                    selectedLat = lat;
                    selectedLon = lon;
                    saveAndFinish();
                }
            });
            if (name.equals(selectedCity)) {
                b.setTextColor(0xFF7DD3FC);
                b.setText("✓ " + name);
            }
            list.addView(b);
        }

        TextView themeLabel = new TextView(this);
        themeLabel.setText(R.string.config_theme);
        themeLabel.setTextSize(14);
        themeLabel.setTextColor(0xB3FFFFFF);
        themeLabel.setPadding(pad, dp(16), pad, dp(4));

        LinearLayout themeRow = new LinearLayout(this);
        themeRow.setOrientation(LinearLayout.HORIZONTAL);
        themeRow.setPadding(pad, 0, pad, 0);
        themeRow.addView(optionButton(getString(R.string.config_theme_dark), !lightTheme,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        lightTheme = false;
                        setContentView(buildUi());
                    }
                }));
        themeRow.addView(optionButton(getString(R.string.config_theme_light), lightTheme,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        lightTheme = true;
                        setContentView(buildUi());
                    }
                }));

        TextView methodLabel = new TextView(this);
        methodLabel.setText(R.string.config_method);
        methodLabel.setTextSize(14);
        methodLabel.setTextColor(0xB3FFFFFF);
        methodLabel.setPadding(pad, dp(16), pad, dp(4));

        LinearLayout methodRow = new LinearLayout(this);
        methodRow.setOrientation(LinearLayout.HORIZONTAL);
        methodRow.setPadding(pad, 0, pad, 0);
        for (int i = 0; i < METHOD_IDS.length; i++) {
            final String id = METHOD_IDS[i];
            methodRow.addView(optionButton(getString(METHOD_LABELS[i]), id.equals(selectedMethod),
                    new View.OnClickListener() {
                        @Override
                        public void onClick(View v) {
                            selectedMethod = id;
                            setContentView(buildUi());
                        }
                    }));
        }

        TextView madhabLabel = new TextView(this);
        madhabLabel.setText(R.string.config_madhab);
        madhabLabel.setTextSize(14);
        madhabLabel.setTextColor(0xB3FFFFFF);
        madhabLabel.setPadding(pad, dp(16), pad, dp(4));

        LinearLayout madhabRow = new LinearLayout(this);
        madhabRow.setOrientation(LinearLayout.HORIZONTAL);
        madhabRow.setPadding(pad, 0, pad, 0);
        madhabRow.addView(optionButton(getString(R.string.config_madhab_hanafi), !selectedShafi,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        selectedShafi = false;
                        setContentView(buildUi());
                    }
                }));
        madhabRow.addView(optionButton(getString(R.string.config_madhab_shafi), selectedShafi,
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        selectedShafi = true;
                        setContentView(buildUi());
                    }
                }));

        TextView bgLabel = new TextView(this);
        bgLabel.setText(R.string.config_bg);
        bgLabel.setTextSize(14);
        bgLabel.setTextColor(0xB3FFFFFF);
        bgLabel.setPadding(pad, dp(16), pad, dp(4));

        LinearLayout bgRow = new LinearLayout(this);
        bgRow.setOrientation(LinearLayout.HORIZONTAL);
        bgRow.setPadding(pad, 0, pad, 0);
        bgRow.addView(optionButton(getString(R.string.config_bg_glass), "glass".equals(selectedBg),
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        selectedBg = "glass";
                        setContentView(buildUi());
                    }
                }));
        bgRow.addView(optionButton(getString(R.string.config_bg_solid), "solid".equals(selectedBg),
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        selectedBg = "solid";
                        setContentView(buildUi());
                    }
                }));
        bgRow.addView(optionButton(getString(R.string.config_bg_gradient), "gradient".equals(selectedBg),
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        selectedBg = "gradient";
                        setContentView(buildUi());
                    }
                }));

        TextView c1Label = new TextView(this);
        c1Label.setText(R.string.config_color1);
        c1Label.setTextSize(12);
        c1Label.setTextColor(0xB3FFFFFF);
        c1Label.setPadding(pad, dp(8), pad, 0);

        LinearLayout c1Row = new LinearLayout(this);
        c1Row.setOrientation(LinearLayout.HORIZONTAL);
        c1Row.setPadding(pad, dp(4), pad, 0);
        for (int color : PALETTE) {
            c1Row.addView(swatch(color, true));
        }

        TextView c2Label = new TextView(this);
        c2Label.setText(R.string.config_color2);
        c2Label.setTextSize(12);
        c2Label.setTextColor(0xB3FFFFFF);
        c2Label.setPadding(pad, dp(8), pad, 0);

        LinearLayout c2Row = new LinearLayout(this);
        c2Row.setOrientation(LinearLayout.HORIZONTAL);
        c2Row.setPadding(pad, dp(4), pad, 0);
        for (int color : PALETTE) {
            c2Row.addView(swatch(color, false));
        }

        Button save = new Button(this, null, android.R.attr.borderlessButtonStyle);
        save.setText(R.string.config_save);
        save.setAllCaps(false);
        save.setTextSize(15);
        save.setTypeface(Typeface.DEFAULT_BOLD);
        save.setTextColor(0xFF7DD3FC);
        save.setGravity(Gravity.CENTER);
        save.setPadding(pad, dp(12), pad, dp(12));
        save.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                saveAndFinish();
            }
        });

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
        root.addView(methodLabel);
        root.addView(methodRow);
        root.addView(madhabLabel);
        root.addView(madhabRow);
        root.addView(bgLabel);
        root.addView(bgRow);
        root.addView(c1Label);
        root.addView(c1Row);
        root.addView(c2Label);
        root.addView(c2Row);
        root.addView(save);

        ScrollView outer = new ScrollView(this);
        outer.addView(root, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        outer.setBackground(glassBackground());

        return outer;
    }

    private Button optionButton(String label, boolean active, View.OnClickListener listener) {
        Button b = new Button(this, null, android.R.attr.borderlessButtonStyle);
        b.setText(active ? "✓ " + label : label);
        b.setAllCaps(false);
        b.setTextColor(active ? 0xFF7DD3FC : Color.WHITE);
        b.setTypeface(active ? Typeface.DEFAULT_BOLD : Typeface.DEFAULT);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, dp(40), 1f);
        lp.setMargins(dp(4), 0, dp(4), 0);
        b.setLayoutParams(lp);
        b.setOnClickListener(listener);
        return b;
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
            toast(getString(R.string.config_perm_denied));
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
            toast(getString(R.string.config_perm_denied));
            return;
        } catch (Exception e) {
            best = null;
        }
        if (best == null) {
            toast(getString(R.string.config_no_location));
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
                    new Geocoder(this, Locale.getDefault()).getFromLocation(lat, lon, 1);
            if (addrs != null && !addrs.isEmpty()) {
                android.location.Address a = addrs.get(0);
                if (a.getLocality() != null) return a.getLocality();
                if (a.getSubAdminArea() != null) return a.getSubAdminArea();
                if (a.getAdminArea() != null) return a.getAdminArea();
            }
        } catch (Exception ignored) {
        }
        return getString(R.string.config_my_place);
    }

    private void toast(String text) {
        android.widget.Toast.makeText(this, text, android.widget.Toast.LENGTH_SHORT).show();
    }

    private Button swatch(final int color, final boolean isC1) {
        Button b = new Button(this, null, android.R.attr.borderlessButtonStyle);
        boolean active = isC1 ? color == selectedC1 : color == selectedC2;
        b.setText(active ? "\u2713" : "\u25CF");
        b.setTextSize(18);
        b.setTextColor(color);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, dp(36), 1f);
        lp.setMargins(dp(2), 0, dp(2), 0);
        b.setLayoutParams(lp);
        b.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (isC1) selectedC1 = color; else selectedC2 = color;
                setContentView(buildUi());
            }
        });
        return b;
    }

    private void saveAndFinish() {
        WidgetPrefs.save(this, appWidgetId, selectedLat, selectedLon, selectedCity,
                lightTheme, selectedMethod, selectedShafi);
        WidgetPrefs.saveStyle(this, appWidgetId, selectedBg, selectedC1, selectedC2);

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

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }
}
