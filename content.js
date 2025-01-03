document.addEventListener("DOMContentLoaded", function() {
  // 设置阈值
  const threshold = 100; // 这里设置阈值为100，可以根据需要调整

  const links = document.querySelectorAll('a.link');
  links.forEach(link => {
    const match = link.textContent.match(/共(\d+)个/);
    if (match && parseInt(match[1]) < threshold) {
      link.style.backgroundColor = 'red';
      link.style.fontWeight = 'bold';
    }
  });
});



