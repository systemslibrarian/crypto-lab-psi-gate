var Jt=Object.defineProperty;var Qt=(t,e,n)=>e in t?Jt(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n;var w=(t,e,n)=>Qt(t,typeof e!="symbol"?e+"":e,n);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const o of i)if(o.type==="childList")for(const r of o.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function n(i){const o={};return i.integrity&&(o.integrity=i.integrity),i.referrerPolicy&&(o.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?o.credentials="include":i.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(i){if(i.ep)return;i.ep=!0;const o=n(i);fetch(i.href,o)}})();function vt(t){return t instanceof Uint8Array||ArrayBuffer.isView(t)&&t.constructor.name==="Uint8Array"&&"BYTES_PER_ELEMENT"in t&&t.BYTES_PER_ELEMENT===1}function yt(t,e=""){if(typeof t!="number"){const n=e&&`"${e}" `;throw new TypeError(`${n}expected number, got ${typeof t}`)}if(!Number.isSafeInteger(t)||t<0){const n=e&&`"${e}" `;throw new RangeError(`${n}expected integer >= 0, got ${t}`)}}function te(t,e,n=""){const s=vt(t),i=t==null?void 0:t.length,o=e!==void 0;if(!s||o&&i!==e){const r=n&&`"${n}" `,c=o?` of length ${e}`:"",l=s?`length=${i}`:`type=${typeof t}`,a=r+"expected Uint8Array"+c+", got "+l;throw s?new RangeError(a):new TypeError(a)}return t}function Je(t,e=!0){if(t.destroyed)throw new Error("Hash instance has been destroyed");if(e&&t.finished)throw new Error("Hash#digest() has already been called")}function en(t,e){te(t,void 0,"digestInto() output");const n=e.outputLen;if(t.length<n)throw new RangeError('"digestInto() output" expected to be of length >='+n)}function He(...t){for(let e=0;e<t.length;e++)t[e].fill(0)}function Ie(t){return new DataView(t.buffer,t.byteOffset,t.byteLength)}const wt=typeof Uint8Array.from([]).toHex=="function"&&typeof Uint8Array.fromHex=="function",tn=Array.from({length:256},(t,e)=>e.toString(16).padStart(2,"0"));function ze(t){if(te(t),wt)return t.toHex();let e="";for(let n=0;n<t.length;n++)e+=tn[t[n]];return e}const U={_0:48,_9:57,A:65,F:70,a:97,f:102};function Qe(t){if(t>=U._0&&t<=U._9)return t-U._0;if(t>=U.A&&t<=U.F)return t-(U.A-10);if(t>=U.a&&t<=U.f)return t-(U.a-10)}function Ye(t){if(typeof t!="string")throw new TypeError("hex string expected, got "+typeof t);if(wt)try{return Uint8Array.fromHex(t)}catch(i){throw i instanceof SyntaxError?new RangeError(i.message):i}const e=t.length,n=e/2;if(e%2)throw new RangeError("hex string expected, got unpadded hex of length "+e);const s=new Uint8Array(n);for(let i=0,o=0;i<n;i++,o+=2){const r=Qe(t.charCodeAt(o)),c=Qe(t.charCodeAt(o+1));if(r===void 0||c===void 0){const l=t[o]+t[o+1];throw new RangeError('hex string expected, got non-hex character "'+l+'" at index '+o)}s[i]=r*16+c}return s}function nn(...t){let e=0;for(let s=0;s<t.length;s++){const i=t[s];te(i),e+=i.length}const n=new Uint8Array(e);for(let s=0,i=0;s<t.length;s++){const o=t[s];n.set(o,i),i+=o.length}return n}function sn(t,e={}){const n=(i,o)=>t(o).update(i).digest(),s=t(void 0);return n.outputLen=s.outputLen,n.blockLen=s.blockLen,n.canXOF=s.canXOF,n.create=i=>t(i),Object.assign(n,e),Object.freeze(n)}const on=t=>({oid:Uint8Array.from([6,9,96,134,72,1,101,3,4,2,t])});class rn{constructor(e,n,s,i){w(this,"blockLen");w(this,"outputLen");w(this,"canXOF",!1);w(this,"padOffset");w(this,"isLE");w(this,"buffer");w(this,"view");w(this,"finished",!1);w(this,"length",0);w(this,"pos",0);w(this,"destroyed",!1);this.blockLen=e,this.outputLen=n,this.padOffset=s,this.isLE=i,this.buffer=new Uint8Array(e),this.view=Ie(this.buffer)}update(e){Je(this),te(e);const{view:n,buffer:s,blockLen:i}=this,o=e.length;for(let r=0;r<o;){const c=Math.min(i-this.pos,o-r);if(c===i){const l=Ie(e);for(;i<=o-r;r+=i)this.process(l,r);continue}s.set(e.subarray(r,r+c),this.pos),this.pos+=c,r+=c,this.pos===i&&(this.process(n,0),this.pos=0)}return this.length+=e.length,this.roundClean(),this}digestInto(e){Je(this),en(e,this),this.finished=!0;const{buffer:n,view:s,blockLen:i,isLE:o}=this;let{pos:r}=this;n[r++]=128,He(this.buffer.subarray(r)),this.padOffset>i-r&&(this.process(s,0),r=0);for(let p=r;p<i;p++)n[p]=0;s.setBigUint64(i-8,BigInt(this.length*8),o),this.process(s,0);const c=Ie(e),l=this.outputLen;if(l%4)throw new Error("_sha2: outputLen must be aligned to 32bit");const a=l/4,u=this.get();if(a>u.length)throw new Error("_sha2: outputLen bigger than state");for(let p=0;p<a;p++)c.setUint32(4*p,u[p],o)}digest(){const{buffer:e,outputLen:n}=this;this.digestInto(e);const s=e.slice(0,n);return this.destroy(),s}_cloneInto(e){e||(e=new this.constructor),e.set(...this.get());const{blockLen:n,buffer:s,length:i,finished:o,destroyed:r,pos:c}=this;return e.destroyed=r,e.finished=o,e.length=i,e.pos=c,i%n&&e.buffer.set(s),e}clone(){return this._cloneInto()}}const O=Uint32Array.from([1779033703,4089235720,3144134277,2227873595,1013904242,4271175723,2773480762,1595750129,1359893119,2917565137,2600822924,725511199,528734635,4215389547,1541459225,327033209]),ge=BigInt(2**32-1),et=BigInt(32);function an(t,e=!1){return e?{h:Number(t&ge),l:Number(t>>et&ge)}:{h:Number(t>>et&ge)|0,l:Number(t&ge)|0}}function cn(t,e=!1){const n=t.length;let s=new Uint32Array(n),i=new Uint32Array(n);for(let o=0;o<n;o++){const{h:r,l:c}=an(t[o],e);[s[o],i[o]]=[r,c]}return[s,i]}const tt=(t,e,n)=>t>>>n,nt=(t,e,n)=>t<<32-n|e>>>n,oe=(t,e,n)=>t>>>n|e<<32-n,re=(t,e,n)=>t<<32-n|e>>>n,ve=(t,e,n)=>t<<64-n|e>>>n-32,ye=(t,e,n)=>t>>>n-32|e<<64-n;function X(t,e,n,s){const i=(e>>>0)+(s>>>0);return{h:t+n+(i/2**32|0)|0,l:i|0}}const ln=(t,e,n)=>(t>>>0)+(e>>>0)+(n>>>0),dn=(t,e,n,s)=>e+n+s+(t/2**32|0)|0,un=(t,e,n,s)=>(t>>>0)+(e>>>0)+(n>>>0)+(s>>>0),pn=(t,e,n,s,i)=>e+n+s+i+(t/2**32|0)|0,fn=(t,e,n,s,i)=>(t>>>0)+(e>>>0)+(n>>>0)+(s>>>0)+(i>>>0),hn=(t,e,n,s,i,o)=>e+n+s+i+o+(t/2**32|0)|0,xt=cn(["0x428a2f98d728ae22","0x7137449123ef65cd","0xb5c0fbcfec4d3b2f","0xe9b5dba58189dbbc","0x3956c25bf348b538","0x59f111f1b605d019","0x923f82a4af194f9b","0xab1c5ed5da6d8118","0xd807aa98a3030242","0x12835b0145706fbe","0x243185be4ee4b28c","0x550c7dc3d5ffb4e2","0x72be5d74f27b896f","0x80deb1fe3b1696b1","0x9bdc06a725c71235","0xc19bf174cf692694","0xe49b69c19ef14ad2","0xefbe4786384f25e3","0x0fc19dc68b8cd5b5","0x240ca1cc77ac9c65","0x2de92c6f592b0275","0x4a7484aa6ea6e483","0x5cb0a9dcbd41fbd4","0x76f988da831153b5","0x983e5152ee66dfab","0xa831c66d2db43210","0xb00327c898fb213f","0xbf597fc7beef0ee4","0xc6e00bf33da88fc2","0xd5a79147930aa725","0x06ca6351e003826f","0x142929670a0e6e70","0x27b70a8546d22ffc","0x2e1b21385c26c926","0x4d2c6dfc5ac42aed","0x53380d139d95b3df","0x650a73548baf63de","0x766a0abb3c77b2a8","0x81c2c92e47edaee6","0x92722c851482353b","0xa2bfe8a14cf10364","0xa81a664bbc423001","0xc24b8b70d0f89791","0xc76c51a30654be30","0xd192e819d6ef5218","0xd69906245565a910","0xf40e35855771202a","0x106aa07032bbd1b8","0x19a4c116b8d2d0c8","0x1e376c085141ab53","0x2748774cdf8eeb99","0x34b0bcb5e19b48a8","0x391c0cb3c5c95a63","0x4ed8aa4ae3418acb","0x5b9cca4f7763e373","0x682e6ff3d6b2b8a3","0x748f82ee5defb2fc","0x78a5636f43172f60","0x84c87814a1f0ab72","0x8cc702081a6439ec","0x90befffa23631e28","0xa4506cebde82bde9","0xbef9a3f7b2c67915","0xc67178f2e372532b","0xca273eceea26619c","0xd186b8c721c0c207","0xeada7dd6cde0eb1e","0xf57d4f7fee6ed178","0x06f067aa72176fba","0x0a637dc5a2c898a6","0x113f9804bef90dae","0x1b710b35131c471b","0x28db77f523047d84","0x32caab7b40c72493","0x3c9ebe0a15c9bebc","0x431d67c49c100d4c","0x4cc5d4becb3e42b6","0x597f299cfc657e2a","0x5fcb6fab3ad6faec","0x6c44198c4a475817"].map(t=>BigInt(t))),mn=xt[0],bn=xt[1],W=new Uint32Array(80),G=new Uint32Array(80);class gn extends rn{constructor(e){super(128,e,16,!1)}get(){const{Ah:e,Al:n,Bh:s,Bl:i,Ch:o,Cl:r,Dh:c,Dl:l,Eh:a,El:u,Fh:p,Fl:d,Gh:h,Gl:b,Hh:g,Hl:v}=this;return[e,n,s,i,o,r,c,l,a,u,p,d,h,b,g,v]}set(e,n,s,i,o,r,c,l,a,u,p,d,h,b,g,v){this.Ah=e|0,this.Al=n|0,this.Bh=s|0,this.Bl=i|0,this.Ch=o|0,this.Cl=r|0,this.Dh=c|0,this.Dl=l|0,this.Eh=a|0,this.El=u|0,this.Fh=p|0,this.Fl=d|0,this.Gh=h|0,this.Gl=b|0,this.Hh=g|0,this.Hl=v|0}process(e,n){for(let m=0;m<16;m++,n+=4)W[m]=e.getUint32(n),G[m]=e.getUint32(n+=4);for(let m=16;m<80;m++){const S=W[m-15]|0,x=G[m-15]|0,E=oe(S,x,1)^oe(S,x,8)^tt(S,x,7),_=re(S,x,1)^re(S,x,8)^nt(S,x,7),B=W[m-2]|0,$=G[m-2]|0,R=oe(B,$,19)^ve(B,$,61)^tt(B,$,6),D=re(B,$,19)^ye(B,$,61)^nt(B,$,6),P=un(_,D,G[m-7],G[m-16]),M=pn(P,E,R,W[m-7],W[m-16]);W[m]=M|0,G[m]=P|0}let{Ah:s,Al:i,Bh:o,Bl:r,Ch:c,Cl:l,Dh:a,Dl:u,Eh:p,El:d,Fh:h,Fl:b,Gh:g,Gl:v,Hh:f,Hl:y}=this;for(let m=0;m<80;m++){const S=oe(p,d,14)^oe(p,d,18)^ve(p,d,41),x=re(p,d,14)^re(p,d,18)^ye(p,d,41),E=p&h^~p&g,_=d&b^~d&v,B=fn(y,x,_,bn[m],G[m]),$=hn(B,f,S,E,mn[m],W[m]),R=B|0,D=oe(s,i,28)^ve(s,i,34)^ve(s,i,39),P=re(s,i,28)^ye(s,i,34)^ye(s,i,39),M=s&o^s&c^o&c,F=i&r^i&l^r&l;f=g|0,y=v|0,g=h|0,v=b|0,h=p|0,b=d|0,{h:p,l:d}=X(a|0,u|0,$|0,R|0),a=c|0,u=l|0,c=o|0,l=r|0,o=s|0,r=i|0;const z=ln(R,P,F);s=dn(z,$,D,M),i=z|0}({h:s,l:i}=X(this.Ah|0,this.Al|0,s|0,i|0)),{h:o,l:r}=X(this.Bh|0,this.Bl|0,o|0,r|0),{h:c,l}=X(this.Ch|0,this.Cl|0,c|0,l|0),{h:a,l:u}=X(this.Dh|0,this.Dl|0,a|0,u|0),{h:p,l:d}=X(this.Eh|0,this.El|0,p|0,d|0),{h,l:b}=X(this.Fh|0,this.Fl|0,h|0,b|0),{h:g,l:v}=X(this.Gh|0,this.Gl|0,g|0,v|0),{h:f,l:y}=X(this.Hh|0,this.Hl|0,f|0,y|0),this.set(s,i,o,r,c,l,a,u,p,d,h,b,g,v,f,y)}roundClean(){He(W,G)}destroy(){this.destroyed=!0,He(this.buffer),this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0)}}class vn extends gn{constructor(){super(64);w(this,"Ah",O[0]|0);w(this,"Al",O[1]|0);w(this,"Bh",O[2]|0);w(this,"Bl",O[3]|0);w(this,"Ch",O[4]|0);w(this,"Cl",O[5]|0);w(this,"Dh",O[6]|0);w(this,"Dl",O[7]|0);w(this,"Eh",O[8]|0);w(this,"El",O[9]|0);w(this,"Fh",O[10]|0);w(this,"Fl",O[11]|0);w(this,"Gh",O[12]|0);w(this,"Gl",O[13]|0);w(this,"Hh",O[14]|0);w(this,"Hl",O[15]|0)}}const st=sn(()=>new vn,on(3));/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */const le=(t,e,n)=>te(t,e,n),Et=yt,St=ze,ae=(...t)=>nn(...t),yn=t=>Ye(t),wn=vt,Se=BigInt(0),Le=BigInt(1);function Bt(t,e=""){if(typeof t!="boolean"){const n=e&&`"${e}" `;throw new TypeError(n+"expected boolean, got type="+typeof t)}return t}function xn(t){if(typeof t=="bigint"){if(!Ee(t))throw new RangeError("positive bigint expected, got "+t)}else Et(t);return t}function he(t,e=""){if(typeof t!="number"){const n=e&&`"${e}" `;throw new TypeError(n+"expected number, got type="+typeof t)}if(!Number.isSafeInteger(t)){const n=e&&`"${e}" `;throw new RangeError(n+"expected safe integer, got "+t)}}function At(t){if(typeof t!="string")throw new TypeError("hex string expected, got "+typeof t);return t===""?Se:BigInt("0x"+t)}function En(t){return At(ze(t))}function Ae(t){return At(ze(De(te(t)).reverse()))}function It(t,e){if(yt(e),e===0)throw new RangeError("zero length");t=xn(t);const n=t.toString(16);if(n.length>e*2)throw new RangeError("number too large");return Ye(n.padStart(e*2,"0"))}function Sn(t,e){return It(t,e).reverse()}function Bn(t,e){if(t=le(t),e=le(e),t.length!==e.length)return!1;let n=0;for(let s=0;s<t.length;s++)n|=t[s]^e[s];return n===0}function De(t){return Uint8Array.from(le(t))}function $t(t){if(typeof t!="string")throw new TypeError("ascii string expected, got "+typeof t);return Uint8Array.from(t,(e,n)=>{const s=e.charCodeAt(0);if(e.length!==1||s>127)throw new RangeError(`string contains non-ASCII character "${t[n]}" with code ${s} at position ${n}`);return s})}const Ee=t=>typeof t=="bigint"&&Se<=t;function An(t,e,n){return Ee(t)&&Ee(e)&&Ee(n)&&e<=t&&t<n}function it(t,e,n,s){if(!An(e,n,s))throw new RangeError("expected valid "+t+": "+n+" <= n < "+s+", got "+e)}function In(t){if(t<Se)throw new Error("expected non-negative bigint, got "+t);let e;for(e=0;t>Se;t>>=Le,e+=1);return e}const $n=t=>(Le<<BigInt(t))-Le;function _t(t,e={},n={}){if(Object.prototype.toString.call(t)!=="[object Object]")throw new TypeError("expected valid options object");function s(o,r,c){if(!c&&r!=="function"&&!Object.hasOwn(t,o))throw new TypeError(`param "${o}" is invalid: expected own property`);const l=t[o];if(c&&l===void 0)return;const a=typeof l;if(a!==r||l===null)throw new TypeError(`param "${o}" is invalid: expected ${r}, got ${a}`)}const i=(o,r)=>Object.entries(o).forEach(([c,l])=>s(c,l,r));i(e,!1),i(n,!0)}const ot=()=>{throw new Error("not implemented")};/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */const H=BigInt(0),k=BigInt(1),ne=BigInt(2),Rt=BigInt(3),Tt=BigInt(4),kt=BigInt(5),_n=BigInt(7),Ot=BigInt(8),Rn=BigInt(9),Ht=BigInt(16);function T(t,e){if(e<=H)throw new Error("mod: expected positive modulus, got "+e);const n=t%e;return n>=H?n:e+n}function Y(t,e,n){if(e<H)throw new Error("pow2: expected non-negative exponent, got "+e);let s=t;for(;e-- >H;)s*=s,s%=n;return s}function rt(t,e){if(t===H)throw new Error("invert: expected non-zero number");if(e<=H)throw new Error("invert: expected positive modulus, got "+e);let n=T(t,e),s=e,i=H,o=k;for(;n!==H;){const c=s/n,l=s-n*c,a=i-o*c;s=n,n=l,i=o,o=a}if(s!==k)throw new Error("invert: does not exist");return T(i,e)}function qe(t,e,n){const s=t;if(!s.eql(s.sqr(e),n))throw new Error("Cannot find square root")}function Lt(t,e){const n=t,s=(n.ORDER+k)/Tt,i=n.pow(e,s);return qe(n,i,e),i}function Tn(t,e){const n=t,s=(n.ORDER-kt)/Ot,i=n.mul(e,ne),o=n.pow(i,s),r=n.mul(e,o),c=n.mul(n.mul(r,ne),o),l=n.mul(r,n.sub(c,n.ONE));return qe(n,l,e),l}function kn(t){const e=Ze(t),n=Dt(t),s=n(e,e.neg(e.ONE)),i=n(e,s),o=n(e,e.neg(s)),r=(t+_n)/Ht;return((c,l)=>{const a=c;let u=a.pow(l,r),p=a.mul(u,s);const d=a.mul(u,i),h=a.mul(u,o),b=a.eql(a.sqr(p),l),g=a.eql(a.sqr(d),l);u=a.cmov(u,p,b),p=a.cmov(h,d,g);const v=a.eql(a.sqr(p),l),f=a.cmov(u,p,v);return qe(a,f,l),f})}function Dt(t){if(t<Rt)throw new Error("sqrt is not defined for small field");let e=t-k,n=0;for(;e%ne===H;)e/=ne,n++;let s=ne;const i=Ze(t);for(;at(i,s)===1;)if(s++>1e3)throw new Error("Cannot find square root: probably non-prime P");if(n===1)return Lt;let o=i.pow(s,e);const r=(e+k)/ne;return function(l,a){const u=l;if(u.is0(a))return a;if(at(u,a)!==1)throw new Error("Cannot find square root");let p=n,d=u.mul(u.ONE,o),h=u.pow(a,e),b=u.pow(a,r);for(;!u.eql(h,u.ONE);){if(u.is0(h))return u.ZERO;let g=1,v=u.sqr(h);for(;!u.eql(v,u.ONE);)if(g++,v=u.sqr(v),g===p)throw new Error("Cannot find square root");const f=k<<BigInt(p-g-1),y=u.pow(d,f);p=g,d=u.sqr(y),h=u.mul(h,d),b=u.mul(b,y)}return b}}function On(t){return t%Tt===Rt?Lt:t%Ot===kt?Tn:t%Ht===Rn?kn(t):Dt(t)}const J=(t,e)=>(T(t,e)&k)===k,Hn=["create","isValid","is0","neg","inv","sqrt","sqr","eql","add","sub","mul","pow","div","addN","subN","mulN","sqrN"];function Ln(t){const e={ORDER:"bigint",BYTES:"number",BITS:"number"},n=Hn.reduce((s,i)=>(s[i]="function",s),e);if(_t(t,n),he(t.BYTES,"BYTES"),he(t.BITS,"BITS"),t.BYTES<1||t.BITS<1)throw new Error("invalid field: expected BYTES/BITS > 0");if(t.ORDER<=k)throw new Error("invalid field: expected ORDER > 1, got "+t.ORDER);return t}function Dn(t,e,n){const s=t;if(n<H)throw new Error("invalid exponent, negatives unsupported");if(n===H)return s.ONE;if(n===k)return e;let i=s.ONE,o=e;for(;n>H;)n&k&&(i=s.mul(i,o)),o=s.sqr(o),n>>=k;return i}function Pt(t,e,n=!1){const s=t,i=new Array(e.length).fill(n?s.ZERO:void 0),o=e.reduce((c,l,a)=>s.is0(l)?c:(i[a]=c,s.mul(c,l)),s.ONE),r=s.inv(o);return e.reduceRight((c,l,a)=>s.is0(l)?c:(i[a]=s.mul(c,i[a]),s.mul(c,l)),r),i}function at(t,e){const n=t,s=(n.ORDER-k)/ne,i=n.pow(e,s),o=n.eql(i,n.ONE),r=n.eql(i,n.ZERO),c=n.eql(i,n.neg(n.ONE));if(!o&&!r&&!c)throw new Error("invalid Legendre symbol result");return o?1:r?0:-1}function Pn(t,e){if(e!==void 0&&Et(e),t<=H)throw new Error("invalid n length: expected positive n, got "+t);if(e!==void 0&&e<1)throw new Error("invalid n length: expected positive bit length, got "+e);const n=In(t);if(e!==void 0&&e<n)throw new Error(`invalid n length: expected bit length (${n}) >= n.length (${e})`);const s=e!==void 0?e:n,i=Math.ceil(s/8);return{nBitLength:s,nByteLength:i}}const ct=new WeakMap;class Ft{constructor(e,n={}){w(this,"ORDER");w(this,"BITS");w(this,"BYTES");w(this,"isLE");w(this,"ZERO",H);w(this,"ONE",k);w(this,"_lengths");w(this,"_mod");if(e<=k)throw new Error("invalid field: expected ORDER > 1, got "+e);let s;this.isLE=!1,n!=null&&typeof n=="object"&&(typeof n.BITS=="number"&&(s=n.BITS),typeof n.sqrt=="function"&&Object.defineProperty(this,"sqrt",{value:n.sqrt,enumerable:!0}),typeof n.isLE=="boolean"&&(this.isLE=n.isLE),n.allowedLengths&&(this._lengths=Object.freeze(n.allowedLengths.slice())),typeof n.modFromBytes=="boolean"&&(this._mod=n.modFromBytes));const{nBitLength:i,nByteLength:o}=Pn(e,s);if(o>2048)throw new Error("invalid field: expected ORDER of <= 2048 bytes");this.ORDER=e,this.BITS=i,this.BYTES=o,Object.freeze(this)}create(e){return T(e,this.ORDER)}isValid(e){if(typeof e!="bigint")throw new TypeError("invalid field element: expected bigint, got "+typeof e);return H<=e&&e<this.ORDER}is0(e){return e===H}isValidNot0(e){return!this.is0(e)&&this.isValid(e)}isOdd(e){return(e&k)===k}neg(e){return T(-e,this.ORDER)}eql(e,n){return e===n}sqr(e){return T(e*e,this.ORDER)}add(e,n){return T(e+n,this.ORDER)}sub(e,n){return T(e-n,this.ORDER)}mul(e,n){return T(e*n,this.ORDER)}pow(e,n){return Dn(this,e,n)}div(e,n){return T(e*rt(n,this.ORDER),this.ORDER)}sqrN(e){return e*e}addN(e,n){return e+n}subN(e,n){return e-n}mulN(e,n){return e*n}inv(e){return rt(e,this.ORDER)}sqrt(e){let n=ct.get(this);return n||ct.set(this,n=On(this.ORDER)),n(this,e)}toBytes(e){return this.isLE?Sn(e,this.BYTES):It(e,this.BYTES)}fromBytes(e,n=!1){le(e);const{_lengths:s,BYTES:i,isLE:o,ORDER:r,_mod:c}=this;if(s){if(e.length<1||!s.includes(e.length)||e.length>i)throw new Error("Field.fromBytes: expected "+s+" bytes, got "+e.length);const a=new Uint8Array(i);a.set(e,o?0:a.length-e.length),e=a}if(e.length!==i)throw new Error("Field.fromBytes: expected "+i+" bytes, got "+e.length);let l=o?Ae(e):En(e);if(c&&(l=T(l,r)),!n&&!this.isValid(l))throw new Error("invalid field element: outside of range 0..ORDER");return l}invertBatch(e){return Pt(this,e)}cmov(e,n,s){return Bt(s,"condition"),s?n:e}}Object.freeze(Ft.prototype);function Ze(t,e={}){return new Ft(t,e)}/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */const Be=BigInt(0),Pe=BigInt(1);function lt(t,e){const n=e.negate();return t?n:e}function $e(t,e){const n=Pt(t.Fp,e.map(s=>s.Z));return e.map((s,i)=>t.fromAffine(s.toAffine(n[i])))}function Ct(t,e){if(!Number.isSafeInteger(t)||t<=0||t>e)throw new Error("invalid window size, expected [1.."+e+"], got W="+t)}function _e(t,e){Ct(t,e);const n=Math.ceil(e/t)+1,s=2**(t-1),i=2**t,o=$n(t),r=BigInt(t);return{windows:n,windowSize:s,mask:o,maxNumber:i,shiftBy:r}}function dt(t,e,n){const{windowSize:s,mask:i,maxNumber:o,shiftBy:r}=n;let c=Number(t&i),l=t>>r;c>s&&(c-=o,l+=Pe);const a=e*s,u=a+Math.abs(c)-1,p=c===0,d=c<0,h=e%2!==0;return{nextN:l,offset:u,isZero:p,isNeg:d,isNegF:h,offsetF:a}}const Re=new WeakMap,jt=new WeakMap;function Te(t){return jt.get(t)||1}function ut(t){if(t!==Be)throw new Error("invalid wNAF")}class Fn{constructor(e,n){w(this,"BASE");w(this,"ZERO");w(this,"Fn");w(this,"bits");this.BASE=e.BASE,this.ZERO=e.ZERO,this.Fn=e.Fn,this.bits=n}_unsafeLadder(e,n,s=this.ZERO){let i=e;for(;n>Be;)n&Pe&&(s=s.add(i)),i=i.double(),n>>=Pe;return s}precomputeWindow(e,n){const{windows:s,windowSize:i}=_e(n,this.bits),o=[];let r=e,c=r;for(let l=0;l<s;l++){c=r,o.push(c);for(let a=1;a<i;a++)c=c.add(r),o.push(c);r=c.double()}return o}wNAF(e,n,s){if(!this.Fn.isValid(s))throw new Error("invalid scalar");let i=this.ZERO,o=this.BASE;const r=_e(e,this.bits);for(let c=0;c<r.windows;c++){const{nextN:l,offset:a,isZero:u,isNeg:p,isNegF:d,offsetF:h}=dt(s,c,r);s=l,u?o=o.add(lt(d,n[h])):i=i.add(lt(p,n[a]))}return ut(s),{p:i,f:o}}wNAFUnsafe(e,n,s,i=this.ZERO){const o=_e(e,this.bits);for(let r=0;r<o.windows&&s!==Be;r++){const{nextN:c,offset:l,isZero:a,isNeg:u}=dt(s,r,o);if(s=c,!a){const p=n[l];i=i.add(u?p.negate():p)}}return ut(s),i}getPrecomputes(e,n,s){let i=Re.get(n);return i||(i=this.precomputeWindow(n,e),e!==1&&(typeof s=="function"&&(i=s(i)),Re.set(n,i))),i}cached(e,n,s){const i=Te(e);return this.wNAF(i,this.getPrecomputes(i,e,s),n)}unsafe(e,n,s,i){const o=Te(e);return o===1?this._unsafeLadder(e,n,i):this.wNAFUnsafe(o,this.getPrecomputes(o,e,s),n,i)}createCache(e,n){Ct(n,this.bits),jt.set(e,n),Re.delete(e)}hasCache(e){return Te(e)!==1}}function pt(t,e,n){if(e){if(e.ORDER!==t)throw new Error("Field.ORDER must match order: Fp == p, Fn == n");return Ln(e),e}else return Ze(t,{isLE:n})}function Cn(t,e,n={},s){if(s===void 0&&(s=t==="edwards"),!e||typeof e!="object")throw new Error(`expected valid ${t} CURVE object`);for(const l of["p","n","h"]){const a=e[l];if(!(typeof a=="bigint"&&a>Be))throw new Error(`CURVE.${l} must be positive bigint`)}const i=pt(e.p,n.Fp,s),o=pt(e.n,n.Fn,s),c=["Gx","Gy","a","d"];for(const l of c)if(!i.isValid(e[l]))throw new Error(`CURVE.${l} must be valid field element of CURVE.Fp`);return e=Object.freeze(Object.assign({},e)),{CURVE:e,Fp:i,Fn:o}}/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */const K=BigInt(0),C=BigInt(1),ke=BigInt(2),jn=BigInt(8);function Mn(t,e,n,s){const i=t.sqr(n),o=t.sqr(s),r=t.add(t.mul(e.a,i),o),c=t.add(t.ONE,t.mul(e.d,t.mul(i,o)));return t.eql(r,c)}function Nn(t,e={}){const n=e,s=Cn("edwards",t,n,n.FpFnLE),{Fp:i,Fn:o}=s;let r=s.CURVE;const{h:c}=r;_t(n,{},{uvRatio:"function"});const l=ke<<BigInt(o.BYTES*8)-C,a=v=>i.create(v),u=n.uvRatio===void 0?(v,f)=>{try{return{isValid:!0,value:i.sqrt(i.div(v,f))}}catch{return{isValid:!1,value:K}}}:n.uvRatio;if(!Mn(i,r,r.Gx,r.Gy))throw new Error("bad curve params: generator point");function p(v,f,y=!1){const m=y?C:K;return it("coordinate "+v,f,m,l),f}function d(v){if(!(v instanceof h))throw new Error("EdwardsPoint expected")}const g=class g{constructor(f,y,m,S){w(this,"X");w(this,"Y");w(this,"Z");w(this,"T");this.X=p("x",f),this.Y=p("y",y),this.Z=p("z",m,!0),this.T=p("t",S),Object.freeze(this)}static CURVE(){return r}static fromAffine(f){if(f instanceof g)throw new Error("extended point not allowed");const{x:y,y:m}=f||{};return p("x",y),p("y",m),new g(y,m,C,a(y*m))}static fromBytes(f,y=!1){const m=i.BYTES,{a:S,d:x}=r;f=De(le(f,m,"point")),Bt(y,"zip215");const E=De(f),_=f[m-1];E[m-1]=_&-129;const B=Ae(E),$=y?l:i.ORDER;it("point.y",B,K,$);const R=a(B*B),D=a(R-C),P=a(x*R-S);let{isValid:M,value:F}=u(D,P);if(!M)throw new Error("bad point: invalid y coordinate");const z=(F&C)===C,Z=(_&128)!==0;if(!y&&F===K&&Z)throw new Error("bad point: x=0 and x_0=1");return Z!==z&&(F=a(-F)),g.fromAffine({x:F,y:B})}static fromHex(f,y=!1){return g.fromBytes(yn(f),y)}get x(){return this.toAffine().x}get y(){return this.toAffine().y}precompute(f=8,y=!0){return b.createCache(this,f),y||this.multiply(ke),this}assertValidity(){const f=this,{a:y,d:m}=r;if(f.is0())throw new Error("bad point: ZERO");const{X:S,Y:x,Z:E,T:_}=f,B=a(S*S),$=a(x*x),R=a(E*E),D=a(R*R),P=a(B*y),M=a(R*a(P+$)),F=a(D+a(m*a(B*$)));if(M!==F)throw new Error("bad point: equation left != right (1)");const z=a(S*x),Z=a(E*_);if(z!==Z)throw new Error("bad point: equation left != right (2)")}equals(f){d(f);const{X:y,Y:m,Z:S}=this,{X:x,Y:E,Z:_}=f,B=a(y*_),$=a(x*S),R=a(m*_),D=a(E*S);return B===$&&R===D}is0(){return this.equals(g.ZERO)}negate(){return new g(a(-this.X),this.Y,this.Z,a(-this.T))}double(){const{a:f}=r,{X:y,Y:m,Z:S}=this,x=a(y*y),E=a(m*m),_=a(ke*a(S*S)),B=a(f*x),$=y+m,R=a(a($*$)-x-E),D=B+E,P=D-_,M=B-E,F=a(R*P),z=a(D*M),Z=a(R*M),be=a(P*D);return new g(F,z,be,Z)}add(f){d(f);const{a:y,d:m}=r,{X:S,Y:x,Z:E,T:_}=this,{X:B,Y:$,Z:R,T:D}=f,P=a(S*B),M=a(x*$),F=a(_*m*D),z=a(E*R),Z=a((S+x)*(B+$)-P-M),be=z-F,Ge=z+F,Ke=a(M-y*P),Vt=a(Z*be),Wt=a(Ge*Ke),Gt=a(Z*Ke),Kt=a(be*Ge);return new g(Vt,Wt,Kt,Gt)}subtract(f){return d(f),this.add(f.negate())}multiply(f){if(!o.isValidNot0(f))throw new RangeError("invalid scalar: expected 1 <= sc < curve.n");const{p:y,f:m}=b.cached(this,f,S=>$e(g,S));return $e(g,[y,m])[0]}multiplyUnsafe(f){if(!o.isValid(f))throw new RangeError("invalid scalar: expected 0 <= sc < curve.n");return f===K?g.ZERO:this.is0()||f===C?this:b.unsafe(this,f,y=>$e(g,y))}isSmallOrder(){return this.clearCofactor().is0()}isTorsionFree(){return b.unsafe(this,r.n).is0()}toAffine(f){const y=this;let m=f;const{X:S,Y:x,Z:E}=y,_=y.is0();m==null&&(m=_?jn:i.inv(E));const B=a(S*m),$=a(x*m),R=i.mul(E,m);if(_)return{x:K,y:C};if(R!==C)throw new Error("invZ was invalid");return{x:B,y:$}}clearCofactor(){return c===C?this:this.multiplyUnsafe(c)}toBytes(){const{x:f,y}=this.toAffine(),m=i.toBytes(y);return m[m.length-1]|=f&C?128:0,m}toHex(){return St(this.toBytes())}toString(){return`<Point ${this.is0()?"ZERO":this.toHex()}>`}};w(g,"BASE",new g(r.Gx,r.Gy,C,a(r.Gx*r.Gy))),w(g,"ZERO",new g(K,C,C,K)),w(g,"Fp",i),w(g,"Fn",o);let h=g;const b=new Fn(h,o.BITS);return o.BITS>=8&&h.BASE.precompute(8),Object.freeze(h.prototype),Object.freeze(h),h}class pe{constructor(e){w(this,"ep");this.ep=e}static fromBytes(e){ot()}static fromHex(e){ot()}get x(){return this.toAffine().x}get y(){return this.toAffine().y}clearCofactor(){return this}assertValidity(){this.ep.assertValidity()}toAffine(e){return this.ep.toAffine(e)}toHex(){return St(this.toBytes())}toString(){return this.toHex()}isTorsionFree(){return!0}isSmallOrder(){return!1}add(e){return this.assertSame(e),this.init(this.ep.add(e.ep))}subtract(e){return this.assertSame(e),this.init(this.ep.subtract(e.ep))}multiply(e){return this.init(this.ep.multiply(e))}multiplyUnsafe(e){return this.init(this.ep.multiplyUnsafe(e))}double(){return this.init(this.ep.double())}negate(){return this.init(this.ep.negate())}precompute(e,n){return this.ep.precompute(e,n),this}}w(pe,"BASE"),w(pe,"ZERO"),w(pe,"Fp"),w(pe,"Fn");function ue(t,e){if(he(t),he(e),e<0||e>4)throw new Error("invalid I2OSP length: "+e);if(t<0||t>2**(8*e)-1)throw new Error("invalid I2OSP input: "+t);const n=Array.from({length:e}).fill(0);for(let s=e-1;s>=0;s--)n[s]=t&255,t>>>=8;return new Uint8Array(n)}function zn(t,e){const n=new Uint8Array(t.length);for(let s=0;s<t.length;s++)n[s]=t[s]^e[s];return n}function Yn(t){if(!wn(t)&&typeof t!="string")throw new Error("DST must be Uint8Array or ascii string");const e=typeof t=="string"?$t(t):t;if(e.length===0)throw new Error("DST must be non-empty");return e}function ft(t,e,n,s){le(t),he(n),e=Yn(e),e.length>255&&(e=s(ae($t("H2C-OVERSIZE-DST-"),e)));const{outputLen:i,blockLen:o}=s,r=Math.ceil(n/i);if(r>255)throw new Error("expand_message_xmd: invalid lenInBytes");const c=ae(e,ue(e.length,1)),l=new Uint8Array(o),a=ue(n,2),u=new Array(r),p=s(ae(l,t,a,ue(0,1),c));u[0]=s(ae(p,ue(1,1),c));for(let h=1;h<r;h++){const b=[zn(p,u[h-1]),ue(h+1,1),c];u[h]=s(ae(...b))}return ae(...u).slice(0,n)}const qn="HashToScalar-";/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */const Zn=BigInt(0),V=BigInt(1),ht=BigInt(2),Un=BigInt(5),Xn=BigInt(8),de=BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffed"),Ue={p:de,n:BigInt("0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed"),h:Xn,a:BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffec"),d:BigInt("0x52036cee2b6ffe738cc740797779e89800700a4d4141d8ab75eb4dca135978a3"),Gx:BigInt("0x216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a"),Gy:BigInt("0x6666666666666666666666666666666666666666666666666666666666666658")};function Vn(t){const e=BigInt(10),n=BigInt(20),s=BigInt(40),i=BigInt(80),o=de,c=t*t%o*t%o,l=Y(c,ht,o)*c%o,a=Y(l,V,o)*t%o,u=Y(a,Un,o)*a%o,p=Y(u,e,o)*u%o,d=Y(p,n,o)*p%o,h=Y(d,s,o)*d%o,b=Y(h,i,o)*h%o,g=Y(b,i,o)*h%o,v=Y(g,e,o)*u%o;return{pow_p_5_8:Y(v,ht,o)*t%o,b2:c}}const Fe=BigInt("19681161376707505956807079304988542015446066515923890162744021073123829784752");function Xe(t,e){const n=de,s=T(e*e*e,n),i=T(s*s*e,n),o=Vn(t*i).pow_p_5_8;let r=T(t*s*o,n);const c=T(e*r*r,n),l=r,a=T(r*Fe,n),u=c===t,p=c===T(-t,n),d=c===T(-t*Fe,n);return u&&(r=l),(p||d)&&(r=a),J(r,n)&&(r=T(-r,n)),{isValid:u||p,value:r}}const se=Nn(Ue,{uvRatio:Xe}),Q=se.Fp,Mt=se.Fn,Ce=Fe,Wn=BigInt("25063068953384623474111414158702152701244531502492656460079210482610430750235"),Gn=BigInt("54469307008909316920995813868745141605393597292927456921205312896311721017578"),Kn=BigInt("1159843021668779879193775521855586647937357759715417654439879720876111806838"),Jn=BigInt("40440834346308536858101042469323190826248399146238708352240133220865137265952"),mt=t=>Xe(V,t),Qn=BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"),je=t=>Q.create(Ae(t)&Qn);function bt(t){const{d:e}=Ue,n=de,s=f=>Q.create(f),i=s(Ce*t*t),o=s((i+V)*Kn);let r=BigInt(-1);const c=s((r-e*i)*s(i+e));let{isValid:l,value:a}=Xe(o,c),u=s(a*t);J(u,n)||(u=s(-u)),l||(a=u),l||(r=i);const p=s(r*(i-V)*Jn-c),d=a*a,h=s((a+a)*c),b=s(p*Wn),g=s(V-d),v=s(V+d);return new se(s(h*v),s(g*b),s(b*v),s(h*g))}const j=class j extends pe{constructor(e){super(e)}static fromAffine(e){return new j(se.fromAffine(e))}assertSame(e){if(!(e instanceof j))throw new Error("RistrettoPoint expected")}init(e){return new j(e)}static fromBytes(e){te(e,32);const{a:n,d:s}=Ue,i=de,o=S=>Q.create(S),r=je(e);if(!Bn(Q.toBytes(r),e)||J(r,i))throw new Error("invalid ristretto255 encoding 1");const c=o(r*r),l=o(V+n*c),a=o(V-n*c),u=o(l*l),p=o(a*a),d=o(n*s*u-p),{isValid:h,value:b}=mt(o(d*p)),g=o(b*a),v=o(b*g*d);let f=o((r+r)*g);J(f,i)&&(f=o(-f));const y=o(l*v),m=o(f*y);if(!h||J(m,i)||y===Zn)throw new Error("invalid ristretto255 encoding 2");return new j(new se(f,y,V,m))}static fromHex(e){return j.fromBytes(Ye(e))}toBytes(){let{X:e,Y:n,Z:s,T:i}=this.ep;const o=de,r=v=>Q.create(v),c=r(r(s+n)*r(s-n)),l=r(e*n),a=r(l*l),{value:u}=mt(r(c*a)),p=r(u*c),d=r(u*l),h=r(p*d*i);let b;if(J(i*h,o)){let v=r(n*Ce),f=r(e*Ce);e=v,n=f,b=r(p*Gn)}else b=d;J(e*h,o)&&(n=r(-n));let g=r((s-n)*b);return J(g,o)&&(g=r(-g)),Q.toBytes(g)}equals(e){this.assertSame(e);const{X:n,Y:s}=this.ep,{X:i,Y:o}=e.ep,r=a=>Q.create(a),c=r(n*o)===r(s*i),l=r(s*o)===r(n*i);return c||l}is0(){return this.equals(j.ZERO)}};w(j,"BASE",new j(se.BASE)),w(j,"ZERO",new j(se.ZERO)),w(j,"Fp",Q),w(j,"Fn",Mt);let ee=j;Object.freeze(ee.BASE);Object.freeze(ee.ZERO);Object.freeze(ee.prototype);Object.freeze(ee);const me=Object.freeze({Point:ee,hashToCurve(t,e){const n=(e==null?void 0:e.DST)===void 0?"ristretto255_XMD:SHA-512_R255MAP_RO_":e.DST,s=ft(t,n,64,st);return me.deriveToCurve(s)},hashToScalar(t,e={DST:qn}){const n=ft(t,e.DST,64,st);return Mt.create(Ae(n))},deriveToCurve(t){te(t,64);const e=je(t.subarray(0,32)),n=bt(e),s=je(t.subarray(32,64)),i=bt(s);return new ee(n.add(i))}}),Nt=me.Point.Fn.ORDER,zt=me.Point;function Ve(t){const e=t.toString(16).padStart(64,"0"),n=new Uint8Array(32);for(let s=0;s<32;s++)n[s]=parseInt(e.slice(s*2,s*2+2),16);return n}function We(t){let e="";for(const n of t)e+=n.toString(16).padStart(2,"0");return BigInt("0x"+e)}function ie(){let t;do{const e=new Uint8Array(32);crypto.getRandomValues(e),t=We(e)}while(t===0n||t>=Nt);return Ve(t)}function gt(t){let e=t.toLowerCase().replace(/[^0-9a-f]/g,"");e.length===0&&(e="01"),e.length<64&&(e=e.padStart(64,"0")),e.length>64&&(e=e.slice(-64));let n=BigInt("0x"+e)%Nt;return n===0n&&(n=1n),Ve(n)}function we(t){if(t.length!==32)return!1;try{return zt.fromBytes(t),!t.every(e=>e===0)}catch{return!1}}function N(t){const e=new TextEncoder().encode(t);return me.hashToCurve(e).toBytes()}function es(t){const e=We(t);if(e===0n)throw new Error("scalarInverse: zero has no inverse");const n=me.Point.Fn.inv(e);return Ve(n)}function L(t,e){const n=We(t);return zt.fromBytes(e).multiply(n).toBytes()}function A(t){return Array.from(t).map(e=>e.toString(16).padStart(2,"0")).join("")}function Yt(t){const e=[...t];for(let n=e.length-1;n>0;n--){const s=new Uint8Array(4);crypto.getRandomValues(s);const i=new DataView(s.buffer).getUint32(0,!1)%(n+1);[e[n],e[i]]=[e[i],e[n]]}return e}function qt(t){const e=ie(),n=t.map(o=>({point:L(e,N(o)),element:o})),s=Yt(n),i=new Map;for(const{point:o,element:r}of s)i.set(A(o),r);return{blindedElements:s.map(o=>o.point),aliceScalar:e,aliceOriginalMapping:i}}function Zt(t,e){const n=ie(),s=t.blindedElements.map(o=>L(n,o)),i=Yt(e.map(o=>L(n,N(o))));return{doubleBlindedAliceElements:s,bobBlindedElements:i,bobScalar:n}}function Me(t,e,n){const{aliceScalar:s,aliceOriginalMapping:i,blindedElements:o}=t,{doubleBlindedAliceElements:r,bobBlindedElements:c}=e,l=new Set(c.map(u=>A(L(s,u)))),a=[];for(let u=0;u<r.length;u++)if(l.has(A(r[u]))){const p=i.get(A(o[u]));p!==void 0&&a.push(p)}return{intersection:a,intersectionSize:a.length,aliceLearnedBobSize:c.length,bobLearnedAliceSize:o.length}}function q(t,e){const n=qt(t),s=Zt(n,e);return Me(n,s)}function ts(t,e,n,s){const i=t.map(d=>N(d)),o=e.map(d=>N(d)),r=i.map(d=>L(n,d)),c=r.map(d=>L(s,d)),l=o.map(d=>L(s,d)),a=l.map(d=>L(n,d)),u=new Set(a.map(A)),p=[];for(let d=0;d<c.length;d++)u.has(A(c[d]))&&p.push(t[d]);return{aliceSet:t,bobSet:e,aliceScalar:n,bobScalar:s,hashedAlice:i,hashedBob:o,wireA2B_X:r,wireB2A_Y:c,wireB2A_Z:l,computedW:a,intersection:p}}function Ut(t,e,n){const s=new Set(e),i=t.filter(c=>s.has(c)).sort(),o=[...n.intersection].sort();return{matches:i.length===o.length&&i.every((c,l)=>c===o[l]),expected:i,actual:o}}function ns(t,e,n){const s=q(t,n);return{aliceSeesBobSize:s.aliceLearnedBobSize,actualBobSize:e.length,intersection:s.intersection,inflationDelta:n.length-e.length}}function ss(t,e){const s=q(t,e).intersection,i=t.length>0?Math.round(s.length/t.length*100):0,o=`Dictionary of ${e.length} entries revealed ${s.length}/${t.length} of Alice's elements (${i}% of her set). This attack works because the element domain is small enough to enumerate. Mitigation: rate limiting, proof-of-work, or OPRF-based PSI.`;return{aliceElementsLearned:s,coveragePercent:i,warningMessage:o}}function is(t,e,n,s){const i=q(t,n),o=q(e,n),r=t.map(m=>A(L(s,N(m)))),c=e.map(m=>A(L(s,N(m)))),l=new Set(r),a=c.filter(m=>l.has(m)),u=a.length,p=a.slice(0,3).map(m=>m.slice(0,16)+"…"),d=new Set(t),h=new Set(e),b=t.filter(m=>h.has(m)).length,g=e.filter(m=>!d.has(m)).length,v=t.filter(m=>!h.has(m)).length,f=g>0||v>0||u!==t.length,y=f?`LEAK: With reused α, Bob sees ${u} byte-identical Y_i value(s) across the two sessions — these are stable elements in Alice's set. Bob also sees ${g} new Y_i value(s) (added) and ${v} disappeared Y_i value(s) (removed). He learns the size of the change without learning a single plaintext. Fix: fresh random α per session — MANDATORY.`:`Sets identical across sessions. Bob still sees ${u} byte-identical Y_i value(s), confirming the same α was used twice (a fingerprint by itself).`;return{session1Intersection:i.intersection,session2Intersection:o.intersection,bobInfersAliceChange:f,stableElements:b,addedElements:g,removedElements:v,linkedYCount:u,linkedYSamples:p,warningMessage:y}}function os(){const t=[],e=new Uint8Array(32);t.push({label:"Identity element O (all-zero encoding)",bytesHex:A(e),accepted:we(e),consequence:'If accepted: β·O = O for every i, so every Y_i is the same point. Alice cannot distinguish elements; intersection result becomes meaningless (or trivially "all match" against another identity).'});const n=new Uint8Array(32);n[31]=128,t.push({label:"Non-canonical encoding (high bit set)",bytesHex:A(n),accepted:we(n),consequence:"On raw Ed25519, a malformed sign bit can encode the same point two ways, enabling implementation fingerprinting and signature malleability. Ristretto rejects all non-canonical encodings."});const s=new Uint8Array(32);crypto.getRandomValues(s),t.push({label:"Random 32 bytes (garbage)",bytesHex:A(s),accepted:we(s),consequence:"Most random 32-byte strings are not valid ristretto encodings (~50% rejection rate). A protocol that skips validation would crash on scalarMul, or worse, fall through to an unspecified scalar field operation."});const i=new Uint8Array([236,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,127]);t.push({label:"Order-2 point (raw Curve25519 torsion)",bytesHex:A(i),accepted:we(i),consequence:"On raw Curve25519, this point has order 2: 2·P = O. Reveals the parity of α. Ristretto255 has prime order (no torsion subgroup) — encoding is rejected outright."});const o=t.filter(c=>c.accepted).length,r=o===0?`Ristretto255 + identity check rejected all ${t.length} malicious encodings. This is the point of using ristretto255 instead of raw Ed25519: invalid-curve and small-subgroup attacks are impossible by construction.`:`WARNING: ${o}/${t.length} malicious encodings were accepted. The implementation is missing critical input validation.`;return{probes:t,ristrettoVerdict:r}}function Xt(t){return A(t)}function rs(t,e){const n=ie(),s=new Set;for(const i of t)s.add(Xt(L(n,N(i))));return{bobKey:n,publishedSet:s,bobSetSize:t.length}}function as(t){const e=ie(),n=t.map(s=>L(e,N(s)));return{aliceScalar:e,blindedElements:n}}function cs(t,e){return{evaluatedElements:t.blindedElements.map(n=>L(e,n))}}function ls(t,e,n,s){const i=es(e.aliceScalar),o=[];for(let r=0;r<t.length;r++){const c=L(i,n.evaluatedElements[r]);s.has(Xt(c))&&o.push(t[r])}return{intersection:o,intersectionSize:o.length,aliceLearnedBobSize:s.size,bobLearnedAliceSize:t.length}}function ds(t,e){const n=rs(e),s=as(t),i=cs(s,n.bobKey);return ls(t,s,i,n.publishedSet)}let ce=null,us=1;const fe=new Map;function ps(){return ce||(ce=new Worker(new URL("/crypto-lab-psi-gate/assets/psi-worker-DSxwWqNC.js",import.meta.url),{type:"module"}),ce.addEventListener("message",t=>{const{id:e}=t.data;if(e===0)return;const n=fe.get(e);n&&(fe.delete(e),t.data.ok?n.resolve(t.data.result):n.reject(new Error(t.data.error)))}),ce.addEventListener("error",t=>{for(const{reject:e}of fe.values())e(new Error(t.message||"worker error"));fe.clear()}),ce)}function Ne(t,e){const n=us++;return new Promise((s,i)=>{fe.set(n,{resolve:s,reject:i}),ps().postMessage({id:n,kind:t,payload:e})})}function fs(){return typeof Worker<"u"}function I(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function xe(t,e=16){return t.slice(0,e)+"…"}function hs(){const t=document.createElement("button");t.type="button",t.className="theme-toggle";const e=document.createElement("span");e.setAttribute("aria-hidden","true"),e.textContent="☀ / ☾",t.appendChild(e);const n=()=>{const i=`Switch to ${(document.documentElement.getAttribute("data-theme")??"dark")==="dark"?"light":"dark"} theme`;t.setAttribute("aria-label",i),t.setAttribute("title",i)};n(),t.addEventListener("click",()=>{const i=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",i),localStorage.setItem("theme",i),n()}),document.body.appendChild(t)}function ms(){const t=Array.from(document.querySelectorAll('[role="tab"]')),e=Array.from(document.querySelectorAll('[role="tabpanel"]'));function n(s){var o;t.forEach(r=>{r.setAttribute("aria-selected","false"),r.setAttribute("tabindex","-1")}),e.forEach(r=>r.classList.remove("active")),s.setAttribute("aria-selected","true"),s.setAttribute("tabindex","0"),s.focus();const i=s.getAttribute("aria-controls");i&&((o=document.getElementById(i))==null||o.classList.add("active"))}t.forEach((s,i)=>{s.addEventListener("click",()=>n(s)),s.addEventListener("keydown",o=>{let r=-1;o.key==="ArrowRight"?r=(i+1)%t.length:o.key==="ArrowLeft"?r=(i-1+t.length)%t.length:o.key==="Home"?r=0:o.key==="End"&&(r=t.length-1),r!==-1&&(o.preventDefault(),n(t[r]))})})}function bs(){const t=document.getElementById("e1-run"),e=document.getElementById("e1-alice-list"),n=document.getElementById("e1-bob-list"),s=document.getElementById("e1-output"),i=["prayer.partner@example.com","mom@gmail.com","friend.alex@email.com","pastor.john@church.org","colleague@work.com","neighbor.smith@example.com","sister.mary@example.com","youth.leader@church.org"],o=["prayer.partner@example.com","friend.alex@email.com","youth.leader@church.org","random.user1@example.com","random.user2@example.com","another.user@example.com","pastor.john@church.org"];e.innerHTML=i.map(r=>`<li class="no-match">${I(r)}</li>`).join(""),n.innerHTML=o.map(r=>`<li class="no-match">${I(r)}</li>`).join(""),t.addEventListener("click",()=>{t.disabled=!0,t.innerHTML='<span class="spinner" aria-hidden="true"></span><span class="sr-only">Running PSI…</span> Running PSI…',setTimeout(()=>{const r=q(i,o),c=new Set(r.intersection);e.innerHTML=i.map(l=>`<li class="${c.has(l)?"match":"no-match"}">${I(l)}</li>`).join(""),s.innerHTML=`
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
            ${r.intersection.map(l=>`<div class="intersection-item">${I(l)}</div>`).join("")}
          </div>
          <div class="status ok" style="margin-top:0.75rem">
            ✓ PSI complete — only matching contacts revealed. Neither party learned anything else.
          </div>
        </div>`,t.disabled=!1,t.textContent="Run PSI Again"},50)})}function gs(){const t=["alice@example.com","mom@gmail.com","bob@example.com"],e=["bob@example.com","charlie@example.com","dave@example.com"];let n=0,s=null,i=null;const o=document.getElementById("e2-panel"),r=document.getElementById("e2-prev"),c=document.getElementById("e2-next"),l=document.getElementById("e2-step"),a=[()=>`
      <h3><span class="step-counter" aria-hidden="true">0</span>Setup</h3>
      <div class="card-row">
        <div>
          <div class="set-label alice">Alice's Set A</div>
          <ul class="element-list">
            ${t.map(p=>`<li>${I(p)}</li>`).join("")}
          </ul>
        </div>
        <div>
          <div class="set-label bob">Bob's Set B</div>
          <ul class="element-list">
            ${e.map(p=>`<li>${I(p)}</li>`).join("")}
          </ul>
        </div>
      </div>
      <div class="status info" style="margin-top:1rem">
        Group: ristretto255 (prime-order, DDH-hard). Hash-to-curve: RFC 9380.
        Expected intersection: { bob@example.com }
      </div>`,()=>(s=qt(t),`
        <h3><span class="step-counter" aria-hidden="true">1</span>Alice — Round 1: Blind her elements</h3>
        <p>Alice picks a fresh random scalar α and computes X_i = α · H(a_i) for each element.</p>
        <div class="card">
          <div class="info-grid">
            <span class="info-label">α (private, NEVER sent):</span>
            <button type="button" class="scalar-btn" aria-pressed="false"
              aria-label="Reveal private scalar α (currently hidden — click to toggle)">
              <span data-hex aria-hidden="true">${Array.from(s.aliceScalar).map(d=>d.toString(16).padStart(2,"0")).join("")}</span>
            </button>
          </div>
        </div>
        <div class="set-label alice" style="margin-top:0.75rem">Blinded elements X_i = α · H(a_i) sent to Bob:</div>
        <ul class="element-list">
          ${s.blindedElements.map((d,h)=>`<li class="blinded" title="Blinded(${I(t[h])})">X_${h+1} = ${xe(A(d))}</li>`).join("")}
        </ul>
        <div class="status info">Bob sees 3 random-looking curve points. He cannot recover Alice's emails.</div>`),()=>s?(i=Zt(s,e),`
        <h3><span class="step-counter" aria-hidden="true">2</span>Bob — Round 2: Double-blind + blind his own</h3>
        <p>Bob picks fresh β, computes Y_i = β · X_i (double-blinded Alice's), and Z_j = β · H(b_j) (his own).</p>
        <div class="card">
          <div class="info-grid">
            <span class="info-label">β (private, NEVER sent):</span>
            <button type="button" class="scalar-btn" aria-pressed="false"
              aria-label="Reveal private scalar β (currently hidden — click to toggle)">
              <span data-hex aria-hidden="true">${Array.from(i.bobScalar).map(d=>d.toString(16).padStart(2,"0")).join("")}</span>
            </button>
          </div>
        </div>
        <div class="card-row">
          <div>
            <div class="set-label" style="color:var(--double-blinded)">Y_i = β · X_i (sent to Alice)</div>
            <ul class="element-list">
              ${i.doubleBlindedAliceElements.map(d=>`<li class="double-blinded">Y = ${xe(A(d))}</li>`).join("")}
            </ul>
          </div>
          <div>
            <div class="set-label bob">Z_j = β · H(b_j) (sent to Alice, shuffled)</div>
            <ul class="element-list">
              ${i.bobBlindedElements.map(d=>`<li class="blinded">Z = ${xe(A(d))}</li>`).join("")}
            </ul>
          </div>
        </div>
        <div class="status info">Alice can't learn Bob's emails. Bob can't link Y_i back to Alice's emails.</div>`):'<p class="status error">Run Step 1 first</p>',()=>{if(!s||!i)return'<p class="status error">Run Steps 1 & 2 first</p>';const p=Me(s,i);return`
        <h3><span class="step-counter" aria-hidden="true">3</span>Alice — Round 3: Double-blind Bob's and match</h3>
        <p>Alice computes W_j = α · Z_j = αβ · H(b_j). Then checks if any Y_i equals some W_j.</p>
        <div class="set-label" style="color:var(--double-blinded)">W_j = α · Z_j (αβ · H(b_j))</div>
        <ul class="element-list" style="margin-bottom:0.75rem">
          ${i.bobBlindedElements.map((d,h)=>{const b=L(s.aliceScalar,d);return`<li class="double-blinded">W_${h+1} = ${xe(A(b))}</li>`}).join("")}
        </ul>
        <div class="status ok">
          Intersection (Y_i matched some W_j):
          ${p.intersection.length>0?p.intersection.map(d=>`<div class="intersection-item">${I(d)}</div>`).join(""):'<span style="color:var(--text-muted)">∅ (empty)</span>'}
        </div>
        <div class="info-grid" style="margin-top:0.75rem">
          <span class="info-label">Alice learned Bob's set size:</span>
          <span class="info-value bob">${p.aliceLearnedBobSize}</span>
          <span class="info-label">Bob learned Alice's set size:</span>
          <span class="info-value alice">${p.bobLearnedAliceSize}</span>
        </div>`},()=>{if(!s||!i)return'<p class="status error">Run Steps 1-3 first</p>';const p=Me(s,i),d=Ut(t,e,p);return`
        <h3><span class="step-counter" aria-hidden="true">4</span>Verification</h3>
        <p>Compare PSI output to the plain-text intersection (honest verifier check — not a security feature).</p>
        <div class="card">
          <div class="info-grid">
            <span class="info-label">Expected intersection:</span>
            <span class="info-value match">${d.expected.join(", ")||"∅"}</span>
            <span class="info-label">PSI intersection:</span>
            <span class="info-value match">${d.actual.join(", ")||"∅"}</span>
            <span class="info-label">Correct:</span>
            <span class="info-value ${d.matches?"match":"private"}">${d.matches?"✓ YES":"✗ NO"}</span>
          </div>
        </div>
        <div class="status ok">
          The DH-PSI protocol correctly computed A ∩ B without either party
          revealing their non-intersection elements.
        </div>`}];function u(){o.innerHTML=a[n](),l.textContent=`Step ${n+1} / ${a.length}`,r.disabled=n===0,c.disabled=n===a.length-1}r.addEventListener("click",()=>{n>0&&(n--,u())}),c.addEventListener("click",()=>{n<a.length-1&&(n++,u())}),u()}function vs(){const t=document.getElementById("e3-alice"),e=document.getElementById("e3-bob"),n=document.getElementById("e3-run"),s=document.getElementById("e3-output");t.value=["alice.friend@gmail.com","workmate@example.com","mom@example.com","pastor@church.org","neighbor@example.com","prayer.circle@example.com","book.club@example.com","cousin@example.com","mentor@example.com","colleague.bob@work.com"].join(`
`),e.value=["alice.friend@gmail.com","workmate@example.com","pastor@church.org","prayer.circle@example.com","random.server.user1@example.com","random.server.user2@example.com","another.user@example.com","server.only@example.com","database.user@example.com","app.user@example.com"].join(`
`),n.addEventListener("click",()=>{var l;const i=t.value.split(`
`).map(a=>a.trim()).filter(Boolean),o=e.value.split(`
`).map(a=>a.trim()).filter(Boolean);if(i.length===0||o.length===0){s.innerHTML='<div class="status error">Both sets must be non-empty.</div>';return}const r=(((l=document.querySelector('input[name="e3-proto"]:checked'))==null?void 0:l.value)??"dh")==="oprf"?"oprf":"dh",c=r==="oprf"?"OPRF-PSI (Jarecki-Liu)":"DH-PSI (Meadows)";n.disabled=!0,n.innerHTML='<span class="spinner" aria-hidden="true"></span><span class="sr-only">Running…</span> Running…',s.innerHTML=`<div class="status info" role="status">Running ${c} (${i.length} × ${o.length} elements)…</div>`,setTimeout(()=>{const a=r==="oprf"?ds(i,o):q(i,o),u=Ut(i,o,a);s.innerHTML=`
        <div class="result-box">
          <div class="info-grid">
            <span class="info-label">Alice's elements:</span>
            <span class="info-value alice">${i.length}</span>
            <span class="info-label">Bob's elements:</span>
            <span class="info-value bob">${o.length}</span>
            <span class="info-label">Intersection size:</span>
            <span class="info-value match">${a.intersectionSize}</span>
            <span class="info-label">Correct (verified):</span>
            <span class="info-value ${u.matches?"match":"private"}">${u.matches?"✓":"✗"}</span>
          </div>
          <div style="margin-top:0.75rem">
            ${a.intersection.length>0?a.intersection.map(p=>`<div class="intersection-item">${I(p)}</div>`).join(""):'<div class="status info">∅ Empty intersection — no common elements.</div>'}
          </div>
        </div>
        <div class="card" style="margin-top:0.75rem">
          <div style="margin-bottom:0.5rem;font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)">What each party learned</div>
          <div class="info-grid">
            <span class="info-label">Alice learned:</span>
            <span class="info-value match">The intersection (${a.intersectionSize} elements) + Bob's set size (${a.aliceLearnedBobSize})</span>
            <span class="info-label">Bob learned:</span>
            <span class="info-value bob">Alice's set size (${a.bobLearnedAliceSize})</span>
            <span class="info-label">Neither learned:</span>
            <span class="info-value">Alice's ${i.length-a.intersectionSize} non-matching elements; Bob's ${o.length-a.intersectionSize} non-matching elements</span>
          </div>
        </div>`,n.disabled=!1,n.textContent="Run PSI"},50)})}function ys(){const t=document.getElementById("e4-a1-run"),e=document.getElementById("e4-a1-output");t.addEventListener("click",()=>{const l=["alice@example.com","mom@example.com","pastor@church.org"],a=["alice@example.com","real.user@example.com"],u=Array.from({length:20},(h,b)=>`fake.user.${b}@attacker.com`),p=[...a,...u],d=ns(l,a,p);e.innerHTML=`
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
      </div>`});const n=document.getElementById("e4-a2-run"),s=document.getElementById("e4-a2-output");n.addEventListener("click",()=>{const l=["1234","5678","9999"],a=Array.from({length:100},(p,d)=>d.toString().padStart(4,"0")).concat(["1234","5678","9999","0000","1111"]),u=ss(l,a);s.innerHTML=`
      <div class="result-box">
        <div class="info-grid">
          <span class="info-label">Alice's set size:</span>
          <span class="info-value alice">${l.length}</span>
          <span class="info-label">Bob's dictionary size:</span>
          <span class="info-value bob">${a.length}</span>
          <span class="info-label">Alice's elements learned by Bob:</span>
          <span class="info-value private">${u.aliceElementsLearned.join(", ")||"∅"}</span>
          <span class="info-label">Coverage:</span>
          <span class="info-value warning">${u.coveragePercent}%</span>
        </div>
        <div class="warning-box">${I(u.warningMessage)}</div>
      </div>`});const i=document.getElementById("e4-a3-run"),o=document.getElementById("e4-a3-output");i.addEventListener("click",()=>{const l=["alice@example.com","mom@example.com","bob@example.com"],a=["alice@example.com","mom@example.com","new.friend@example.com"],u=["alice@example.com","service.user@example.com"],p=ie(),d=is(l,a,u,p);o.innerHTML=`
      <div class="result-box">
        <div class="info-grid">
          <span class="info-label">Session 1 set:</span>
          <span class="info-value alice">${l.join(", ")}</span>
          <span class="info-label">Session 2 set:</span>
          <span class="info-value alice">${a.join(", ")}</span>
          <span class="info-label">Session 1 intersection:</span>
          <span class="info-value match">${d.session1Intersection.join(", ")||"∅"}</span>
          <span class="info-label">Session 2 intersection:</span>
          <span class="info-value match">${d.session2Intersection.join(", ")||"∅"}</span>
          <span class="info-label">Stable elements (both sessions):</span>
          <span class="info-value">${d.stableElements}</span>
          <span class="info-label">Elements added in session 2:</span>
          <span class="info-value warning">${d.addedElements}</span>
          <span class="info-label">Elements removed in session 2:</span>
          <span class="info-value warning">${d.removedElements}</span>
          <span class="info-label">Bob infers Alice's set changed:</span>
          <span class="info-value ${d.bobInfersAliceChange?"private":"match"}">${d.bobInfersAliceChange?"✗ YES — privacy violation":"✓ No change detected"}</span>
          <span class="info-label">Byte-identical Y_i seen in both sessions:</span>
          <span class="info-value private">${d.linkedYCount} of ${l.length} (Bob links these with zero plaintext)</span>
          ${d.linkedYSamples.length>0?`<span class="info-label">Sample linked Y_i (Bob sees twice):</span>
               <span class="info-value">${d.linkedYSamples.map(h=>I(h)).join(", ")}</span>`:""}
        </div>
        <div class="warning-box">${I(d.warningMessage)}</div>
      </div>`});const r=document.getElementById("e4-a4-run"),c=document.getElementById("e4-a4-output");r.addEventListener("click",()=>{const{probes:l,ristrettoVerdict:a}=os();c.innerHTML=`
      <div class="result-box">
        <table class="probe-table" aria-label="Malicious point injection probes">
          <thead>
            <tr>
              <th scope="col">Injected encoding</th>
              <th scope="col">32 bytes (hex)</th>
              <th scope="col">Decoded?</th>
            </tr>
          </thead>
          <tbody>
            ${l.map(u=>`
              <tr>
                <td>${I(u.label)}</td>
                <td class="mono-cell">${I(u.bytesHex.slice(0,16))}…${I(u.bytesHex.slice(-4))}</td>
                <td class="info-value ${u.accepted?"private":"match"}">${u.accepted?"✗ accepted":"✓ rejected"}</td>
              </tr>
              <tr class="probe-detail">
                <td colspan="3">${I(u.consequence)}</td>
              </tr>`).join("")}
          </tbody>
        </table>
        <div class="warning-box">${I(a)}</div>
      </div>`})}function ws(){const t=document.getElementById("e5-selftest");setTimeout(()=>{try{const e=A(N("alice@example.com")),n=A(N("bob@example.com")),s=e!==n,i=q(["a@example.com","b@example.com","c@example.com"],["b@example.com","c@example.com","d@example.com"]),o=i.intersection.length===2&&i.intersection.includes("b@example.com")&&i.intersection.includes("c@example.com"),c=q(["x@example.com"],["y@example.com"]).intersection.length===0,l=["a@example.com","b@example.com","c@example.com"],u=q(l,l).intersection.length===3,p=[{name:"hashToPoint distinct inputs",ok:s},{name:"PSI small sets (3×3, 2 matching)",ok:o},{name:"PSI empty intersection",ok:c},{name:"PSI identical sets",ok:u}];t.innerHTML=`
        <div class="card">
          <div style="margin-bottom:0.5rem;font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)">Gate Tests</div>
          ${p.map(d=>`<div class="status ${d.ok?"ok":"error"}">${d.ok?"✓":"✗"} ${I(d.name)}</div>`).join("")}
        </div>`}catch(e){t.innerHTML=`<div class="status error">Self-test error: ${I(String(e))}</div>`}},100)}function Oe(t){return t<1024?`${t} B`:`${(t/1024).toFixed(2)} KB`}function xs(){const t=document.getElementById("e6-tv-run"),e=document.getElementById("e6-tv-output"),n=document.getElementById("e6-transcript"),s=["alice@example.com","bob@example.com","mom@example.com"],i=["bob@example.com","mom@example.com","eve@example.com"],o="0000000000000000000000000000000000000000000000000000000000000007",r="000000000000000000000000000000000000000000000000000000000000000b";function c(){const p=gt(o),d=gt(r),h=ts(s,i,p,d),b=(x,E)=>`
      <div class="tv-row">
        <span class="tv-label">${I(x)}</span>
        <code class="tv-hex">${I(E)}</code>
      </div>`,g=h.aliceSet.map((x,E)=>b(`H(a${E+1}) — "${x}"`,A(h.hashedAlice[E]))).join("")+h.bobSet.map((x,E)=>b(`H(b${E+1}) — "${x}"`,A(h.hashedBob[E]))).join(""),v=h.wireA2B_X.map((x,E)=>b(`X_${E+1} = α·H(a${E+1})`,A(x))).join("")+h.wireB2A_Y.map((x,E)=>b(`Y_${E+1} = β·X_${E+1}`,A(x))).join("")+h.wireB2A_Z.map((x,E)=>b(`Z_${E+1} = β·H(b${E+1})`,A(x))).join("")+h.computedW.map((x,E)=>b(`W_${E+1} = α·Z_${E+1}`,A(x))).join("");e.innerHTML=`
      <div class="card">
        <div class="card-section-label">Inputs (fixed)</div>
        ${b("Group","ristretto255 (prime order, RFC 9496 + RFC 9380 hash-to-curve)")}
        ${b("α seed",o)}
        ${b("β seed",r)}
        ${b("α (32 bytes, big-endian)",A(h.aliceScalar))}
        ${b("β (32 bytes, big-endian)",A(h.bobScalar))}
        ${b("A = {a_i}",s.join(", "))}
        ${b("B = {b_j}",i.join(", "))}
      </div>
      <div class="card">
        <div class="card-section-label">Hashed inputs (not on wire)</div>
        ${g}
      </div>
      <div class="card">
        <div class="card-section-label">Protocol points</div>
        ${v}
      </div>
      <div class="status ok">
        Expected intersection: {${h.intersection.join(", ")}} —
        any conforming DH-PSI/ristretto255 implementation MUST produce
        the same X, Y, Z, W byte strings given these inputs.
      </div>`;const f=x=>Array.from(x).map((E,_)=>(_>0&&_%8===0?" ":"")+E.toString(16).padStart(2,"0")).join(""),y=h.wireA2B_X.length*32,m=h.wireB2A_Y.length*32,S=h.wireB2A_Z.length*32;n.innerHTML=`
      <div class="card">
        <div class="card-section-label">A → B  Round 1 — ${h.wireA2B_X.length} × 32 B = ${Oe(y)}</div>
        ${h.wireA2B_X.map((x,E)=>`
          <div class="wire-line wire-alice">
            <span class="wire-tag">X_${E+1}</span>
            <code class="wire-hex">${f(x)}</code>
          </div>`).join("")}
      </div>
      <div class="card">
        <div class="card-section-label">B → A  Round 2 — ${h.wireB2A_Y.length+h.wireB2A_Z.length} × 32 B = ${Oe(m+S)}</div>
        ${h.wireB2A_Y.map((x,E)=>`
          <div class="wire-line wire-doubleblinded">
            <span class="wire-tag">Y_${E+1}</span>
            <code class="wire-hex">${f(x)}</code>
          </div>`).join("")}
        ${h.wireB2A_Z.map((x,E)=>`
          <div class="wire-line wire-bob">
            <span class="wire-tag">Z_${E+1}</span>
            <code class="wire-hex">${f(x)}</code>
          </div>`).join("")}
      </div>
      <div class="status info">
        Total wire traffic: ${Oe(y+m+S)}
        (${h.wireA2B_X.length+h.wireB2A_Y.length+h.wireB2A_Z.length} ristretto points).
        DH-PSI is O(n+m) points sent — linear in set sizes.
      </div>`}t.addEventListener("click",c),c();const l=document.getElementById("e6-bm-run"),a=document.getElementById("e6-bm-output");function u(p,d,h){const b=Math.min(50,Math.max(1,Math.floor(d*.05)));for(let f=0;f<b;f++)h();const g=performance.now();for(let f=0;f<d;f++)h();const v=performance.now()-g;return{name:p,iter:d,totalMs:v,perOpUs:v*1e3/d,opsPerSec:d/(v/1e3)}}l.addEventListener("click",async()=>{l.disabled=!0,l.innerHTML='<span class="spinner" aria-hidden="true"></span><span class="sr-only">Running benchmarks…</span> Running…',a.innerHTML='<div class="status info" role="status">Running benchmarks in a Web Worker — UI stays responsive…</div>';const p=(v,f=2)=>v>=1e3?Math.round(v).toLocaleString():v.toFixed(f),d=[[10,10],[100,100],[500,500],[1e3,1e3]];let h,b;try{if(fs()){const v=["hashToPoint","scalarMul","randomScalar"].map(async f=>{const y=await Ne("bench-op",{op:f,iter:f==="randomScalar"?1e3:500});return{name:f,...y}});h=await Promise.all(v),b=[];for(const[f,y]of d){const m=f>=500?2:f>=100?4:6,S=await Ne("bench-psi",{n:f,m:y,iter:m});b.push({name:`PSI ${f} × ${y}`,...S})}}else{h=[u("hashToPoint",500,()=>{N("bench-"+Math.random())}),u("scalarMul",500,()=>{const v=N("benchmark"),f=ie();L(f,v)}),u("randomScalar",1e3,()=>{ie()})],b=[];for(const[v,f]of[[10,10],[100,100]]){const y=Array.from({length:v},(S,x)=>`alice-${x}@example.com`),m=Array.from({length:f},(S,x)=>`bob-${x}@example.com`);y[0]=m[0],y.length>1&&m.length>1&&(y[1]=m[1]),b.push(u(`PSI ${v} × ${f}`,v>=100?4:6,()=>{q(y,m)}))}}}catch(v){a.innerHTML=`<div class="status error">Benchmark error: ${I(String(v))}</div>`,l.disabled=!1,l.textContent="Run benchmarks again";return}const g=v=>v.map(f=>`
            <tr>
              <td>${I(f.name)}</td>
              <td class="num">${f.iter}</td>
              <td class="num">${p(f.totalMs)} ms</td>
              <td class="num">${p(f.perOpUs)} µs</td>
              <td class="num">${p(f.opsPerSec,0)} /s</td>
            </tr>`).join("");a.innerHTML=`
      <div class="result-box">
        <table class="bench-table" aria-label="Benchmark results">
          <thead>
            <tr>
              <th scope="col">Operation</th>
              <th scope="col" class="num">Iterations</th>
              <th scope="col" class="num">Total</th>
              <th scope="col" class="num">Per op</th>
              <th scope="col" class="num">Throughput</th>
            </tr>
          </thead>
          <tbody>
            ${g(h)}
            <tr><td colspan="5" class="bench-section">End-to-end DH-PSI (in worker)</td></tr>
            ${g(b)}
          </tbody>
        </table>
        <div class="status info">
          Numbers are from THIS browser session, executed in a Web Worker so the
          main thread stays responsive. For reference: KKRT16/VOLE-PSI in C++ reach
          ~10⁶ elements/sec/core. DH-PSI in JS is roughly two orders of magnitude
          slower and exists here for clarity, not throughput.
        </div>
      </div>`,l.disabled=!1,l.textContent="Run benchmarks again"}),Es()}function Es(){const t=document.getElementById("e6-ddh-run"),e=document.getElementById("e6-ddh-output");if(!t||!e)return;const n={p01_lo:198.38,p01_hi:317.097,p05_lo:213.997,p05_hi:297.829};t.addEventListener("click",async()=>{t.disabled=!0;const s=t.textContent??"";t.innerHTML='<span class="spinner" aria-hidden="true"></span><span class="sr-only">Sampling…</span> Sampling…',e.innerHTML='<div class="status info" role="status">Hashing 5000 strings, multiplying by α in a worker, binning bytes 0–255…</div>';try{const i=await Ne("distribution",{count:5e3}),o=512,r=160,c=Math.max(...i.histogram),l=i.totalBytes/256,a=o/256,u=i.histogram.map((h,b)=>{const g=h/c*(r-24),v=r-g-16;return`<rect x="${b*a}" y="${v}" width="${a-.2}" height="${g}" fill="var(--alice)" opacity="0.7"></rect>`}).join(""),p=r-l/c*(r-24)-16,d=i.chiSq>=n.p01_lo&&i.chiSq<=n.p01_hi?{msg:"Distribution is consistent with uniform (cannot reject H₀ at α = 0.01).",cls:"ok"}:i.chiSq>=n.p05_lo&&i.chiSq<=n.p05_hi?{msg:"Distribution is consistent with uniform (cannot reject H₀ at α = 0.05).",cls:"ok"}:{msg:"Distribution differs from uniform at α = 0.05 (unusual — re-run to check).",cls:"warn"};e.innerHTML=`
        <div class="card">
          <div class="card-section-label">Byte-frequency histogram of α·H(x) for ${i.count.toLocaleString()} fresh x</div>
          <div class="ddh-chart-wrap">
            <svg class="ddh-chart" viewBox="0 0 ${o} ${r}" role="img"
              aria-label="Histogram of byte values 0 to 255 from ${i.totalBytes.toLocaleString()} ristretto255 output bytes; bars near horizontal line indicate uniform distribution.">
              <line x1="0" y1="${p}" x2="${o}" y2="${p}"
                stroke="var(--match)" stroke-dasharray="4 3" stroke-width="1.5"></line>
              ${u}
              <text x="${o-4}" y="${p-4}" text-anchor="end"
                fill="var(--match)" font-family="var(--mono)" font-size="10">
                expected ≈ ${Math.round(l).toLocaleString()}
              </text>
            </svg>
          </div>
          <div class="info-grid">
            <span class="info-label">Samples (32 bytes each):</span>
            <span class="info-value">${i.count.toLocaleString()} ⇒ ${i.totalBytes.toLocaleString()} byte observations</span>
            <span class="info-label">α (fresh, this run):</span>
            <span class="info-value mono-cell">${I(i.sampleAlphaHex)}</span>
            <span class="info-label">Chi-square statistic (df = 255):</span>
            <span class="info-value">${i.chiSq.toFixed(2)}</span>
            <span class="info-label">α = 0.05 acceptance range:</span>
            <span class="info-value">${n.p05_lo.toFixed(2)} … ${n.p05_hi.toFixed(2)}</span>
            <span class="info-label">α = 0.01 acceptance range:</span>
            <span class="info-value">${n.p01_lo.toFixed(2)} … ${n.p01_hi.toFixed(2)}</span>
          </div>
          <div class="status ${d.cls}">${I(d.msg)}</div>
          <div class="status info">
            This is the operational consequence of DDH: for any x ∉ A ∩ B,
            the value α·H(x) that an honest-but-curious Bob receives is
            computationally indistinguishable from a uniform ristretto point —
            so its byte-wise marginals are flat to within sampling noise.
          </div>
        </div>`}catch(i){e.innerHTML=`<div class="status error">Visualization error: ${I(String(i))}</div>`}t.disabled=!1,t.textContent=s||"Resample distribution"})}const Ss=document.getElementById("app");Ss.innerHTML=`
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

<div role="tablist" aria-label="Demo exhibits">
  <button type="button" id="tab-1" role="tab" aria-selected="true"  aria-controls="exhibit-1" tabindex="0"  class="tab-btn active">1. Contact Discovery</button>
  <button type="button" id="tab-2" role="tab" aria-selected="false" aria-controls="exhibit-2" tabindex="-1" class="tab-btn">2. Protocol Walkthrough</button>
  <button type="button" id="tab-3" role="tab" aria-selected="false" aria-controls="exhibit-3" tabindex="-1" class="tab-btn">3. Live Simulator</button>
  <button type="button" id="tab-4" role="tab" aria-selected="false" aria-controls="exhibit-4" tabindex="-1" class="tab-btn">4. Attacks</button>
  <button type="button" id="tab-5" role="tab" aria-selected="false" aria-controls="exhibit-5" tabindex="-1" class="tab-btn">5. Real-World</button>
  <button type="button" id="tab-6" role="tab" aria-selected="false" aria-controls="exhibit-6" tabindex="-1" class="tab-btn">6. Cryptographer's Lab</button>
</div>

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
    <button id="e1-run" type="button" class="btn primary">Run Private Set Intersection</button>
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
    <button type="button" id="e2-prev" class="btn">← Prev</button>
    <span id="e2-step" style="align-self:center;color:var(--text-muted);font-size:0.85rem" aria-live="polite"></span>
    <button id="e2-next" type="button" class="btn primary">Next →</button>
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
  <fieldset class="proto-picker">
    <legend>Protocol</legend>
    <label class="proto-option">
      <input type="radio" name="e3-proto" value="dh" checked>
      <span>DH-PSI (Meadows 1986)</span>
      <small>three-round interactive; both parties exchange points</small>
    </label>
    <label class="proto-option">
      <input type="radio" name="e3-proto" value="oprf">
      <span>OPRF-PSI (Jarecki-Liu 2010)</span>
      <small>Bob publishes PRF tags once; Signal-style contact discovery</small>
    </label>
  </fieldset>
  <div style="margin-top:0.75rem">
    <button id="e3-run" type="button" class="btn primary">Run PSI</button>
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
    <button id="e4-a1-run" type="button" class="btn danger">Simulate Inflation</button>
    <div id="e4-a1-output" aria-live="polite" aria-atomic="true"></div>
  </div>

  <div class="card">
    <h3>Attack 2 — Dictionary Attack on Small Domains</h3>
    <p>
      If Alice's elements come from a small domain (4-digit PINs, short codes),
      Bob can enumerate the entire domain as his set and learn Alice's full set.
    </p>
    <button id="e4-a2-run" type="button" class="btn danger">Simulate Dictionary Attack</button>
    <div id="e4-a2-output" aria-live="polite" aria-atomic="true"></div>
  </div>

  <div class="card">
    <h3>Attack 3 — Scalar Reuse Across Sessions</h3>
    <p>
      If Alice reuses α across two PSI sessions, Bob can link the sessions and
      detect which elements changed — even without reading any element values.
    </p>
    <button id="e4-a3-run" type="button" class="btn danger">Simulate Scalar Reuse</button>
    <div id="e4-a3-output" aria-live="polite" aria-atomic="true"></div>
  </div>

  <div class="card">
    <h3>Attack 4 — Malformed / Low-Order Point Injection</h3>
    <p>
      Malicious Bob (or a network attacker) submits crafted 32-byte values
      instead of legitimate group points: the identity, low-order torsion
      points, non-canonical encodings, garbage. On raw Ed25519/Curve25519
      these enable real attacks; ristretto255 is designed to reject them.
    </p>
    <button id="e4-a4-run" type="button" class="btn danger">Probe Input Validation</button>
    <div id="e4-a4-output" aria-live="polite" aria-atomic="true"></div>
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

<!-- ── Exhibit 6 — Cryptographer's Lab ── -->
<section id="exhibit-6" role="tabpanel" aria-labelledby="tab-6" class="exhibit">
  <h2>Cryptographer's Lab</h2>
  <p>
    Reproducible test vectors, wire-format transcripts, benchmarks, and the
    semi-honest security argument. Everything here is byte-exact and replayable.
  </p>

  <h3>Test Vectors (canonical)</h3>
  <p>
    Fixed inputs, fixed scalars (no shuffling, no fresh randomness). Any
    conforming DH-PSI on ristretto255 must reproduce every hex string below.
    NOTE: this mode disables shuffling and uses seeded scalars — it is a
    reference oracle, NOT a secure execution.
  </p>
  <button id="e6-tv-run" type="button" class="btn primary">Recompute Test Vectors</button>
  <div id="e6-tv-output" aria-live="polite" aria-atomic="true"></div>

  <h3>Wire-Format Transcript</h3>
  <p>
    Byte-by-byte view of every ristretto point sent over the wire during the
    test-vector run above. Color-coded by sender; recompute to refresh.
  </p>
  <div id="e6-transcript" aria-live="polite" aria-atomic="true"></div>

  <h3>Benchmarks</h3>
  <p>
    Live measurement of <code>hashToPoint</code>, <code>scalarMul</code>, and
    end-to-end DH-PSI at a few set sizes. Numbers come from your browser, not
    a publication — useful for sanity-checking JS-vs-native expectations.
  </p>
  <button id="e6-bm-run" type="button" class="btn primary">Run Benchmarks</button>
  <div id="e6-bm-output" aria-live="polite" aria-atomic="true"></div>

  <h3>DDH Pseudorandomness — Empirical Check</h3>
  <p>
    Under DDH on ristretto255, the blinded values α·H(x) are computationally
    indistinguishable from uniform random group elements. We sample 5000 fresh
    strings, multiply by a fresh α, then bin every output byte across 0–255
    and compute a chi-square statistic against the uniform expectation.
  </p>
  <button id="e6-ddh-run" type="button" class="btn primary">Sample 5000 × α·H(x)</button>
  <div id="e6-ddh-output" aria-live="polite" aria-atomic="true"></div>

  <h3>Semi-Honest Security Argument</h3>
  <p>
    DH-PSI is secure against semi-honest (honest-but-curious) adversaries
    under the Decisional Diffie-Hellman assumption on ristretto255.
    Each party's view is computationally indistinguishable from a simulated
    view constructed using only their input, output, and set sizes.
  </p>
  <div class="card-row">
    <div class="card">
      <div class="card-section-label">Simulator for corrupt Alice</div>
      <p>Given α (Alice's private input), A, and the output (intersection I, |B|):</p>
      <ol class="proof-list">
        <li>For each element of I, compute Y* = αβ'·H(x) using a fresh β'.</li>
        <li>For each remaining slot up to |A|, sample a uniform random ristretto point.</li>
        <li>Sample |B| fresh random points and assign to Z* (shuffled).</li>
        <li>Output (Y*, Z*) as the simulated round-2 message.</li>
      </ol>
      <p class="proof-note">
        Indistinguishable from a real run by DDH: αβ·H(x) for x ∉ A ∩ B
        is pseudorandom to Alice, who only knows α.
      </p>
    </div>
    <div class="card">
      <div class="card-section-label">Simulator for corrupt Bob</div>
      <p>Given β (Bob's private input), B, and the output (|A|):</p>
      <ol class="proof-list">
        <li>Sample |A| fresh uniform random ristretto points as X*.</li>
        <li>Compute Y* = β·X* (the simulator can do this since β is known).</li>
        <li>Output X* as the simulated round-1 message.</li>
      </ol>
      <p class="proof-note">
        Indistinguishable from a real run by DDH: α·H(a_i) for fresh α
        is pseudorandom over the group, regardless of a_i.
      </p>
    </div>
  </div>

  <h3>What This Implementation Is NOT</h3>
  <ul class="caveat-list">
    <li><strong>Not constant-time.</strong> JavaScript <code>BigInt</code> and array
      ops leak timing through engine internals (GC, JIT). Use a native constant-time
      library (libsodium, BoringSSL) in production.</li>
    <li><strong>Not malicious-secure.</strong> No ZK proofs of correct β-application,
      no commitment to set sizes, no DoS defenses. See VOLE-PSI for malicious security.</li>
    <li><strong>Not side-channel hardened.</strong> No defense against cache, branch,
      or power side channels.</li>
    <li><strong>Not formally verified.</strong> The simulator sketch above is a
      proof intuition, not a machine-checked proof. See Hazay-Lindell or
      Pinkas-Schneider-Zohner for full proofs.</li>
  </ul>

  <h3>PSI Protocol Comparison</h3>
  <div class="psi-compare-scroll">
    <table class="psi-compare" aria-label="PSI protocol comparison">
      <thead>
        <tr>
          <th scope="col">Protocol</th>
          <th scope="col">Year</th>
          <th scope="col">Communication</th>
          <th scope="col">Computation</th>
          <th scope="col">Security</th>
          <th scope="col">Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">DH-PSI <em>(this demo)</em></th>
          <td>1986</td>
          <td>O(n + m) group elts</td>
          <td>O(n + m) scalar muls</td>
          <td>Semi-honest, DDH</td>
          <td>Simple, slow; baseline for understanding PSI</td>
        </tr>
        <tr>
          <th scope="row">OPRF-PSI (JL10)</th>
          <td>2010</td>
          <td>O(n + m) group elts</td>
          <td>O(n + m) scalar muls</td>
          <td>Semi-honest, one-more-DH</td>
          <td>Signal contact discovery — DH-PSI hardened with an OPRF</td>
        </tr>
        <tr>
          <th scope="row">KKRT16</th>
          <td>2016</td>
          <td>O(n) ciphertexts</td>
          <td>O(n) symmetric ops</td>
          <td>Semi-honest</td>
          <td>OT-extension based; ~10⁶ elts/sec in C++</td>
        </tr>
        <tr>
          <th scope="row">CM20 / SpOT-Light</th>
          <td>2020</td>
          <td>O(n) bits asymptotic</td>
          <td>O(n)</td>
          <td>Semi-honest</td>
          <td>Communication-optimal for small intersection</td>
        </tr>
        <tr>
          <th scope="row">PaXoS / VOLE-PSI</th>
          <td>2021</td>
          <td>O(n)</td>
          <td>O(n) field ops</td>
          <td>Malicious</td>
          <td>State-of-the-art; basis for modern Signal-style deployments</td>
        </tr>
        <tr>
          <th scope="row">FHE-PSI (Chen-Laine-Rindal)</th>
          <td>2017</td>
          <td>O(n) ciphertexts</td>
          <td>Heavy (FHE)</td>
          <td>Semi-honest</td>
          <td>Asymmetric: useful when one party has tiny set, other has huge</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>
</main>

<footer>
  <p>DH-PSI (Meadows 1986, Huberman-Franklin-Hogg 1999) · ristretto255 via @noble/curves</p>
  <p style="margin-top:0.25rem;font-style:italic;color:var(--text-muted)">
    "Whether therefore ye eat, or drink, or whatsoever ye do, do all to the glory of God." — 1 Cor 10:31
  </p>
</footer>
`;hs();ms();bs();gs();vs();ys();ws();xs();document.addEventListener("click",t=>{const e=t.target;if(!(e instanceof Element))return;const n=e.closest(".scalar-btn");if(!n)return;const i=!(n.getAttribute("aria-pressed")==="true");n.setAttribute("aria-pressed",i?"true":"false");const o=n.querySelector("[data-hex]");o&&o.setAttribute("aria-hidden",i?"false":"true");const r=/α/.test(n.getAttribute("aria-label")??"")?"α":"β";n.setAttribute("aria-label",i?`Hide private scalar ${r} (currently revealed — click to toggle)`:`Reveal private scalar ${r} (currently hidden — click to toggle)`)});
