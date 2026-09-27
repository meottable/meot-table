"""Bundle the private Apps Script UI from the exact checked-in admin sources."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[2]
s=(root/'admin.html').read_text()
base='https://meottable.github.io/meot-table/'
def script(m):
    p=root/m.group(1).split('?')[0].removeprefix('./')
    return '<script>\n'+p.read_text()+'\n</script>' if p.is_file() else m.group(0)
def style(m):
    p=root/m.group(1).split('?')[0].removeprefix('./')
    return '<style>\n'+p.read_text()+'\n</style>' if p.is_file() else m.group(0)
s=re.sub(r'<script src="([^"]+)"\s*></script>',script,s)
s=re.sub(r'<link rel="stylesheet" href="([^"]+)"\s*>',style,s)
s=s.replace("meot_admin_customers_v2","meot_cloud_customers_v1").replace("meot_admin_quotes_v2","meot_cloud_quotes_v1")
preamble='''<base href="'''+base+'''" target="_top"><script>
window.MEOT_CLOUD=<?!= bootstrap ?>;
localStorage.setItem('meot_cloud_customers_v1',JSON.stringify(window.MEOT_CLOUD.data.customers));
localStorage.setItem('meot_cloud_quotes_v1',JSON.stringify(window.MEOT_CLOUD.data.quotes));
localStorage.setItem('meot_cloud_automation_v1',JSON.stringify(window.MEOT_CLOUD.data.automation));
</script>'''
s=s.replace('<head>','<head>'+preamble)
s=s.replace('</body>','<script>'+ (root/'automation/cloud/sync.js').read_text()+'</script></body>')
s=s.replace('고객·견적 기록은 이 기기에 저장됩니다.','고객·견적 기록은 Google 공통 DB에 저장됩니다. 상단 저장 상태를 확인하세요.')
s=s.replace('실제 상담 기록은 이 기기·브라우저에 저장됩니다.','별도 상담 상세 기록은 이 기기·브라우저에 저장됩니다.')
(root/'automation/cloud/App.html').write_text(s)
print('Generated private Apps Script App.html')
