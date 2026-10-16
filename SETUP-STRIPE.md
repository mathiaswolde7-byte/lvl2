# Turning on Stripe payments for LVL

The code is already done. You just connect three free accounts: **Stripe** (takes the money), **GitHub** (stores the site files) and **Netlify** (puts the site online and runs the payment code). Plan on about 30 minutes.

> **Your Stripe secret key (starts with `sk_`) is like a password to your money.**
> Only ever paste it into Netlify's settings. Never put it in a website file, a chat, or GitHub.

---

## 1. Get your Stripe test key
1. Sign up at **stripe.com**. You can skip the business details for now.
2. Make sure **Test mode** is switched on (toggle near the top right).
3. Go to **Developers → API keys**.
4. Next to **Secret key**, click **Reveal** and copy the key that starts with `sk_test_`. Keep it handy for step 3.

## 2. Put the site on GitHub
1. Make an account at **github.com**.
2. Click **+ → New repository**, name it `lvl-website`, leave it **Private**, and click **Create repository**.
3. Click **uploading an existing file**, then drag **everything inside** the `lvl-website` folder (all the files and folders, not the folder itself) into the page.
4. Click **Commit changes**.

## 3. Put it online with Netlify
1. Make an account at **netlify.com**. Choose **Sign up with GitHub**.
2. Click **Add new site → Import an existing project → GitHub**, and pick `lvl-website`.
3. Leave the settings as they are (the `netlify.toml` file fills them in) and click **Deploy**.
4. Add your key: go to **Site configuration → Environment variables → Add a variable**.
   - Key: `STRIPE_SECRET_KEY`
   - Value: your `sk_test_…` key from step 1
5. Go to **Deploys → Trigger deploy → Deploy site** so the new setting takes effect.
6. Open your site's address (something like `https://lvl-website.netlify.app`).

## 4. Test a fake order
1. Add something to the bag, go to **Checkout**, and click **Pay securely**.
2. On Stripe's page, pay with test card **4242 4242 4242 4242**, any future expiry date (like `12/34`), any 3-digit CVC and any ZIP code.
3. You should land on the "You leveled up." page with your order number.
4. In Stripe (still in test mode), open **Payments**. The order is there, with the items, sizes and shipping address.

Test cards never charge real money.

## 5. Go live (when you're ready to sell)
1. In Stripe, finish **Activate payments**: legal name, date of birth, address, SSN details and the bank account you want paid out to.
2. Switch **Test mode** off, go to **Developers → API keys**, and copy the **live** secret key (`sk_live_…`).
3. In Netlify, edit `STRIPE_SECRET_KEY`, paste the live key, then **Trigger deploy** again.
4. In Stripe live mode, make the Mystery Box payment link again (same settings), and paste the new `https://buy.stripe.com/...` link into `MYSTERY_LINK` in `js/catalog.js`.
5. Make one small real purchase yourself, then refund it from the Stripe dashboard to confirm everything works.
6. In Stripe's settings, turn on **email receipts for customers** and **email notifications for successful payments** to yourself, so you hear about every order.

---

## The Mystery Box
The Mystery Box button skips the bag and goes straight to its own Stripe payment link (set in `MYSTERY_LINK` in `js/catalog.js`). Customers pick their size on Stripe's page. That button works even before the site is on Netlify.

## Everyday changes
- **Prices, products, colours, sizes, sold-out items, shipping costs:** edit `js/catalog.js` only. The website and the payment code both read from it. Upload the changed file to GitHub and Netlify updates the site within a minute.
- **Ship to more countries:** add two-letter country codes to `countries` in `js/catalog.js` (for example `['US', 'CA']`).
- **Promo codes:** create them in Stripe under **Product catalog → Coupons**. Customers enter them on the Stripe payment page.
- **Sales tax:** in Netlify, add the variable `STRIPE_TAX` with the value `on` (and set up Stripe Tax in the Stripe dashboard). This costs extra per sale.

## Fees
Stripe charges 2.9% + 30¢ per successful card payment. No monthly fee. Netlify and GitHub are free at this size.

## Optional: test on your own computer
If you install Node.js, you can run the full site and payments locally:
```
npm install
npm install -g netlify-cli
cp .env.example .env      # then paste your sk_test_ key into .env
netlify dev
```

## What's in the code
| File | What it does |
|---|---|
| `js/catalog.js` | All products, prices and shipping rules |
| `checkout.html` | Order review + "Pay securely" button |
| `netlify/functions/create-checkout.js` | Re-checks prices and stock, then opens Stripe's payment page |
| `netlify/functions/get-order.js` | Fetches the finished order for the confirmation page |
| `success.html` | "You leveled up." confirmation page, empties the bag |
| `netlify.toml` / `package.json` | Settings Netlify reads automatically |
