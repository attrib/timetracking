// Start Page
if ($("body.not-logged-in.section-news")) {
  // Remove old news
  $('.views-field-created span').each(function() {
    var content = $(this).text(),
        date = new Date(content.substr(6, 4) + "-" + content.substr(3, 2) + "-" + content.substr(0, 2)),
        diff = new Date() - date;
    if (diff > (1000*60*60*24*30*6)) {
      $(this).parent().parent().remove();
    }
  });
  // Add my news
  $('.view-News .view-content').append(createNews("Intranet Tracking v0.2 online", "https://chrome.google.com/webstore/detail/cocomore-timetracking/fmdfjdlmmcdmiiajollfcbnjcghpbcng", "<p>Welcome to the improved version of the Intranet time tracking Chrome extension.</p><br><p>For feature request, concerns or similar visit the <a href='https://github.com/attrib/timetracking/issues'>Bug tracker</a>.</p><br><p>Have a nice day and don't forget to track ;)</p><br>", "31.01.2014 - 23:23"));
  $.get("https://xkcd.com/info.0.json", function (data) {
    $('.view-News .view-content').prepend(createNews(data.title, "https://xkcd.com", '<p><img id="xkcd" src="'+data.img+'"></p><br>', data.day+'.'+data.month+'.'+data.year));
    $("#xkcd").attr('alt', data.alt).attr('title', data.alt);
  });
}

function createNews(title, href, text, dateString) {
  return $('<div class="views-row">' +
  '<div class="views-field-title"><span class="field-content"><a href="'+href+'"><h3>'+title+'</h3></a></span></div>' +
  '<div class="views-field-created"><span class="field-content">'+dateString+'</span></div>' +
  '<div class="views-field-teaser"><div class="field-content">'+text+'</div></div>' +
  '</div>');
}

// Project page - add date selector
if ($(".node-type-stormproject").size() > 0) {

  var
    $from = $("<input type='date'>"),
    $to = $("<input type='date'>"),
    $submit = $("<input type='submit'>"),
    $wrapper = $("<div></div>");

  $("#content_main").before($wrapper);
  $wrapper.after($submit).after($to).after($from);

  $submit.click(function() {
    var data = {
      dates: [],
      title: $("h1").text().trim(),
      organization: $(".organization a").text().trim(),
      project_nid: document.location.pathname.split("/")[2]
    };
    var to = new Date($to.val()),
      month_to_process = [];
    for (var d = new Date($from.val()); d <= to; d.setDate(d.getDate() + 1)) {
      data.dates.push(date_output(d));
      month_to_process.push(d.getFullYear() + "-" + (d.getMonth() + 1));
    }
    data.month_to_process = month_to_process.getUnique();
    chrome.storage.local.set(data, function() {
      var href = $('.coco-user-info-block .my-profil a').attr('href');
      chrome.runtime.sendMessage({redirect: "https://intranet.cocomore.com" + href + "/timetrackings?date=" + data.month_to_process[0] + "-01"});
    });
  });

}

// Do timetracking.
if (document.location.pathname == "/node/add/stormtimetracking") {
  chrome.storage.local.get(null, function(data) {
    if (data && data.dates.length > 0) {
      var date = data.dates.shift();
      chrome.storage.local.set(data);
      $("#edit-trackingdate-popup-datepicker-popup-0").val(date);
      $("#edit-timebegin").val("09:00");
      $("#edit-timeend").val("");
      $("#edit-duration").val("8,4");
      $("#edit-title").val("Timetracking für " + data.title);
      $("#edit-submit").click();
    }
  });
}

// Go back to a new time tracking or to the overview if done.
if ($(".node-type-stormtimetracking").size() > 0) {
  chrome.storage.local.get(null, function(data) {
    if (data && data.dates.length > 0) {
      chrome.runtime.sendMessage({redirect: "https://intranet.cocomore.com/node/add/stormtimetracking?project_nid=" + data.project_nid});
    }
    else {
      chrome.storage.local.set({});
      chrome.runtime.sendMessage({redirect: "https://intranet.cocomore.com/storm/my-timetrackings"});
    }
  });
}

// Check open days.
if ($(".node-type-stormperson").size() > 0) {
  chrome.storage.local.get(null, function(data) {
    if (data && data.dates.length > 0) {
      var new_dates = [];
      $.each(data.dates, function(key, date_string) {
        var date = this;
        var $date_td= $(".stormtimetracking-calendar .storm_c_timetracking_calendar-" + date);
        // Not on this page, wait for next reload
        if ($date_td.size() == 0) {
          new_dates.push(this.toString());
        }
        else if (!$date_td.hasClass("utilisation-okay") && !$date_td.hasClass("weekend") && !$date_td.hasClass("national-holiday")) {
          new_dates.push(this.toString());
        }
      });
      data.dates = new_dates;
      data.month_to_process.shift();
      chrome.storage.local.set(data, function() {
        if (data.month_to_process.length > 0) {
          var href = $('.coco-user-info-block .my-profil a').attr('href');
          chrome.runtime.sendMessage({redirect: "https://intranet.cocomore.com" + href + "/timetrackings?date=" + data.month_to_process[0] + "-01"});
        }
        else {
          if (data.dates.length > 0) {
            chrome.runtime.sendMessage({redirect: "https://intranet.cocomore.com/node/add/stormtimetracking?project_nid=" + data.project_nid});
          }
          else {
            chrome.storage.local.set({});
            chrome.runtime.sendMessage({redirect: "https://intranet.cocomore.com/storm/my-timetrackings"});
          }
        }
      });
    }
  });
}

/**
 *
 * @param date Date
 */
function date_output(date) {
  var month = date.getMonth() + 1,
    day = date.getDate();
  day = (day < 10) ? "0" + day : day;
  month = (month < 10) ? "0" + month : month;
  return date.getFullYear() + "-" + month + "-" + day;
}

Array.prototype.getUnique = function() {
  var u = {}, a = [];
  for(var i = 0, l = this.length; i < l; ++i){
    if(u.hasOwnProperty(this[i])) {
      continue;
    }
    a.push(this[i]);
    u[this[i]] = 1;
  }
  return a;
};
