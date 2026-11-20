(function(){
var box;
function show(t){try{
if(!box){box=document.createElement("div");box.style.cssText="position:fixed;bottom:0;left:0;right:0;max-height:35vh;overflow:auto;z-index:99999;background:#300;color:#fff;font:11px monospace;direction:ltr;white-space:pre-wrap;word-break:break-all;padding:6px";box.onclick=function(){box.innerHTML=""};document.body.appendChild(box)}
box.appendChild(document.createTextNode(t+"\n---\n"));
}catch(x){}}
window.onerror=function(m,s,l,c,e){show(m+" "+s+":"+l+"\n"+(e&&e.stack?e.stack.split("\n").slice(0,8).join("\n"):""))};
addEventListener("unhandledrejection",function(e){show("REJ "+e.reason)});
var oe=console.error;
console.error=function(){var a=[].slice.call(arguments);try{show("ERR "+a.map(function(x){return x&&x.message?x.message:(typeof x==="object"?JSON.stringify(x):String(x))}).join(" "))}catch(x){}oe.apply(console,a)};
})();
