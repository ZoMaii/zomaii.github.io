// 需要提前引入 Bootstrap Icons
(function () {
  var OPTS_HOST_DARK_MOD = function (hook, vm) {
    // 默认配置
    const DEFAULT_CONFIG = {
      lightStart: 7,                // 亮色主题开始小时 (本地时间)
      darkStart: 19,                // 暗色主题开始小时 (本地时间)
      lightThemeUrl: document.querySelector('link#docsify-theme').href,
      darkThemeUrl: 'https://cdn.jsdelivr.net/npm/docsify/themes/dark.css',
      lightColor: '#42b983',        // 亮色主色（用于闪烁背景）
      darkColor: '#ea6f5a',         // 暗色主色
      statusBar: true,              // 是否显示状态栏
      statusBarPosition: 'bottom-right', // 状态栏位置 (支持 'bottom-right', 'bottom-left', 'top-right', 'top-left')
      showUtcTime: false,           // 状态栏是否显示UTC时间 (默认显示本地时间)
    };

    // 合并用户配置
    const userConfig = window.$docsify && window.$docsify.opts_host_darkmod ? window.$docsify.opts_host_darkmod : {};
    const CONFIG = { ...DEFAULT_CONFIG, ...userConfig };

    // 主题样式文件 (根据配置)
    const THEME_FILES = {
      light: CONFIG.lightThemeUrl,
      dark: CONFIG.darkThemeUrl
    };

    // 主题图标
    const THEME_ICON = {
      light: '<i class="bi bi-brightness-high"></i>',
      dark: '<i class="bi bi-moon"></i>'
    };

    // 状态栏默认背景 (完全透明毛玻璃)
    const DEFAULT_BG = 'rgba(0, 0, 0, 0)';

    // DOM 元素引用
    let themeLink = null;
    let statusEl = null;
    let isLight = true;           // 当前是否为亮色主题
    let manualOverride = false;    // 是否手动切换过

    // 闪烁定时器
    let flashTimer = null;

    /**
     * 根据本地时间获取应使用的主题名
     */
    function getThemeByTime() {
      const hour = new Date().getHours();
      // 注意：如果 lightStart < darkStart，表示白天范围；否则表示跨天（如晚8点到早7点）
      if (CONFIG.lightStart < CONFIG.darkStart) {
        return (hour >= CONFIG.lightStart && hour < CONFIG.darkStart) ? 'light' : 'dark';
      } else {
        // 跨天情况：例如 lightStart=19, darkStart=7 表示晚上7点到早上7点为暗色，其余亮色
        return (hour >= CONFIG.darkStart && hour < CONFIG.lightStart) ? 'dark' : 'light';
      }
    }

    /**
     * 格式化时间显示
     */
    function formatTime(useLocal = true) {
      const d = new Date();
      return useLocal ? d.toLocaleString() : d.toUTCString();
    }

    /**
     * 闪烁状态栏，提示主题切换
     * @param {string} type - 'manual' 或 'auto'
     */
    function flashStatus(type) {
      if (!statusEl) return;

      // 清除之前的定时器，避免冲突
      if (flashTimer) {
        clearTimeout(flashTimer);
        statusEl.style.backgroundColor = DEFAULT_BG;
        statusEl.style.transform = 'scale(1)';
      }

      // 根据当前主题选择闪烁颜色
      const baseColor = isLight ? CONFIG.lightColor : CONFIG.darkColor;
      // 将十六进制颜色转换为 rgba，手动切换使用纯色 (alpha=1)，自动切换使用半透明 (alpha=0.5)
      const alpha = type === 'manual' ? 1 : 0.5;
      const rgbaColor = hexToRgba(baseColor, alpha);

      statusEl.style.backgroundColor = rgbaColor;
      statusEl.style.transform = 'scale(1.05)';

      flashTimer = setTimeout(() => {
        statusEl.style.backgroundColor = DEFAULT_BG;
        statusEl.style.transform = 'scale(1)';
        flashTimer = null;
      }, 500);
    }

    /**
     * 辅助函数：将十六进制颜色转为 rgba 字符串
     */
    function hexToRgba(hex, alpha) {
      let r = 0, g = 0, b = 0;
      // 支持 #RGB 和 #RRGGBB 格式
      if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
      } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
      }
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * 自动更新主题（仅在未手动覆盖且时间变化时）
     */
    function autoUpdateTheme() {
      if (manualOverride || !themeLink) return;
      const targetTheme = getThemeByTime();
      const targetUrl = THEME_FILES[targetTheme];
      if (themeLink.href !== targetUrl) {
        themeLink.href = targetUrl;
        isLight = (targetTheme === 'light');
        flashStatus('auto');
        updateStatusDisplay(); // 更新状态栏显示（图标等）
      }
    }

    /**
     * 手动切换主题
     */
    function toggleTheme() {
      if (!themeLink) return;
      const newTheme = isLight ? 'dark' : 'light';
      themeLink.href = THEME_FILES[newTheme];
      isLight = !isLight;
      manualOverride = true;
      flashStatus('manual');
      updateStatusDisplay();
    }

    /**
     * 更新状态栏内容和样式
     */
    function updateStatusDisplay() {
      if (!statusEl) return;

      const currentTheme = isLight ? 'light' : 'dark';
      let content = '';

      if (window.innerWidth <= 425) {
        // 小屏幕仅显示图标
        content = THEME_ICON[currentTheme];
      } else {
        // 大屏幕显示时间 + 主题图标
        const timeStr = formatTime(!CONFIG.showUtcTime); // 默认本地时间
        content = `${timeStr} ${THEME_ICON[currentTheme]}`;
      }

      statusEl.innerHTML = content;
      statusEl.setAttribute(
        'title',
        `当前本地时间：${formatTime(true)}\n点击切换主题（本次会话内有效）`
      );
    }

    /**
     * 定时任务：每秒更新时间显示，并检查自动切换
     */
    function tick() {
      updateStatusDisplay();
      autoUpdateTheme(); // 每秒检查一次，性能开销很小，也可改为每分钟检查，但简单起见保留
    }

    /**
     * 创建状态栏元素
     */
    function createStatusBar() {
      if (!CONFIG.statusBar) return null;

      let el = document.getElementById('theme-status');
      if (el) return el;

      el = document.createElement('div');
      el.id = 'theme-status';

      // 预定义位置对象
      const positions = {
        'bottom-right': { bottom: '20px', right: '20px' },
        'bottom-left':  { bottom: '20px', left: '20px' },
        'top-right':    { top: '20px', right: '20px' },
        'top-left':     { top: '20px', left: '20px' }
      };

      // 获取用户配置的位置，若无效则使用默认
      let posKey = CONFIG.statusBarPosition;
      let pos = positions[posKey];
      if (!pos) {
        console.warn(`opts_host_darkmod: 无效的 statusBarPosition "${posKey}"，将使用 "bottom-right"`);
        pos = positions['bottom-right'];
      }

      // 构建定位样式：确保至少有一个方向（兜底）
      let positionStyles = '';
      if (pos.top) positionStyles += `top: ${pos.top}; `;
      if (pos.bottom) positionStyles += `bottom: ${pos.bottom}; `;
      if (pos.left) positionStyles += `left: ${pos.left}; `;
      if (pos.right) positionStyles += `right: ${pos.right}; `;

      // 如果所有方向都缺失（理论上不应该），强制设为 bottom:20px; right:20px
      if (!positionStyles) {
        positionStyles = 'bottom: 20px; right: 20px;';
      }

      el.style.cssText = `
        position: fixed;
        ${positionStyles}
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

      document.body.appendChild(el);
      return el;
    }

    /**
     * 初始化插件
     */
    function initPlugin() {
      // 获取主题 link 元素
      themeLink = document.getElementById('docsify-theme');
      if (!themeLink) {
        console.warn('docsify-darkmod-plugin: 未找到 id="docsify-theme" 的 link 元素，主题切换功能不可用。');
        return;
      }

      // 如果用户未配置亮色主题 URL，则尝试从当前 link 的 href 获取（兼容旧版行为）
      if (!userConfig.lightThemeUrl && themeLink.href) {
        THEME_FILES.light = themeLink.href;
      }
      // 如果用户未配置暗色主题 URL，则保留默认 dark.css

      // 根据当前时间设置初始主题
      const initialTheme = getThemeByTime();
      const initialUrl = THEME_FILES[initialTheme];
      if (themeLink.href !== initialUrl) {
        themeLink.href = initialUrl;
      }
      isLight = (initialTheme === 'light');

      // 创建状态栏
      statusEl = createStatusBar();
      if (statusEl) {
        statusEl.addEventListener('click', toggleTheme);
        window.addEventListener('resize', updateStatusDisplay);
      }

      // 启动定时器（每秒更新）
      setInterval(tick, 1000);
      // 立即更新一次显示
      updateStatusDisplay();
    }

    // 挂载插件
    hook.mounted(initPlugin);
  };

  // 注册插件
  $docsify = $docsify || {};
  $docsify.plugins = [].concat(OPTS_HOST_DARK_MOD, $docsify.plugins || []);
})();