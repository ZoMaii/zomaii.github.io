// 区域点读机，哪里不会亮哪里。
// 不包含对 ==(.*)== 类型的 mark 标签元素的解析

// Selected role, and hightlighted role area.
// Need ES6+ support

/** 书写格式
 * 
 * （一）、行书书写格式，默认使用格式
 * 
 * [展示 viewer 角色的高亮提示](@?viewer)       默认翻译为：<a data-ac-role="viewer">展示 viewer 角色的高亮提示</a>
 * * 出于安全考虑，图片写法被宣告无效。
 * * ![图片写法无效](@?viewer)                 默认翻译为：!<a data-ac-role="viewer">图片写法无效</a>
 * 
 * 
 * * 日常书写示例
 * * 
 * * == 导入此插件后，默认的 mark 段落将不被高亮 ==
 * * ==[$] 这部分高亮等价于 mark 段落 ==
 * * 
 * * ==[viewer] 点击 Viewer 的链接后，这段内容将被高亮==
 * * ==[p1] p1作为其他角色专属高亮，在Viewer高亮的情况下不会高亮==
 * 
 *
 * 
 * 合法嵌套/ 最佳嵌套实践如下（仅支持 A+B 或 B+A 排列，其他表现不强制要求一致）：
 * ==[viewer] 如果你希望查看与之不同的内容，请 [切换到 user 视角](@?user) ==
 * [==[viewer] viewer 角色才能看到高亮==，如果看不到，可点击本行文本强制切换到 Viewer 视角==](@?viewer)
 * 
 * 
 * 
 * 特别提醒：书写 markdown 时，不要在元素内嵌套！务必使用 data-ac-role 属性在 markdwon 内进行元素书写！
 * 
 */


/** 触发器方案
 * 
 * （一）、事件触发器（默认）[A方案]
 *  所有具备 data-ac-role 的元素均会被监听是否发生点击事件。这是被默认的使用方式。
 *  属于核心方式，不可被卸载或禁用。
 * 
 * （二）、Route_Query 触发器 [B方案]
 *  直接跳过点击事件，在浏览器刷新后即触发高亮。为保持兼容性，默认关闭状态。
 *  在 .md 文件首行写 <!-- areaclick:Route --> 即可启用。
 */

