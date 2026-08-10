# SEO Description Workflow

Tool untuk menulis ulang `seoDescription` di `src/data/coupons.json` secara batch.

Aturan tiap `seoDescription`:

- Panjang **250–350 karakter**
- Bebas boilerplate (`this is applicable to...`, `Udemy discount offers`, dll)
- Bebas template/duplikat kata — tiap kursus harus pakai kalimat unik sesuai topiknya (anti thin content)
- 3 bagian: hook (belajar apa) → topik utama (keyword yang relevan dengan kursus) → CTA kupon
- **Angka diskon di CTA harus sesuai diskon asli kursus** (dari data `price` vs `originalPrice`), jangan memakai angka patokan. File dump sudah menyertakan `discountPercent` tiap kursus.
- Tidak mengarang fakta; tahun selalu `2026`

## Cara pakai

Deskripsi ditulis manual/oleh AI (bukan template), lalu script hanya memvalidasi & menerapkan.

1. Lihat instruktur yang masih perlu dibersihkan:

```powershell
npm run seo:report
```

2. Export kursus per instruktur:

```powershell
npm run seo:dump "Stephane Maarek"
```

Output: `scripts/work/seo-dump.json` berisi kursus instruktur itu yang deskripsinya masih jelek.

3. Tulis `seoDescription` baru unik untuk tiap kursus (fetch data di file dump), simpan sebagai JSON:

```json
{
  "slug-kursus": "deskripsi unik 250-350 karakter...",
  "slug-lain": "..."
}
```

4. Terapkan + cek:

```powershell
npm run seo:apply scripts/work/seo-new.json
npm run seo:validate
```

`apply` otomatis **menolak** deskripsi yang:

- Bukan string / kosong
- Di luar 250–350 karakter
- Masih boilerplate
- Mengandung sisa template (frasa generik seperti "Step-by-step lessons take you through...", "You'll cover...")
- Memakai kalimat yang **identik dengan kursus lain** (duplicate wording — penyebab thin content)
- Angka diskon (`NN%`) yang **tidak sesuai diskon asli kursus**

## Command reference

| Command | Fungsi |
|---|---|
| `npm run seo:report` | Daftar instruktur yang masih punya seoDescription jelek + jumlah kursus |
| `npm run seo:dump "Nama"` | Export kursus instruktur ke `scripts/work/seo-dump.json` |
| `npm run seo:apply <file.json>` | Terapkan `{slug: seoDescription}` (dengan validasi anti-template/duplikat) |
| `npm run seo:validate` | Cek seluruh seoDescription (panjang, boilerplate, template, duplikat) |

File terkait: `scripts/seo-descriptions.js`, `docs/seo-description-prompt.md`.