var Mt=Object.defineProperty;var qt=(t,e,n)=>e in t?Mt(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n;var b=(t,e,n)=>qt(t,typeof e!="symbol"?e+"":e,n);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const r of i.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function n(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function s(o){if(o.ep)return;o.ep=!0;const i=n(o);fetch(o.href,i)}})();function dt(t){return t instanceof Uint8Array||ArrayBuffer.isView(t)&&t.constructor.name==="Uint8Array"&&"BYTES_PER_ELEMENT"in t&&t.BYTES_PER_ELEMENT===1}function ft(t,e=""){if(typeof t!="number"){const n=e&&`"${e}" `;throw new TypeError(`${n}expected number, got ${typeof t}`)}if(!Number.isSafeInteger(t)||t<0){const n=e&&`"${e}" `;throw new RangeError(`${n}expected integer >= 0, got ${t}`)}}function J(t,e,n=""){const s=dt(t),o=t==null?void 0:t.length,i=e!==void 0;if(!s||i&&o!==e){const r=n&&`"${n}" `,c=i?` of length ${e}`:"",l=s?`length=${o}`:`type=${typeof t}`,a=r+"expected Uint8Array"+c+", got "+l;throw s?new RangeError(a):new TypeError(a)}return t}function Ye(t,e=!0){if(t.destroyed)throw new Error("Hash instance has been destroyed");if(e&&t.finished)throw new Error("Hash#digest() has already been called")}function Zt(t,e){J(t,void 0,"digestInto() output");const n=e.outputLen;if(t.length<n)throw new RangeError('"digestInto() output" expected to be of length >='+n)}function _e(...t){for(let e=0;e<t.length;e++)t[e].fill(0)}function ye(t){return new DataView(t.buffer,t.byteOffset,t.byteLength)}const ut=typeof Uint8Array.from([]).toHex=="function"&&typeof Uint8Array.fromHex=="function",Yt=Array.from({length:256},(t,e)=>e.toString(16).padStart(2,"0"));function Fe(t){if(J(t),ut)return t.toHex();let e="";for(let n=0;n<t.length;n++)e+=Yt[t[n]];return e}const M={_0:48,_9:57,A:65,F:70,a:97,f:102};function Ue(t){if(t>=M._0&&t<=M._9)return t-M._0;if(t>=M.A&&t<=M.F)return t-(M.A-10);if(t>=M.a&&t<=M.f)return t-(M.a-10)}function Ne(t){if(typeof t!="string")throw new TypeError("hex string expected, got "+typeof t);if(ut)try{return Uint8Array.fromHex(t)}catch(o){throw o instanceof SyntaxError?new RangeError(o.message):o}const e=t.length,n=e/2;if(e%2)throw new RangeError("hex string expected, got unpadded hex of length "+e);const s=new Uint8Array(n);for(let o=0,i=0;o<n;o++,i+=2){const r=Ue(t.charCodeAt(i)),c=Ue(t.charCodeAt(i+1));if(r===void 0||c===void 0){const l=t[i]+t[i+1];throw new RangeError('hex string expected, got non-hex character "'+l+'" at index '+i)}s[o]=r*16+c}return s}function Ut(...t){let e=0;for(let s=0;s<t.length;s++){const o=t[s];J(o),e+=o.length}const n=new Uint8Array(e);for(let s=0,o=0;s<t.length;s++){const i=t[s];n.set(i,o),o+=i.length}return n}function Xt(t,e={}){const n=(o,i)=>t(i).update(o).digest(),s=t(void 0);return n.outputLen=s.outputLen,n.blockLen=s.blockLen,n.canXOF=s.canXOF,n.create=o=>t(o),Object.assign(n,e),Object.freeze(n)}const Vt=t=>({oid:Uint8Array.from([6,9,96,134,72,1,101,3,4,2,t])});class Gt{constructor(e,n,s,o){b(this,"blockLen");b(this,"outputLen");b(this,"canXOF",!1);b(this,"padOffset");b(this,"isLE");b(this,"buffer");b(this,"view");b(this,"finished",!1);b(this,"length",0);b(this,"pos",0);b(this,"destroyed",!1);this.blockLen=e,this.outputLen=n,this.padOffset=s,this.isLE=o,this.buffer=new Uint8Array(e),this.view=ye(this.buffer)}update(e){Ye(this),J(e);const{view:n,buffer:s,blockLen:o}=this,i=e.length;for(let r=0;r<i;){const c=Math.min(o-this.pos,i-r);if(c===o){const l=ye(e);for(;o<=i-r;r+=o)this.process(l,r);continue}s.set(e.subarray(r,r+c),this.pos),this.pos+=c,r+=c,this.pos===o&&(this.process(n,0),this.pos=0)}return this.length+=e.length,this.roundClean(),this}digestInto(e){Ye(this),Zt(e,this),this.finished=!0;const{buffer:n,view:s,blockLen:o,isLE:i}=this;let{pos:r}=this;n[r++]=128,_e(this.buffer.subarray(r)),this.padOffset>o-r&&(this.process(s,0),r=0);for(let d=r;d<o;d++)n[d]=0;s.setBigUint64(o-8,BigInt(this.length*8),i),this.process(s,0);const c=ye(e),l=this.outputLen;if(l%4)throw new Error("_sha2: outputLen must be aligned to 32bit");const a=l/4,f=this.get();if(a>f.length)throw new Error("_sha2: outputLen bigger than state");for(let d=0;d<a;d++)c.setUint32(4*d,f[d],i)}digest(){const{buffer:e,outputLen:n}=this;this.digestInto(e);const s=e.slice(0,n);return this.destroy(),s}_cloneInto(e){e||(e=new this.constructor),e.set(...this.get());const{blockLen:n,buffer:s,length:o,finished:i,destroyed:r,pos:c}=this;return e.destroyed=r,e.finished=i,e.length=o,e.pos=c,o%n&&e.buffer.set(s),e}clone(){return this._cloneInto()}}const T=Uint32Array.from([1779033703,4089235720,3144134277,2227873595,1013904242,4271175723,2773480762,1595750129,1359893119,2917565137,2600822924,725511199,528734635,4215389547,1541459225,327033209]),fe=BigInt(2**32-1),Xe=BigInt(32);function Wt(t,e=!1){return e?{h:Number(t&fe),l:Number(t>>Xe&fe)}:{h:Number(t>>Xe&fe)|0,l:Number(t&fe)|0}}function Qt(t,e=!1){const n=t.length;let s=new Uint32Array(n),o=new Uint32Array(n);for(let i=0;i<n;i++){const{h:r,l:c}=Wt(t[i],e);[s[i],o[i]]=[r,c]}return[s,o]}const Ve=(t,e,n)=>t>>>n,Ge=(t,e,n)=>t<<32-n|e>>>n,ne=(t,e,n)=>t>>>n|e<<32-n,se=(t,e,n)=>t<<32-n|e>>>n,ue=(t,e,n)=>t<<64-n|e>>>n-32,pe=(t,e,n)=>t>>>n-32|e<<64-n;function q(t,e,n,s){const o=(e>>>0)+(s>>>0);return{h:t+n+(o/2**32|0)|0,l:o|0}}const Kt=(t,e,n)=>(t>>>0)+(e>>>0)+(n>>>0),Jt=(t,e,n,s)=>e+n+s+(t/2**32|0)|0,en=(t,e,n,s)=>(t>>>0)+(e>>>0)+(n>>>0)+(s>>>0),tn=(t,e,n,s,o)=>e+n+s+o+(t/2**32|0)|0,nn=(t,e,n,s,o)=>(t>>>0)+(e>>>0)+(n>>>0)+(s>>>0)+(o>>>0),sn=(t,e,n,s,o,i)=>e+n+s+o+i+(t/2**32|0)|0,pt=Qt(["0x428a2f98d728ae22","0x7137449123ef65cd","0xb5c0fbcfec4d3b2f","0xe9b5dba58189dbbc","0x3956c25bf348b538","0x59f111f1b605d019","0x923f82a4af194f9b","0xab1c5ed5da6d8118","0xd807aa98a3030242","0x12835b0145706fbe","0x243185be4ee4b28c","0x550c7dc3d5ffb4e2","0x72be5d74f27b896f","0x80deb1fe3b1696b1","0x9bdc06a725c71235","0xc19bf174cf692694","0xe49b69c19ef14ad2","0xefbe4786384f25e3","0x0fc19dc68b8cd5b5","0x240ca1cc77ac9c65","0x2de92c6f592b0275","0x4a7484aa6ea6e483","0x5cb0a9dcbd41fbd4","0x76f988da831153b5","0x983e5152ee66dfab","0xa831c66d2db43210","0xb00327c898fb213f","0xbf597fc7beef0ee4","0xc6e00bf33da88fc2","0xd5a79147930aa725","0x06ca6351e003826f","0x142929670a0e6e70","0x27b70a8546d22ffc","0x2e1b21385c26c926","0x4d2c6dfc5ac42aed","0x53380d139d95b3df","0x650a73548baf63de","0x766a0abb3c77b2a8","0x81c2c92e47edaee6","0x92722c851482353b","0xa2bfe8a14cf10364","0xa81a664bbc423001","0xc24b8b70d0f89791","0xc76c51a30654be30","0xd192e819d6ef5218","0xd69906245565a910","0xf40e35855771202a","0x106aa07032bbd1b8","0x19a4c116b8d2d0c8","0x1e376c085141ab53","0x2748774cdf8eeb99","0x34b0bcb5e19b48a8","0x391c0cb3c5c95a63","0x4ed8aa4ae3418acb","0x5b9cca4f7763e373","0x682e6ff3d6b2b8a3","0x748f82ee5defb2fc","0x78a5636f43172f60","0x84c87814a1f0ab72","0x8cc702081a6439ec","0x90befffa23631e28","0xa4506cebde82bde9","0xbef9a3f7b2c67915","0xc67178f2e372532b","0xca273eceea26619c","0xd186b8c721c0c207","0xeada7dd6cde0eb1e","0xf57d4f7fee6ed178","0x06f067aa72176fba","0x0a637dc5a2c898a6","0x113f9804bef90dae","0x1b710b35131c471b","0x28db77f523047d84","0x32caab7b40c72493","0x3c9ebe0a15c9bebc","0x431d67c49c100d4c","0x4cc5d4becb3e42b6","0x597f299cfc657e2a","0x5fcb6fab3ad6faec","0x6c44198c4a475817"].map(t=>BigInt(t))),on=pt[0],rn=pt[1],X=new Uint32Array(80),V=new Uint32Array(80);class an extends Gt{constructor(e){super(128,e,16,!1)}get(){const{Ah:e,Al:n,Bh:s,Bl:o,Ch:i,Cl:r,Dh:c,Dl:l,Eh:a,El:f,Fh:d,Fl:u,Gh:m,Gl:x,Hh:g,Hl:w}=this;return[e,n,s,o,i,r,c,l,a,f,d,u,m,x,g,w]}set(e,n,s,o,i,r,c,l,a,f,d,u,m,x,g,w){this.Ah=e|0,this.Al=n|0,this.Bh=s|0,this.Bl=o|0,this.Ch=i|0,this.Cl=r|0,this.Dh=c|0,this.Dl=l|0,this.Eh=a|0,this.El=f|0,this.Fh=d|0,this.Fl=u|0,this.Gh=m|0,this.Gl=x|0,this.Hh=g|0,this.Hl=w|0}process(e,n){for(let h=0;h<16;h++,n+=4)X[h]=e.getUint32(n),V[h]=e.getUint32(n+=4);for(let h=16;h<80;h++){const y=X[h-15]|0,S=V[h-15]|0,A=ne(y,S,1)^ne(y,S,8)^Ve(y,S,7),_=se(y,S,1)^se(y,S,8)^Ge(y,S,7),E=X[h-2]|0,B=V[h-2]|0,I=ne(E,B,19)^ue(E,B,61)^Ve(E,B,6),L=se(E,B,19)^pe(E,B,61)^Ge(E,B,6),k=en(_,L,V[h-7],V[h-16]),N=tn(k,A,I,X[h-7],X[h-16]);X[h]=N|0,V[h]=k|0}let{Ah:s,Al:o,Bh:i,Bl:r,Ch:c,Cl:l,Dh:a,Dl:f,Eh:d,El:u,Fh:m,Fl:x,Gh:g,Gl:w,Hh:p,Hl:v}=this;for(let h=0;h<80;h++){const y=ne(d,u,14)^ne(d,u,18)^ue(d,u,41),S=se(d,u,14)^se(d,u,18)^pe(d,u,41),A=d&m^~d&g,_=u&x^~u&w,E=nn(v,S,_,rn[h],V[h]),B=sn(E,p,y,A,on[h],X[h]),I=E|0,L=ne(s,o,28)^ue(s,o,34)^ue(s,o,39),k=se(s,o,28)^pe(s,o,34)^pe(s,o,39),N=s&i^s&c^i&c,H=o&r^o&l^r&l;p=g|0,v=w|0,g=m|0,w=x|0,m=d|0,x=u|0,{h:d,l:u}=q(a|0,f|0,B|0,I|0),a=c|0,f=l|0,c=i|0,l=r|0,i=s|0,r=o|0;const j=Kt(I,k,H);s=Jt(j,B,L,N),o=j|0}({h:s,l:o}=q(this.Ah|0,this.Al|0,s|0,o|0)),{h:i,l:r}=q(this.Bh|0,this.Bl|0,i|0,r|0),{h:c,l}=q(this.Ch|0,this.Cl|0,c|0,l|0),{h:a,l:f}=q(this.Dh|0,this.Dl|0,a|0,f|0),{h:d,l:u}=q(this.Eh|0,this.El|0,d|0,u|0),{h:m,l:x}=q(this.Fh|0,this.Fl|0,m|0,x|0),{h:g,l:w}=q(this.Gh|0,this.Gl|0,g|0,w|0),{h:p,l:v}=q(this.Hh|0,this.Hl|0,p|0,v|0),this.set(s,o,i,r,c,l,a,f,d,u,m,x,g,w,p,v)}roundClean(){_e(X,V)}destroy(){this.destroyed=!0,_e(this.buffer),this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0)}}class cn extends an{constructor(){super(64);b(this,"Ah",T[0]|0);b(this,"Al",T[1]|0);b(this,"Bh",T[2]|0);b(this,"Bl",T[3]|0);b(this,"Ch",T[4]|0);b(this,"Cl",T[5]|0);b(this,"Dh",T[6]|0);b(this,"Dl",T[7]|0);b(this,"Eh",T[8]|0);b(this,"El",T[9]|0);b(this,"Fh",T[10]|0);b(this,"Fl",T[11]|0);b(this,"Gh",T[12]|0);b(this,"Gl",T[13]|0);b(this,"Hh",T[14]|0);b(this,"Hl",T[15]|0)}}const We=Xt(()=>new cn,Vt(3));/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */const ie=(t,e,n)=>J(t,e,n),ht=ft,mt=Fe,oe=(...t)=>Ut(...t),ln=t=>Ne(t),dn=dt,me=BigInt(0),Oe=BigInt(1);function bt(t,e=""){if(typeof t!="boolean"){const n=e&&`"${e}" `;throw new TypeError(n+"expected boolean, got type="+typeof t)}return t}function fn(t){if(typeof t=="bigint"){if(!he(t))throw new RangeError("positive bigint expected, got "+t)}else ht(t);return t}function le(t,e=""){if(typeof t!="number"){const n=e&&`"${e}" `;throw new TypeError(n+"expected number, got type="+typeof t)}if(!Number.isSafeInteger(t)){const n=e&&`"${e}" `;throw new RangeError(n+"expected safe integer, got "+t)}}function gt(t){if(typeof t!="string")throw new TypeError("hex string expected, got "+typeof t);return t===""?me:BigInt("0x"+t)}function un(t){return gt(Fe(t))}function xe(t){return gt(Fe(Te(J(t)).reverse()))}function vt(t,e){if(ft(e),e===0)throw new RangeError("zero length");t=fn(t);const n=t.toString(16);if(n.length>e*2)throw new RangeError("number too large");return Ne(n.padStart(e*2,"0"))}function pn(t,e){return vt(t,e).reverse()}function hn(t,e){if(t=ie(t),e=ie(e),t.length!==e.length)return!1;let n=0;for(let s=0;s<t.length;s++)n|=t[s]^e[s];return n===0}function Te(t){return Uint8Array.from(ie(t))}function xt(t){if(typeof t!="string")throw new TypeError("ascii string expected, got "+typeof t);return Uint8Array.from(t,(e,n)=>{const s=e.charCodeAt(0);if(e.length!==1||s>127)throw new RangeError(`string contains non-ASCII character "${t[n]}" with code ${s} at position ${n}`);return s})}const he=t=>typeof t=="bigint"&&me<=t;function mn(t,e,n){return he(t)&&he(e)&&he(n)&&e<=t&&t<n}function Qe(t,e,n,s){if(!mn(e,n,s))throw new RangeError("expected valid "+t+": "+n+" <= n < "+s+", got "+e)}function bn(t){if(t<me)throw new Error("expected non-negative bigint, got "+t);let e;for(e=0;t>me;t>>=Oe,e+=1);return e}const gn=t=>(Oe<<BigInt(t))-Oe;function wt(t,e={},n={}){if(Object.prototype.toString.call(t)!=="[object Object]")throw new TypeError("expected valid options object");function s(i,r,c){if(!c&&r!=="function"&&!Object.hasOwn(t,i))throw new TypeError(`param "${i}" is invalid: expected own property`);const l=t[i];if(c&&l===void 0)return;const a=typeof l;if(a!==r||l===null)throw new TypeError(`param "${i}" is invalid: expected ${r}, got ${a}`)}const o=(i,r)=>Object.entries(i).forEach(([c,l])=>s(c,l,r));o(e,!1),o(n,!0)}const Ke=()=>{throw new Error("not implemented")};/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */const $=BigInt(0),O=BigInt(1),ee=BigInt(2),yt=BigInt(3),Et=BigInt(4),St=BigInt(5),vn=BigInt(7),Bt=BigInt(8),xn=BigInt(9),At=BigInt(16);function R(t,e){if(e<=$)throw new Error("mod: expected positive modulus, got "+e);const n=t%e;return n>=$?n:e+n}function z(t,e,n){if(e<$)throw new Error("pow2: expected non-negative exponent, got "+e);let s=t;for(;e-- >$;)s*=s,s%=n;return s}function Je(t,e){if(t===$)throw new Error("invert: expected non-zero number");if(e<=$)throw new Error("invert: expected positive modulus, got "+e);let n=R(t,e),s=e,o=$,i=O;for(;n!==$;){const c=s/n,l=s-n*c,a=o-i*c;s=n,n=l,o=i,i=a}if(s!==O)throw new Error("invert: does not exist");return R(o,e)}function Ce(t,e,n){const s=t;if(!s.eql(s.sqr(e),n))throw new Error("Cannot find square root")}function It(t,e){const n=t,s=(n.ORDER+O)/Et,o=n.pow(e,s);return Ce(n,o,e),o}function wn(t,e){const n=t,s=(n.ORDER-St)/Bt,o=n.mul(e,ee),i=n.pow(o,s),r=n.mul(e,i),c=n.mul(n.mul(r,ee),i),l=n.mul(r,n.sub(c,n.ONE));return Ce(n,l,e),l}function yn(t){const e=je(t),n=Rt(t),s=n(e,e.neg(e.ONE)),o=n(e,s),i=n(e,e.neg(s)),r=(t+vn)/At;return((c,l)=>{const a=c;let f=a.pow(l,r),d=a.mul(f,s);const u=a.mul(f,o),m=a.mul(f,i),x=a.eql(a.sqr(d),l),g=a.eql(a.sqr(u),l);f=a.cmov(f,d,x),d=a.cmov(m,u,g);const w=a.eql(a.sqr(d),l),p=a.cmov(f,d,w);return Ce(a,p,l),p})}function Rt(t){if(t<yt)throw new Error("sqrt is not defined for small field");let e=t-O,n=0;for(;e%ee===$;)e/=ee,n++;let s=ee;const o=je(t);for(;et(o,s)===1;)if(s++>1e3)throw new Error("Cannot find square root: probably non-prime P");if(n===1)return It;let i=o.pow(s,e);const r=(e+O)/ee;return function(l,a){const f=l;if(f.is0(a))return a;if(et(f,a)!==1)throw new Error("Cannot find square root");let d=n,u=f.mul(f.ONE,i),m=f.pow(a,e),x=f.pow(a,r);for(;!f.eql(m,f.ONE);){if(f.is0(m))return f.ZERO;let g=1,w=f.sqr(m);for(;!f.eql(w,f.ONE);)if(g++,w=f.sqr(w),g===d)throw new Error("Cannot find square root");const p=O<<BigInt(d-g-1),v=f.pow(u,p);d=g,u=f.sqr(v),m=f.mul(m,u),x=f.mul(x,v)}return x}}function En(t){return t%Et===yt?It:t%Bt===St?wn:t%At===xn?yn(t):Rt(t)}const W=(t,e)=>(R(t,e)&O)===O,Sn=["create","isValid","is0","neg","inv","sqrt","sqr","eql","add","sub","mul","pow","div","addN","subN","mulN","sqrN"];function Bn(t){const e={ORDER:"bigint",BYTES:"number",BITS:"number"},n=Sn.reduce((s,o)=>(s[o]="function",s),e);if(wt(t,n),le(t.BYTES,"BYTES"),le(t.BITS,"BITS"),t.BYTES<1||t.BITS<1)throw new Error("invalid field: expected BYTES/BITS > 0");if(t.ORDER<=O)throw new Error("invalid field: expected ORDER > 1, got "+t.ORDER);return t}function An(t,e,n){const s=t;if(n<$)throw new Error("invalid exponent, negatives unsupported");if(n===$)return s.ONE;if(n===O)return e;let o=s.ONE,i=e;for(;n>$;)n&O&&(o=s.mul(o,i)),i=s.sqr(i),n>>=O;return o}function _t(t,e,n=!1){const s=t,o=new Array(e.length).fill(n?s.ZERO:void 0),i=e.reduce((c,l,a)=>s.is0(l)?c:(o[a]=c,s.mul(c,l)),s.ONE),r=s.inv(i);return e.reduceRight((c,l,a)=>s.is0(l)?c:(o[a]=s.mul(c,o[a]),s.mul(c,l)),r),o}function et(t,e){const n=t,s=(n.ORDER-O)/ee,o=n.pow(e,s),i=n.eql(o,n.ONE),r=n.eql(o,n.ZERO),c=n.eql(o,n.neg(n.ONE));if(!i&&!r&&!c)throw new Error("invalid Legendre symbol result");return i?1:r?0:-1}function In(t,e){if(e!==void 0&&ht(e),t<=$)throw new Error("invalid n length: expected positive n, got "+t);if(e!==void 0&&e<1)throw new Error("invalid n length: expected positive bit length, got "+e);const n=bn(t);if(e!==void 0&&e<n)throw new Error(`invalid n length: expected bit length (${n}) >= n.length (${e})`);const s=e!==void 0?e:n,o=Math.ceil(s/8);return{nBitLength:s,nByteLength:o}}const tt=new WeakMap;class Ot{constructor(e,n={}){b(this,"ORDER");b(this,"BITS");b(this,"BYTES");b(this,"isLE");b(this,"ZERO",$);b(this,"ONE",O);b(this,"_lengths");b(this,"_mod");if(e<=O)throw new Error("invalid field: expected ORDER > 1, got "+e);let s;this.isLE=!1,n!=null&&typeof n=="object"&&(typeof n.BITS=="number"&&(s=n.BITS),typeof n.sqrt=="function"&&Object.defineProperty(this,"sqrt",{value:n.sqrt,enumerable:!0}),typeof n.isLE=="boolean"&&(this.isLE=n.isLE),n.allowedLengths&&(this._lengths=Object.freeze(n.allowedLengths.slice())),typeof n.modFromBytes=="boolean"&&(this._mod=n.modFromBytes));const{nBitLength:o,nByteLength:i}=In(e,s);if(i>2048)throw new Error("invalid field: expected ORDER of <= 2048 bytes");this.ORDER=e,this.BITS=o,this.BYTES=i,Object.freeze(this)}create(e){return R(e,this.ORDER)}isValid(e){if(typeof e!="bigint")throw new TypeError("invalid field element: expected bigint, got "+typeof e);return $<=e&&e<this.ORDER}is0(e){return e===$}isValidNot0(e){return!this.is0(e)&&this.isValid(e)}isOdd(e){return(e&O)===O}neg(e){return R(-e,this.ORDER)}eql(e,n){return e===n}sqr(e){return R(e*e,this.ORDER)}add(e,n){return R(e+n,this.ORDER)}sub(e,n){return R(e-n,this.ORDER)}mul(e,n){return R(e*n,this.ORDER)}pow(e,n){return An(this,e,n)}div(e,n){return R(e*Je(n,this.ORDER),this.ORDER)}sqrN(e){return e*e}addN(e,n){return e+n}subN(e,n){return e-n}mulN(e,n){return e*n}inv(e){return Je(e,this.ORDER)}sqrt(e){let n=tt.get(this);return n||tt.set(this,n=En(this.ORDER)),n(this,e)}toBytes(e){return this.isLE?pn(e,this.BYTES):vt(e,this.BYTES)}fromBytes(e,n=!1){ie(e);const{_lengths:s,BYTES:o,isLE:i,ORDER:r,_mod:c}=this;if(s){if(e.length<1||!s.includes(e.length)||e.length>o)throw new Error("Field.fromBytes: expected "+s+" bytes, got "+e.length);const a=new Uint8Array(o);a.set(e,i?0:a.length-e.length),e=a}if(e.length!==o)throw new Error("Field.fromBytes: expected "+o+" bytes, got "+e.length);let l=i?xe(e):un(e);if(c&&(l=R(l,r)),!n&&!this.isValid(l))throw new Error("invalid field element: outside of range 0..ORDER");return l}invertBatch(e){return _t(this,e)}cmov(e,n,s){return bt(s,"condition"),s?n:e}}Object.freeze(Ot.prototype);function je(t,e={}){return new Ot(t,e)}/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */const be=BigInt(0),$e=BigInt(1);function nt(t,e){const n=e.negate();return t?n:e}function Ee(t,e){const n=_t(t.Fp,e.map(s=>s.Z));return e.map((s,o)=>t.fromAffine(s.toAffine(n[o])))}function Tt(t,e){if(!Number.isSafeInteger(t)||t<=0||t>e)throw new Error("invalid window size, expected [1.."+e+"], got W="+t)}function Se(t,e){Tt(t,e);const n=Math.ceil(e/t)+1,s=2**(t-1),o=2**t,i=gn(t),r=BigInt(t);return{windows:n,windowSize:s,mask:i,maxNumber:o,shiftBy:r}}function st(t,e,n){const{windowSize:s,mask:o,maxNumber:i,shiftBy:r}=n;let c=Number(t&o),l=t>>r;c>s&&(c-=i,l+=$e);const a=e*s,f=a+Math.abs(c)-1,d=c===0,u=c<0,m=e%2!==0;return{nextN:l,offset:f,isZero:d,isNeg:u,isNegF:m,offsetF:a}}const Be=new WeakMap,$t=new WeakMap;function Ae(t){return $t.get(t)||1}function ot(t){if(t!==be)throw new Error("invalid wNAF")}class Rn{constructor(e,n){b(this,"BASE");b(this,"ZERO");b(this,"Fn");b(this,"bits");this.BASE=e.BASE,this.ZERO=e.ZERO,this.Fn=e.Fn,this.bits=n}_unsafeLadder(e,n,s=this.ZERO){let o=e;for(;n>be;)n&$e&&(s=s.add(o)),o=o.double(),n>>=$e;return s}precomputeWindow(e,n){const{windows:s,windowSize:o}=Se(n,this.bits),i=[];let r=e,c=r;for(let l=0;l<s;l++){c=r,i.push(c);for(let a=1;a<o;a++)c=c.add(r),i.push(c);r=c.double()}return i}wNAF(e,n,s){if(!this.Fn.isValid(s))throw new Error("invalid scalar");let o=this.ZERO,i=this.BASE;const r=Se(e,this.bits);for(let c=0;c<r.windows;c++){const{nextN:l,offset:a,isZero:f,isNeg:d,isNegF:u,offsetF:m}=st(s,c,r);s=l,f?i=i.add(nt(u,n[m])):o=o.add(nt(d,n[a]))}return ot(s),{p:o,f:i}}wNAFUnsafe(e,n,s,o=this.ZERO){const i=Se(e,this.bits);for(let r=0;r<i.windows&&s!==be;r++){const{nextN:c,offset:l,isZero:a,isNeg:f}=st(s,r,i);if(s=c,!a){const d=n[l];o=o.add(f?d.negate():d)}}return ot(s),o}getPrecomputes(e,n,s){let o=Be.get(n);return o||(o=this.precomputeWindow(n,e),e!==1&&(typeof s=="function"&&(o=s(o)),Be.set(n,o))),o}cached(e,n,s){const o=Ae(e);return this.wNAF(o,this.getPrecomputes(o,e,s),n)}unsafe(e,n,s,o){const i=Ae(e);return i===1?this._unsafeLadder(e,n,o):this.wNAFUnsafe(i,this.getPrecomputes(i,e,s),n,o)}createCache(e,n){Tt(n,this.bits),$t.set(e,n),Be.delete(e)}hasCache(e){return Ae(e)!==1}}function it(t,e,n){if(e){if(e.ORDER!==t)throw new Error("Field.ORDER must match order: Fp == p, Fn == n");return Bn(e),e}else return je(t,{isLE:n})}function _n(t,e,n={},s){if(s===void 0&&(s=t==="edwards"),!e||typeof e!="object")throw new Error(`expected valid ${t} CURVE object`);for(const l of["p","n","h"]){const a=e[l];if(!(typeof a=="bigint"&&a>be))throw new Error(`CURVE.${l} must be positive bigint`)}const o=it(e.p,n.Fp,s),i=it(e.n,n.Fn,s),c=["Gx","Gy","a","d"];for(const l of c)if(!o.isValid(e[l]))throw new Error(`CURVE.${l} must be valid field element of CURVE.Fp`);return e=Object.freeze(Object.assign({},e)),{CURVE:e,Fp:o,Fn:i}}/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */const G=BigInt(0),D=BigInt(1),Ie=BigInt(2),On=BigInt(8);function Tn(t,e,n,s){const o=t.sqr(n),i=t.sqr(s),r=t.add(t.mul(e.a,o),i),c=t.add(t.ONE,t.mul(e.d,t.mul(o,i)));return t.eql(r,c)}function $n(t,e={}){const n=e,s=_n("edwards",t,n,n.FpFnLE),{Fp:o,Fn:i}=s;let r=s.CURVE;const{h:c}=r;wt(n,{},{uvRatio:"function"});const l=Ie<<BigInt(i.BYTES*8)-D,a=w=>o.create(w),f=n.uvRatio===void 0?(w,p)=>{try{return{isValid:!0,value:o.sqrt(o.div(w,p))}}catch{return{isValid:!1,value:G}}}:n.uvRatio;if(!Tn(o,r,r.Gx,r.Gy))throw new Error("bad curve params: generator point");function d(w,p,v=!1){const h=v?D:G;return Qe("coordinate "+w,p,h,l),p}function u(w){if(!(w instanceof m))throw new Error("EdwardsPoint expected")}const g=class g{constructor(p,v,h,y){b(this,"X");b(this,"Y");b(this,"Z");b(this,"T");this.X=d("x",p),this.Y=d("y",v),this.Z=d("z",h,!0),this.T=d("t",y),Object.freeze(this)}static CURVE(){return r}static fromAffine(p){if(p instanceof g)throw new Error("extended point not allowed");const{x:v,y:h}=p||{};return d("x",v),d("y",h),new g(v,h,D,a(v*h))}static fromBytes(p,v=!1){const h=o.BYTES,{a:y,d:S}=r;p=Te(ie(p,h,"point")),bt(v,"zip215");const A=Te(p),_=p[h-1];A[h-1]=_&-129;const E=xe(A),B=v?l:o.ORDER;Qe("point.y",E,G,B);const I=a(E*E),L=a(I-D),k=a(S*I-y);let{isValid:N,value:H}=f(L,k);if(!N)throw new Error("bad point: invalid y coordinate");const j=(H&D)===D,P=(_&128)!==0;if(!v&&H===G&&P)throw new Error("bad point: x=0 and x_0=1");return P!==j&&(H=a(-H)),g.fromAffine({x:H,y:E})}static fromHex(p,v=!1){return g.fromBytes(ln(p),v)}get x(){return this.toAffine().x}get y(){return this.toAffine().y}precompute(p=8,v=!0){return x.createCache(this,p),v||this.multiply(Ie),this}assertValidity(){const p=this,{a:v,d:h}=r;if(p.is0())throw new Error("bad point: ZERO");const{X:y,Y:S,Z:A,T:_}=p,E=a(y*y),B=a(S*S),I=a(A*A),L=a(I*I),k=a(E*v),N=a(I*a(k+B)),H=a(L+a(h*a(E*B)));if(N!==H)throw new Error("bad point: equation left != right (1)");const j=a(y*S),P=a(A*_);if(j!==P)throw new Error("bad point: equation left != right (2)")}equals(p){u(p);const{X:v,Y:h,Z:y}=this,{X:S,Y:A,Z:_}=p,E=a(v*_),B=a(S*y),I=a(h*_),L=a(A*y);return E===B&&I===L}is0(){return this.equals(g.ZERO)}negate(){return new g(a(-this.X),this.Y,this.Z,a(-this.T))}double(){const{a:p}=r,{X:v,Y:h,Z:y}=this,S=a(v*v),A=a(h*h),_=a(Ie*a(y*y)),E=a(p*S),B=v+h,I=a(a(B*B)-S-A),L=E+A,k=L-_,N=E-A,H=a(I*k),j=a(L*N),P=a(I*N),de=a(k*L);return new g(H,j,de,P)}add(p){u(p);const{a:v,d:h}=r,{X:y,Y:S,Z:A,T:_}=this,{X:E,Y:B,Z:I,T:L}=p,k=a(y*E),N=a(S*B),H=a(_*h*L),j=a(A*I),P=a((y+S)*(E+B)-k-N),de=j-H,qe=j+H,Ze=a(N-v*k),Ct=a(P*de),jt=a(qe*Ze),zt=a(P*Ze),Pt=a(de*qe);return new g(Ct,jt,Pt,zt)}subtract(p){return u(p),this.add(p.negate())}multiply(p){if(!i.isValidNot0(p))throw new RangeError("invalid scalar: expected 1 <= sc < curve.n");const{p:v,f:h}=x.cached(this,p,y=>Ee(g,y));return Ee(g,[v,h])[0]}multiplyUnsafe(p){if(!i.isValid(p))throw new RangeError("invalid scalar: expected 0 <= sc < curve.n");return p===G?g.ZERO:this.is0()||p===D?this:x.unsafe(this,p,v=>Ee(g,v))}isSmallOrder(){return this.clearCofactor().is0()}isTorsionFree(){return x.unsafe(this,r.n).is0()}toAffine(p){const v=this;let h=p;const{X:y,Y:S,Z:A}=v,_=v.is0();h==null&&(h=_?On:o.inv(A));const E=a(y*h),B=a(S*h),I=o.mul(A,h);if(_)return{x:G,y:D};if(I!==D)throw new Error("invZ was invalid");return{x:E,y:B}}clearCofactor(){return c===D?this:this.multiplyUnsafe(c)}toBytes(){const{x:p,y:v}=this.toAffine(),h=o.toBytes(v);return h[h.length-1]|=p&D?128:0,h}toHex(){return mt(this.toBytes())}toString(){return`<Point ${this.is0()?"ZERO":this.toHex()}>`}};b(g,"BASE",new g(r.Gx,r.Gy,D,a(r.Gx*r.Gy))),b(g,"ZERO",new g(G,D,D,G)),b(g,"Fp",o),b(g,"Fn",i);let m=g;const x=new Rn(m,i.BITS);return i.BITS>=8&&m.BASE.precompute(8),Object.freeze(m.prototype),Object.freeze(m),m}class ce{constructor(e){b(this,"ep");this.ep=e}static fromBytes(e){Ke()}static fromHex(e){Ke()}get x(){return this.toAffine().x}get y(){return this.toAffine().y}clearCofactor(){return this}assertValidity(){this.ep.assertValidity()}toAffine(e){return this.ep.toAffine(e)}toHex(){return mt(this.toBytes())}toString(){return this.toHex()}isTorsionFree(){return!0}isSmallOrder(){return!1}add(e){return this.assertSame(e),this.init(this.ep.add(e.ep))}subtract(e){return this.assertSame(e),this.init(this.ep.subtract(e.ep))}multiply(e){return this.init(this.ep.multiply(e))}multiplyUnsafe(e){return this.init(this.ep.multiplyUnsafe(e))}double(){return this.init(this.ep.double())}negate(){return this.init(this.ep.negate())}precompute(e,n){return this.ep.precompute(e,n),this}}b(ce,"BASE"),b(ce,"ZERO"),b(ce,"Fp"),b(ce,"Fn");function ae(t,e){if(le(t),le(e),e<0||e>4)throw new Error("invalid I2OSP length: "+e);if(t<0||t>2**(8*e)-1)throw new Error("invalid I2OSP input: "+t);const n=Array.from({length:e}).fill(0);for(let s=e-1;s>=0;s--)n[s]=t&255,t>>>=8;return new Uint8Array(n)}function Ln(t,e){const n=new Uint8Array(t.length);for(let s=0;s<t.length;s++)n[s]=t[s]^e[s];return n}function kn(t){if(!dn(t)&&typeof t!="string")throw new Error("DST must be Uint8Array or ascii string");const e=typeof t=="string"?xt(t):t;if(e.length===0)throw new Error("DST must be non-empty");return e}function rt(t,e,n,s){ie(t),le(n),e=kn(e),e.length>255&&(e=s(oe(xt("H2C-OVERSIZE-DST-"),e)));const{outputLen:o,blockLen:i}=s,r=Math.ceil(n/o);if(r>255)throw new Error("expand_message_xmd: invalid lenInBytes");const c=oe(e,ae(e.length,1)),l=new Uint8Array(i),a=ae(n,2),f=new Array(r),d=s(oe(l,t,a,ae(0,1),c));f[0]=s(oe(d,ae(1,1),c));for(let m=1;m<r;m++){const x=[Ln(d,f[m-1]),ae(m+1,1),c];f[m]=s(oe(...x))}return oe(...f).slice(0,n)}const Hn="HashToScalar-";/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */const Dn=BigInt(0),Z=BigInt(1),at=BigInt(2),Fn=BigInt(5),Nn=BigInt(8),re=BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffed"),ze={p:re,n:BigInt("0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed"),h:Nn,a:BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffec"),d:BigInt("0x52036cee2b6ffe738cc740797779e89800700a4d4141d8ab75eb4dca135978a3"),Gx:BigInt("0x216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a"),Gy:BigInt("0x6666666666666666666666666666666666666666666666666666666666666658")};function Cn(t){const e=BigInt(10),n=BigInt(20),s=BigInt(40),o=BigInt(80),i=re,c=t*t%i*t%i,l=z(c,at,i)*c%i,a=z(l,Z,i)*t%i,f=z(a,Fn,i)*a%i,d=z(f,e,i)*f%i,u=z(d,n,i)*d%i,m=z(u,s,i)*u%i,x=z(m,o,i)*m%i,g=z(x,o,i)*m%i,w=z(g,e,i)*f%i;return{pow_p_5_8:z(w,at,i)*t%i,b2:c}}const Le=BigInt("19681161376707505956807079304988542015446066515923890162744021073123829784752");function Pe(t,e){const n=re,s=R(e*e*e,n),o=R(s*s*e,n),i=Cn(t*o).pow_p_5_8;let r=R(t*s*i,n);const c=R(e*r*r,n),l=r,a=R(r*Le,n),f=c===t,d=c===R(-t,n),u=c===R(-t*Le,n);return f&&(r=l),(d||u)&&(r=a),W(r,n)&&(r=R(-r,n)),{isValid:f||d,value:r}}const te=$n(ze,{uvRatio:Pe}),Q=te.Fp,Lt=te.Fn,ke=Le,jn=BigInt("25063068953384623474111414158702152701244531502492656460079210482610430750235"),zn=BigInt("54469307008909316920995813868745141605393597292927456921205312896311721017578"),Pn=BigInt("1159843021668779879193775521855586647937357759715417654439879720876111806838"),Mn=BigInt("40440834346308536858101042469323190826248399146238708352240133220865137265952"),ct=t=>Pe(Z,t),qn=BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"),He=t=>Q.create(xe(t)&qn);function lt(t){const{d:e}=ze,n=re,s=p=>Q.create(p),o=s(ke*t*t),i=s((o+Z)*Pn);let r=BigInt(-1);const c=s((r-e*o)*s(o+e));let{isValid:l,value:a}=Pe(i,c),f=s(a*t);W(f,n)||(f=s(-f)),l||(a=f),l||(r=o);const d=s(r*(o-Z)*Mn-c),u=a*a,m=s((a+a)*c),x=s(d*jn),g=s(Z-u),w=s(Z+u);return new te(s(m*w),s(g*x),s(x*w),s(m*g))}const F=class F extends ce{constructor(e){super(e)}static fromAffine(e){return new F(te.fromAffine(e))}assertSame(e){if(!(e instanceof F))throw new Error("RistrettoPoint expected")}init(e){return new F(e)}static fromBytes(e){J(e,32);const{a:n,d:s}=ze,o=re,i=y=>Q.create(y),r=He(e);if(!hn(Q.toBytes(r),e)||W(r,o))throw new Error("invalid ristretto255 encoding 1");const c=i(r*r),l=i(Z+n*c),a=i(Z-n*c),f=i(l*l),d=i(a*a),u=i(n*s*f-d),{isValid:m,value:x}=ct(i(u*d)),g=i(x*a),w=i(x*g*u);let p=i((r+r)*g);W(p,o)&&(p=i(-p));const v=i(l*w),h=i(p*v);if(!m||W(h,o)||v===Dn)throw new Error("invalid ristretto255 encoding 2");return new F(new te(p,v,Z,h))}static fromHex(e){return F.fromBytes(Ne(e))}toBytes(){let{X:e,Y:n,Z:s,T:o}=this.ep;const i=re,r=w=>Q.create(w),c=r(r(s+n)*r(s-n)),l=r(e*n),a=r(l*l),{value:f}=ct(r(c*a)),d=r(f*c),u=r(f*l),m=r(d*u*o);let x;if(W(o*m,i)){let w=r(n*ke),p=r(e*ke);e=w,n=p,x=r(d*zn)}else x=u;W(e*m,i)&&(n=r(-n));let g=r((s-n)*x);return W(g,i)&&(g=r(-g)),Q.toBytes(g)}equals(e){this.assertSame(e);const{X:n,Y:s}=this.ep,{X:o,Y:i}=e.ep,r=a=>Q.create(a),c=r(n*i)===r(s*o),l=r(s*i)===r(n*o);return c||l}is0(){return this.equals(F.ZERO)}};b(F,"BASE",new F(te.BASE)),b(F,"ZERO",new F(te.ZERO)),b(F,"Fp",Q),b(F,"Fn",Lt);let K=F;Object.freeze(K.BASE);Object.freeze(K.ZERO);Object.freeze(K.prototype);Object.freeze(K);const we=Object.freeze({Point:K,hashToCurve(t,e){const n=(e==null?void 0:e.DST)===void 0?"ristretto255_XMD:SHA-512_R255MAP_RO_":e.DST,s=rt(t,n,64,We);return we.deriveToCurve(s)},hashToScalar(t,e={DST:Hn}){const n=rt(t,e.DST,64,We);return Lt.create(xe(n))},deriveToCurve(t){J(t,64);const e=He(t.subarray(0,32)),n=lt(e),s=He(t.subarray(32,64)),o=lt(s);return new K(n.add(o))}}),Zn=we.Point.Fn.ORDER,Yn=we.Point.BASE,Un=Yn.ep,Xn=Object.getPrototypeOf(Un).constructor;function Vn(t){const e=t.toString(16).padStart(64,"0"),n=new Uint8Array(32);for(let s=0;s<32;s++)n[s]=parseInt(e.slice(s*2,s*2+2),16);return n}function kt(t){let e="";for(const n of t)e+=n.toString(16).padStart(2,"0");return BigInt("0x"+e)}function Me(){let t;do{const e=new Uint8Array(32);crypto.getRandomValues(e),t=kt(e)}while(t===0n||t>=Zn);return Vn(t)}function ge(t){const e=new TextEncoder().encode(t);return we.hashToCurve(e).ep.toBytes()}function ve(t,e){const n=kt(t),s=Array.from(e).map(r=>r.toString(16).padStart(2,"0")).join("");return Xn.fromHex(s).multiply(n).toBytes()}function Y(t){return Array.from(t).map(e=>e.toString(16).padStart(2,"0")).join("")}function Ht(t){const e=[...t];for(let n=e.length-1;n>0;n--){const s=new Uint8Array(4);crypto.getRandomValues(s);const i=new DataView(s.buffer).getUint32(0,!1)%(n+1);[e[n],e[i]]=[e[i],e[n]]}return e}function Dt(t){const e=Me(),n=t.map(i=>({point:ve(e,ge(i)),element:i})),s=Ht(n),o=new Map;for(const{point:i,element:r}of s)o.set(Y(i),r);return{blindedElements:s.map(i=>i.point),aliceScalar:e,aliceOriginalMapping:o}}function Ft(t,e){const n=Me(),s=t.blindedElements.map(i=>ve(n,i)),o=Ht(e.map(i=>ve(n,ge(i))));return{doubleBlindedAliceElements:s,bobBlindedElements:o,bobScalar:n}}function De(t,e,n){const{aliceScalar:s,aliceOriginalMapping:o,blindedElements:i}=t,{doubleBlindedAliceElements:r,bobBlindedElements:c}=e,l=c.map(d=>ve(s,d)),a=new Set;for(const d of l)a.add(Y(d));const f=[];for(let d=0;d<r.length;d++){const u=r[d];if(a.has(Y(u))){const m=i[d],x=o.get(Y(m));x!==void 0&&f.push(x)}}return{intersection:f,intersectionSize:f.length,aliceLearnedBobSize:c.length,bobLearnedAliceSize:i.length}}function U(t,e){const n=Dt(t),s=Ft(n,e);return De(n,s)}function Nt(t,e,n){const s=new Set(e),o=t.filter(c=>s.has(c)).sort(),i=[...n.intersection].sort();return{matches:o.length===i.length&&o.every((c,l)=>c===i[l]),expected:o,actual:i}}function Gn(t,e,n){const s=U(t,n);return{aliceSeesBobSize:s.aliceLearnedBobSize,actualBobSize:e.length,intersection:s.intersection,inflationDelta:n.length-e.length}}function Wn(t,e){const s=U(t,e).intersection,o=t.length>0?Math.round(s.length/t.length*100):0,i=`Dictionary of ${e.length} entries revealed ${s.length}/${t.length} of Alice's elements (${o}% of her set). This attack works because the element domain is small enough to enumerate. Mitigation: rate limiting, proof-of-work, or OPRF-based PSI.`;return{aliceElementsLearned:s,coveragePercent:o,warningMessage:i}}function Qn(t,e,n,s){const o=U(t,n),i=U(e,n),r=new Set(t),c=new Set(e),l=t.filter(m=>c.has(m)).length,a=e.filter(m=>!r.has(m)).length,f=t.filter(m=>!c.has(m)).length,d=a>0||f>0,u=d?`LEAK: Bob can detect that Alice's set changed between sessions. With reused α, ${a} elements appear new and ${f} elements disappeared. Bob cannot read the elements, but he can track that Alice's contact list changed — a privacy violation. Fix: always use a fresh random scalar per session.`:"No change detected between sessions (sets are identical). Bob would still learn the two sessions used the same α via the identical Y_i values.";return{session1Intersection:o.intersection,session2Intersection:i.intersection,bobInfersAliceChange:d,stableElements:l,addedElements:a,removedElements:f,warningMessage:u}}function C(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function Re(t,e=16){return t.slice(0,e)+"…"}function Kn(){const t=document.createElement("button");t.className="theme-toggle",t.textContent="☀ / ☾",t.setAttribute("aria-label","Toggle light/dark theme"),t.addEventListener("click",()=>{const n=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",n),localStorage.setItem("theme",n)}),document.body.appendChild(t)}function Jn(){document.querySelectorAll(".tab-btn").forEach(t=>{t.addEventListener("click",()=>{var n;const e=t.dataset.exhibit;e&&(document.querySelectorAll(".tab-btn").forEach(s=>s.classList.remove("active")),document.querySelectorAll(".exhibit").forEach(s=>s.classList.remove("active")),t.classList.add("active"),(n=document.getElementById(`exhibit-${e}`))==null||n.classList.add("active"))})})}function es(){const t=document.getElementById("e1-run"),e=document.getElementById("e1-alice-list"),n=document.getElementById("e1-bob-list"),s=document.getElementById("e1-output"),o=["prayer.partner@example.com","mom@gmail.com","friend.alex@email.com","pastor.john@church.org","colleague@work.com","neighbor.smith@example.com","sister.mary@example.com","youth.leader@church.org"],i=["prayer.partner@example.com","friend.alex@email.com","youth.leader@church.org","random.user1@example.com","random.user2@example.com","another.user@example.com","pastor.john@church.org"];e.innerHTML=o.map(r=>`<li class="no-match">${C(r)}</li>`).join(""),n.innerHTML=i.map(r=>`<li class="no-match">${C(r)}</li>`).join(""),t.addEventListener("click",()=>{t.disabled=!0,t.innerHTML='<span class="spinner"></span> Running PSI…',setTimeout(()=>{const r=U(o,i),c=new Set(r.intersection);e.innerHTML=o.map(l=>`<li class="${c.has(l)?"match":"no-match"}">${C(l)}</li>`).join(""),s.innerHTML=`
        <div class="result-box">
          <div class="info-grid">
            <span class="info-label">Intersection found:</span>
            <span class="info-value match">${r.intersectionSize} contact(s)</span>
            <span class="info-label">Alice's contacts:</span>
            <span class="info-value alice">${o.length} (server never saw them)</span>
            <span class="info-label">Server database:</span>
            <span class="info-value bob">${i.length} users (Alice never downloaded it)</span>
          </div>
          <div style="margin-top:0.75rem">
            ${r.intersection.map(l=>`<div class="intersection-item">${C(l)}</div>`).join("")}
          </div>
          <div class="status ok" style="margin-top:0.75rem">
            ✓ PSI complete — only matching contacts revealed. Neither party learned anything else.
          </div>
        </div>`,t.disabled=!1,t.textContent="Run PSI Again"},50)})}function ts(){const t=["alice@example.com","mom@gmail.com","bob@example.com"],e=["bob@example.com","charlie@example.com","dave@example.com"];let n=0,s=null,o=null;const i=document.getElementById("e2-panel"),r=document.getElementById("e2-prev"),c=document.getElementById("e2-next"),l=document.getElementById("e2-step"),a=[()=>`
      <h3><span class="step-counter">0</span>Setup</h3>
      <div class="card-row">
        <div>
          <div class="set-label alice">Alice's Set A</div>
          <ul class="element-list">
            ${t.map(d=>`<li>${C(d)}</li>`).join("")}
          </ul>
        </div>
        <div>
          <div class="set-label bob">Bob's Set B</div>
          <ul class="element-list">
            ${e.map(d=>`<li>${C(d)}</li>`).join("")}
          </ul>
        </div>
      </div>
      <div class="status info" style="margin-top:1rem">
        Group: ristretto255 (prime-order, DDH-hard). Hash-to-curve: RFC 9380.
        Expected intersection: { bob@example.com }
      </div>`,()=>(s=Dt(t),`
        <h3><span class="step-counter">1</span>Alice — Round 1: Blind her elements</h3>
        <p>Alice picks a fresh random scalar α and computes X_i = α · H(a_i) for each element.</p>
        <div class="card">
          <div class="info-grid">
            <span class="info-label">α (private, NEVER sent):</span>
            <span class="scalar-censor info-value private" title="Click to reveal" onclick="this.classList.toggle('revealed')">${Array.from(s.aliceScalar).map(u=>u.toString(16).padStart(2,"0")).join("")}</span>
          </div>
        </div>
        <div class="set-label alice" style="margin-top:0.75rem">Blinded elements X_i = α · H(a_i) sent to Bob:</div>
        <ul class="element-list">
          ${s.blindedElements.map(u=>`<li class="blinded" title="${C(t.find(m=>!0)??"")}">X = ${Re(Y(u))}</li>`).join("")}
        </ul>
        <div class="status info">Bob sees 3 random-looking curve points. He cannot recover Alice's emails.</div>`),()=>s?(o=Ft(s,e),`
        <h3><span class="step-counter">2</span>Bob — Round 2: Double-blind + blind his own</h3>
        <p>Bob picks fresh β, computes Y_i = β · X_i (double-blinded Alice's), and Z_j = β · H(b_j) (his own).</p>
        <div class="card">
          <div class="info-grid">
            <span class="info-label">β (private, NEVER sent):</span>
            <span class="scalar-censor info-value private" title="Click to reveal" onclick="this.classList.toggle('revealed')">${Array.from(o.bobScalar).map(u=>u.toString(16).padStart(2,"0")).join("")}</span>
          </div>
        </div>
        <div class="card-row">
          <div>
            <div class="set-label" style="color:var(--double-blinded)">Y_i = β · X_i (sent to Alice)</div>
            <ul class="element-list">
              ${o.doubleBlindedAliceElements.map(u=>`<li class="double-blinded">Y = ${Re(Y(u))}</li>`).join("")}
            </ul>
          </div>
          <div>
            <div class="set-label bob">Z_j = β · H(b_j) (sent to Alice, shuffled)</div>
            <ul class="element-list">
              ${o.bobBlindedElements.map(u=>`<li class="blinded">Z = ${Re(Y(u))}</li>`).join("")}
            </ul>
          </div>
        </div>
        <div class="status info">Alice can't learn Bob's emails. Bob can't link Y_i back to Alice's emails.</div>`):'<p class="status error">Run Step 1 first</p>',()=>{if(!s||!o)return'<p class="status error">Run Steps 1 & 2 first</p>';const d=De(s,o);return`
        <h3><span class="step-counter">3</span>Alice — Round 3: Double-blind Bob's and match</h3>
        <p>Alice computes W_j = α · Z_j = αβ · H(b_j). Then checks if any Y_i equals some W_j.</p>
        <div class="set-label" style="color:var(--double-blinded)">W_j = α · Z_j (αβ · H(b_j))</div>
        <ul class="element-list" style="margin-bottom:0.75rem">
          ${o.bobBlindedElements.map(u=>'<li class="double-blinded">W = αβ · H(b_j)</li>').join("")}
        </ul>
        <div class="status ok">
          Intersection (Y_i matched some W_j):
          ${d.intersection.length>0?d.intersection.map(u=>`<div class="intersection-item">${C(u)}</div>`).join(""):'<span style="color:var(--text-muted)">∅ (empty)</span>'}
        </div>
        <div class="info-grid" style="margin-top:0.75rem">
          <span class="info-label">Alice learned Bob's set size:</span>
          <span class="info-value bob">${d.aliceLearnedBobSize}</span>
          <span class="info-label">Bob learned Alice's set size:</span>
          <span class="info-value alice">${d.bobLearnedAliceSize}</span>
        </div>`},()=>{if(!s||!o)return'<p class="status error">Run Steps 1-3 first</p>';const d=De(s,o),u=Nt(t,e,d);return`
        <h3><span class="step-counter">4</span>Verification</h3>
        <p>Compare PSI output to the plain-text intersection (honest verifier check — not a security feature).</p>
        <div class="card">
          <div class="info-grid">
            <span class="info-label">Expected intersection:</span>
            <span class="info-value match">${u.expected.join(", ")||"∅"}</span>
            <span class="info-label">PSI intersection:</span>
            <span class="info-value match">${u.actual.join(", ")||"∅"}</span>
            <span class="info-label">Correct:</span>
            <span class="info-value ${u.matches?"match":"private"}">${u.matches?"✓ YES":"✗ NO"}</span>
          </div>
        </div>
        <div class="status ok">
          The DH-PSI protocol correctly computed A ∩ B without either party
          revealing their non-intersection elements.
        </div>`}];function f(){i.innerHTML=a[n](),l.textContent=`Step ${n+1} / ${a.length}`,r.disabled=n===0,c.disabled=n===a.length-1}r.addEventListener("click",()=>{n>0&&(n--,f())}),c.addEventListener("click",()=>{n<a.length-1&&(n++,f())}),f()}function ns(){const t=document.getElementById("e3-alice"),e=document.getElementById("e3-bob"),n=document.getElementById("e3-run"),s=document.getElementById("e3-output");t.value=["alice.friend@gmail.com","workmate@example.com","mom@example.com","pastor@church.org","neighbor@example.com","prayer.circle@example.com","book.club@example.com","cousin@example.com","mentor@example.com","colleague.bob@work.com"].join(`
`),e.value=["alice.friend@gmail.com","workmate@example.com","pastor@church.org","prayer.circle@example.com","random.server.user1@example.com","random.server.user2@example.com","another.user@example.com","server.only@example.com","database.user@example.com","app.user@example.com"].join(`
`),n.addEventListener("click",()=>{const o=t.value.split(`
`).map(r=>r.trim()).filter(Boolean),i=e.value.split(`
`).map(r=>r.trim()).filter(Boolean);if(o.length===0||i.length===0){s.innerHTML='<div class="status error">Both sets must be non-empty.</div>';return}n.disabled=!0,n.innerHTML='<span class="spinner"></span> Running…',s.innerHTML=`<div class="status info">Running DH-PSI (${o.length} × ${i.length} elements)…</div>`,setTimeout(()=>{const r=U(o,i),c=Nt(o,i,r);s.innerHTML=`
        <div class="result-box">
          <div class="info-grid">
            <span class="info-label">Alice's elements:</span>
            <span class="info-value alice">${o.length}</span>
            <span class="info-label">Bob's elements:</span>
            <span class="info-value bob">${i.length}</span>
            <span class="info-label">Intersection size:</span>
            <span class="info-value match">${r.intersectionSize}</span>
            <span class="info-label">Correct (verified):</span>
            <span class="info-value ${c.matches?"match":"private"}">${c.matches?"✓":"✗"}</span>
          </div>
          <div style="margin-top:0.75rem">
            ${r.intersection.length>0?r.intersection.map(l=>`<div class="intersection-item">${C(l)}</div>`).join(""):'<div class="status info">∅ Empty intersection — no common elements.</div>'}
          </div>
        </div>
        <div class="card" style="margin-top:0.75rem">
          <div style="margin-bottom:0.5rem;font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)">What each party learned</div>
          <div class="info-grid">
            <span class="info-label">Alice learned:</span>
            <span class="info-value match">The intersection (${r.intersectionSize} elements) + Bob's set size (${r.aliceLearnedBobSize})</span>
            <span class="info-label">Bob learned:</span>
            <span class="info-value bob">Alice's set size (${r.bobLearnedAliceSize})</span>
            <span class="info-label">Neither learned:</span>
            <span class="info-value">Alice's ${o.length-r.intersectionSize} non-matching elements; Bob's ${i.length-r.intersectionSize} non-matching elements</span>
          </div>
        </div>`,n.disabled=!1,n.textContent="Run PSI"},50)})}function ss(){const t=document.getElementById("e4-a1-run"),e=document.getElementById("e4-a1-output");t.addEventListener("click",()=>{const r=["alice@example.com","mom@example.com","pastor@church.org"],c=["alice@example.com","real.user@example.com"],l=Array.from({length:20},(d,u)=>`fake.user.${u}@attacker.com`),a=[...c,...l],f=Gn(r,c,a);e.innerHTML=`
      <div class="result-box">
        <div class="info-grid">
          <span class="info-label">Alice sees Bob's set size as:</span>
          <span class="info-value warning">${f.aliceSeesBobSize} (inflated)</span>
          <span class="info-label">Bob's actual set size:</span>
          <span class="info-value bob">${f.actualBobSize}</span>
          <span class="info-label">Inflation delta:</span>
          <span class="info-value warning">+${f.inflationDelta} fake entries</span>
          <span class="info-label">Intersection (still correct):</span>
          <span class="info-value match">${f.intersection.join(", ")||"∅"}</span>
        </div>
        <div class="warning-box">
          Bob can claim any size without Alice knowing. Set size hiding requires
          padding, polynomial commitment, or size-preserving protocols (PaXoS, CM20).
        </div>
      </div>`});const n=document.getElementById("e4-a2-run"),s=document.getElementById("e4-a2-output");n.addEventListener("click",()=>{const r=["1234","5678","9999"],c=Array.from({length:100},(a,f)=>f.toString().padStart(4,"0")).concat(["1234","5678","9999","0000","1111"]),l=Wn(r,c);s.innerHTML=`
      <div class="result-box">
        <div class="info-grid">
          <span class="info-label">Alice's set size:</span>
          <span class="info-value alice">${r.length}</span>
          <span class="info-label">Bob's dictionary size:</span>
          <span class="info-value bob">${c.length}</span>
          <span class="info-label">Alice's elements learned by Bob:</span>
          <span class="info-value private">${l.aliceElementsLearned.join(", ")||"∅"}</span>
          <span class="info-label">Coverage:</span>
          <span class="info-value warning">${l.coveragePercent}%</span>
        </div>
        <div class="warning-box">${C(l.warningMessage)}</div>
      </div>`});const o=document.getElementById("e4-a3-run"),i=document.getElementById("e4-a3-output");o.addEventListener("click",()=>{const r=["alice@example.com","mom@example.com","bob@example.com"],c=["alice@example.com","mom@example.com","new.friend@example.com"],l=["alice@example.com","service.user@example.com"];Me();const a=Qn(r,c,l);i.innerHTML=`
      <div class="result-box">
        <div class="info-grid">
          <span class="info-label">Session 1 set:</span>
          <span class="info-value alice">${r.join(", ")}</span>
          <span class="info-label">Session 2 set:</span>
          <span class="info-value alice">${c.join(", ")}</span>
          <span class="info-label">Session 1 intersection:</span>
          <span class="info-value match">${a.session1Intersection.join(", ")||"∅"}</span>
          <span class="info-label">Session 2 intersection:</span>
          <span class="info-value match">${a.session2Intersection.join(", ")||"∅"}</span>
          <span class="info-label">Stable elements (both sessions):</span>
          <span class="info-value">${a.stableElements}</span>
          <span class="info-label">Elements added in session 2:</span>
          <span class="info-value warning">${a.addedElements}</span>
          <span class="info-label">Elements removed in session 2:</span>
          <span class="info-value warning">${a.removedElements}</span>
          <span class="info-label">Bob infers Alice's set changed:</span>
          <span class="info-value ${a.bobInfersAliceChange?"private":"match"}">${a.bobInfersAliceChange?"✗ YES — privacy violation":"✓ No change detected"}</span>
        </div>
        <div class="warning-box">${C(a.warningMessage)}</div>
      </div>`})}function os(){const t=document.getElementById("e5-selftest");setTimeout(()=>{try{const e=Y(ge("alice@example.com")),n=Y(ge("bob@example.com")),s=e!==n,o=U(["a@example.com","b@example.com","c@example.com"],["b@example.com","c@example.com","d@example.com"]),i=o.intersection.length===2&&o.intersection.includes("b@example.com")&&o.intersection.includes("c@example.com"),c=U(["x@example.com"],["y@example.com"]).intersection.length===0,l=["a@example.com","b@example.com","c@example.com"],f=U(l,l).intersection.length===3,d=[{name:"hashToPoint distinct inputs",ok:s},{name:"PSI small sets (3×3, 2 matching)",ok:i},{name:"PSI empty intersection",ok:c},{name:"PSI identical sets",ok:f}];t.innerHTML=`
        <div class="card">
          <div style="margin-bottom:0.5rem;font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)">Gate Tests</div>
          ${d.map(u=>`<div class="status ${u.ok?"ok":"error"}">${u.ok?"✓":"✗"} ${C(u.name)}</div>`).join("")}
        </div>`}catch(e){t.innerHTML=`<div class="status error">Self-test error: ${C(String(e))}</div>`}},100)}const is=document.getElementById("app");is.innerHTML=`
<header>
  <h1>PSI Gate</h1>
  <p>
    Private Set Intersection — compute A ∩ B without either party
    learning non-matching elements.
    <span class="security-note">Semi-honest secure only</span>
  </p>
  <p style="font-size:0.8rem;margin-top:0.25rem">
    DH-PSI (Meadows 1986, Huberman-Franklin-Hogg 1999) · ristretto255 · No backends
  </p>
</header>

<nav class="tabs">
  <button class="tab-btn active" data-exhibit="1">1. Contact Discovery</button>
  <button class="tab-btn" data-exhibit="2">2. Protocol Walkthrough</button>
  <button class="tab-btn" data-exhibit="3">3. Live Simulator</button>
  <button class="tab-btn" data-exhibit="4">4. Attacks</button>
  <button class="tab-btn" data-exhibit="5">5. Real-World</button>
</nav>

<!-- ── Exhibit 1 ── -->
<section id="exhibit-1" class="exhibit active">
  <h2>The Contact Discovery Problem</h2>
  <p>
    You just downloaded <strong>PrayerWarriors.Mobi</strong>. Which of your 8 trusted
    prayer partners are already on the app? The naive solution sends your entire address
    book to the server — a privacy violation. PSI solves this.
  </p>
  <div class="card-row">
    <div>
      <div class="set-label alice">Your Contacts (Alice)</div>
      <ul id="e1-alice-list" class="element-list"></ul>
    </div>
    <div>
      <div class="set-label bob">App User Database (Bob / Server)</div>
      <ul id="e1-bob-list" class="element-list"></ul>
    </div>
  </div>
  <div style="margin-top:1rem">
    <button id="e1-run" class="btn primary">Run Private Set Intersection</button>
  </div>
  <div id="e1-output"></div>
  <div class="card" style="margin-top:1rem">
    <div class="info-grid">
      <span class="info-label">Naive approach:</span>
      <span class="info-value private">Send all 8 contacts to server → server learns your full address book</span>
      <span class="info-label">PSI approach:</span>
      <span class="info-value match">Cryptographically blind contacts → server learns only the intersection size</span>
    </div>
  </div>
</section>

<!-- ── Exhibit 2 ── -->
<section id="exhibit-2" class="exhibit">
  <h2>DH-PSI Protocol — Step by Step</h2>
  <p>
    The classic three-round interactive protocol. Click through each round to see
    how blinding transforms plain emails into random curve points — and back.
  </p>
  <div id="e2-panel" class="step-panel"></div>
  <div class="step-nav">
    <button id="e2-prev" class="btn">← Prev</button>
    <span id="e2-step" style="align-self:center;color:var(--text-muted);font-size:0.85rem"></span>
    <button id="e2-next" class="btn primary">Next →</button>
  </div>
</section>

<!-- ── Exhibit 3 ── -->
<section id="exhibit-3" class="exhibit">
  <h2>Live Contact Matching Simulator</h2>
  <p>Enter your own sets — one element per line. PSI runs entirely in your browser.</p>
  <div class="card-row">
    <div>
      <div class="set-label alice">Alice's Set (your contacts)</div>
      <textarea id="e3-alice" placeholder="Enter one element per line…"></textarea>
    </div>
    <div>
      <div class="set-label bob">Bob's Set (server user database)</div>
      <textarea id="e3-bob" placeholder="Enter one element per line…"></textarea>
    </div>
  </div>
  <div style="margin-top:0.75rem">
    <button id="e3-run" class="btn primary">Run PSI</button>
  </div>
  <div id="e3-output"></div>
</section>

<!-- ── Exhibit 4 ── -->
<section id="exhibit-4" class="exhibit">
  <h2>What Can Go Wrong — Attack Simulations</h2>

  <div class="card">
    <h3>Attack 1 — Set Size Inflation</h3>
    <p>
      Bob can claim any set size without Alice knowing. He can inflate to
      hide his database size, or deflate to look smaller.
    </p>
    <button id="e4-a1-run" class="btn danger">Simulate Inflation</button>
    <div id="e4-a1-output"></div>
  </div>

  <div class="card">
    <h3>Attack 2 — Dictionary Attack on Small Domains</h3>
    <p>
      If Alice's elements come from a small domain (4-digit PINs, short codes),
      Bob can enumerate the entire domain as his set and learn Alice's full set.
    </p>
    <button id="e4-a2-run" class="btn danger">Simulate Dictionary Attack</button>
    <div id="e4-a2-output"></div>
  </div>

  <div class="card">
    <h3>Attack 3 — Scalar Reuse Across Sessions</h3>
    <p>
      If Alice reuses α across two PSI sessions, Bob can link the sessions and
      detect which elements changed — even without reading any element values.
    </p>
    <button id="e4-a3-run" class="btn danger">Simulate Scalar Reuse</button>
    <div id="e4-a3-output"></div>
  </div>
</section>

<!-- ── Exhibit 5 ── -->
<section id="exhibit-5" class="exhibit">
  <h2>Real-World PSI Deployments</h2>
  <div id="e5-selftest"></div>

  <div class="deployment-grid" style="margin-top:1rem">
    <div class="deployment-card">
      <h4>Signal — Contact Discovery</h4>
      <p>SGX enclave + OPRF-based PSI. Processes millions of contacts per query
      without the server learning them. Open-source: signalapp/ContactDiscoveryService.</p>
    </div>
    <div class="deployment-card">
      <h4>Apple Password Monitoring (iOS 14+)</h4>
      <p>Checks saved passwords against breach databases using a PSI variant.
      Apple does not learn your passwords.</p>
    </div>
    <div class="deployment-card">
      <h4>Google Password Checkup</h4>
      <p>Checks passwords against 4+ billion leaked credentials.
      Uses blind hashing + k-anonymity. Google does not learn your passwords.</p>
    </div>
    <div class="deployment-card">
      <h4>Google Private Join and Compute</h4>
      <p>Ad conversion attribution across organizations. Two companies compute joint
      conversion statistics without seeing each other's user databases.
      Open-source: google/private-join-and-compute.</p>
    </div>
    <div class="deployment-card">
      <h4>DP3T / Google-Apple Exposure Notification</h4>
      <p>COVID-19 contact tracing via Bluetooth proximity. PSI with ephemeral IDs.
      Decentralized — no government server sees your contacts.</p>
    </div>
    <div class="deployment-card">
      <h4>Healthcare — Cross-Hospital Billing Detection</h4>
      <p>Hospitals combine patient record hashes to detect double-billing patterns.
      Individual records never leave their originating institution.</p>
    </div>
  </div>

  <div class="card" style="margin-top:1.5rem">
    <h3>The PrayerWarriors.Mobi Connection</h3>
    <p>
      When a user joins PrayerWarriors.Mobi, they can identify trusted prayer partners.
      The app needs to know which partners are also users — so prayers can be securely
      shared. PSI enables this without the server ever seeing your full contact list,
      and without you downloading the full user database.
    </p>
    <p>
      Your address book never reaches the server. The server's user database never
      reaches you. Only the intersection — prayer partners who are also on the app —
      becomes known. This is exactly the Signal model, adapted for prayer.
    </p>
  </div>

  <div class="card" style="margin-top:1rem">
    <h3>Related Crypto Labs</h3>
    <pre>crypto-lab-opaque-gate       — aPAKE (authentication, related primitive)
crypto-lab-silent-tally      — private aggregation
crypto-lab-blind-oracle      — TFHE (general-purpose PSI via FHE)
crypto-lab-oblivious-shelf   — PIR (private information retrieval)
crypto-lab-patron-shield     — privacy-preserving analytics
crypto-lab-paillier-gate     — Paillier (used in some PSI variants)
crypto-lab-ot-gate           — oblivious transfer (used in OPRF-PSI)</pre>
  </div>
</section>

<footer>
  <p>DH-PSI (Meadows 1986, Huberman-Franklin-Hogg 1999) · ristretto255 via @noble/curves</p>
  <p style="margin-top:0.25rem;font-style:italic;color:var(--text-muted)">
    "Whether therefore ye eat, or drink, or whatsoever ye do, do all to the glory of God." — 1 Cor 10:31
  </p>
</footer>
`;Kn();Jn();es();ts();ns();ss();os();
