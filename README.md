# CineScope — OMDB Movie Search

Modern, responsive bir Single Page Application: OMDB API üzerinden film, dizi ve bölüm araması; favoriler, filtreler, detay modalı, tema desteği ile.

**Canlı Demo:** https://batuhanbasswe.github.io/omdb-project/

**Repo:** https://github.com/BatuhanbasSwe/omdb-project

---

## İçindekiler

- [Hızlı Bakış](#hızlı-bakış)
- [Gereksinim Karşılama Matrisi](#gereksinim-karşılama-matrisi)
- [Özellikler](#özellikler)
- [Teknolojiler](#teknolojiler)
- [Proje Yapısı](#proje-yapısı)
- [Lokal Çalıştırma](#lokal-çalıştırma)
- [Kullanılan OMDB Endpoint'leri](#kullanılan-omdb-endpointleri)
- [Mimari Kararlar](#mimari-kararlar)
- [API Key Hakkında](#api-key-hakkında)
- [Bilinen Sınırlamalar](#bilinen-sınırlamalar)
- [Tarayıcı Desteği](#tarayıcı-desteği)

---

## Hızlı Bakış

| Konu | Detay |
|---|---|
| Stack | Vanilla HTML5 + CSS3 + JavaScript (ES Modules) |
| Build aracı | Yok — `index.html`'i aç çalışsın |
| Bağımlılık | Sıfır npm paketi |
| API | [OMDB API](https://www.omdbapi.com) |
| Hosting | GitHub Pages |
| Persistans | LocalStorage + URL params |

---

## Gereksinim Karşılama Matrisi

Orijinal proje README'sindeki her madde, projede şu şekilde karşılanıyor:

### Functional Requirements

| # | Spec maddesi | Durum | Nerede karşılanıyor |
|---|---|---|---|
| 1 | **Movie Search Input** — search box + button | Karşılandı | [`index.html`](index.html#L102-L120) `<form data-search-form>` + Enter / submit butonu |
| 1.bonus | Sahibinden tarzı zengin filtreler | Karşılandı | Tür / Yıl / Sıralama segmentleri + 11 tür chip'i ([`index.html`](index.html#L122-L167)) |
| 2 | **Display Movie Details** — Title, Year, Genre, Director, Poster | Karşılandı | Detay modal'ında tam künye ([`src/ui/modal.js`](src/ui/modal.js)); kart görünümünde Title/Year/Poster + IMDb puanı ([`src/ui/card.js`](src/ui/card.js)) |
| 3 | **Error Handling** — net hata mesajı | Karşılandı | "Sonuç yok", boş arama uyarısı, network hatası ([`src/ui/results.js`](src/ui/results.js) — `showEmpty`, `showError`) |
| 4 | **Multiple Searches** — refresh olmadan ardışık arama | Karşılandı | Form `preventDefault` + state-driven render ([`src/main.js`](src/main.js)) |
| 4 | Refresh sonrası son arama korunur | Karşılandı | URL params + LocalStorage ([`src/url.js`](src/url.js), [`src/storage.js`](src/storage.js)) |
| 5 | **Backend Proxy** | Opsiyonel — yapılmadı | Spec'te explicit olarak opsiyonel; bu proje saf SPA, [API Key Hakkında](#api-key-hakkında) bölümünde gerekçe |

### Non-Functional Requirements

| # | Spec maddesi | Durum | Nerede karşılanıyor |
|---|---|---|---|
| 1 | **Performance** — efficient API, no duplicate requests | Karşılandı | `Map<key, Promise>` cache + `AbortController` ([`src/api.js`](src/api.js)). Aynı sorgu iki kez atılmaz. |
| 2 | **Usability** — simple, intuitive | Karşılandı | Modern minimal UI, klavye kısayolu (`/`), skeleton loader, animasyonlar, ARIA attribute'ları |
| 3 | **Portability** — cross-browser + responsive | Karşılandı | Modern evergreen browser'lar (Chrome/Edge/Firefox/Safari); 360 / 768 / 1280 px breakpoint'leri ([`styles/main.css`](styles/main.css#L249) → [`styles/components.css`](styles/components.css)) |
| 4 | **Maintainability** — modular, well-documented | Karşılandı | ES Modules ile katmanlı: `api`, `state`, `storage`, `url`, `ui/*`. Tek sorumluluk, açık isimlendirme. Bu README mimari kararları belgeliyor. |

### Deliverables

| Madde | URL |
|---|---|
| Public GitHub repository | https://github.com/BatuhanbasSwe/omdb-project |
| GitHub Pages deployment | https://batuhanbasswe.github.io/omdb-project/ |

---

## Özellikler

### Zorunlu Gereksinimler (README spec'inden)

- **Arama** — Form ile kelime tabanlı arama; Enter veya buton ile submit; ardışık aramalar sayfa yenilenmeden çalışır
- **Detay alanları** — Title, Year, Genre, Director, Plot, Cast, Runtime, IMDb Rating, Awards, Poster (modal'da tam künye)
- **Hata yönetimi** — "Sonuç yok", "Boş arama", "Network hatası" mesajları kullanıcıya net şekilde gösterilir
- **State persistans** — Sayfa F5 yenilense bile son arama, sayfa, filtre ve sonuçlar URL params + LocalStorage üzerinden geri yüklenir

### Bonus Özellikler

#### Arama deneyimi
- **Filtre paneli** — İçerik türü (film / dizi / bölüm), yıl, sıralama (alaka / yıl / başlık)
- **Tür chip'leri** — Aksiyon, Macera, Komedi, Dram, Gerilim, Korku, Bilim Kurgu, Romantik, Animasyon, Suç, Fantastik
- **Sayfalama** — Önceki / Sonraki butonları, mevcut sayfa göstergesi
- **Klavye kısayolu** — `/` tuşu aramaya focus
- **Temizle butonu** — Input'a girilen yazıyı X ile sıfırla

#### Keşfet sekmesi
- **Top 250 Film** — IMDb klasikleri ve modern hitler (240+ başlık, IMDb puanına göre azalan sıralı)
- **Top 250 Dizi** — Breaking Bad, The Wire, Sopranos vb. dahil 95+ dizi
- **Son Çıkanlar** — Oppenheimer, Dune Part Two, Wicked vb. yakın dönem çıkışlar
- **Daha Fazla Yükle** — 20'lik batch'ler halinde lazy load
- **Tür filtresi** — Keşfet sayfasında da chip filtreleri
- **Otomatik kalite filtresi** — IMDb puanı 7.0 altı içerikler curated listelerden elenir

#### Favoriler & Tema
- **Favoriler** — Karttaki yıldız ile ekle/çıkar; ayrı sekmede listele; LocalStorage'da kalıcı
- **Light / Dark tema** — Header'daki ikondan toggle; tercih kalıcı
- **Sayaç badge** — Favoriler tab'ında canlı sayı

#### Detay modalı
- Karta tıklayınca yandan slide ile açılır
- Büyük poster, başlık, yıl, tür, yönetmen, oyuncular, plot, IMDb / Rotten Tomatoes / Metacritic puanları, ödüller
- ESC tuşu, X butonu veya overlay tıklamasıyla kapanır
- Body scroll lock

#### Görsel cila
- Glassmorphism (cam efekti) header ve filtre çubuğu
- Background gradient + film grain
- Poster animasyonları, fade-in kart geçişleri
- Skeleton shimmer (yükleme sırasında)
- `prefers-reduced-motion` desteği

### Performans & Mimari Çözümler

- **In-memory cache** — `Map<key, Promise>` ile aynı OMDB sorgusu iki kez atılmaz
- **AbortController** — Kullanıcı yeni arama yaparken eski fetch iptal edilir
- **URL ↔ State sync** — Arama parametreleri URL'de tutulur (paylaşılabilir / yer imine eklenebilir)
- **Lazy poster loading** — `loading="lazy"` attribute ile poster'lar görünür olunca yüklenir
- **GPU-friendly animasyonlar** — Sadece `transform` ve `opacity` üzerinden

---

## Teknolojiler

| Katman | Seçim | Notlar |
|---|---|---|
| Markup | HTML5 | Semantik tag'ler, ARIA attribute'ları |
| Stil | CSS3 | Custom properties (tema), Flexbox, Grid, `backdrop-filter` |
| Mantık | JavaScript (ES2022) | ES Modules, async/await, AbortController |
| Veri | OMDB API | Search + ID detay endpoint'leri |
| Persistans | LocalStorage + URL params | Hibrit hidrasyon |
| Tipografi | Inter + JetBrains Mono | Google Fonts |
| Hosting | GitHub Pages | `main` branch / root |

**Framework yok, build aracı yok, npm dependency yok.**

---

## Proje Yapısı

```
omdb-project/
├── index.html              Semantik iskelet: header, hero, search, modal, footer
├── README.md               Bu dosya
├── assets/
│   ├── icons/logo.svg
│   └── placeholder.svg     Poster yoksa fallback
├── styles/
│   ├── main.css            CSS değişkenleri (tema), layout, responsive
│   ├── components.css      Card, modal, button, filter, skeleton, badge
│   └── animations.css      Fade-in, shimmer, modal transition
└── src/
    ├── main.js             Giriş noktası, orkestrasyon, event binding
    ├── api.js              OMDB fetch sarmalayıcı, cache, AbortController
    ├── config.js           API key, base URL, page size, storage keys
    ├── storage.js          LocalStorage adaptörü (favoriler, tema, son arama)
    ├── url.js              URL query params ↔ state
    ├── utils.js            debounce, escapeHtml, $/$$ DOM helpers
    ├── top250.js           Keşfet için curated IMDb ID listeleri
    └── ui/
        ├── card.js         Tek film/dizi kartı render
        ├── modal.js        Detay paneli (yandan slide)
        ├── results.js      Grid render, pagination, empty/error states
        └── icons.js        SVG ikon constants (heart, search, star, vb.)
```

---

## Lokal Çalıştırma

Build aşaması yok. İki seçenek:

### 1. Tarayıcıda direkt aç (en hızlı)

`index.html`'e çift tıkla. ES modules `file://` protokolünde Chrome'da CORS uyarısı verir → bu yüzden local sunucu önerilir.

### 2. Local HTTP sunucu (önerilen)

```bash
# Python (tüm sistemlerde varsayılan kuruludur)
python -m http.server 8080

# Node.js varsa
npx serve .

# VSCode kullanıyorsanız: "Live Server" eklentisini kurun, index.html'e sağ tık → Open with Live Server
```

Sonra tarayıcıda: `http://localhost:8080`

---

## Kullanılan OMDB Endpoint'leri

```
GET https://www.omdbapi.com/?apikey=KEY&s=QUERY&type=TYPE&y=YEAR&page=N
```
Liste araması — sayfa başı 10 sonuç döner. Yanıt: `Search[]`, `totalResults`, `Response`.

```
GET https://www.omdbapi.com/?apikey=KEY&i=IMDB_ID&plot=full
```
Tek başlık detayı — Title, Year, Genre, Director, Actors, Plot, Runtime, Ratings, Awards, Poster, vb.

Hata durumlarında OMDB `Response: "False"` + `Error` mesajı döner; bu mesaj kullanıcıya gösterilir.

---

## Mimari Kararlar

### Genre & Director neden kart yerine modal'da?

OMDB'nin `?s=` (search) endpoint'i yalnızca `Title`, `Year`, `Type`, `Poster`, `imdbID` döner. Genre ve Director için her başlık için ayrı bir `?i=` (detay) çağrısı gerekir. Bu durumda 10 kartlık bir sonuç sayfası 11 OMDB isteği yapar (1 search + 10 detay) ki bu free tier'ın 1000 istek/gün limitini hızla tüketir.

**Çözüm:**
- Kart görünümünde: Title, Year, Poster + (arka planda enrich edilen) IMDb rating, Runtime
- Detay modalında: Title, Year, **Genre, Director**, Plot, Cast, Ratings, Awards, Runtime, Poster (büyük)

### Keşfet için neden manuel ID listesi?

OMDB'de "IMDb Top 250" gibi bir endpoint yok — sadece arama ve detay var. Keşfet sekmesi için [`src/top250.js`](src/top250.js) dosyasında manuel IMDb ID listeleri tutulur:

- `TOP_MOVIES` — 240+ klasik ve modern film
- `TOP_SERIES` — 95+ dizi
- `NEW_RELEASES` — Yakın dönem (2023–2024) çıkışlar

İçerik IMDb puanına göre azalan sıralı render edilir. IMDb puanı 7.0 altı başlıklar curated listelerden filtrelenir (Son Çıkanlar hariç — puanı henüz oturmamış olabilir).

### State yönetimi

Merkezi tek bir `state` objesi ([`src/main.js`](src/main.js#L20)):

```js
const state = {
  view: 'search',                         // home | search | favorites
  homeCategory: 'movies',                 // movies | series | new
  query: '', type: '', year: '', sort: '',
  genre: '', homeGenre: '',
  page: 1,
  loading: false,
  favorites: [],
  theme: 'dark',
  ...
};
```

Pub/sub framework yok. View'lar event-driven render edilir. URL ve LocalStorage state ile iki yönlü senkronize.

### Performans

- **Cache:** [`src/api.js`](src/api.js) içinde `Map<key, Promise>` — aynı parametreli istek tekrar atılmaz
- **AbortController:** Yeni arama yapılırken eski fetch iptal edilir → race condition yok
- **Skeleton:** İlk yüklemede shimmer kart'ları, kullanıcıya hız hissi
- **CSS animations:** Sadece `transform` + `opacity` üzerinden, GPU'da

---

## API Key Hakkında

API key [`src/config.js`](src/config.js) içinde **frontend'de açık** tutulmaktadır.

**Gerekçe:**
- OMDB free tier zaten public anahtarlara dayalı (anahtar URL'de görünür)
- Bu proje **tamamen client-side bir SPA** — backend proxy eklemek staj görevinin kapsamını gereksiz büyütürdü
- README spec'i Backend Proxy'yi **opsiyonel** olarak işaretlemiş

**Anahtarı değiştirmek için:** [`src/config.js`](src/config.js) dosyasındaki `OMDB_API_KEY` değişkenini güncelleyin.

Production'da: API key'i bir backend proxy üzerinden saklamak best practice'tir.

---

## Bilinen Sınırlamalar

- OMDB `?s=` endpoint'i Genre/Director döndürmediği için kart görünümünde bu alanlar yok (modal'da tam künye var)
- IMDb'nin gerçek Top 250 sıralaması Bayesian ortalama kullanır; biz ham `imdbRating`'e göre sıralıyoruz, ufak sapmalar olabilir
- Son Çıkanlar manuel listeyle besleniyor — otomatik güncellenmiyor
- OMDB free tier 1000 istek/gün ile sınırlı; cache + AbortController bunu en aza indiriyor ama yoğun kullanımda limit aşılabilir

---

## Tarayıcı Desteği

Modern evergreen tarayıcılar:

- Chrome / Edge 90+
- Firefox 90+
- Safari 14+

Kullanılan modern özellikler: ES Modules, `backdrop-filter`, CSS Grid, custom properties, `AbortController`. IE 11 desteklenmez.

---

## Lisans

Bu proje bir staj başvurusu görev çalışmasıdır.

---

Geliştirici: [@BatuhanbasSwe](https://github.com/BatuhanbasSwe)
