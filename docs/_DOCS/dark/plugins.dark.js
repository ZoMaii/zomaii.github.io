(function () {
  var OPTS_HOST_DARK_MOD = function (hook, vm) {

    const TIME_CONFIG = {
      // 本地时间进行判断，默认 24 Hours
      light: 7,
      dark: 19
    };

    const THEME_FILES = {
        light: 'https://cdn.jsdelivr.net/npm/docsify/themes/vue.css',
        dark: 'https://cdn.jsdelivr.net/npm/docsify/themes/dark.css'
    };

    const mainTheme = document.getElementById('docsify-theme');
    let isLight = mainTheme && mainTheme.href.includes('vue.css');
    let selectBySelf = false;
    // 避免后续更新出问题
    let addedListener = false;

    function getThemeByTime() {
      // 主题依旧按本地时间计算，而非 UTC 时间。
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
      // 由于 Docsify 设计原因，Cookies、localstrong 和 Indexedb 暂不考虑。所有只有短期记忆
      if(!selectBySelf){  // 单次会话内保持长期记忆
        const themeName = getThemeByTime();
        mainTheme.href = THEME_FILES[themeName];
        isLight = themeName === 'light';
      }
    }

    function toggleTheme(){
        const newTheme = isLight ? 'dark' : 'light';
        mainTheme.href = THEME_FILES[newTheme];
        isLight = !isLight;
        selectBySelf = true;
    }

    function updataStatus(){
      const mainElement = document.getElementById('theme-status');
      const themeName = getThemeByTime();
      // console.log(mainElement);

      mainElement.innerText = `\u23F0[${themeName} theme] ${getFormatTime(false)}`;
      mainElement.setAttribute('title', 
          `当前时间大约为：${getFormatTime()} \n点击以切换主题 | 本次会话内长期保存。`);
      
      updateThemeBasedOnTime();
      
      if(!addedListener) {
        mainElement.addEventListener('click',toggleTheme);
        addedListener = true;
      }
    }

    hook.init(function() {
        // 初始化完成后调用，只调用一次，没有参数。
    });

    hook.beforeEach(function(content) {
      // 每次开始解析 Markdown 内容时调用
      // ...
      return content;
    });

    hook.afterEach(function(html, next) {
      // 解析成 html 后调用。
      // beforeEach 和 afterEach 支持处理异步逻辑
      // ...
      // 异步处理完成后调用 next(html) 返回结果
      next(html);
    });

    hook.doneEach(function() {
      // 每次路由切换时数据全部加载完成后调用，没有参数。
      // ...
      updataStatus();
      // 设置监听
      const d = setInterval(updataStatus,1000);
    });

    hook.mounted(function() {
      // 初始化并第一次加载完成数据后调用，只触发一次，没有参数。
    });

    hook.ready(function() {
      // 初始化并第一次加载完成数据后调用，没有参数。
    });
  };

  // Add plugin to docsify's plugin array
  $docsify = $docsify || {};
  $docsify.plugins = [].concat(OPTS_HOST_DARK_MOD, $docsify.plugins || []);
})();