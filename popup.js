let currentIndex = 0;
let highlightedLinks = [];

document.addEventListener('DOMContentLoaded', () => {
  const startScrapingButton = document.getElementById('start-scraping');
  const clearResultsButton = document.getElementById('clear-results');
  const resultsTextarea = document.getElementById('results');
  const statusParagraph = document.getElementById('status');

  // 加载已保存的域名
  chrome.storage.local.get(['domains'], (result) => {
    if (result.domains && result.domains.length > 0) {
      resultsTextarea.value = result.domains.join('\n');
    }
  });

  startScrapingButton.addEventListener('click', async () => {
    statusParagraph.textContent = '抓取中...';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: scrapeDomainDetails,
        args: [currentIndex] // 传递 currentIndex 参数
      });
    });
  });

  clearResultsButton.addEventListener('click', () => {
    resultsTextarea.value = '';
    statusParagraph.textContent = '';
    chrome.storage.local.remove(['domains']);
    currentIndex = 0; // 重置 currentIndex
    highlightedLinks = []; // 清空高亮链接数组
  });

  // 监听消息以更新状态和结果显示
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateResults') {
      resultsTextarea.value += request.domain + '\n';
      chrome.storage.local.set({ domains: resultsTextarea.value.split('\n').filter(line => line.trim() !== '') });
    } else if (request.status === 'done') {
      statusParagraph.textContent = '抓取完成！';
    }
  });

  // 阻止点击事件冒泡到 body 关闭窗口
  document.getElementById('popup-container').addEventListener('click', (event) => {
    event.stopPropagation();
  });

  // 点击 body 关闭窗口
  document.body.addEventListener('click', () => {
    window.close();
  });

  document.getElementById('highlightButton').addEventListener('click', () => {
    const threshold = parseInt(document.getElementById('thresholdInput').value);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: highlightWithThreshold,
        args: [threshold],
        world: "MAIN"
      }).then((injectionResults) => {
        highlightedLinks = injectionResults[0].result;
        updateCount();
        currentIndex = -1;
      });
    });
  });
});

async function scrapeDomainDetails(currentIndex) {
  const detailsButtons = Array.from(document.querySelectorAll('.cell button.el-button.el-button--primary.el-button--small'));

  if (currentIndex >= detailsButtons.length) {
    // 所有域名都抓取完毕
    chrome.runtime.sendMessage({ status: 'done' });
    return;
  }

  detailsButtons[currentIndex].click();

  // 等待详情页面加载
  await new Promise(resolve => setTimeout(resolve, 5000)); // 根据实际情况调整等待时间

  // 获取域名
  const domainElement = document.querySelector('[data-v-3b8940bf][style="float: left;"]');
  let domain = '';
  if (domainElement) {
    domain = domainElement.textContent.trim();
    chrome.runtime.sendMessage({ action: 'updateResults', domain: domain });
  }

  // 返回查询结果
  const backButton = document.querySelector('.details_close .el-button');
  if (backButton) {
    backButton.click();
  }

  // 继续抓取下一个域名
  currentIndex++;
  scrapeDomainDetails(currentIndex); // 递归调用时传递 currentIndex
}

function highlightWithThreshold(threshold) {
  const links = Array.from(document.querySelectorAll('a.link'));
  links.forEach(link => {
    const match = link.textContent.match(/共(\d+)个/);
    if (match && parseInt(match[1]) < threshold) {
      link.style.backgroundColor = 'red';
      link.style.fontWeight = 'bold';
    } else {
      link.style.backgroundColor = '';
      link.style.fontWeight = '';
    }
  });

  return links.filter(link => {
    const match = link.textContent.match(/共(\d+)个/);
    return match && parseInt(match[1]) < threshold;
  });
}

function updateCount() {
  document.getElementById('countDisplay').textContent = `找到 ${highlightedLinks.length} 个匹配项`;
}



