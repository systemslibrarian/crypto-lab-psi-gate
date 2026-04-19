var Pt=Object.defineProperty;var qt=(t,e,n)=>e in t?Pt(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n;var m=(t,e,n)=>qt(t,typeof e!="symbol"?e+"":e,n);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const r of o.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function n(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(i){if(i.ep)return;i.ep=!0;const o=n(i);fetch(i.href,o)}})();function dt(t){return t instanceof Uint8Array||ArrayBuffer.isView(t)&&t.constructor.name==="Uint8Array"&&"BYTES_PER_ELEMENT"in t&&t.BYTES_PER_ELEMENT===1}function ft(t,e=""){if(typeof t!="number"){const n=e&&`"${e}" `;throw new TypeError(`${n}expected number, got ${typeof t}`)}if(!Number.isSafeInteger(t)||t<0){const n=e&&`"${e}" `;throw new RangeError(`${n}expected integer >= 0, got ${t}`)}}function J(t,e,n=""){const s=dt(t),i=t==null?void 0:t.length,o=e!==void 0;if(!s||o&&i!==e){const r=n&&`"${n}" `,c=o?` of length ${e}`:"",l=s?`length=${i}`:`type=${typeof t}`,a=r+"expected Uint8Array"+c+", got "+l;throw s?new RangeError(a):new TypeError(a)}return t}function Ye(t,e=!0){if(t.destroyed)throw new Error("Hash instance has been destroyed");if(e&&t.finished)throw new Error("Hash#digest() has already been called")}function Zt(t,e){J(t,void 0,"digestInto() output");const n=e.outputLen;if(t.length<n)throw new RangeError('"digestInto() output" expected to be of length >='+n)}function _e(...t){for(let e=0;e<t.length;e++)t[e].fill(0)}function Ee(t){return new DataView(t.buffer,t.byteOffset,t.byteLength)}const ut=typeof Uint8Array.from([]).toHex=="function"&&typeof Uint8Array.fromHex=="function",Yt=Array.from({length:256},(t,e)=>e.toString(16).padStart(2,"0"));function Fe(t){if(J(t),ut)return t.toHex();let e="";for(let n=0;n<t.length;n++)e+=Yt[t[n]];return e}const q={_0:48,_9:57,A:65,F:70,a:97,f:102};function Ue(t){if(t>=q._0&&t<=q._9)return t-q._0;if(t>=q.A&&t<=q.F)return t-(q.A-10);if(t>=q.a&&t<=q.f)return t-(q.a-10)}function Ne(t){if(typeof t!="string")throw new TypeError("hex string expected, got "+typeof t);if(ut)try{return Uint8Array.fromHex(t)}catch(i){throw i instanceof SyntaxError?new RangeError(i.message):i}const e=t.length,n=e/2;if(e%2)throw new RangeError("hex string expected, got unpadded hex of length "+e);const s=new Uint8Array(n);for(let i=0,o=0;i<n;i++,o+=2){const r=Ue(t.charCodeAt(o)),c=Ue(t.charCodeAt(o+1));if(r===void 0||c===void 0){const l=t[o]+t[o+1];throw new RangeError('hex string expected, got non-hex character "'+l+'" at index '+o)}s[i]=r*16+c}return s}function Ut(...t){let e=0;for(let s=0;s<t.length;s++){const i=t[s];J(i),e+=i.length}const n=new Uint8Array(e);for(let s=0,i=0;s<t.length;s++){const o=t[s];n.set(o,i),i+=o.length}return n}function Xt(t,e={}){const n=(i,o)=>t(o).update(i).digest(),s=t(void 0);return n.outputLen=s.outputLen,n.blockLen=s.blockLen,n.canXOF=s.canXOF,n.create=i=>t(i),Object.assign(n,e),Object.freeze(n)}const Vt=t=>({oid:Uint8Array.from([6,9,96,134,72,1,101,3,4,2,t])});class Gt{constructor(e,n,s,i){m(this,"blockLen");m(this,"outputLen");m(this,"canXOF",!1);m(this,"padOffset");m(this,"isLE");m(this,"buffer");m(this,"view");m(this,"finished",!1);m(this,"length",0);m(this,"pos",0);m(this,"destroyed",!1);this.blockLen=e,this.outputLen=n,this.padOffset=s,this.isLE=i,this.buffer=new Uint8Array(e),this.view=Ee(this.buffer)}update(e){Ye(this),J(e);const{view:n,buffer:s,blockLen:i}=this,o=e.length;for(let r=0;r<o;){const c=Math.min(i-this.pos,o-r);if(c===i){const l=Ee(e);for(;i<=o-r;r+=i)this.process(l,r);continue}s.set(e.subarray(r,r+c),this.pos),this.pos+=c,r+=c,this.pos===i&&(this.process(n,0),this.pos=0)}return this.length+=e.length,this.roundClean(),this}digestInto(e){Ye(this),Zt(e,this),this.finished=!0;const{buffer:n,view:s,blockLen:i,isLE:o}=this;let{pos:r}=this;n[r++]=128,_e(this.buffer.subarray(r)),this.padOffset>i-r&&(this.process(s,0),r=0);for(let f=r;f<i;f++)n[f]=0;s.setBigUint64(i-8,BigInt(this.length*8),o),this.process(s,0);const c=Ee(e),l=this.outputLen;if(l%4)throw new Error("_sha2: outputLen must be aligned to 32bit");const a=l/4,d=this.get();if(a>d.length)throw new Error("_sha2: outputLen bigger than state");for(let f=0;f<a;f++)c.setUint32(4*f,d[f],o)}digest(){const{buffer:e,outputLen:n}=this;this.digestInto(e);const s=e.slice(0,n);return this.destroy(),s}_cloneInto(e){e||(e=new this.constructor),e.set(...this.get());const{blockLen:n,buffer:s,length:i,finished:o,destroyed:r,pos:c}=this;return e.destroyed=r,e.finished=o,e.length=i,e.pos=c,i%n&&e.buffer.set(s),e}clone(){return this._cloneInto()}}const O=Uint32Array.from([1779033703,4089235720,3144134277,2227873595,1013904242,4271175723,2773480762,1595750129,1359893119,2917565137,2600822924,725511199,528734635,4215389547,1541459225,327033209]),ue=BigInt(2**32-1),Xe=BigInt(32);function Wt(t,e=!1){return e?{h:Number(t&ue),l:Number(t>>Xe&ue)}:{h:Number(t>>Xe&ue)|0,l:Number(t&ue)|0}}function Qt(t,e=!1){const n=t.length;let s=new Uint32Array(n),i=new Uint32Array(n);for(let o=0;o<n;o++){const{h:r,l:c}=Wt(t[o],e);[s[o],i[o]]=[r,c]}return[s,i]}const Ve=(t,e,n)=>t>>>n,Ge=(t,e,n)=>t<<32-n|e>>>n,ne=(t,e,n)=>t>>>n|e<<32-n,se=(t,e,n)=>t<<32-n|e>>>n,pe=(t,e,n)=>t<<64-n|e>>>n-32,he=(t,e,n)=>t>>>n-32|e<<64-n;function Z(t,e,n,s){const i=(e>>>0)+(s>>>0);return{h:t+n+(i/2**32|0)|0,l:i|0}}const Kt=(t,e,n)=>(t>>>0)+(e>>>0)+(n>>>0),Jt=(t,e,n,s)=>e+n+s+(t/2**32|0)|0,en=(t,e,n,s)=>(t>>>0)+(e>>>0)+(n>>>0)+(s>>>0),tn=(t,e,n,s,i)=>e+n+s+i+(t/2**32|0)|0,nn=(t,e,n,s,i)=>(t>>>0)+(e>>>0)+(n>>>0)+(s>>>0)+(i>>>0),sn=(t,e,n,s,i,o)=>e+n+s+i+o+(t/2**32|0)|0,pt=Qt(["0x428a2f98d728ae22","0x7137449123ef65cd","0xb5c0fbcfec4d3b2f","0xe9b5dba58189dbbc","0x3956c25bf348b538","0x59f111f1b605d019","0x923f82a4af194f9b","0xab1c5ed5da6d8118","0xd807aa98a3030242","0x12835b0145706fbe","0x243185be4ee4b28c","0x550c7dc3d5ffb4e2","0x72be5d74f27b896f","0x80deb1fe3b1696b1","0x9bdc06a725c71235","0xc19bf174cf692694","0xe49b69c19ef14ad2","0xefbe4786384f25e3","0x0fc19dc68b8cd5b5","0x240ca1cc77ac9c65","0x2de92c6f592b0275","0x4a7484aa6ea6e483","0x5cb0a9dcbd41fbd4","0x76f988da831153b5","0x983e5152ee66dfab","0xa831c66d2db43210","0xb00327c898fb213f","0xbf597fc7beef0ee4","0xc6e00bf33da88fc2","0xd5a79147930aa725","0x06ca6351e003826f","0x142929670a0e6e70","0x27b70a8546d22ffc","0x2e1b21385c26c926","0x4d2c6dfc5ac42aed","0x53380d139d95b3df","0x650a73548baf63de","0x766a0abb3c77b2a8","0x81c2c92e47edaee6","0x92722c851482353b","0xa2bfe8a14cf10364","0xa81a664bbc423001","0xc24b8b70d0f89791","0xc76c51a30654be30","0xd192e819d6ef5218","0xd69906245565a910","0xf40e35855771202a","0x106aa07032bbd1b8","0x19a4c116b8d2d0c8","0x1e376c085141ab53","0x2748774cdf8eeb99","0x34b0bcb5e19b48a8","0x391c0cb3c5c95a63","0x4ed8aa4ae3418acb","0x5b9cca4f7763e373","0x682e6ff3d6b2b8a3","0x748f82ee5defb2fc","0x78a5636f43172f60","0x84c87814a1f0ab72","0x8cc702081a6439ec","0x90befffa23631e28","0xa4506cebde82bde9","0xbef9a3f7b2c67915","0xc67178f2e372532b","0xca273eceea26619c","0xd186b8c721c0c207","0xeada7dd6cde0eb1e","0xf57d4f7fee6ed178","0x06f067aa72176fba","0x0a637dc5a2c898a6","0x113f9804bef90dae","0x1b710b35131c471b","0x28db77f523047d84","0x32caab7b40c72493","0x3c9ebe0a15c9bebc","0x431d67c49c100d4c","0x4cc5d4becb3e42b6","0x597f299cfc657e2a","0x5fcb6fab3ad6faec","0x6c44198c4a475817"].map(t=>BigInt(t))),on=pt[0],rn=pt[1],X=new Uint32Array(80),V=new Uint32Array(80);class an extends Gt{constructor(e){super(128,e,16,!1)}get(){const{Ah:e,Al:n,Bh:s,Bl:i,Ch:o,Cl:r,Dh:c,Dl:l,Eh:a,El:d,Fh:f,Fl:u,Gh:b,Gl:x,Hh:g,Hl:y}=this;return[e,n,s,i,o,r,c,l,a,d,f,u,b,x,g,y]}set(e,n,s,i,o,r,c,l,a,d,f,u,b,x,g,y){this.Ah=e|0,this.Al=n|0,this.Bh=s|0,this.Bl=i|0,this.Ch=o|0,this.Cl=r|0,this.Dh=c|0,this.Dl=l|0,this.Eh=a|0,this.El=d|0,this.Fh=f|0,this.Fl=u|0,this.Gh=b|0,this.Gl=x|0,this.Hh=g|0,this.Hl=y|0}process(e,n){for(let h=0;h<16;h++,n+=4)X[h]=e.getUint32(n),V[h]=e.getUint32(n+=4);for(let h=16;h<80;h++){const w=X[h-15]|0,S=V[h-15]|0,A=ne(w,S,1)^ne(w,S,8)^Ve(w,S,7),_=se(w,S,1)^se(w,S,8)^Ge(w,S,7),E=X[h-2]|0,B=V[h-2]|0,I=ne(E,B,19)^pe(E,B,61)^Ve(E,B,6),L=se(E,B,19)^he(E,B,61)^Ge(E,B,6),k=en(_,L,V[h-7],V[h-16]),N=tn(k,A,I,X[h-7],X[h-16]);X[h]=N|0,V[h]=k|0}let{Ah:s,Al:i,Bh:o,Bl:r,Ch:c,Cl:l,Dh:a,Dl:d,Eh:f,El:u,Fh:b,Fl:x,Gh:g,Gl:y,Hh:p,Hl:v}=this;for(let h=0;h<80;h++){const w=ne(f,u,14)^ne(f,u,18)^pe(f,u,41),S=se(f,u,14)^se(f,u,18)^he(f,u,41),A=f&b^~f&g,_=u&x^~u&y,E=nn(v,S,_,rn[h],V[h]),B=sn(E,p,w,A,on[h],X[h]),I=E|0,L=ne(s,i,28)^pe(s,i,34)^pe(s,i,39),k=se(s,i,28)^he(s,i,34)^he(s,i,39),N=s&o^s&c^o&c,H=i&r^i&l^r&l;p=g|0,v=y|0,g=b|0,y=x|0,b=f|0,x=u|0,{h:f,l:u}=Z(a|0,d|0,B|0,I|0),a=c|0,d=l|0,c=o|0,l=r|0,o=s|0,r=i|0;const C=Kt(I,k,H);s=Jt(C,B,L,N),i=C|0}({h:s,l:i}=Z(this.Ah|0,this.Al|0,s|0,i|0)),{h:o,l:r}=Z(this.Bh|0,this.Bl|0,o|0,r|0),{h:c,l}=Z(this.Ch|0,this.Cl|0,c|0,l|0),{h:a,l:d}=Z(this.Dh|0,this.Dl|0,a|0,d|0),{h:f,l:u}=Z(this.Eh|0,this.El|0,f|0,u|0),{h:b,l:x}=Z(this.Fh|0,this.Fl|0,b|0,x|0),{h:g,l:y}=Z(this.Gh|0,this.Gl|0,g|0,y|0),{h:p,l:v}=Z(this.Hh|0,this.Hl|0,p|0,v|0),this.set(s,i,o,r,c,l,a,d,f,u,b,x,g,y,p,v)}roundClean(){_e(X,V)}destroy(){this.destroyed=!0,_e(this.buffer),this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0)}}class cn extends an{constructor(){super(64);m(this,"Ah",O[0]|0);m(this,"Al",O[1]|0);m(this,"Bh",O[2]|0);m(this,"Bl",O[3]|0);m(this,"Ch",O[4]|0);m(this,"Cl",O[5]|0);m(this,"Dh",O[6]|0);m(this,"Dl",O[7]|0);m(this,"Eh",O[8]|0);m(this,"El",O[9]|0);m(this,"Fh",O[10]|0);m(this,"Fl",O[11]|0);m(this,"Gh",O[12]|0);m(this,"Gl",O[13]|0);m(this,"Hh",O[14]|0);m(this,"Hl",O[15]|0)}}const We=Xt(()=>new cn,Vt(3));/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */const oe=(t,e,n)=>J(t,e,n),ht=ft,bt=Fe,ie=(...t)=>Ut(...t),ln=t=>Ne(t),dn=dt,ge=BigInt(0),$e=BigInt(1);function mt(t,e=""){if(typeof t!="boolean"){const n=e&&`"${e}" `;throw new TypeError(n+"expected boolean, got type="+typeof t)}return t}function fn(t){if(typeof t=="bigint"){if(!me(t))throw new RangeError("positive bigint expected, got "+t)}else ht(t);return t}function le(t,e=""){if(typeof t!="number"){const n=e&&`"${e}" `;throw new TypeError(n+"expected number, got type="+typeof t)}if(!Number.isSafeInteger(t)){const n=e&&`"${e}" `;throw new RangeError(n+"expected safe integer, got "+t)}}function gt(t){if(typeof t!="string")throw new TypeError("hex string expected, got "+typeof t);return t===""?ge:BigInt("0x"+t)}function un(t){return gt(Fe(t))}function ye(t){return gt(Fe(Oe(J(t)).reverse()))}function vt(t,e){if(ft(e),e===0)throw new RangeError("zero length");t=fn(t);const n=t.toString(16);if(n.length>e*2)throw new RangeError("number too large");return Ne(n.padStart(e*2,"0"))}function pn(t,e){return vt(t,e).reverse()}function hn(t,e){if(t=oe(t),e=oe(e),t.length!==e.length)return!1;let n=0;for(let s=0;s<t.length;s++)n|=t[s]^e[s];return n===0}function Oe(t){return Uint8Array.from(oe(t))}function xt(t){if(typeof t!="string")throw new TypeError("ascii string expected, got "+typeof t);return Uint8Array.from(t,(e,n)=>{const s=e.charCodeAt(0);if(e.length!==1||s>127)throw new RangeError(`string contains non-ASCII character "${t[n]}" with code ${s} at position ${n}`);return s})}const me=t=>typeof t=="bigint"&&ge<=t;function bn(t,e,n){return me(t)&&me(e)&&me(n)&&e<=t&&t<n}function Qe(t,e,n,s){if(!bn(e,n,s))throw new RangeError("expected valid "+t+": "+n+" <= n < "+s+", got "+e)}function mn(t){if(t<ge)throw new Error("expected non-negative bigint, got "+t);let e;for(e=0;t>ge;t>>=$e,e+=1);return e}const gn=t=>($e<<BigInt(t))-$e;function yt(t,e={},n={}){if(Object.prototype.toString.call(t)!=="[object Object]")throw new TypeError("expected valid options object");function s(o,r,c){if(!c&&r!=="function"&&!Object.hasOwn(t,o))throw new TypeError(`param "${o}" is invalid: expected own property`);const l=t[o];if(c&&l===void 0)return;const a=typeof l;if(a!==r||l===null)throw new TypeError(`param "${o}" is invalid: expected ${r}, got ${a}`)}const i=(o,r)=>Object.entries(o).forEach(([c,l])=>s(c,l,r));i(e,!1),i(n,!0)}const Ke=()=>{throw new Error("not implemented")};/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */const T=BigInt(0),$=BigInt(1),ee=BigInt(2),wt=BigInt(3),Et=BigInt(4),St=BigInt(5),vn=BigInt(7),Bt=BigInt(8),xn=BigInt(9),At=BigInt(16);function R(t,e){if(e<=T)throw new Error("mod: expected positive modulus, got "+e);const n=t%e;return n>=T?n:e+n}function z(t,e,n){if(e<T)throw new Error("pow2: expected non-negative exponent, got "+e);let s=t;for(;e-- >T;)s*=s,s%=n;return s}function Je(t,e){if(t===T)throw new Error("invert: expected non-zero number");if(e<=T)throw new Error("invert: expected positive modulus, got "+e);let n=R(t,e),s=e,i=T,o=$;for(;n!==T;){const c=s/n,l=s-n*c,a=i-o*c;s=n,n=l,i=o,o=a}if(s!==$)throw new Error("invert: does not exist");return R(i,e)}function je(t,e,n){const s=t;if(!s.eql(s.sqr(e),n))throw new Error("Cannot find square root")}function It(t,e){const n=t,s=(n.ORDER+$)/Et,i=n.pow(e,s);return je(n,i,e),i}function yn(t,e){const n=t,s=(n.ORDER-St)/Bt,i=n.mul(e,ee),o=n.pow(i,s),r=n.mul(e,o),c=n.mul(n.mul(r,ee),o),l=n.mul(r,n.sub(c,n.ONE));return je(n,l,e),l}function wn(t){const e=Ce(t),n=Rt(t),s=n(e,e.neg(e.ONE)),i=n(e,s),o=n(e,e.neg(s)),r=(t+vn)/At;return((c,l)=>{const a=c;let d=a.pow(l,r),f=a.mul(d,s);const u=a.mul(d,i),b=a.mul(d,o),x=a.eql(a.sqr(f),l),g=a.eql(a.sqr(u),l);d=a.cmov(d,f,x),f=a.cmov(b,u,g);const y=a.eql(a.sqr(f),l),p=a.cmov(d,f,y);return je(a,p,l),p})}function Rt(t){if(t<wt)throw new Error("sqrt is not defined for small field");let e=t-$,n=0;for(;e%ee===T;)e/=ee,n++;let s=ee;const i=Ce(t);for(;et(i,s)===1;)if(s++>1e3)throw new Error("Cannot find square root: probably non-prime P");if(n===1)return It;let o=i.pow(s,e);const r=(e+$)/ee;return function(l,a){const d=l;if(d.is0(a))return a;if(et(d,a)!==1)throw new Error("Cannot find square root");let f=n,u=d.mul(d.ONE,o),b=d.pow(a,e),x=d.pow(a,r);for(;!d.eql(b,d.ONE);){if(d.is0(b))return d.ZERO;let g=1,y=d.sqr(b);for(;!d.eql(y,d.ONE);)if(g++,y=d.sqr(y),g===f)throw new Error("Cannot find square root");const p=$<<BigInt(f-g-1),v=d.pow(u,p);f=g,u=d.sqr(v),b=d.mul(b,u),x=d.mul(x,v)}return x}}function En(t){return t%Et===wt?It:t%Bt===St?yn:t%At===xn?wn(t):Rt(t)}const W=(t,e)=>(R(t,e)&$)===$,Sn=["create","isValid","is0","neg","inv","sqrt","sqr","eql","add","sub","mul","pow","div","addN","subN","mulN","sqrN"];function Bn(t){const e={ORDER:"bigint",BYTES:"number",BITS:"number"},n=Sn.reduce((s,i)=>(s[i]="function",s),e);if(yt(t,n),le(t.BYTES,"BYTES"),le(t.BITS,"BITS"),t.BYTES<1||t.BITS<1)throw new Error("invalid field: expected BYTES/BITS > 0");if(t.ORDER<=$)throw new Error("invalid field: expected ORDER > 1, got "+t.ORDER);return t}function An(t,e,n){const s=t;if(n<T)throw new Error("invalid exponent, negatives unsupported");if(n===T)return s.ONE;if(n===$)return e;let i=s.ONE,o=e;for(;n>T;)n&$&&(i=s.mul(i,o)),o=s.sqr(o),n>>=$;return i}function _t(t,e,n=!1){const s=t,i=new Array(e.length).fill(n?s.ZERO:void 0),o=e.reduce((c,l,a)=>s.is0(l)?c:(i[a]=c,s.mul(c,l)),s.ONE),r=s.inv(o);return e.reduceRight((c,l,a)=>s.is0(l)?c:(i[a]=s.mul(c,i[a]),s.mul(c,l)),r),i}function et(t,e){const n=t,s=(n.ORDER-$)/ee,i=n.pow(e,s),o=n.eql(i,n.ONE),r=n.eql(i,n.ZERO),c=n.eql(i,n.neg(n.ONE));if(!o&&!r&&!c)throw new Error("invalid Legendre symbol result");return o?1:r?0:-1}function In(t,e){if(e!==void 0&&ht(e),t<=T)throw new Error("invalid n length: expected positive n, got "+t);if(e!==void 0&&e<1)throw new Error("invalid n length: expected positive bit length, got "+e);const n=mn(t);if(e!==void 0&&e<n)throw new Error(`invalid n length: expected bit length (${n}) >= n.length (${e})`);const s=e!==void 0?e:n,i=Math.ceil(s/8);return{nBitLength:s,nByteLength:i}}const tt=new WeakMap;class $t{constructor(e,n={}){m(this,"ORDER");m(this,"BITS");m(this,"BYTES");m(this,"isLE");m(this,"ZERO",T);m(this,"ONE",$);m(this,"_lengths");m(this,"_mod");if(e<=$)throw new Error("invalid field: expected ORDER > 1, got "+e);let s;this.isLE=!1,n!=null&&typeof n=="object"&&(typeof n.BITS=="number"&&(s=n.BITS),typeof n.sqrt=="function"&&Object.defineProperty(this,"sqrt",{value:n.sqrt,enumerable:!0}),typeof n.isLE=="boolean"&&(this.isLE=n.isLE),n.allowedLengths&&(this._lengths=Object.freeze(n.allowedLengths.slice())),typeof n.modFromBytes=="boolean"&&(this._mod=n.modFromBytes));const{nBitLength:i,nByteLength:o}=In(e,s);if(o>2048)throw new Error("invalid field: expected ORDER of <= 2048 bytes");this.ORDER=e,this.BITS=i,this.BYTES=o,Object.freeze(this)}create(e){return R(e,this.ORDER)}isValid(e){if(typeof e!="bigint")throw new TypeError("invalid field element: expected bigint, got "+typeof e);return T<=e&&e<this.ORDER}is0(e){return e===T}isValidNot0(e){return!this.is0(e)&&this.isValid(e)}isOdd(e){return(e&$)===$}neg(e){return R(-e,this.ORDER)}eql(e,n){return e===n}sqr(e){return R(e*e,this.ORDER)}add(e,n){return R(e+n,this.ORDER)}sub(e,n){return R(e-n,this.ORDER)}mul(e,n){return R(e*n,this.ORDER)}pow(e,n){return An(this,e,n)}div(e,n){return R(e*Je(n,this.ORDER),this.ORDER)}sqrN(e){return e*e}addN(e,n){return e+n}subN(e,n){return e-n}mulN(e,n){return e*n}inv(e){return Je(e,this.ORDER)}sqrt(e){let n=tt.get(this);return n||tt.set(this,n=En(this.ORDER)),n(this,e)}toBytes(e){return this.isLE?pn(e,this.BYTES):vt(e,this.BYTES)}fromBytes(e,n=!1){oe(e);const{_lengths:s,BYTES:i,isLE:o,ORDER:r,_mod:c}=this;if(s){if(e.length<1||!s.includes(e.length)||e.length>i)throw new Error("Field.fromBytes: expected "+s+" bytes, got "+e.length);const a=new Uint8Array(i);a.set(e,o?0:a.length-e.length),e=a}if(e.length!==i)throw new Error("Field.fromBytes: expected "+i+" bytes, got "+e.length);let l=o?ye(e):un(e);if(c&&(l=R(l,r)),!n&&!this.isValid(l))throw new Error("invalid field element: outside of range 0..ORDER");return l}invertBatch(e){return _t(this,e)}cmov(e,n,s){return mt(s,"condition"),s?n:e}}Object.freeze($t.prototype);function Ce(t,e={}){return new $t(t,e)}/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */const ve=BigInt(0),Te=BigInt(1);function nt(t,e){const n=e.negate();return t?n:e}function Se(t,e){const n=_t(t.Fp,e.map(s=>s.Z));return e.map((s,i)=>t.fromAffine(s.toAffine(n[i])))}function Ot(t,e){if(!Number.isSafeInteger(t)||t<=0||t>e)throw new Error("invalid window size, expected [1.."+e+"], got W="+t)}function Be(t,e){Ot(t,e);const n=Math.ceil(e/t)+1,s=2**(t-1),i=2**t,o=gn(t),r=BigInt(t);return{windows:n,windowSize:s,mask:o,maxNumber:i,shiftBy:r}}function st(t,e,n){const{windowSize:s,mask:i,maxNumber:o,shiftBy:r}=n;let c=Number(t&i),l=t>>r;c>s&&(c-=o,l+=Te);const a=e*s,d=a+Math.abs(c)-1,f=c===0,u=c<0,b=e%2!==0;return{nextN:l,offset:d,isZero:f,isNeg:u,isNegF:b,offsetF:a}}const Ae=new WeakMap,Tt=new WeakMap;function Ie(t){return Tt.get(t)||1}function it(t){if(t!==ve)throw new Error("invalid wNAF")}class Rn{constructor(e,n){m(this,"BASE");m(this,"ZERO");m(this,"Fn");m(this,"bits");this.BASE=e.BASE,this.ZERO=e.ZERO,this.Fn=e.Fn,this.bits=n}_unsafeLadder(e,n,s=this.ZERO){let i=e;for(;n>ve;)n&Te&&(s=s.add(i)),i=i.double(),n>>=Te;return s}precomputeWindow(e,n){const{windows:s,windowSize:i}=Be(n,this.bits),o=[];let r=e,c=r;for(let l=0;l<s;l++){c=r,o.push(c);for(let a=1;a<i;a++)c=c.add(r),o.push(c);r=c.double()}return o}wNAF(e,n,s){if(!this.Fn.isValid(s))throw new Error("invalid scalar");let i=this.ZERO,o=this.BASE;const r=Be(e,this.bits);for(let c=0;c<r.windows;c++){const{nextN:l,offset:a,isZero:d,isNeg:f,isNegF:u,offsetF:b}=st(s,c,r);s=l,d?o=o.add(nt(u,n[b])):i=i.add(nt(f,n[a]))}return it(s),{p:i,f:o}}wNAFUnsafe(e,n,s,i=this.ZERO){const o=Be(e,this.bits);for(let r=0;r<o.windows&&s!==ve;r++){const{nextN:c,offset:l,isZero:a,isNeg:d}=st(s,r,o);if(s=c,!a){const f=n[l];i=i.add(d?f.negate():f)}}return it(s),i}getPrecomputes(e,n,s){let i=Ae.get(n);return i||(i=this.precomputeWindow(n,e),e!==1&&(typeof s=="function"&&(i=s(i)),Ae.set(n,i))),i}cached(e,n,s){const i=Ie(e);return this.wNAF(i,this.getPrecomputes(i,e,s),n)}unsafe(e,n,s,i){const o=Ie(e);return o===1?this._unsafeLadder(e,n,i):this.wNAFUnsafe(o,this.getPrecomputes(o,e,s),n,i)}createCache(e,n){Ot(n,this.bits),Tt.set(e,n),Ae.delete(e)}hasCache(e){return Ie(e)!==1}}function ot(t,e,n){if(e){if(e.ORDER!==t)throw new Error("Field.ORDER must match order: Fp == p, Fn == n");return Bn(e),e}else return Ce(t,{isLE:n})}function _n(t,e,n={},s){if(s===void 0&&(s=t==="edwards"),!e||typeof e!="object")throw new Error(`expected valid ${t} CURVE object`);for(const l of["p","n","h"]){const a=e[l];if(!(typeof a=="bigint"&&a>ve))throw new Error(`CURVE.${l} must be positive bigint`)}const i=ot(e.p,n.Fp,s),o=ot(e.n,n.Fn,s),c=["Gx","Gy","a","d"];for(const l of c)if(!i.isValid(e[l]))throw new Error(`CURVE.${l} must be valid field element of CURVE.Fp`);return e=Object.freeze(Object.assign({},e)),{CURVE:e,Fp:i,Fn:o}}/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */const G=BigInt(0),D=BigInt(1),Re=BigInt(2),$n=BigInt(8);function On(t,e,n,s){const i=t.sqr(n),o=t.sqr(s),r=t.add(t.mul(e.a,i),o),c=t.add(t.ONE,t.mul(e.d,t.mul(i,o)));return t.eql(r,c)}function Tn(t,e={}){const n=e,s=_n("edwards",t,n,n.FpFnLE),{Fp:i,Fn:o}=s;let r=s.CURVE;const{h:c}=r;yt(n,{},{uvRatio:"function"});const l=Re<<BigInt(o.BYTES*8)-D,a=y=>i.create(y),d=n.uvRatio===void 0?(y,p)=>{try{return{isValid:!0,value:i.sqrt(i.div(y,p))}}catch{return{isValid:!1,value:G}}}:n.uvRatio;if(!On(i,r,r.Gx,r.Gy))throw new Error("bad curve params: generator point");function f(y,p,v=!1){const h=v?D:G;return Qe("coordinate "+y,p,h,l),p}function u(y){if(!(y instanceof b))throw new Error("EdwardsPoint expected")}const g=class g{constructor(p,v,h,w){m(this,"X");m(this,"Y");m(this,"Z");m(this,"T");this.X=f("x",p),this.Y=f("y",v),this.Z=f("z",h,!0),this.T=f("t",w),Object.freeze(this)}static CURVE(){return r}static fromAffine(p){if(p instanceof g)throw new Error("extended point not allowed");const{x:v,y:h}=p||{};return f("x",v),f("y",h),new g(v,h,D,a(v*h))}static fromBytes(p,v=!1){const h=i.BYTES,{a:w,d:S}=r;p=Oe(oe(p,h,"point")),mt(v,"zip215");const A=Oe(p),_=p[h-1];A[h-1]=_&-129;const E=ye(A),B=v?l:i.ORDER;Qe("point.y",E,G,B);const I=a(E*E),L=a(I-D),k=a(S*I-w);let{isValid:N,value:H}=d(L,k);if(!N)throw new Error("bad point: invalid y coordinate");const C=(H&D)===D,P=(_&128)!==0;if(!v&&H===G&&P)throw new Error("bad point: x=0 and x_0=1");return P!==C&&(H=a(-H)),g.fromAffine({x:H,y:E})}static fromHex(p,v=!1){return g.fromBytes(ln(p),v)}get x(){return this.toAffine().x}get y(){return this.toAffine().y}precompute(p=8,v=!0){return x.createCache(this,p),v||this.multiply(Re),this}assertValidity(){const p=this,{a:v,d:h}=r;if(p.is0())throw new Error("bad point: ZERO");const{X:w,Y:S,Z:A,T:_}=p,E=a(w*w),B=a(S*S),I=a(A*A),L=a(I*I),k=a(E*v),N=a(I*a(k+B)),H=a(L+a(h*a(E*B)));if(N!==H)throw new Error("bad point: equation left != right (1)");const C=a(w*S),P=a(A*_);if(C!==P)throw new Error("bad point: equation left != right (2)")}equals(p){u(p);const{X:v,Y:h,Z:w}=this,{X:S,Y:A,Z:_}=p,E=a(v*_),B=a(S*w),I=a(h*_),L=a(A*w);return E===B&&I===L}is0(){return this.equals(g.ZERO)}negate(){return new g(a(-this.X),this.Y,this.Z,a(-this.T))}double(){const{a:p}=r,{X:v,Y:h,Z:w}=this,S=a(v*v),A=a(h*h),_=a(Re*a(w*w)),E=a(p*S),B=v+h,I=a(a(B*B)-S-A),L=E+A,k=L-_,N=E-A,H=a(I*k),C=a(L*N),P=a(I*N),fe=a(k*L);return new g(H,C,fe,P)}add(p){u(p);const{a:v,d:h}=r,{X:w,Y:S,Z:A,T:_}=this,{X:E,Y:B,Z:I,T:L}=p,k=a(w*E),N=a(S*B),H=a(_*h*L),C=a(A*I),P=a((w+S)*(E+B)-k-N),fe=C-H,qe=C+H,Ze=a(N-v*k),jt=a(P*fe),Ct=a(qe*Ze),zt=a(P*Ze),Mt=a(fe*qe);return new g(jt,Ct,Mt,zt)}subtract(p){return u(p),this.add(p.negate())}multiply(p){if(!o.isValidNot0(p))throw new RangeError("invalid scalar: expected 1 <= sc < curve.n");const{p:v,f:h}=x.cached(this,p,w=>Se(g,w));return Se(g,[v,h])[0]}multiplyUnsafe(p){if(!o.isValid(p))throw new RangeError("invalid scalar: expected 0 <= sc < curve.n");return p===G?g.ZERO:this.is0()||p===D?this:x.unsafe(this,p,v=>Se(g,v))}isSmallOrder(){return this.clearCofactor().is0()}isTorsionFree(){return x.unsafe(this,r.n).is0()}toAffine(p){const v=this;let h=p;const{X:w,Y:S,Z:A}=v,_=v.is0();h==null&&(h=_?$n:i.inv(A));const E=a(w*h),B=a(S*h),I=i.mul(A,h);if(_)return{x:G,y:D};if(I!==D)throw new Error("invZ was invalid");return{x:E,y:B}}clearCofactor(){return c===D?this:this.multiplyUnsafe(c)}toBytes(){const{x:p,y:v}=this.toAffine(),h=i.toBytes(v);return h[h.length-1]|=p&D?128:0,h}toHex(){return bt(this.toBytes())}toString(){return`<Point ${this.is0()?"ZERO":this.toHex()}>`}};m(g,"BASE",new g(r.Gx,r.Gy,D,a(r.Gx*r.Gy))),m(g,"ZERO",new g(G,D,D,G)),m(g,"Fp",i),m(g,"Fn",o);let b=g;const x=new Rn(b,o.BITS);return o.BITS>=8&&b.BASE.precompute(8),Object.freeze(b.prototype),Object.freeze(b),b}class ce{constructor(e){m(this,"ep");this.ep=e}static fromBytes(e){Ke()}static fromHex(e){Ke()}get x(){return this.toAffine().x}get y(){return this.toAffine().y}clearCofactor(){return this}assertValidity(){this.ep.assertValidity()}toAffine(e){return this.ep.toAffine(e)}toHex(){return bt(this.toBytes())}toString(){return this.toHex()}isTorsionFree(){return!0}isSmallOrder(){return!1}add(e){return this.assertSame(e),this.init(this.ep.add(e.ep))}subtract(e){return this.assertSame(e),this.init(this.ep.subtract(e.ep))}multiply(e){return this.init(this.ep.multiply(e))}multiplyUnsafe(e){return this.init(this.ep.multiplyUnsafe(e))}double(){return this.init(this.ep.double())}negate(){return this.init(this.ep.negate())}precompute(e,n){return this.ep.precompute(e,n),this}}m(ce,"BASE"),m(ce,"ZERO"),m(ce,"Fp"),m(ce,"Fn");function ae(t,e){if(le(t),le(e),e<0||e>4)throw new Error("invalid I2OSP length: "+e);if(t<0||t>2**(8*e)-1)throw new Error("invalid I2OSP input: "+t);const n=Array.from({length:e}).fill(0);for(let s=e-1;s>=0;s--)n[s]=t&255,t>>>=8;return new Uint8Array(n)}function Ln(t,e){const n=new Uint8Array(t.length);for(let s=0;s<t.length;s++)n[s]=t[s]^e[s];return n}function kn(t){if(!dn(t)&&typeof t!="string")throw new Error("DST must be Uint8Array or ascii string");const e=typeof t=="string"?xt(t):t;if(e.length===0)throw new Error("DST must be non-empty");return e}function rt(t,e,n,s){oe(t),le(n),e=kn(e),e.length>255&&(e=s(ie(xt("H2C-OVERSIZE-DST-"),e)));const{outputLen:i,blockLen:o}=s,r=Math.ceil(n/i);if(r>255)throw new Error("expand_message_xmd: invalid lenInBytes");const c=ie(e,ae(e.length,1)),l=new Uint8Array(o),a=ae(n,2),d=new Array(r),f=s(ie(l,t,a,ae(0,1),c));d[0]=s(ie(f,ae(1,1),c));for(let b=1;b<r;b++){const x=[Ln(f,d[b-1]),ae(b+1,1),c];d[b]=s(ie(...x))}return ie(...d).slice(0,n)}const Hn="HashToScalar-";/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */const Dn=BigInt(0),Y=BigInt(1),at=BigInt(2),Fn=BigInt(5),Nn=BigInt(8),re=BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffed"),ze={p:re,n:BigInt("0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed"),h:Nn,a:BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffec"),d:BigInt("0x52036cee2b6ffe738cc740797779e89800700a4d4141d8ab75eb4dca135978a3"),Gx:BigInt("0x216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a"),Gy:BigInt("0x6666666666666666666666666666666666666666666666666666666666666658")};function jn(t){const e=BigInt(10),n=BigInt(20),s=BigInt(40),i=BigInt(80),o=re,c=t*t%o*t%o,l=z(c,at,o)*c%o,a=z(l,Y,o)*t%o,d=z(a,Fn,o)*a%o,f=z(d,e,o)*d%o,u=z(f,n,o)*f%o,b=z(u,s,o)*u%o,x=z(b,i,o)*b%o,g=z(x,i,o)*b%o,y=z(g,e,o)*d%o;return{pow_p_5_8:z(y,at,o)*t%o,b2:c}}const Le=BigInt("19681161376707505956807079304988542015446066515923890162744021073123829784752");function Me(t,e){const n=re,s=R(e*e*e,n),i=R(s*s*e,n),o=jn(t*i).pow_p_5_8;let r=R(t*s*o,n);const c=R(e*r*r,n),l=r,a=R(r*Le,n),d=c===t,f=c===R(-t,n),u=c===R(-t*Le,n);return d&&(r=l),(f||u)&&(r=a),W(r,n)&&(r=R(-r,n)),{isValid:d||f,value:r}}const te=Tn(ze,{uvRatio:Me}),Q=te.Fp,Lt=te.Fn,ke=Le,Cn=BigInt("25063068953384623474111414158702152701244531502492656460079210482610430750235"),zn=BigInt("54469307008909316920995813868745141605393597292927456921205312896311721017578"),Mn=BigInt("1159843021668779879193775521855586647937357759715417654439879720876111806838"),Pn=BigInt("40440834346308536858101042469323190826248399146238708352240133220865137265952"),ct=t=>Me(Y,t),qn=BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"),He=t=>Q.create(ye(t)&qn);function lt(t){const{d:e}=ze,n=re,s=p=>Q.create(p),i=s(ke*t*t),o=s((i+Y)*Mn);let r=BigInt(-1);const c=s((r-e*i)*s(i+e));let{isValid:l,value:a}=Me(o,c),d=s(a*t);W(d,n)||(d=s(-d)),l||(a=d),l||(r=i);const f=s(r*(i-Y)*Pn-c),u=a*a,b=s((a+a)*c),x=s(f*Cn),g=s(Y-u),y=s(Y+u);return new te(s(b*y),s(g*x),s(x*y),s(b*g))}const F=class F extends ce{constructor(e){super(e)}static fromAffine(e){return new F(te.fromAffine(e))}assertSame(e){if(!(e instanceof F))throw new Error("RistrettoPoint expected")}init(e){return new F(e)}static fromBytes(e){J(e,32);const{a:n,d:s}=ze,i=re,o=w=>Q.create(w),r=He(e);if(!hn(Q.toBytes(r),e)||W(r,i))throw new Error("invalid ristretto255 encoding 1");const c=o(r*r),l=o(Y+n*c),a=o(Y-n*c),d=o(l*l),f=o(a*a),u=o(n*s*d-f),{isValid:b,value:x}=ct(o(u*f)),g=o(x*a),y=o(x*g*u);let p=o((r+r)*g);W(p,i)&&(p=o(-p));const v=o(l*y),h=o(p*v);if(!b||W(h,i)||v===Dn)throw new Error("invalid ristretto255 encoding 2");return new F(new te(p,v,Y,h))}static fromHex(e){return F.fromBytes(Ne(e))}toBytes(){let{X:e,Y:n,Z:s,T:i}=this.ep;const o=re,r=y=>Q.create(y),c=r(r(s+n)*r(s-n)),l=r(e*n),a=r(l*l),{value:d}=ct(r(c*a)),f=r(d*c),u=r(d*l),b=r(f*u*i);let x;if(W(i*b,o)){let y=r(n*ke),p=r(e*ke);e=y,n=p,x=r(f*zn)}else x=u;W(e*b,o)&&(n=r(-n));let g=r((s-n)*x);return W(g,o)&&(g=r(-g)),Q.toBytes(g)}equals(e){this.assertSame(e);const{X:n,Y:s}=this.ep,{X:i,Y:o}=e.ep,r=a=>Q.create(a),c=r(n*o)===r(s*i),l=r(s*o)===r(n*i);return c||l}is0(){return this.equals(F.ZERO)}};m(F,"BASE",new F(te.BASE)),m(F,"ZERO",new F(te.ZERO)),m(F,"Fp",Q),m(F,"Fn",Lt);let K=F;Object.freeze(K.BASE);Object.freeze(K.ZERO);Object.freeze(K.prototype);Object.freeze(K);const we=Object.freeze({Point:K,hashToCurve(t,e){const n=(e==null?void 0:e.DST)===void 0?"ristretto255_XMD:SHA-512_R255MAP_RO_":e.DST,s=rt(t,n,64,We);return we.deriveToCurve(s)},hashToScalar(t,e={DST:Hn}){const n=rt(t,e.DST,64,We);return Lt.create(ye(n))},deriveToCurve(t){J(t,64);const e=He(t.subarray(0,32)),n=lt(e),s=He(t.subarray(32,64)),i=lt(s);return new K(n.add(i))}}),Zn=we.Point.Fn.ORDER,Yn=we.Point.BASE,Un=Object.getPrototypeOf(Yn.ep).constructor;function Xn(t){const e=t.toString(16).padStart(64,"0"),n=new Uint8Array(32);for(let s=0;s<32;s++)n[s]=parseInt(e.slice(s*2,s*2+2),16);return n}function kt(t){let e="";for(const n of t)e+=n.toString(16).padStart(2,"0");return BigInt("0x"+e)}function Pe(){let t;do{const e=new Uint8Array(32);crypto.getRandomValues(e),t=kt(e)}while(t===0n||t>=Zn);return Xn(t)}function xe(t){const e=new TextEncoder().encode(t);return we.hashToCurve(e).ep.toBytes()}function de(t,e){const n=kt(t),s=Array.from(e).map(o=>o.toString(16).padStart(2,"0")).join("");return Un.fromHex(s).multiply(n).toBytes()}function M(t){return Array.from(t).map(e=>e.toString(16).padStart(2,"0")).join("")}function Ht(t){const e=[...t];for(let n=e.length-1;n>0;n--){const s=new Uint8Array(4);crypto.getRandomValues(s);const i=new DataView(s.buffer).getUint32(0,!1)%(n+1);[e[n],e[i]]=[e[i],e[n]]}return e}function Dt(t){const e=Pe(),n=t.map(o=>({point:de(e,xe(o)),element:o})),s=Ht(n),i=new Map;for(const{point:o,element:r}of s)i.set(M(o),r);return{blindedElements:s.map(o=>o.point),aliceScalar:e,aliceOriginalMapping:i}}function Ft(t,e){const n=Pe(),s=t.blindedElements.map(o=>de(n,o)),i=Ht(e.map(o=>de(n,xe(o))));return{doubleBlindedAliceElements:s,bobBlindedElements:i,bobScalar:n}}function De(t,e,n){const{aliceScalar:s,aliceOriginalMapping:i,blindedElements:o}=t,{doubleBlindedAliceElements:r,bobBlindedElements:c}=e,l=new Set(c.map(d=>M(de(s,d)))),a=[];for(let d=0;d<r.length;d++)if(l.has(M(r[d]))){const f=i.get(M(o[d]));f!==void 0&&a.push(f)}return{intersection:a,intersectionSize:a.length,aliceLearnedBobSize:c.length,bobLearnedAliceSize:o.length}}function U(t,e){const n=Dt(t),s=Ft(n,e);return De(n,s)}function Nt(t,e,n){const s=new Set(e),i=t.filter(c=>s.has(c)).sort(),o=[...n.intersection].sort();return{matches:i.length===o.length&&i.every((c,l)=>c===o[l]),expected:i,actual:o}}function Vn(t,e,n){const s=U(t,n);return{aliceSeesBobSize:s.aliceLearnedBobSize,actualBobSize:e.length,intersection:s.intersection,inflationDelta:n.length-e.length}}function Gn(t,e){const s=U(t,e).intersection,i=t.length>0?Math.round(s.length/t.length*100):0,o=`Dictionary of ${e.length} entries revealed ${s.length}/${t.length} of Alice's elements (${i}% of her set). This attack works because the element domain is small enough to enumerate. Mitigation: rate limiting, proof-of-work, or OPRF-based PSI.`;return{aliceElementsLearned:s,coveragePercent:i,warningMessage:o}}function Wn(t,e,n,s){const i=U(t,n),o=U(e,n),r=new Set(t),c=new Set(e),l=t.filter(b=>c.has(b)).length,a=e.filter(b=>!r.has(b)).length,d=t.filter(b=>!c.has(b)).length,f=a>0||d>0,u=f?`LEAK: Bob can detect that Alice's set changed between sessions. With reused α, ${a} elements appear new and ${d} elements disappeared. Bob cannot read the elements, but he can track that Alice's contact list changed — a privacy violation. Fix: always use a fresh random scalar per session.`:"No change detected between sessions (sets are identical). Bob would still learn the two sessions used the same α via the identical Y_i values.";return{session1Intersection:i.intersection,session2Intersection:o.intersection,bobInfersAliceChange:f,stableElements:l,addedElements:a,removedElements:d,warningMessage:u}}function j(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function be(t,e=16){return t.slice(0,e)+"…"}function Qn(){const t=document.createElement("button");t.className="theme-toggle",t.textContent="☀ / ☾";const e=()=>{const n=document.documentElement.getAttribute("data-theme")??"dark";t.setAttribute("aria-label",`Switch to ${n==="dark"?"light":"dark"} theme`),t.setAttribute("title",t.getAttribute("aria-label"))};e(),t.addEventListener("click",()=>{const s=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",s),localStorage.setItem("theme",s),e()}),document.body.appendChild(t)}function Kn(){const t=Array.from(document.querySelectorAll('[role="tab"]')),e=Array.from(document.querySelectorAll('[role="tabpanel"]'));function n(s){var o;t.forEach(r=>{r.setAttribute("aria-selected","false"),r.setAttribute("tabindex","-1")}),e.forEach(r=>r.classList.remove("active")),s.setAttribute("aria-selected","true"),s.setAttribute("tabindex","0"),s.focus();const i=s.getAttribute("aria-controls");i&&((o=document.getElementById(i))==null||o.classList.add("active"))}t.forEach((s,i)=>{s.addEventListener("click",()=>n(s)),s.addEventListener("keydown",o=>{let r=-1;o.key==="ArrowRight"?r=(i+1)%t.length:o.key==="ArrowLeft"?r=(i-1+t.length)%t.length:o.key==="Home"?r=0:o.key==="End"&&(r=t.length-1),r!==-1&&(o.preventDefault(),n(t[r]))})})}function Jn(){const t=document.getElementById("e1-run"),e=document.getElementById("e1-alice-list"),n=document.getElementById("e1-bob-list"),s=document.getElementById("e1-output"),i=["prayer.partner@example.com","mom@gmail.com","friend.alex@email.com","pastor.john@church.org","colleague@work.com","neighbor.smith@example.com","sister.mary@example.com","youth.leader@church.org"],o=["prayer.partner@example.com","friend.alex@email.com","youth.leader@church.org","random.user1@example.com","random.user2@example.com","another.user@example.com","pastor.john@church.org"];e.innerHTML=i.map(r=>`<li class="no-match">${j(r)}</li>`).join(""),n.innerHTML=o.map(r=>`<li class="no-match">${j(r)}</li>`).join(""),t.addEventListener("click",()=>{t.disabled=!0,t.innerHTML='<span class="spinner" aria-hidden="true"></span><span class="sr-only">Running PSI…</span> Running PSI…',setTimeout(()=>{const r=U(i,o),c=new Set(r.intersection);e.innerHTML=i.map(l=>`<li class="${c.has(l)?"match":"no-match"}">${j(l)}</li>`).join(""),s.innerHTML=`
        <div class="result-box">
          <div class="info-grid">
            <span class="info-label">Intersection found:</span>
            <span class="info-value match">${r.intersectionSize} contact(s)</span>
            <span class="info-label">Alice's contacts:</span>
            <span class="info-value alice">${i.length} (server never saw them)</span>
            <span class="info-label">Server database:</span>
            <span class="info-value bob">${o.length} users (Alice never downloaded it)</span>
          </div>
          <div style="margin-top:0.75rem">
            ${r.intersection.map(l=>`<div class="intersection-item">${j(l)}</div>`).join("")}
          </div>
          <div class="status ok" style="margin-top:0.75rem">
            ✓ PSI complete — only matching contacts revealed. Neither party learned anything else.
          </div>
        </div>`,t.disabled=!1,t.textContent="Run PSI Again"},50)})}function es(){const t=["alice@example.com","mom@gmail.com","bob@example.com"],e=["bob@example.com","charlie@example.com","dave@example.com"];let n=0,s=null,i=null;const o=document.getElementById("e2-panel"),r=document.getElementById("e2-prev"),c=document.getElementById("e2-next"),l=document.getElementById("e2-step"),a=[()=>`
      <h3><span class="step-counter">0</span>Setup</h3>
      <div class="card-row">
        <div>
          <div class="set-label alice">Alice's Set A</div>
          <ul class="element-list">
            ${t.map(f=>`<li>${j(f)}</li>`).join("")}
          </ul>
        </div>
        <div>
          <div class="set-label bob">Bob's Set B</div>
          <ul class="element-list">
            ${e.map(f=>`<li>${j(f)}</li>`).join("")}
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
            <button class="scalar-btn" aria-pressed="false" aria-label="Reveal private scalar (click to toggle)">${Array.from(s.aliceScalar).map(u=>u.toString(16).padStart(2,"0")).join("")}</button>
          </div>
        </div>
        <div class="set-label alice" style="margin-top:0.75rem">Blinded elements X_i = α · H(a_i) sent to Bob:</div>
        <ul class="element-list">
          ${s.blindedElements.map((u,b)=>`<li class="blinded" title="Blinded(${j(t[b])})">X_${b+1} = ${be(M(u))}</li>`).join("")}
        </ul>
        <div class="status info">Bob sees 3 random-looking curve points. He cannot recover Alice's emails.</div>`),()=>s?(i=Ft(s,e),`
        <h3><span class="step-counter">2</span>Bob — Round 2: Double-blind + blind his own</h3>
        <p>Bob picks fresh β, computes Y_i = β · X_i (double-blinded Alice's), and Z_j = β · H(b_j) (his own).</p>
        <div class="card">
          <div class="info-grid">
            <span class="info-label">β (private, NEVER sent):</span>
            <button class="scalar-btn" aria-pressed="false" aria-label="Reveal private scalar (click to toggle)">${Array.from(i.bobScalar).map(u=>u.toString(16).padStart(2,"0")).join("")}</button>
          </div>
        </div>
        <div class="card-row">
          <div>
            <div class="set-label" style="color:var(--double-blinded)">Y_i = β · X_i (sent to Alice)</div>
            <ul class="element-list">
              ${i.doubleBlindedAliceElements.map(u=>`<li class="double-blinded">Y = ${be(M(u))}</li>`).join("")}
            </ul>
          </div>
          <div>
            <div class="set-label bob">Z_j = β · H(b_j) (sent to Alice, shuffled)</div>
            <ul class="element-list">
              ${i.bobBlindedElements.map(u=>`<li class="blinded">Z = ${be(M(u))}</li>`).join("")}
            </ul>
          </div>
        </div>
        <div class="status info">Alice can't learn Bob's emails. Bob can't link Y_i back to Alice's emails.</div>`):'<p class="status error">Run Step 1 first</p>',()=>{if(!s||!i)return'<p class="status error">Run Steps 1 & 2 first</p>';const f=De(s,i);return`
        <h3><span class="step-counter">3</span>Alice — Round 3: Double-blind Bob's and match</h3>
        <p>Alice computes W_j = α · Z_j = αβ · H(b_j). Then checks if any Y_i equals some W_j.</p>
        <div class="set-label" style="color:var(--double-blinded)">W_j = α · Z_j (αβ · H(b_j))</div>
        <ul class="element-list" style="margin-bottom:0.75rem">
          ${i.bobBlindedElements.map((u,b)=>{const x=de(s.aliceScalar,u);return`<li class="double-blinded">W_${b+1} = ${be(M(x))}</li>`}).join("")}
        </ul>
        <div class="status ok">
          Intersection (Y_i matched some W_j):
          ${f.intersection.length>0?f.intersection.map(u=>`<div class="intersection-item">${j(u)}</div>`).join(""):'<span style="color:var(--text-muted)">∅ (empty)</span>'}
        </div>
        <div class="info-grid" style="margin-top:0.75rem">
          <span class="info-label">Alice learned Bob's set size:</span>
          <span class="info-value bob">${f.aliceLearnedBobSize}</span>
          <span class="info-label">Bob learned Alice's set size:</span>
          <span class="info-value alice">${f.bobLearnedAliceSize}</span>
        </div>`},()=>{if(!s||!i)return'<p class="status error">Run Steps 1-3 first</p>';const f=De(s,i),u=Nt(t,e,f);return`
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
        </div>`}];function d(){o.innerHTML=a[n](),l.textContent=`Step ${n+1} / ${a.length}`,r.disabled=n===0,c.disabled=n===a.length-1}r.addEventListener("click",()=>{n>0&&(n--,d())}),c.addEventListener("click",()=>{n<a.length-1&&(n++,d())}),d()}function ts(){const t=document.getElementById("e3-alice"),e=document.getElementById("e3-bob"),n=document.getElementById("e3-run"),s=document.getElementById("e3-output");t.value=["alice.friend@gmail.com","workmate@example.com","mom@example.com","pastor@church.org","neighbor@example.com","prayer.circle@example.com","book.club@example.com","cousin@example.com","mentor@example.com","colleague.bob@work.com"].join(`
`),e.value=["alice.friend@gmail.com","workmate@example.com","pastor@church.org","prayer.circle@example.com","random.server.user1@example.com","random.server.user2@example.com","another.user@example.com","server.only@example.com","database.user@example.com","app.user@example.com"].join(`
`),n.addEventListener("click",()=>{const i=t.value.split(`
`).map(r=>r.trim()).filter(Boolean),o=e.value.split(`
`).map(r=>r.trim()).filter(Boolean);if(i.length===0||o.length===0){s.innerHTML='<div class="status error">Both sets must be non-empty.</div>';return}n.disabled=!0,n.innerHTML='<span class="spinner" aria-hidden="true"></span><span class="sr-only">Running…</span> Running…',s.innerHTML=`<div class="status info" role="status">Running DH-PSI (${i.length} × ${o.length} elements)…</div>`,setTimeout(()=>{const r=U(i,o),c=Nt(i,o,r);s.innerHTML=`
        <div class="result-box">
          <div class="info-grid">
            <span class="info-label">Alice's elements:</span>
            <span class="info-value alice">${i.length}</span>
            <span class="info-label">Bob's elements:</span>
            <span class="info-value bob">${o.length}</span>
            <span class="info-label">Intersection size:</span>
            <span class="info-value match">${r.intersectionSize}</span>
            <span class="info-label">Correct (verified):</span>
            <span class="info-value ${c.matches?"match":"private"}">${c.matches?"✓":"✗"}</span>
          </div>
          <div style="margin-top:0.75rem">
            ${r.intersection.length>0?r.intersection.map(l=>`<div class="intersection-item">${j(l)}</div>`).join(""):'<div class="status info">∅ Empty intersection — no common elements.</div>'}
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
            <span class="info-value">Alice's ${i.length-r.intersectionSize} non-matching elements; Bob's ${o.length-r.intersectionSize} non-matching elements</span>
          </div>
        </div>`,n.disabled=!1,n.textContent="Run PSI"},50)})}function ns(){const t=document.getElementById("e4-a1-run"),e=document.getElementById("e4-a1-output");t.addEventListener("click",()=>{const r=["alice@example.com","mom@example.com","pastor@church.org"],c=["alice@example.com","real.user@example.com"],l=Array.from({length:20},(f,u)=>`fake.user.${u}@attacker.com`),a=[...c,...l],d=Vn(r,c,a);e.innerHTML=`
      <div class="result-box">
        <div class="info-grid">
          <span class="info-label">Alice sees Bob's set size as:</span>
          <span class="info-value warning">${d.aliceSeesBobSize} (inflated)</span>
          <span class="info-label">Bob's actual set size:</span>
          <span class="info-value bob">${d.actualBobSize}</span>
          <span class="info-label">Inflation delta:</span>
          <span class="info-value warning">+${d.inflationDelta} fake entries</span>
          <span class="info-label">Intersection (still correct):</span>
          <span class="info-value match">${d.intersection.join(", ")||"∅"}</span>
        </div>
        <div class="warning-box">
          Bob can claim any size without Alice knowing. Set size hiding requires
          padding, polynomial commitment, or size-preserving protocols (PaXoS, CM20).
        </div>
      </div>`});const n=document.getElementById("e4-a2-run"),s=document.getElementById("e4-a2-output");n.addEventListener("click",()=>{const r=["1234","5678","9999"],c=Array.from({length:100},(a,d)=>d.toString().padStart(4,"0")).concat(["1234","5678","9999","0000","1111"]),l=Gn(r,c);s.innerHTML=`
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
        <div class="warning-box">${j(l.warningMessage)}</div>
      </div>`});const i=document.getElementById("e4-a3-run"),o=document.getElementById("e4-a3-output");i.addEventListener("click",()=>{const r=["alice@example.com","mom@example.com","bob@example.com"],c=["alice@example.com","mom@example.com","new.friend@example.com"],l=["alice@example.com","service.user@example.com"];Pe();const a=Wn(r,c,l);o.innerHTML=`
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
        <div class="warning-box">${j(a.warningMessage)}</div>
      </div>`})}function ss(){const t=document.getElementById("e5-selftest");setTimeout(()=>{try{const e=M(xe("alice@example.com")),n=M(xe("bob@example.com")),s=e!==n,i=U(["a@example.com","b@example.com","c@example.com"],["b@example.com","c@example.com","d@example.com"]),o=i.intersection.length===2&&i.intersection.includes("b@example.com")&&i.intersection.includes("c@example.com"),c=U(["x@example.com"],["y@example.com"]).intersection.length===0,l=["a@example.com","b@example.com","c@example.com"],d=U(l,l).intersection.length===3,f=[{name:"hashToPoint distinct inputs",ok:s},{name:"PSI small sets (3×3, 2 matching)",ok:o},{name:"PSI empty intersection",ok:c},{name:"PSI identical sets",ok:d}];t.innerHTML=`
        <div class="card">
          <div style="margin-bottom:0.5rem;font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)">Gate Tests</div>
          ${f.map(u=>`<div class="status ${u.ok?"ok":"error"}">${u.ok?"✓":"✗"} ${j(u.name)}</div>`).join("")}
        </div>`}catch(e){t.innerHTML=`<div class="status error">Self-test error: ${j(String(e))}</div>`}},100)}const is=document.getElementById("app");is.innerHTML=`
<a href="#main-content" class="skip-link">Skip to main content</a>
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

<nav aria-label="Demo exhibits">
  <div role="tablist" aria-label="Demo exhibits">
    <button id="tab-1" role="tab" aria-selected="true"  aria-controls="exhibit-1" tabindex="0"  class="tab-btn active">1. Contact Discovery</button>
    <button id="tab-2" role="tab" aria-selected="false" aria-controls="exhibit-2" tabindex="-1" class="tab-btn">2. Protocol Walkthrough</button>
    <button id="tab-3" role="tab" aria-selected="false" aria-controls="exhibit-3" tabindex="-1" class="tab-btn">3. Live Simulator</button>
    <button id="tab-4" role="tab" aria-selected="false" aria-controls="exhibit-4" tabindex="-1" class="tab-btn">4. Attacks</button>
    <button id="tab-5" role="tab" aria-selected="false" aria-controls="exhibit-5" tabindex="-1" class="tab-btn">5. Real-World</button>
  </div>
</nav>

<main id="main-content">
<!-- ── Exhibit 1 ── -->
<section id="exhibit-1" role="tabpanel" aria-labelledby="tab-1" class="exhibit active">
  <h2>The Contact Discovery Problem</h2>
  <p>
    You just downloaded <strong>PrayerWarriors.Mobi</strong>. Which of your 8 trusted
    prayer partners are already on the app? The naive solution sends your entire address
    book to the server — a privacy violation. PSI solves this.
  </p>
  <div class="card-row">
    <div>
      <div class="set-label alice">Your Contacts (Alice)</div>
      <ul id="e1-alice-list" class="element-list" aria-label="Alice's contacts"></ul>
    </div>
    <div>
      <div class="set-label bob">App User Database (Bob / Server)</div>
      <ul id="e1-bob-list" class="element-list" aria-label="Server's user database"></ul>
    </div>
  </div>
  <div style="margin-top:1rem">
    <button id="e1-run" class="btn primary">Run Private Set Intersection</button>
  </div>
  <div id="e1-output" aria-live="polite" aria-atomic="true"></div>
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
<section id="exhibit-2" role="tabpanel" aria-labelledby="tab-2" class="exhibit">
  <h2>DH-PSI Protocol — Step by Step</h2>
  <p>
    The classic three-round interactive protocol. Click through each round to see
    how blinding transforms plain emails into random curve points — and back.
  </p>
  <div id="e2-panel" class="step-panel" aria-live="polite" aria-atomic="true"></div>
  <div class="step-nav">
    <button id="e2-prev" class="btn">← Prev</button>
    <span id="e2-step" style="align-self:center;color:var(--text-muted);font-size:0.85rem" aria-live="polite"></span>
    <button id="e2-next" class="btn primary">Next →</button>
  </div>
</section>

<!-- ── Exhibit 3 ── -->
<section id="exhibit-3" role="tabpanel" aria-labelledby="tab-3" class="exhibit">
  <h2>Live Contact Matching Simulator</h2>
  <p>Enter your own sets — one element per line. PSI runs entirely in your browser.</p>
  <div class="card-row">
    <div>
      <label for="e3-alice" class="set-label alice">Alice's Set (your contacts)</label>
      <textarea id="e3-alice" placeholder="Enter one element per line…"></textarea>
    </div>
    <div>
      <label for="e3-bob" class="set-label bob">Bob's Set (server user database)</label>
      <textarea id="e3-bob" placeholder="Enter one element per line…"></textarea>
    </div>
  </div>
  <div style="margin-top:0.75rem">
    <button id="e3-run" class="btn primary">Run PSI</button>
  </div>
  <div id="e3-output" aria-live="polite" aria-atomic="true"></div>
</section>

<!-- ── Exhibit 4 ── -->
<section id="exhibit-4" role="tabpanel" aria-labelledby="tab-4" class="exhibit">
  <h2>What Can Go Wrong — Attack Simulations</h2>

  <div class="card">
    <h3>Attack 1 — Set Size Inflation</h3>
    <p>
      Bob can claim any set size without Alice knowing. He can inflate to
      hide his database size, or deflate to look smaller.
    </p>
    <button id="e4-a1-run" class="btn danger">Simulate Inflation</button>
    <div id="e4-a1-output" aria-live="polite" aria-atomic="true"></div>
  </div>

  <div class="card">
    <h3>Attack 2 — Dictionary Attack on Small Domains</h3>
    <p>
      If Alice's elements come from a small domain (4-digit PINs, short codes),
      Bob can enumerate the entire domain as his set and learn Alice's full set.
    </p>
    <button id="e4-a2-run" class="btn danger">Simulate Dictionary Attack</button>
    <div id="e4-a2-output" aria-live="polite" aria-atomic="true"></div>
  </div>

  <div class="card">
    <h3>Attack 3 — Scalar Reuse Across Sessions</h3>
    <p>
      If Alice reuses α across two PSI sessions, Bob can link the sessions and
      detect which elements changed — even without reading any element values.
    </p>
    <button id="e4-a3-run" class="btn danger">Simulate Scalar Reuse</button>
    <div id="e4-a3-output" aria-live="polite" aria-atomic="true"></div>
  </div>
</section>

<!-- ── Exhibit 5 ── -->
<section id="exhibit-5" role="tabpanel" aria-labelledby="tab-5" class="exhibit">
  <h2>Real-World PSI Deployments</h2>
  <div id="e5-selftest" aria-live="polite" aria-atomic="true"></div>

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
    <pre aria-label="Related crypto lab projects">crypto-lab-opaque-gate       — aPAKE (authentication, related primitive)
crypto-lab-silent-tally      — private aggregation
crypto-lab-blind-oracle      — TFHE (general-purpose PSI via FHE)
crypto-lab-oblivious-shelf   — PIR (private information retrieval)
crypto-lab-patron-shield     — privacy-preserving analytics
crypto-lab-paillier-gate     — Paillier (used in some PSI variants)
crypto-lab-ot-gate           — oblivious transfer (used in OPRF-PSI)</pre>
  </div>
</section>
</main>

<footer>
  <p>DH-PSI (Meadows 1986, Huberman-Franklin-Hogg 1999) · ristretto255 via @noble/curves</p>
  <p style="margin-top:0.25rem;font-style:italic;color:var(--text-muted)">
    "Whether therefore ye eat, or drink, or whatsoever ye do, do all to the glory of God." — 1 Cor 10:31
  </p>
</footer>
`;Qn();Kn();Jn();es();ts();ns();ss();document.addEventListener("click",t=>{const e=t.target.closest(".scalar-btn");if(!e)return;const n=e.getAttribute("aria-pressed")==="true";e.setAttribute("aria-pressed",n?"false":"true"),e.classList.toggle("revealed",!n)});
