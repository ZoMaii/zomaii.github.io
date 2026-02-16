// 需要提前引入 BootStrap ICON

(function () {
  var OPTS_HOST_DARK_MOD = function (hook, vm) {
    // 主题切换时段配置（本地时间）
    const TIME_CONFIG = {
      light: 7,
      dark: 19
    };

    // 主题样式文件
    const THEME_FILES = {
      light: document.querySelector("link#docsify-theme").href,
      dark: 'https://cdn.jsdelivr.net/npm/docsify/themes/dark.css'
    };

    const THEME_ICON = {
      light : `<i class="bi bi-brightness-high"></i>`,
      dark  : `<i class="bi bi-moon"></i>`
    };

    let themeLink = document.getElementById('docsify-theme');
    let statusEl = document.getElementById('theme-status');
    let isLight = themeLink && themeLink.href.includes('vue.css');
    let manualOverride = false;    // 是否手动切换过

    // 默认毛玻璃背景色（半透明黑）
    const DEFAULT_BG = 'rgba(0, 0, 0, 0)';
    // 主题主色：亮色 #42b983，暗色 #ea6f5a
    const lightColor = '#42b983';
    const darkColor = '#ea6f5a';

    // 用于管理动画的定时器
    let flashTimer = null;

    // 根据本地时间获取应使用的主题名
    function getThemeByTime() {
      const hour = new Date().getHours();
      return (hour >= TIME_CONFIG.light && hour < TIME_CONFIG.dark) ? 'light' : 'dark';
    }

    // 格式化时间显示
    function formatTime(useLocal = true) {
      const d = new Date();
      return useLocal ? d.toLocaleString() : d.toUTCString();
    }

    // 触发状态栏闪烁动画（使用 CSS 过渡平滑变化）
    function flashStatus(type) {
      if (!statusEl) return;

      // 清除之前的定时器，避免冲突
      if (flashTimer) {
        clearTimeout(flashTimer);
        // 立即恢复默认样式（过渡会自动处理）
        statusEl.style.backgroundColor = DEFAULT_BG;
        statusEl.style.transform = 'scale(1)';
      }

      const flashColor = isLight ? lightColor : darkColor;
      // 手动切换使用纯色，自动切换使用半透明（50% 透明度）
      const targetColor = (type === 'manual') ? flashColor : (flashColor + '80'); // 80 为 50% 透明度 hex

      statusEl.style.backgroundColor = targetColor;
      statusEl.style.transform = 'scale(1.05)';

      // 500ms 后恢复默认样式
      flashTimer = setTimeout(() => {
        statusEl.style.backgroundColor = DEFAULT_BG;
        statusEl.style.transform = 'scale(1)';
        flashTimer = null;
      }, 500);
    }

    // 自动更新主题（仅在未手动覆盖时）
    function autoUpdateTheme() {
      if (manualOverride || !themeLink) return;
      const targetTheme = getThemeByTime();
      const newHref = THEME_FILES[targetTheme];
      if (themeLink.href !== newHref) {
        themeLink.href = newHref;
        isLight = (targetTheme === 'light');
        flashStatus('auto');
      }
    }

    // 手动切换主题
    function toggleTheme() {
      if (!themeLink) return;
      const newTheme = isLight ? 'dark' : 'light';
      themeLink.href = THEME_FILES[newTheme];
      isLight = !isLight;
      manualOverride = true;
      flashStatus('manual');
      updateStatusDisplay(); // 立即更新状态栏显示
    }

    // 更新状态栏显示（根据屏幕宽度调整文本，使用实际主题）
    function updateStatusDisplay() {
      if (!statusEl) return;
      const currentTheme = isLight ? 'light' : 'dark';
      let text;
      if (window.innerWidth <= 425) {
        text = THEME_ICON[currentTheme];
      } else {
        text = `<i class="bi bi-alarm"></i>  ${formatTime(false)} | ${currentTheme}`;
      }

      statusEl.innerHTML = text;
      statusEl.setAttribute(
        'title',
        `当前本地时间：${formatTime(true)}\n点击切换主题（本次会话内有效）`
      );

      if (!manualOverride) autoUpdateTheme();
    }

    // 定时器：每秒刷新显示（主要用于更新时间，并检查自动切换）
    function tick() {
      updateStatusDisplay();
    }

    // 确保状态元素存在（若不存在则自动创建）
    function ensureStatusElement() {
      if (statusEl) return statusEl;
      statusEl = document.createElement('div');
      statusEl.id = 'theme-status';
      // 增强毛玻璃样式
      statusEl.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${DEFAULT_BG};
        padding: 8px 14px;
        border-radius: 30px;
        font-size: 14px;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
        transition: background-color 0.3s ease, transform 0.2s ease;
      `;
      document.body.appendChild(statusEl);
      return statusEl;
    }

    // 插件初始化（仅执行一次）
    function initPlugin() {
      themeLink = document.getElementById('docsify-theme');
      if (!themeLink) {
        console.warn('docsify-darkmod-plugin: 未找到 id="docsify-theme" 的 link 元素，主题切换功能不可用。');
        return;
      }

      statusEl = ensureStatusElement();

      isLight = themeLink.href.includes('vue.css');
      statusEl.addEventListener('click', toggleTheme);

      window.addEventListener('resize', updateStatusDisplay);

      setInterval(tick, 1000);        // 启动秒级刷新
      updateStatusDisplay();           // 立即更新显示
    }

    hook.mounted(initPlugin);
  };

  $docsify = $docsify || {};
  $docsify.plugins = [].concat(OPTS_HOST_DARK_MOD, $docsify.plugins || []);
})();