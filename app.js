const $=id=>document.getElementById(id);
let rows=JSON.parse(localStorage.getItem("acclRows")||"[]");
function render(){ $("count").textContent="कुल रिकॉर्ड: "+rows.length; $("records").innerHTML=rows.slice().reverse().slice(0,20).map((r,i)=>`<div class="item">${rows.length-i}. ${r.date} — ${r.type}: <b>${r.code}</b></div>`).join(""); }
render();
if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(()=>{});
$("scan").onclick=async()=>{
 const f=$("photo").files[0]; if(!f){$("status").textContent="पहले Voucher की फोटो चुनें।";return;}
 if(!window.Tesseract){$("status").textContent="OCR library लोड नहीं हुई। इंटरनेट चालू करके पेज फिर खोलें।";return;}
 $("status").textContent="फोटो पढ़ी जा रही है…";
 try{
  const result=await Tesseract.recognize(f,"eng",{logger:m=>{if(m.status==="recognizing text")$("status").textContent="स्कैन हो रहा है: "+Math.round((m.progress||0)*100)+"%";}});
  const txt=result.data.text;
  const patterns=[/(?:payee|party|vendor)\s*(?:code|no\.?|number)?\s*[:\-]?\s*([A-Z]?\d{6,12})/i,/\b([A-Z]?\d{8})\b/i];
  let found=null; for(const p of patterns){const m=txt.match(p);if(m){found=m[1];break;}}
  $("code").value=found||"";$("status").textContent=found?"कोड मिला। सेव करने से पहले जाँच लें।":"कोड स्पष्ट नहीं मिला। फोटो साफ करके दोबारा कोशिश करें।";
 }catch(e){$("status").textContent="स्कैन में समस्या आई: "+e.message;}
};
$("save").onclick=()=>{
 const code=$("code").value.trim().toUpperCase();if(!code){$("status").textContent="पहले Code Number भरें।";return;}
 rows.push({date:new Date().toLocaleDateString("en-GB"),type:$("type").value,code});
 localStorage.setItem("acclRows",JSON.stringify(rows));$("code").value="";render();$("status").textContent="रिकॉर्ड सेव हो गया।";
};
$("export").onclick=()=>{
 if(!rows.length){$("status").textContent="एक्सपोर्ट करने के लिए रिकॉर्ड नहीं हैं।";return;}
 if(!window.XLSX){$("status").textContent="Excel लाइब्रेरी लोड नहीं हुई। इंटरनेट चालू करके पेज फिर खोलें।";return;}
 const ws=XLSX.utils.json_to_sheet(rows.map(r=>({DATE:r.date,"CODE TYPE":r.type,"CODE NUMBER":r.code})));
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Batch 1");XLSX.writeFile(wb,"ACCL_Payee_Scanner_Batch.xlsx");
};
$("clear").onclick=()=>{if(confirm("क्या आप इस डिवाइस से सभी सेव रिकॉर्ड हटाना चाहते हैं? पहले Excel डाउनलोड कर लें।")){rows=[];localStorage.removeItem("acclRows");render();}};
