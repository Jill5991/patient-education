# patient-education

Patient medication education sheets for pharmacy iPad use.

## Files

- `index.html`: main multilingual medication sheet app
- `content.json`: schema/content reference
- `SPEC.md`: design and authoring spec
- `blank_guides/`: one blank JSON template per medication
- `blank_guides_manifest.json`: index of all blank templates

## iPad usage

Open the deployed HTTPS URL on iPad Safari and switch language/category directly in the page UI.

## Maintain content

1. Edit each file in `blank_guides/*.json`
2. Sync the updated content back into `MEDICATIONS` in `index.html`
3. Commit and push

For reviewed illustration batches, keep the PNGs in `assets/img/<medication-id>/` (use `page-1/` and `page-2/` for two-page sheets). The `index.html` image count map connects each step to its PNG. Keep reviewed video choices in `approved-videos.json`; `video.html` reads this registry so printed language-specific QR codes keep the same destination if a YouTube video changes. Use `{"status":"no_suitable_video"}` when no appropriate video exists for a language. Run `node --test tests/*.test.js` before publishing.

## GitHub Pages deployment

In GitHub repository settings:

1. Go to **Settings → Pages**
2. Set **Source** to **Deploy from a branch**
3. Select **Branch: main** and **Folder: /(root)**
4. Save

After a short build, your public page will be:

`https://Jill5991.github.io/patient-education/`
