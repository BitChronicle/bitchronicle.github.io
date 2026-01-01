// source/js/host-switch.js - 终极图片版
document.addEventListener('DOMContentLoaded', function() {
    var hostSpan = document.getElementById('deployment-host');
    if (!hostSpan) return;

    var currentHost = window.location.hostname;

    // 定义一个统一的 Logo 样式，保证两个图标一样大，且和文字对齐
    // height: 20px 根据你的 footer 文字大小微调，通常 18px-22px 比较合适
    // vertical-align: text-bottom 让图片底部和文字底部对齐
    var logoStyle = 'height: 20px; vertical-align: text-bottom; margin: 0 3px; border: none; box-shadow: none;';

    // 逻辑判断
    if (currentHost.includes('github.io')) {
        // >>> 如果是 GitHub，显示 GitHub Logo <<<
        // 链接到 GitHub Pages 官网
        hostSpan.innerHTML = '<a href="https://pages.github.com/" target="_blank" title="Hosted by GitHub Pages">' + 
                             '<img src="/img/github.png" style="' + logoStyle + '" alt="GitHub Pages">' + 
                             '</a>';
    } else {
        // >>> 如果是其他（默认国内），显示又拍云 Logo <<<
        // 链接到又拍云联盟（带上你的推广后缀最好）
        hostSpan.innerHTML = '<a href="https://www.upyun.com/?from=lianmeng" target="_blank" title="Accelerated by UPYUN">' + 
                             '<img src="/img/upyun.png" style="' + logoStyle + '" alt="又拍云">' + 
                             '</a>';
    }
});