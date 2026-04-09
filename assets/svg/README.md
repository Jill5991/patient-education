# SVG 插圖放置方式

每個步驟可在 `steps[]` 內加入 `illustration`，支援兩種格式：

1. 字串（最簡單）
```js
illustration: "assets/svg/examples/mdi-step-1.svg"
```

2. 物件（可加多語 alt）
```js
illustration: {
  src: "assets/svg/examples/mdi-step-1.svg",
  alt: {
    "zh-TW": "搖動吸入器示意圖",
    "en": "Shake inhaler illustration",
    "id": "Ilustrasi mengocok inhaler",
    "vi": "Hình minh họa lắc ống hít",
    "th": "ภาพประกอบการเขย่ายาสูดพ่น",
    "tl": "Ilustrasyon ng pag-uga ng inhaler",
    "ja": "吸入器を振る図"
  }
}
```

## 檔案建議命名

- `assets/svg/<med-id>/step-1.svg`
- `assets/svg/<med-id>/step-2.svg`

例如：
- `assets/svg/foster-mdi/step-1.svg`
- `assets/svg/foster-mdi/step-2.svg`

系統會自動把 SVG 縮放到步驟右側 4 欄，不需手動算尺寸。
