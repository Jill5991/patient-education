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

## GitHub Pages deployment

In GitHub repository settings:

1. Go to **Settings → Pages**
2. Set **Source** to **Deploy from a branch**
3. Select **Branch: main** and **Folder: /(root)**
4. Save

After a short build, your public page will be:

`https://Jill5991.github.io/patient-education/`
