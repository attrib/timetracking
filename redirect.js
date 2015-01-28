chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  chrome.tabs.update(sender.tab.id, {url: request.redirect});
});
