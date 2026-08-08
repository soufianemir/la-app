const CAMERAS={midi:'z6BNMoj9Pyo',quai:'asO_10T0k2k',palm:'8QKBmrb-r8g'};
module.exports=async function handler(req,res){
 const id=CAMERAS[String(req.query?.camera||'')];if(!id)return res.status(400).json({error:'unknown camera'});
 const urls=[`https://i.ytimg.com/vi/${id}/maxresdefault_live.jpg`,`https://i.ytimg.com/vi/${id}/sddefault_live.jpg`,`https://i.ytimg.com/vi/${id}/hqdefault_live.jpg`];
 for(const url of urls){try{const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0','accept':'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'}});const type=r.headers.get('content-type')||'';if(!r.ok||!type.startsWith('image/'))continue;const buf=Buffer.from(await r.arrayBuffer());if(buf.length<5000)continue;res.setHeader('Content-Type',type);res.setHeader('Cache-Control','public, max-age=0, s-maxage=8, stale-while-revalidate=12');res.setHeader('X-Webcam-Source','YouTube live thumbnail');res.setHeader('X-Fetched-At',new Date().toISOString());return res.status(200).send(buf);}catch{}}
 return res.status(502).json({error:'live snapshot unavailable'});
};
