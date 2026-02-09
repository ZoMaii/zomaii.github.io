// ~~152MB memory 版本，待优化（>= 80 MB）~~
// 关于我尝试优化内存占用结果发现用了作者提供的 hook 和直接用 observer 没什么性能区别的这件事...
// This file is subject to the MIT License; Copyright 2026 zomaii

const TIME_CONFIG = {
    // 本地时间进行判断，默认 24 Hours
    light: 7,
    dark: 19
};

const THEME_FILES = {
    light: 'https://cdn.jsdelivr.net/npm/docsify/themes/vue.css',
    dark: 'https://cdn.jsdelivr.net/npm/docsify/themes/dark.css'
};

// 定位区域
let mainElement = null;
const mainTheme = document.getElementById('docsify-theme');
let isLight = mainTheme && mainTheme.href.includes('vue.css');



// 主要函数区
const dark = (function() {
    let addedListener = false;

    function getThemeByTime() {
        const now = new Date();
        const currentHour = now.getHours();
        
        return (currentHour >= TIME_CONFIG.light && 
                currentHour < TIME_CONFIG.dark) ? 'light' : 'dark';
    }

    function getFormatTime(selectDEF = true) {
        const now = new Date();
        return selectDEF ? now.toLocaleString() : now.toUTCString();
    }

    function updateThemeBasedOnTime() {
        const themeName = getThemeByTime();
        mainTheme.href = THEME_FILES[themeName];
        isLight = themeName === 'light';
    }

    function updateStatus() {
        if (!mainElement) return;
        
        const themeName = getThemeByTime();
        mainElement.innerText = `\u23F0[${themeName} theme] ${getFormatTime(false)}`;
        mainElement.setAttribute('title', 
            `当前时间大约为：${getFormatTime()} \n点击以切换主题。`);
    }

    function toggleTheme() {
        const newTheme = isLight ? 'dark' : 'light';
        mainTheme.href = THEME_FILES[newTheme];
        isLight = !isLight;
        
        // 更新显示状态
        updateStatus();
    }

    function uptimeToStatus() {
        // 立即更新一次
        updateStatus();
        // 设置定时器
        return setInterval(updateStatus, 500);
    }

    // 两种非 hook 钩子的监听替代方案，喜欢哪种用哪种。

    // // MutationObserver
    // const observer = new MutationObserver((mutations) => {
    //     for (const mutation of mutations) {
    //         if (mutation.type === 'childList') {
    //             const element = document.getElementById('theme-status');
    //             if (element) {
    //                 mainElement = element;
                    
    //                 uptimeToStatus();
                    
    //                 // 初始化主题
    //                 updateThemeBasedOnTime();
                    
    //                 // 添加点击事件监听器
    //                 if (!addedListener) {
    //                     element.addEventListener('click', toggleTheme);
    //                     addedListener = true;
    //                 }
                    
    //                 observer.disconnect();
    //                 break;
    //             }
    //         }
    //     }
    // });

    // observer.observe(document.body, {
    //     childList: true,
    //     subtree: true
    // });

    // 全局事件委托
    document.addEventListener('click', function(event) {
        if (event.target.id === 'theme-status' || 
            event.target.closest('#theme-status')) {
            toggleTheme();
        }
    });

    // 持续监控元素变化
    const checkThemeStatusElement = () => {
        const element = document.getElementById('theme-status');
        if (element && element !== mainElement) {
            mainElement = element;
            updateThemeBasedOnTime();
            uptimeToStatus();
        }
    };

    // 定期检查，每秒一次
    setInterval(checkThemeStatusElement, 1000);

    // 监听 Docsify 的路由事件
    window.addEventListener('hashchange', checkThemeStatusElement);
    document.addEventListener('DOMContentLoaded', checkThemeStatusElement);
    
    // 初始检查
    checkThemeStatusElement();
})();