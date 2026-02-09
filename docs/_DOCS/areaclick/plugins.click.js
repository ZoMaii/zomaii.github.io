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
 *          如果对于 $$ 或 ``` 的包裹状态已做了提前的预处理。此插件不会处理这部分内容。
 *          如果本身不支持 Latex 或插件已失效，那么 $(to temp)[@?temp]$ 就会被 Docsify 默认的 marked 引擎正常解析！可能出现意料之外的情况
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
     * beforeEach > 按行处理，然后查验是否处于封禁名单，最后解析为 view 级别。
     * doneEach > 全 HTML 文档扫描，针对性构造触发器。
     * 
     * 
     * [vscode] md-maic 0.1.x 纯 REGEX 流的行处理方案，不含单字符扫描功能。
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

    const BAN = {
      // $...$ 和 `...` 的单独筛选
      Latex        : /(?<!\$)\$(?!\$).*?(?<!\$)\$(?!\$)/g,
      code         : /(?<!`)`(?!`).*?(?<!`)`(?!`)/g,
      // $$...$$ 和 ```...``` 的筛选
      Latex_inline : /\$\$(.*)\$\$/g,
      code_inline  : /```(.*)```/g,
      // 特殊多位触发器
      code_multi_A : /```[a-zA-Z0-9!@#$%^&*()_+=\-\\/,.*:;'"[\]{}?]+\r/g,
      // 多位
      multi        : ['```','$$'],
      // 全局重置位，后续若有新增直接在这里填写，方便统一管理
      resetAll     : function(){
        BAN.Latex.lastIndex = 0;
        BAN.Latex_inline.lastIndex = 0;
        BAN.code.lastIndex = 0;
        BAN.code_inline.lastIndex = 0;
        BAN.code_multi_A.lastIndex = 0;
      }
    }

    let G_useRoute = false;
    let isMulti_Start = false;

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
      // 一次性构造交付方案，需要注意地址栏原有的状态。
      // role 实时角色，vm.route.query.role 为地址栏角色，vm.route.query.id 为地址栏锚点。

      // A 方案：未启用地址栏查询功能，不构造 a 的 href 属性。即只能点击 a 元素实现显示功能，不附加到地址栏
      // B 方案：启用地址栏查询功能，构造 a 的 href 属性。即可以通过 地址栏 和点击 a 标签元素触发查询。
      const R_A = null 
      const R_B = `#${vm.route.path}?${vm.route.query.id === undefined ? '' : 'id='+vm.route.query.id+'&'}role=${role}`
      return {R_A, R_B}
    }

    function useCoreCOM(line=String,route=false) {
      // 稽查黑名单是否出现
      BAN.resetAll();
      // 步骤一、核验是否属于特殊框架内
      let B_raw = BAN.multi.includes(line.trim());
      let B_raw_lang = BAN.code_multi_A.test(line);
      if(B_raw){
        isMulti_Start = !isMulti_Start;
      }
      if(isMulti_Start === false && B_raw_lang)
      {
        isMulti_Start = true;
      }

      if(isMulti_Start) return { type: null }

      // 步骤二，查验单一/多种情况
      if 
      (
        BAN.Latex.test(line) || 
        BAN.code.test(line) || 
        BAN.Latex_inline.test(line) || 
        BAN.code_inline.test(line)
      )
      {
          return { type: null };
      }

      // 正常解析
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

      // 清除可能存在的缓存
      a = null;
      mark = null;
      return {
        type: null
      }
    }

    function useCoreMaker(data=JSON) {
      if(data.type === "WAY")
      {
        // 兼容性修复
        let result = data.origin.replaceAll(data.origin_OK,`<a${data.href === null ? '' : ' href="'+data.href+'"'} data-ac-role="${data.role}">${data.text}</a>`)
        if(result.slice(0,2) === "=="){
          CORE_RULE.MARK_WAY.lastIndex = 0;
          result = CORE_RULE.MARK_WAY.exec(result) === null ? result : result.replace('==','<mark>').replace('==','</mark>');
        }
        return result;
      }
      else if(data.type === "MARK")
      {
        return `<mark data-ac-remind="${data.role}">${data.text}</mark>`
      }
      else
      {
        return null;
      }
      return null;
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
      // [XHR] 不同操作系统文件兼容，CRLF 标准统一化处理。
      const normalizedMarkdown = markdown.replace(/(?:\r\n|\r|\n)/g, '\r\n'); 

      // 正常逻辑
      let content = normalizedMarkdown.split('\n');
      const useRoute = content[0] === '<!-- areaclick:Route -->\r' ? true : false;
      // 更新全局状态
      G_useRoute = useRoute;
      // 创建预备行号，待修改状态
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
        // 取消 \r 回车符，避免 markdown 解析不一致
        content = content.map(item => item).join('\n')
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
      let allTigger = document.querySelectorAll('a[data-ac-role]');
      let allMarked = document.querySelectorAll('mark[data-ac-remind]');

      // 核心点击部分，默认装载。
      allTigger.forEach(element => {
        element.addEventListener('click',()=>{
          const role = element.getAttribute('data-ac-role');

          allMarked.forEach(marked => {
            const remind = marked.getAttribute('data-ac-remind');

            if(role === remind){
              marked.style.backgroundColor = '#FFFF00';
            }else{
              marked.style.backgroundColor = 'initial';
            }
          });
        });
      });
      
      // 发生于 Docsify SPA 应用被整体刷新的情况。
      // 不重载网页，不向 HTTP服务器 发出跳转请求不生效。
      if(G_useRoute){
        // 启用路由
        let role = vm.route.query.role;
        document.querySelectorAll('mark[data-ac-remind]').forEach((el)=>{
          if(el.getAttribute('data-ac-remind') === role){
            el.style.backgroundColor = '#FFFF00';
          } else {
            el.style.backgroundColor = 'initial';
          }
        });
      }

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