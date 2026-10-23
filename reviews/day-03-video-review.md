# Day 03 video and illustration review

Reviewed 2026-10-23 for the four rectal medication sheets listed in
[day-03-summary.md](https://docs.google.com/document/d/1c34lZaPM_Uj7jBKsVe_BZ2vMn03AvBF7XuahbyQ6sr4/edit).

## Illustrations

- Integrated all 27 PNGs listed in the four current `records.json` files.
- Used the latest corrected `high-xylmol/step-00.png` and
  `high-xylmol/step-05.png`; the `-v1-deprecated` files were excluded.
- Confirmed the PNG format, 1200 × 896 dimensions, order, and visual content.
  Four pairs intentionally reuse a general pose, withdrawal, or waiting drawing.

## Video routes

The four sheets have 28 language routes. Fourteen show a video, and fourteen
show the localized `no_suitable_video` message. YouTube oEmbed was used to
verify that each linked ID resolves to the stated title and channel. The
Google Drive candidate records supply the language and detailed content
assessment; oEmbed itself does not establish spoken language or captions.

| Sheet | Linked languages | No suitable video |
| --- | --- | --- |
| Glycerin enema | zh-TW, en, id, vi, th, ja | tl |
| EVAC enema | en, id, th | zh-TW, vi, tl, ja |
| Colasa enema | zh-TW, en, ja | id, vi, th, tl |
| High-Xylmol ointment | zh-TW, ja | en, id, vi, th, tl |

Three day-03 candidates were changed after checking the medication or
technique:

1. EVAC `zh-TW`: [We Care IBD's enema video](https://www.youtube.com/watch?v=O9hAXMpD_0k)
   is a retention enema tutorial, while EVAC is a sodium phosphate laxative
   with a 1–5 minute onset. The route stays unavailable pending a matching
   Traditional Chinese video.
2. EVAC `en`: [the proposed Fleet Bisacodyl video](https://www.youtube.com/watch?v=K-HTUO-feR4)
   covers a different active ingredient. The route uses the
   [SimpleNursing Fleet demonstration](https://www.youtube.com/watch?v=4qhEivVnc3k)
   with a notice to follow the EVAC sheet for product-specific instructions.
   Fleet's [saline product information](https://www.fleetlabs.com/constipation-relief-products/enemas/fleet-saline-enema)
   confirms sodium phosphates and 1–5 minute onset.
3. Colasa `en`: the proposed SimpleNursing Fleet/soap enema video covers
   evacuation enemas. The route uses a
   [Pentasa enema demonstration](https://www.youtube.com/watch?v=R1Y7NJjNxlQ)
   of the same drug class, with a notice that Colasa's bottle and timing may
   differ. The [NHS mesalazine guide](https://www.nhs.uk/medicines/mesalazine/how-and-when-to-take-mesalazine/)
   explains that enema products can have different instructions.

The remaining general-device videos include brief notices where their
device or timing may differ from the sheet. A missing-language route does not
silently fall back to another language.
