import type { NextRequest } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://kona.agency";

  const loaderScript = `
(function(){
  if(document.getElementById('kona-widget-container')) return;
  var c=document.createElement('div');
  c.id='kona-widget-container';
  c.style.cssText='position:fixed;bottom:24px;right:24px;z-index:2147483647;';
  var btn=document.createElement('button');
  btn.id='kona-widget-toggle';
  btn.setAttribute('aria-label','Open chat');
  btn.style.cssText='width:56px;height:56px;border-radius:50%;border:none;background:#7c3aed;color:#fff;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;font-size:24px;transition:transform 0.2s;';
  btn.textContent='💬';
  btn.onmouseenter=function(){btn.style.transform='scale(1.1)'};
  btn.onmouseleave=function(){btn.style.transform='scale(1)'};
  var frame=document.createElement('iframe');
  frame.id='kona-widget-iframe';
  frame.src='${origin}/widget/${encodeURIComponent(clientId)}';
  frame.style.cssText='display:none;width:380px;height:560px;border:none;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,0.12);margin-bottom:12px;';
  frame.setAttribute('allow','clipboard-write');
  frame.title='GRAFT chat widget';
  c.appendChild(frame);
  c.appendChild(btn);
  document.body.appendChild(c);
  var open=false;
  btn.addEventListener('click',function(){
    open=!open;
    frame.style.display=open?'block':'none';
    btn.textContent=open?'✕':'💬';
    btn.setAttribute('aria-label',open?'Close chat':'Open chat');
  });
})();
`.trim();

  return new Response(loaderScript, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
