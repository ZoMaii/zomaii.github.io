# zomaii.github.io

This is a public site which storages documents about [opts.host](https://opts.host).



# The open-source Docsify plugin

I've written several plugins to enhance the reading experience, located in the `docs/_DOCS` directory. All are licensed under _GPLv3_ .

## Dark Theme
> Automatically adjusts the page theme based on your local time. (Auto, light, dark)

### **Usage:**
Add the following element to the `<head>` of your `index.html`:
```html
<link rel="stylesheet" href="//cdn.jsdelivr.net/npm/docsify/themes/vue.css" id="docsify-theme">
<script src="_DOCS/dark/plugins.dark.js"></script>
```

### **Custom:** 
start time, style, animation color, position, times...
```js
window.$docsify = {
    ...
    opts_host_darkmod:{
        lightStart: 7,
        darkStart: 19,
        lightThemeUrl: document.querySelector('link#docsify-theme').href,
        darkThemeUrl: 'https://cdn.jsdelivr.net/npm/docsify/themes/dark.css',
        lightColor: '#42b983',
        darkColor: '#ea6f5a',
        statusBar: true,
        statusBarPosition: 'bottom-right',
        showUtcTime: false,
    }
    ...
}
```


## areaclick
> Read the file with a predefined identity. 

### **Usage:**

**index.html:**
```html
<link rel="stylesheet" href="./_DOCS/areaclick/areaclick.css">
<script src="_DOCS/areaclick/plugins.click.js"></script>
```

**source file:**
```md
> choose your role.
> [Tom](@?tom)
> [Jerry](@?jerry)

== Tom and Jerry agreed to meet up on Friday (this part will not be highlighted) ==
== [tom] Jerry, any plans? ==
== [jerry] Let's play basketball ==
```

This feature is specific to a Markdown dialect and imposes requirements on the source file content.  It may not be compatible with other plugins.