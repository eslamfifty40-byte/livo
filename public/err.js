window.onerror=function(m,s,l){document.body.innerHTML+="<pre style=color:red>"+m+" "+s+":"+l+"</pre>"}
addEventListener("unhandledrejection",function(e){document.body.innerHTML+="<pre style=color:red>"+e.reason+"</pre>"})
