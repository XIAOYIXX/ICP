chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'downloadDomains') {
    const blob = new Blob([request.domains.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    await chrome.downloads.download({
      url: url,
      filename: 'domains.txt',
      saveAs: false
    });
    URL.revokeObjectURL(url);

    // 发送消息给popup表示完成
    chrome.tabs.sendMessage(sender.tab.id, { status: 'done' });
  }
});



