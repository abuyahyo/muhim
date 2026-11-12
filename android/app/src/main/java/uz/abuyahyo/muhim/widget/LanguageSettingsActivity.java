package uz.abuyahyo.muhim.widget;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProviderInfo;
import android.content.ComponentName;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.LayerDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import java.util.Locale;

public class LanguageSettingsActivity extends Activity {

    private static final Class<?>[] PROVIDERS = {
            PrayerWidgetProvider.class, NextPrayerWidgetProvider.class,
            PrayerStripWidgetProvider.class, DateWidgetProvider.class,
            HijriWidgetProvider.class, TahajjudWidgetProvider.class
    };
    private static final int[] PROVIDER_LABELS = {
            R.string.widget_grid_name, R.string.widget_next_name,
            R.string.widget_strip_name, R.string.widget_date_name,
            R.string.widget_hijri_name, R.string.widget_tahajjud_name
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applyLocaleOverride();
        setContentView(buildUi());
    }

    private View buildUi() {
        int pad = dp(16);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(0xFF0B1220);
        root.setGravity(Gravity.CENTER);
        root.setPadding(pad, pad, pad, pad);

        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackground(glassBackground());
        card.setPadding(pad, pad, pad, pad);

        TextView title = new TextView(this);
        title.setText(R.string.settings_title);
        title.setTextSize(18);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setTextColor(Color.WHITE);
        title.setGravity(Gravity.CENTER);
        title.setPadding(0, 0, 0, dp(4));
        card.addView(title);

        TextView hint = new TextView(this);
        hint.setText(R.string.config_language);
        hint.setTextSize(14);
        hint.setTextColor(0xB3FFFFFF);
        hint.setPadding(0, dp(8), 0, dp(4));
        card.addView(hint);

        String currentLang = WidgetPrefs.language(this);
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setPadding(0, 0, 0, dp(8));
        row.addView(optionButton(getString(R.string.config_lang_system),
                "system".equals(currentLang), new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        selectLanguage("system");
                    }
                }));
        row.addView(optionButton(getString(R.string.config_lang_uz),
                "uz".equals(currentLang), new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        selectLanguage("uz");
                    }
                }));
        row.addView(optionButton(getString(R.string.config_lang_ru),
                "ru".equals(currentLang), new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        selectLanguage("ru");
                    }
                }));
        row.addView(optionButton(getString(R.string.config_lang_en),
                "en".equals(currentLang), new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        selectLanguage("en");
                    }
                }));
        card.addView(row);

        TextView widgetsLabel = new TextView(this);
        widgetsLabel.setText(R.string.config_widgets);
        widgetsLabel.setTextSize(14);
        widgetsLabel.setTextColor(0xB3FFFFFF);
        widgetsLabel.setPadding(0, dp(8), 0, dp(4));
        card.addView(widgetsLabel);

        for (int i = 0; i < PROVIDERS.length; i++) {
            card.addView(widgetButton(getString(PROVIDER_LABELS[i]), PROVIDERS[i]));
        }

        Button refresh = widgetButton(getString(R.string.widget_refresh_all), null);
        refresh.setTypeface(Typeface.DEFAULT_BOLD);
        refresh.setTextColor(0xFF7DD3FC);
        card.addView(refresh);

        TextView note = new TextView(this);
        note.setText(R.string.settings_note);
        note.setTextSize(12);
        note.setTextColor(0x80FFFFFF);
        note.setGravity(Gravity.CENTER);
        card.addView(note);

        root.addView(card, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        return root;
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
        } else {
            applyLocaleOverride();
        }
        refreshAllWidgets();
        setContentView(buildUi());
    }

    private void refreshAllWidgets() {
        AppWidgetManager mgr = AppWidgetManager.getInstance(this);
        for (Class<?> p : PROVIDERS) {
            int[] ids = mgr.getAppWidgetIds(new ComponentName(this, p));
            if (ids.length > 0) {
                Intent update = new Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE)
                        .setComponent(new ComponentName(this, p));
                update.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
                sendBroadcast(update);
            }
        }
    }

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

    // Ilova ichidan vidjet qo'yish — launcher'ga pin so'rovi (API 26+).
    private Button widgetButton(final String label, final Class<?> provider) {
        Button b = new Button(this, null, android.R.attr.borderlessButtonStyle);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextSize(14);
        b.setTextColor(Color.WHITE);
        b.setGravity(Gravity.START | Gravity.CENTER_VERTICAL);
        b.setPadding(dp(8), 0, dp(8), 0);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(38));
        lp.setMargins(0, dp(2), 0, dp(2));
        b.setLayoutParams(lp);
        b.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (provider == null) {
                    refreshAllWidgets();
                    toast(getString(R.string.widget_refresh_done));
                } else {
                    pinWidget(provider);
                }
            }
        });
        return b;
    }

    private void pinWidget(Class<?> provider) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(this);
        if (Build.VERSION.SDK_INT < 26 || !mgr.isRequestPinAppWidgetSupported()) {
            toast(getString(R.string.widget_pin_unsupported));
            return;
        }
        mgr.requestPinAppWidget(new ComponentName(this, provider), null, null);
        toast(getString(R.string.widget_pin_sent));
    }

    private void toast(String text) {
        android.widget.Toast.makeText(this, text, android.widget.Toast.LENGTH_SHORT).show();
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
