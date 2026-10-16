# LVL — clothing website

Seven pages that link to each other:

| Page | File |
|---|---|
| Home (scroll animations) | `index.html` |
| All clothing (every piece and colorway, by category) | `all.html` |
| Shop (filter + sort) | `shop.html` |
| Product (colors, sizes, add to bag) | `product.html?id=…` |
| Bag / cart | `cart.html` |
| Checkout (pays through Stripe) | `checkout.html` |
| Order confirmed | `success.html` |

## Open it

Double-click `index.html` to open it in Chrome.

If the bag doesn't keep items between pages, run a tiny local server from this folder instead:

```
python3 -m http.server 8000
```

Then go to http://localhost:8000.

## Put it online for free

Follow **SETUP-STRIPE.md**: put the folder on GitHub and connect it to Netlify (free). That way the Stripe payment code runs too.

## Change things

- **Products, prices, colors, shipping:** `js/catalog.js` (the website and the payment code both read it).
- **Colors and fonts:** the `:root` variables at the top of `css/style.css`.
- **Logo:** your original logo is `assets/lvl-logo.png` (a full-size copy is `assets/lvl-logo-full.png`). Swap that file to change it everywhere.
- **Discover collections (home):** silver tiles that match the shop cards. Each one shows pieces from that collection, its piece count, starting price and colours, all filled in automatically from `js/catalog.js` (a product joins a collection through its `col` field). Styles are under `collection tiles` in `css/style.css`; their darker silver is the `.coll` block at the very bottom of that file.
- **Collections, Mystery Box, colour filters:** the `COLLECTIONS`, `MYSTERY` and `FAMILIES` lists in `js/catalog.js`. Mark a product `soldOut: true`, list sold-out sizes in `soldSizes`, or add `was: 60` to put it on sale.
- **Top box (hero):** the silver pencil-drawn rings are `assets/hero-rings.jpg`, with your logo in the dark centre. Swap that image to change the art.
- **Camo stripes section (home):** the misty camo (`assets/camo-bg.jpg`) shows through evenly spaced vertical stripes with white gaps and silver outlines. It stays still (no scroll animation). The outlines have a tiny glow (`.zoom__glow` in `css/style.css`). Change `--sw` (stripe width), `--sg` (white gap) and `--edge` (outline thickness) in `.zoom__stripes` in `css/style.css`.
- **Effects:** page changes use "Pro-Glide": the content lifts and fades out fast (220ms), then the new page glides up into place on a smooth expo-out curve (560ms, no bounce; the header stays still). Filters re-draw the grid with the same glide. Timings are the `glideOut` / `glideIn` lines in `css/style.css` and `FADE_MS` / `GLIDE_IN_MS` in `js/main.js` (keep them matching). Pages preload when you hover or touch a link. Add to bag / Buy / Pay shoot silver confetti (`confetti` in `js/main.js`), which turns off automatically for visitors whose device is set to reduce motion.
- **Navy titles:** the big headings on white (Raise the floor, Latest drop, Discover collections, Shop all…) and the collection names (Chrome Club, Night Shift, Basics, Ascend) are navy fading lighter toward the bottom. Change `--navy-top`, `--navy-mid` and `--navy-fade` at the bottom of `css/style.css`.
- **Silver backgrounds:** every clothing image sits on a brushed-silver gradient; change `--silver` near the bottom of `css/style.css` to retune it.
- **Real photos:** the product art is drawn in code, so swap the `garment(...)` calls in `js/main.js` for `<img>` tags when you have photos.
- **Payment:** checkout uses Stripe. Follow **SETUP-STRIPE.md** to connect your Stripe account and put the site online. The Pay button only works once the site is on Netlify, not when you open the files on your computer.