(function () {
  var areaclick = function (hook, vm) {

    // http://127.0.0.1:5500/#/./opts.host/test
    /** 核心流程处理逻辑
     * 
     * 1. 预扫描（标记符合 BAN 的行号，求差集得到符合要求的行号）
     *    a. 流处理（将符合要求的行号转化为 html 元素形式，拼接好全文后交由 marked 处理）
     * 
     */

    const CORE_RULE = {
      // a good tool website of REGEX:  https://regex101.com/
      //  搭配方案
      // Base.    MARK.0                  WAY.1
      // 1.        +WAY(正常解析)           +MARK(正常解析，设计上兼容性解析)
      // 2.        +MARK(按解析器执行)       +WAY(非法表达)
      MARK_ROLE        : /==\[(\S*)\](.*)==(?!\]\(\@\?)/g,  // 避免 [==click to ...==](./hello.html) 的方言解析被误入。
      MARK_WAY         : /==(?!\[.*\])(.*)==/g,
      WAY              : /\[([^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*)\]\(\@\?(.*[^\0])\)/g,
    }

    const BAN = [
        { pattern: /^```[\s\S]*?^```$/gm, type: 'code' },           // 多行代码块
        { pattern: /^```\w*[\s\S]*?^```$/gm, type: 'code' },       // 带语言的多行代码块
        { pattern: /`[^`\n]+`/g, type: 'inline' },                 // 行内代码
        { pattern: /\$\$[\s\S]*?\$\$/g, type: 'math' },            // 多行数学公式
        { pattern: /\$[^$\n]+\$/g, type: 'inline-math' },          // 行内数学公式
    ]

    function makeElement(type=String, data=String, route=Boolean, href=String) {
      switch (type) {
        case 'MARK':
          CORE_RULE.MARK_ROLE.lastIndex = 0;
          let mark = CORE_RULE.MARK_ROLE.exec(data);
          return `<mark data-ac-remind="${mark[1]}">${mark[2]}</mark>`
          break;
      
        case 'WAY':
          CORE_RULE.WAY.lastIndex = 0;
          let way = CORE_RULE.WAY.exec(data);
          let way_mark = route ? `<a href="${href}" data-ac-role="${way[2]}">${way[1]}</a>` : `<a data-ac-role=${way[2]}>${way[1]}</a>`;
          let way_ = way.input.replaceAll(way[0],way_mark);
          return way_;
          break;

        default:
          return data;
          break;
      }
      return data
    }

    function useCoreRoute(role=String){
      const haveRole = Object.keys(vm.route.query).includes('role');
      const fullQuery = window.location.href.split('?')[1] === undefined ? '' : `?${window.location.href.split('?')[1]}`;

      // A 方案：无法通过地址栏触发 role 查询，只能通过 a 标签元素触发查询。
      // B 方案：可以通过 地址栏 和 a 标签元素触发查询。
      const R_A = null  
      const R_B = haveRole ? `#${vm.route.path}?${fullQuery}` : `#${vm.route.path}?${fullQuery}&role=${role}`
      return {R_A, R_B}
    }

    function useCoreCOM(line=String,route=false) {
      let mark = CORE_RULE.MARK_ROLE.exec(line);
      let a = CORE_RULE.WAY.exec(line);

      let href = (function(){
        if(a != null){
          let t = route ? useCoreRoute(a[2]).R_B : useCoreRoute(a[2]).R_A;
          return t;
        }else{
          // 不属于 WAY 语法，此处仅为类型断言的系统一致性兜底写法，实际上一般情况下用不到。
          let t = route ? useCoreRoute('defualt').R_B : useCoreRoute('defualt').R_A;
          return t;
        }
      })();

      //  ==[viewer] 如果你希望查看与之不同的内容，请 [切换到 user 视角](@?user) ==
      // mark[1] = viewer
      // mark[2] =  如果你希望查看与之不同的内容，请 [切换到 user 视角](@?user) 
      if(mark != null){
        CORE_RULE.WAY.lastIndex = 0;
        let se = CORE_RULE.WAY.exec(mark[2]);
        const cache = {
          type: 'MARK',
          text: se === null ? mark[2] : makeElement('WAY', mark[2], route, href),
          role: mark[1]
        }
        return cache;
      }

      // console.log(a);
      // [==[viewer] viewer 角色才能看到高亮==，如果看不到，可点击本行文本强制切换到 Viewer 视角==](@?viewer)
      // a[1] = ==[viewer] viewer 角色才能看到高亮==，如果看不到，可点击本行文本强制切换到 Viewer 视角==
      // a[2] = viewer
      // console.log(a)
      if(a != null)
      {
        // 全局模式(g) 重置
        CORE_RULE.MARK_ROLE.lastIndex = 0;
        let se = CORE_RULE.MARK_ROLE.exec(a[1]);
        const cache = {
          type: 'WAY',
          text: se === null ? a[1] : makeElement('MARK', a[1], route, href),
          role: a[2],
          href: href,
          origin: line,
          origin_OK:a[0]
        }
        return cache;
      }

      a = null;
      mark = null;
      return {
        type: null
      }
    }

    function useCoreMaker(data=JSON) {
      switch (data.type) {
        case 'WAY':
          let realText = data.text;
          let rootElement = 'a'
          // console.log(data);
          if(data.origin.slice(0,2) === '=='){
            CORE_RULE.MARK_WAY.lastIndex = 0;
            realText = CORE_RULE.MARK_WAY.exec(data.origin) !== null
              ? origin.replace(data.origin_OK, `<a href="${data.href}" data-ac-role="${data.role}">${data.text}</a>`)
              : origin;
            rootElement = 'mark';
          }

          if(rootElement === 'a'){
            return `<${rootElement}${data.href == null ? '' : ' href='+'"'+ data.href +'"'} role="${data.role}">${realText}</${rootElement}>`
          }else{
            return `<${rootElement}>${realText}</${rootElement}>`
          }
          break;

        case 'MARK':
          return `<mark data-ac-remind="${data.role}">${data.text}</mark>`
          break;
        
        case null:
          return null;
          break;

        default:
          return null;
          break;
      }
    }

    // Docsify 脚本初始化时，执行一次
    hook.init(function () {
      // ...
    });

    // Docsify 实例挂载到 DOM 节点上时，执行一次
    hook.mounted(function () {
      // ...
    });

    // 每次页面加载时，在新的 Markdown 转换为 HTML 之前执行
    // 支持执行异步任务（可参考 beforeEach 官方文档了解详情）
    hook.beforeEach(function (markdown) {
      // ...
      let content = markdown.split('\r\n');
      const useRoute = content[0] === '<!-- areaclick:Route -->' ? true : false;
      let i = 0;
            
      for(const line of content){
        // useCoreCOM(line, useRoute)
        // console.log(useCoreCOM(line, useRoute));
        let result = useCoreMaker(useCoreCOM(line, useRoute));
        if(result != null){
          content[i] = result;
        }
        i++;
      }

      if(Array.isArray(content)){
        content = content.map(item => item || "").join('\r\n')
      }

      return content;
    });

    // 每次页面加载时，在新的 Markdown 转换为 HTML 之后执行
    // 支持执行异步任务（可参考 afterEach 官方文档了解详情）
    hook.afterEach(function (html) {
      // ...
      return html;
    });

    // 每次页面加载时，在新的 HTML 追加到 DOM 节点之后执行
    hook.doneEach(function () {
      // ...
    });

    // 初始页面渲染完成后，执行一次
    hook.ready(function () {
      // ...
    });
  };

  // 将自定义插件添加到 Docsify 的插件数组中
  $docsify = $docsify || {};
  $docsify.plugins = [].concat(areaclick, $docsify.plugins || []);
})();