/* v37 — Jetzt in Niederrad
 * Live-Uhr im Header. Lokale Browserzeit.
 * Kein Tracking, keine Cookies.
 */
(function () {
  "use strict";

  var timeEl = document.getElementById("nowTime");
  var dayEl = document.getElementById("nowDay");
  if (!timeEl || !dayEl) return;

  var timeFmt;
  var dayFmt;
  try {
    timeFmt = new Intl.DateTimeFormat("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    dayFmt = new Intl.DateTimeFormat("de-DE", { weekday: "long" });
  } catch (e) {
    // Fallback-Formatter, falls Intl fehlt
    timeFmt = {
      format: function (d) {
        var h = String(d.getHours()).padStart(2, "0");
        var m = String(d.getMinutes()).padStart(2, "0");
        return h + ":" + m;
      }
    };
    var days = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
    dayFmt = { format: function (d) { return days[d.getDay()]; } };
  }

  var lastTime = "";
  var lastDay = "";

  function tick() {
    var now = new Date();
    var t = timeFmt.format(now);
    var d = dayFmt.format(now);
    if (t !== lastTime) { timeEl.textContent = t; lastTime = t; }
    if (d !== lastDay) { dayEl.textContent = d; lastDay = d; }
  }

  tick();
  // Alle Sekunde aktualisieren — reicht für Minuten-Anzeige, ist unaufdringlich
  setInterval(tick, 1000);
})();
