class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    @JavascriptInterface
    class WebAppInterface(private val context: Context) {
        @JavascriptInterface
        fun log(message: String) {
            Log.d("WebView", message)
        }

        @JavascriptInterface
        fun logError(message: String) {
            Log.e("WebView", message)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)
        webView.settings.javaScriptEnabled = true
        webView.addJavascriptInterface(WebAppInterface(this), "Android")
        
        // Configurar console.log para Android
        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(message: ConsoleMessage): Boolean {
                Log.d("WebView Console", "${message.message()} -- From line ${message.lineNumber()} of ${message.sourceId()}")
                return true
            }
        }
    }
} 