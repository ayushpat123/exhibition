(this.webpackJsonpexhibition=this.webpackJsonpexhibition||[]).push([[3],{11:function(A,t,e){},22:function(A,t,e){},24:function(A,t,e){var n={"./Art1":[17,0,1],"./Art1.js":[17,0,1],"./Art2":[16,0,2],"./Art2.js":[16,0,2]};function i(A){if(!e.o(n,A))return Promise.resolve().then((function(){var t=new Error("Cannot find module '"+A+"'");throw t.code="MODULE_NOT_FOUND",t}));var t=n[A],i=t[0];return Promise.all(t.slice(1).map(e.e)).then((function(){return e(i)}))}i.keys=function(){return Object.keys(n)},i.id=24,A.exports=i},25:function(A,t,e){},29:function(A,t,e){"use strict";e.r(t);var n=e(0),i=e.n(n),r=e(6),g=e.n(r),c=(e(22),e(33)),o=e(32),a=(e(11),e(1));var s=function(A){var t=A.number.toString(),r=i.a.lazy((function(){return e(24)("./Art"+t)})),g=300,c=300,o=50;A.gap&&(o=A.gap),A.x&&(g=A.x,g+=(g/300-1)*o);var s=(g+o)/(300+o);A.y&&(c=A.y,c+=(c/300-1)*o);var d=c/10+o/10,m={backgroundColor:"#111214",height:c.toString()+"px",width:g.toString()+"px",gridRowEnd:"span "+d.toString(),gridColumnEnd:"span "+s.toString()};return Object(a.jsx)("div",{className:"card",style:m,children:Object(a.jsx)("div",{className:"card__body",children:Object(a.jsx)(n.Suspense,{fallback:Object(a.jsx)("div",{}),children:Object(a.jsx)(r,{x:g,y:c})})})})};var d=function(A){var t=300,e=300,n=50;A.gap&&(n=A.gap),A.x&&(t=A.x,t+=(t/300-1)*n);var i=(t+n)/(300+n);A.y&&(e=A.y,e+=(e/300-1)*n);var r=e/10+n/10,g=e.toString()+"px",c=t.toString()+"px",o="span "+r.toString(),s="span "+i.toString(),d=A.pad+"px",m={backgroundColor:"#111214",height:g,width:c,gridRowEnd:o,gridColumnEnd:s};A.light&&(m={backgroundColor:"#F8F6F7",height:g,width:c,gridRowEnd:o,gridColumnEnd:s});var b={height:g,width:"100%",objectFit:"cover",padding:d};return Object(a.jsx)("div",{className:"card",style:m,children:Object(a.jsx)("div",{className:"card__body",children:Object(a.jsx)("img",{src:A.img,style:b,alt:""})})})},m=(e(25),e.p+"static/media/pic1.2cb415f9.jpeg"),b=e.p+"static/media/pic2.0293e94f.png",l=e(12);function B(){return{width:window.innerWidth}}var h=function(){var A,t=function(){var A=Object(n.useState)(B()),t=Object(l.a)(A,2),e=t[0],i=t[1];return Object(n.useEffect)((function(){function A(){i(B())}return window.addEventListener("resize",A),function(){return window.removeEventListener("resize",A)}}),[]),e}().width,e=50..toString()+"px",i=300,r=300;return t<500?(A={columnGap:e,padding:"1rem 0rem 2rem 0rem"},i=300,r=300):t<900?(A={columnGap:e,padding:"1rem 1rem 2rem 1rem"},i=300,r=600):t<1200?(A={columnGap:e,padding:"2rem 2rem 2rem 2rem"},i=300,r=600):(A={columnGap:e,padding:"2rem 5rem 4rem 5rem"},i=600,r=600),Object(a.jsxs)("div",{className:"App",children:[Object(a.jsx)(c.a,{bg:"light",children:Object(a.jsx)(o.a,{children:Object(a.jsx)(c.a.Brand,{className:"order-md-0 mx-auto order-1",children:Object(a.jsx)("img",{src:"data:image/png;base64,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",height:"30",className:"d-inline-block align-top",alt:"EXBT logo"})})})}),Object(a.jsxs)("div",{className:"wrapper",style:A,children:[Object(a.jsx)(s,{number:1,y:r,x:i}),Object(a.jsx)(d,{img:m,pad:"25"}),Object(a.jsx)(s,{number:2}),Object(a.jsx)(d,{img:b,pad:"50"})]})]})},j=function(A){A&&A instanceof Function&&e.e(6).then(e.bind(null,35)).then((function(t){var e=t.getCLS,n=t.getFID,i=t.getFCP,r=t.getLCP,g=t.getTTFB;e(A),n(A),i(A),r(A),g(A)}))};g.a.render(Object(a.jsx)(i.a.StrictMode,{children:Object(a.jsx)(h,{})}),document.getElementById("root")),j()}},[[29,4,5]]]);
//# sourceMappingURL=main.e5d23715.chunk.js.map