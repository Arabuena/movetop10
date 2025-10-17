package com.seuapp

import android.app.Activity
import android.content.Context
import android.content.SharedPreferences
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var prefs: SharedPreferences
    private var attemptedFallback = false

    companion object {
        private const val PREFS_NAME = "app_prefs"
        private const val KEY_BASE_URL = "base_url"
        private const val DEFAULT_FRONTEND_URL = "https://movetop10.onrender.com"
        private const val PERMISSION_LOCATION_REQUEST = 1001
    }

    class WebAppInterface(private val activity: Activity, private val webView: WebView) {
        private var fusedClient: com.google.android.gms.location.FusedLocationProviderClient? = null
        private var locationCallback: com.google.android.gms.location.LocationCallback? = null

        @JavascriptInterface
        fun log(message: String) {
            android.util.Log.d("WebView", message)
        }

        @JavascriptInterface
        fun logError(message: String) {
            android.util.Log.e("WebView", message)
        }

        @JavascriptInterface
        fun hasLocationPermission(): Boolean {
            val fine = androidx.core.content.ContextCompat.checkSelfPermission(
                activity, android.Manifest.permission.ACCESS_FINE_LOCATION
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
            val coarse = androidx.core.content.ContextCompat.checkSelfPermission(
                activity, android.Manifest.permission.ACCESS_COARSE_LOCATION
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
            return fine || coarse
        }

        @JavascriptInterface
        fun requestLocationPermission() {
            androidx.core.app.ActivityCompat.requestPermissions(
                activity,
                arrayOf(
                    android.Manifest.permission.ACCESS_FINE_LOCATION,
                    android.Manifest.permission.ACCESS_COARSE_LOCATION
                ),
                PERMISSION_LOCATION_REQUEST
            )
        }

        @JavascriptInterface
        fun isGPSEnabled(): Boolean {
            val lm = activity.getSystemService(android.content.Context.LOCATION_SERVICE) as android.location.LocationManager
            return lm.isProviderEnabled(android.location.LocationManager.GPS_PROVIDER)
                || lm.isProviderEnabled(android.location.LocationManager.NETWORK_PROVIDER)
        }

        @JavascriptInterface
        fun requestGPSEnable() {
            try {
                activity.startActivity(
                    android.content.Intent(android.provider.Settings.ACTION_LOCATION_SOURCE_SETTINGS)
                        .addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                )
            } catch (e: Exception) {
                android.util.Log.e("WebView", "Erro ao abrir configurações de localização: ${e.message}")
            }
        }

        @JavascriptInterface
        fun startLocationUpdates() {
            if (!hasLocationPermission()) {
                logError("Sem permissão de localização")
                return
            }
            if (fusedClient == null) {
                fusedClient = com.google.android.gms.location.LocationServices.getFusedLocationProviderClient(activity)
            }
            val request = com.google.android.gms.location.LocationRequest.Builder(
                com.google.android.gms.location.Priority.PRIORITY_HIGH_ACCURACY, 5000
            )
                .setMinUpdateIntervalMillis(2000)
                .setWaitForAccurateLocation(true)
                .setMaxUpdateDelayMillis(10000)
                .build()

            locationCallback = object : com.google.android.gms.location.LocationCallback() {
                override fun onLocationResult(result: com.google.android.gms.location.LocationResult) {
                    val loc = result.lastLocation ?: return
                    val json = org.json.JSONObject().apply {
                        put("lat", loc.latitude)
                        put("lng", loc.longitude)
                        put("accuracy", loc.accuracy)
                        put("timestamp", System.currentTimeMillis())
                    }.toString()

                    webView.post {
                        webView.evaluateJavascript(
                            "window.onLocationUpdate && window.onLocationUpdate($json);",
                            null
                        )
                    }
                }
            }

            fusedClient?.requestLocationUpdates(request, locationCallback!!, android.os.Looper.getMainLooper())
            log("Location updates started")
        }

        @JavascriptInterface
        fun stopLocationUpdates() {
            locationCallback?.let { cb ->
                fusedClient?.removeLocationUpdates(cb)
                locationCallback = null
            }
            log("Location updates stopped")
        }

        @JavascriptInterface
        fun getBaseUrl(): String {
            val prefs = activity.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            return prefs.getString(KEY_BASE_URL, DEFAULT_FRONTEND_URL) ?: DEFAULT_FRONTEND_URL
        }

        @JavascriptInterface
        fun setBaseUrl(url: String) {
            val prefs = activity.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putString(KEY_BASE_URL, url).apply()
            activity.runOnUiThread {
                webView.loadUrl(url)
                webView.evaluateJavascript(
                    "window.onBaseUrlChanged && window.onBaseUrlChanged('${'$'}url');",
                    null
                )
            }
        }
    }

    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.mediaPlaybackRequiresUserGesture = false
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            webView.settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }
        android.webkit.WebView.setWebContentsDebuggingEnabled(false)
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                // Mantém navegação dentro do WebView
                return false
            }

            override fun onReceivedError(
                view: WebView,
                request: WebResourceRequest,
                error: WebResourceError
            ) {
                super.onReceivedError(view, request, error)
                if (!attemptedFallback && request.isForMainFrame) {
                    attemptedFallback = true
                    view.loadUrl("file:///android_asset/index.html")
                }
            }
        }

        webView.addJavascriptInterface(WebAppInterface(this, webView), "Android")

        webView.webChromeClient = object : android.webkit.WebChromeClient() {
            override fun onConsoleMessage(message: android.webkit.ConsoleMessage): Boolean {
                android.util.Log.d(
                    "WebView Console",
                    "${message.message()} -- From line ${message.lineNumber()} of ${message.sourceId()}"
                )
                return true
            }
        }

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val baseUrl = prefs.getString(KEY_BASE_URL, DEFAULT_FRONTEND_URL) ?: DEFAULT_FRONTEND_URL
        webView.loadUrl(baseUrl)
    }

    override fun onBackPressed() {
        if (this::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int, permissions: Array<out String>, grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_LOCATION_REQUEST) {
            val granted = grantResults.isNotEmpty() && grantResults.any { it == android.content.pm.PackageManager.PERMISSION_GRANTED }
            webView.post {
                webView.evaluateJavascript(
                    "window.onLocationPermissionResult && window.onLocationPermissionResult(${if (granted) "true" else "false"});",
                    null
                )
            }
        }
    }
}