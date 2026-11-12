package uz.abuyahyo.muhim.widget;

import android.Manifest;
import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.AssetManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.LayerDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ImageButton;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

// Gibrid ilova: web ilova (vaqtlar/kunlar/joylar) APK assets ichida
// bundle qilinadi va WebView'da ochiladi. Oflayn ishlaydi, vidjetlar
// bilan bir xil til sozlamasidan foydalanadi (MuhimAndroid bridge).
public class MainActivity extends Activity {

    private static final String VIRTUAL_HOST = "appassets.local";
    private static final int REQ_LOCATION = 1;

    private WebView webView;
    private GeolocationPermissions.Callback geoCallback;
    private String geoOrigin;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applyLocaleOverride();

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(0xFF0B1220);

        webView = new WebView(this);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setGeolocationEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        webView.setBackgroundColor(Color.TRANSPARENT);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(View view, WebResourceRequest request) {
                return assetResponse(request.getUrl().getPath());
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin,
                    GeolocationPermissions.Callback callback) {
                if (hasLocationPermission()) {
                    callback.invoke(origin, true, false);
                } else if (Build.VERSION.SDK_INT >= 23) {
                    geoCallback = callback;
                    geoOrigin = origin;
                    requestPermissions(new String[] {
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION }, REQ_LOCATION);
                } else {
                    callback.invoke(origin, false, false);
                }
            }
        });

        webView.addJavascriptInterface(new Bridge(), "MuhimAndroid");
        webView.loadUrl("https://" + VIRTUAL_HOST + "/");

        root.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        ImageButton gear = new ImageButton(this, null, android.R.attr.borderlessButtonStyle);
        gear.setImageResource(android.R.drawable.ic_menu_preferences);
        gear.setContentDescription(getString(R.string.settings_open));
        gear.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startActivity(new Intent(MainActivity.this, LanguageSettingsActivity.class));
            }
        });
        FrameLayout.LayoutParams gp = new FrameLayout.LayoutParams(dp(40), dp(40));
        gp.gravity = Gravity.TOP | Gravity.END;
        gp.setMargins(0, dp(10), dp(10), 0);
        root.addView(gear, gp);

        setContentView(root);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] results) {
        if (requestCode != REQ_LOCATION || geoCallback == null) return;
        boolean granted = false;
        for (int r : results) {
            if (r == PackageManager.PERMISSION_GRANTED) granted = true;
        }
        geoCallback.invoke(geoOrigin, granted, false);
        geoCallback = null;
        geoOrigin = null;
    }

    private boolean hasLocationPermission() {
        if (Build.VERSION.SDK_INT < 23) return true;
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
                == PackageManager.PERMISSION_GRANTED
                || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)
                == PackageManager.PERMISSION_GRANTED;
    }

    private WebResourceResponse assetResponse(String path) {
        if (path == null || path.isEmpty() || "/".equals(path)) path = "index.html";
        path = path.substring(1);
        if (path.isEmpty() || path.contains("..")) path = "index.html";
        InputStream is;
        try {
            is = getAssets().open("web/" + path);
        } catch (IOException e) {
            return null;
        }
        return new WebResourceResponse(mime(path), null, is);
    }

    private static String mime(String path) {
        String p = path.toLowerCase(Locale.US);
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js")) return "application/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".ico")) return "image/x-icon";
        if (p.endsWith(".woff2")) return "font/woff2";
        if (p.endsWith(".woff")) return "font/woff";
        if (p.endsWith(".webmanifest")) return "application/manifest+json";
        return "application/octet-stream";
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

    private void refreshAllWidgets() {
        AppWidgetManager mgr = AppWidgetManager.getInstance(this);
        Class<?>[] providers = {
                PrayerWidgetProvider.class, NextPrayerWidgetProvider.class,
                PrayerStripWidgetProvider.class, DateWidgetProvider.class,
                HijriWidgetProvider.class, TahajjudWidgetProvider.class
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

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    private class Bridge {
        @JavascriptInterface
        public String lang() {
            return WidgetPrefs.language(MainActivity.this);
        }

        @JavascriptInterface
        public void saveLang(String l) {
            if (l == null || l.isEmpty()) return;
            WidgetPrefs.saveLanguage(MainActivity.this, l);
            refreshAllWidgets();
        }
    }
}
