/**
 * VEKTR 原生橋接層 — 放進 Next.js 網站(主專案)
 *
 * 用途:網站在 Capacitor App 內開啟時,啟用推播、深層連結、原生分享、LINE 系統瀏覽器登入。
 * 在一般瀏覽器中此檔案不做任何事(會直接 return),安全無副作用。
 * 來源:vektr-app/web-integration/vektr-native.js
 */
(function () {
  var Cap = window.Capacitor;
  if (!Cap || !Cap.isNativePlatform || !Cap.isNativePlatform()) return; // 非 App 環境直接退出

  document.documentElement.classList.add('vektr-native-app'); // CSS 可據此隱藏「下載 App」橫幅等

  var P = Cap.Plugins;

  /* ---------- 推播通知 ---------- */
  function initPush() {
    var Push = P.PushNotifications;
    if (!Push) return;

    Push.checkPermissions().then(function (res) {
      if (res.receive === 'prompt') return Push.requestPermissions();
      return res;
    }).then(function (res) {
      if (res && res.receive === 'granted') Push.register();
    });

    Push.addListener('registration', function (token) {
      fetch('/api/push/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token: token.value,
          platform: Cap.getPlatform(), // 'ios' | 'android'
        }),
      }).catch(function () {});
    });

    Push.addListener('pushNotificationActionPerformed', function (event) {
      var url = event.notification && event.notification.data && event.notification.data.url;
      if (url && url.indexOf('/') === 0) window.location.href = url;
    });
  }

  /* ---------- 深層連結(LINE 分享卡點進來) ---------- */
  function initDeepLinks() {
    var App = P.App;
    if (!App) return;
    App.addListener('appUrlOpen', function (event) {
      try {
        var u = new URL(event.url);
        if (u.hostname.indexOf('vektr.com.tw') !== -1) {
          window.location.href = u.pathname + u.search;
        }
      } catch (e) {}
    });
  }

  /* ---------- 原生分享 ---------- */
  window.vektrShare = function (opts) {
    var Share = P.Share;
    if (Share) return Share.share(opts); // { title, text, url }
    if (navigator.share) return navigator.share(opts);
    return Promise.reject(new Error('share unavailable'));
  };

  /* ---------- LINE 登入:在系統瀏覽器開啟 OAuth(WebView 內 LINE 會擋) ---------- */
  window.vektrOpenAuth = function (url) {
    var Browser = P.Browser;
    if (Browser) return Browser.open({ url: url, presentationStyle: 'popover' });
    window.location.href = url;
  };

  initPush();
  initDeepLinks();
})();
