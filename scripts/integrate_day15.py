"""Apply reviewed Day 15 insulin art and language-matched video routes."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
VIDEOS = ROOT / "approved-videos.json"
IDS = {"novorapid": 7, "apidra": 7, "novomix-30": 8, "humalog-mix50": 8, "ryzodeg": 8}

html = INDEX.read_text(encoding="utf-8")
start = html.index('// Day-15 insulin pen illustrations') if '// Day-15 insulin pen illustrations' in html else -1
if start == -1:
    marker = '\n// ── Day-15 insulin pen illustrations ──\n'
    code = marker + '''const DAY15_INSULIN_IMAGES = {\n  "novorapid": 7, "apidra": 7, "novomix-30": 8,\n  "humalog-mix50": 8, "ryzodeg": 8\n};\nObject.entries(DAY15_INSULIN_IMAGES).forEach(([id, count]) => {\n  const med = MEDICATIONS.find(item => item.id === id);\n  if (!med || med.steps?.length !== count) throw new Error(`Day-15 step mismatch: ${id}`);\n  med.steps.forEach((step, i) => {\n    const art = `assets/img/day15-insulin/${id}/step-${String(i).padStart(2, "0")}.png`;\n    step.illustration = art;\n    if (med.pages?.[0]?.steps?.[i]) med.pages[0].steps[i].illustration = art;\n  });\n  if (med.pages?.[1]?.steps?.length !== 6) throw new Error(`Day-15 rotation step mismatch: ${id}`);\n  med.pages[1].steps.forEach((step, i) => {\n    step.illustration = `assets/img/day15-insulin/rotation/step-${String(i).padStart(2, "0")}.png`;\n  });\n  const videoPage = `https://jill5991.github.io/patient-education/video.html?med=${id}`;\n  med.qrUrl = videoPage;\n  med.pages?.forEach(page => { page.qrUrl = videoPage; });\n});\n'''
    # Insert just before the final inline script closes, after earlier day mapping.
    end = html.rfind('</script>')
    if end < 0:
        raise RuntimeError('No inline script close tag')
    html = html[:end] + code + html[end:]
    INDEX.write_text(html, encoding="utf-8")

registry = json.loads(VIDEOS.read_text(encoding="utf-8"))
primary = {
  "zh-TW": ("69nMfT70Asg", "【衛教】胰島素筆型注射器正確操作流程 國語版", "大林慈濟醫院-健康OK棒"),
  "en": ("_fCqEIn7ccA", "How to Use an Insulin Pen - Mayo Clinic Patient Education", "Mayo Clinic"),
  "id": ("9batH1Ek8-k", "Cara Suntik Insulin dengan Menggunakan Insulin Pen", "Alomedika"),
  "vi": ("u5PhTN2VT14", "Hướng dẫn sử dụng bút tiêm Insulin điều trị tiểu đường", "Bệnh viện ĐKQT Vinmec"),
  "th": ("W_fRodT5VT4", "How to Use | วิธีการใช้ยาอินซูลิน (แบบปากกา) สำหรับผู้ป่วยเบาหวาน", "SIKARIN HOSPITAL"),
  "tl": ("FHVHjCGfWts", "Injecting Insulin with a Pen (TAGALOG version) | PCEDM", "PCEDM - Philippine Endocrinologists"),
  "ja": ("PgKAsIhuNoY", "インスリン⾃⼰注射の指導 ／ 監修 杏林大学", "看護roo!(カンゴルー)公式"),
}
notices = {
  "zh-TW": "影片示範一般胰島素筆；請以本單張的藥品名稱、混勻方式、排氣單位及按住秒數為準。注射前核對手上的筆與標籤。",
  "en": "This shows a general insulin pen. Follow this sheet for your pen's name, mixing, priming dose, and hold time; check the label before injecting.",
  "id": "Video ini menunjukkan pena insulin umum. Ikuti lembar ini untuk nama obat, pencampuran, dosis uji aliran, dan waktu menahan tombol; periksa label sebelum menyuntik.",
  "vi": "Video minh họa bút insulin thông thường. Hãy theo tờ hướng dẫn này về tên thuốc, cách trộn, liều kiểm tra và thời gian giữ nút; kiểm tra nhãn trước khi tiêm.",
  "th": "วิดีโอนี้สาธิตปากกาอินซูลินทั่วไป ให้ยึดชื่อยา วิธีผสม ขนาดทดสอบ และเวลาการกดค้างตามเอกสารนี้ และตรวจฉลากก่อนฉีด",
  "tl": "Pangkalahatang insulin pen ang nasa video. Sundin ang gabay na ito para sa pangalan ng gamot, paghahalo, flow-check dose, at tagal ng pagpindot; tingnan ang label bago magturok.",
  "ja": "動画は一般的なインスリンペンの実演です。薬の名前、混和、空打ちの単位、押し続ける秒数はこのシートに従い、注射前にラベルを確認してください。",
}
for med in IDS:
    registry[med] = {lang: {"youtubeId": video_id, "title": title, "channel": channel, "notice": notices[lang]}
                     for lang, (video_id, title, channel) in primary.items()}
VIDEOS.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("Integrated 38 diagrams and 35 language-specific video entries")
