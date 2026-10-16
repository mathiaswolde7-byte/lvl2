/* ==========================================================
   LVL — product catalog
   The ONE place to edit products, prices, colours, sizes and
   shipping. Used by the website (js/main.js) AND by the payment
   function (netlify/functions/create-checkout.js), so the price a
   customer pays always comes from here, never from their browser.
   ========================================================== */
(function (root) {
  'use strict';

  // g = colour family, used by "Shop by color"
  var C = {
    black:    { n: 'Black',    h: '#141517', g: 'Blacks' },
    white:    { n: 'White',    h: '#F4F4F2', g: 'Neutrals' },
    cream:    { n: 'Cream',    h: '#E9E1CF', g: 'Neutrals' },
    chrome:   { n: 'Chrome',   h: '#BFC3C9', g: 'Greys' },
    steel:    { n: 'Steel',    h: '#7C818A', g: 'Greys' },
    graphite: { n: 'Graphite', h: '#4A4D53', g: 'Greys' },
    olive:    { n: 'Olive',    h: '#5B6146', g: 'Greens' },
    mocha:    { n: 'Mocha',    h: '#5E4A3C', g: 'Browns' },
    sand:     { n: 'Sand',     h: '#B9A88A', g: 'Browns' },
    ice:      { n: 'Ice',      h: '#AFC6D6', g: 'Blues' },
    navy:     { n: 'Navy',     h: '#1F2A3A', g: 'Blues' }
  };
  var FAMILIES = [
    { n: 'Blacks', h: '#141517' }, { n: 'Neutrals', h: '#E9E1CF' }, { n: 'Greys', h: '#7C818A' },
    { n: 'Greens', h: '#5B6146' }, { n: 'Browns', h: '#5E4A3C' }, { n: 'Blues', h: '#1F2A3A' }
  ];

  // print: chest | center | tonal | thigh | front ; back: extra print on the back
  var PRODUCTS = [
    { id: 'chrome-club-tee', name: 'Chrome Club Tee', cat: 'Tops', type: 'T-shirts', shape: 'tee', price: 45, tag: 'New', print: 'chest', back: true, col: 'Chrome Club',
      colors: [C.black, C.white, C.olive],
      desc: 'Heavyweight tee with a small chrome LVL on the chest and the full logo across the back.',
      fit: 'Boxy and slightly cropped. True to size; size down for a closer fit.' },
    { id: 'core-tee', name: 'Core Tee', cat: 'Tops', type: 'T-shirts', shape: 'tee', price: 38, tag: 'Bestseller', print: 'chest', col: 'Basics',
      colors: [C.black, C.cream, C.olive, C.navy],
      desc: 'The everyday tee: heavyweight cotton, boxy cut, dropped shoulder, small chest logo.',
      fit: 'Boxy and slightly cropped. True to size.' },
    { id: 'split-tee', name: 'Split Level Tee', cat: 'Tops', type: 'T-shirts', shape: 'tee', price: 42, was: 52, print: 'center', back: true, col: 'Chrome Club',
      colors: [C.black, C.ice],
      desc: 'The LVL logo printed large on the front and back.',
      fit: 'Boxy and slightly cropped. True to size.' },
    { id: 'elevation-hoodie', name: 'Elevation Hoodie', cat: 'Outerwear', type: 'Hoodies', shape: 'hoodie', price: 88, tag: 'New', print: 'center', col: 'Night Shift',
      colors: [C.graphite, C.black, C.olive],
      desc: 'Brushed-back fleece hoodie with a double-layer hood, chrome drawcords and a front logo print.',
      fit: 'Relaxed through the body with ribbed cuffs and hem.' },
    { id: 'summit-hoodie', name: 'Summit Hoodie', cat: 'Outerwear', type: 'Hoodies', shape: 'hoodie', price: 92, print: 'tonal', col: 'Ascend', soldOut: true,
      colors: [C.cream, C.mocha],
      desc: 'Heavy fleece hoodie with a large tonal embroidered logo, stitched in the same colour as the body.',
      fit: 'Relaxed. Take your usual size.' },
    { id: 'top-floor-jacket', name: 'Top Floor Jacket', cat: 'Outerwear', type: 'Jackets', shape: 'jacket', price: 148, tag: 'Limited', print: 'chest', back: true, col: 'Night Shift', soldSizes: ['XS', 'XXL'],
      colors: [C.black, C.mocha, C.navy],
      desc: 'Water-resistant work jacket with a snap front, two chest pockets and a large logo across the back.',
      fit: 'Boxy. Size up to layer a hoodie underneath.' },
    { id: 'base-crew', name: 'Base Crew', cat: 'Tops', type: 'Sweatshirts', shape: 'crew', price: 74, print: 'tonal', col: 'Basics',
      colors: [C.cream, C.steel, C.black],
      desc: 'Loopback crewneck sweatshirt with a ribbed collar and a tonal embroidered logo.',
      fit: 'Regular fit with a slightly dropped shoulder.' },
    { id: 'ground-cargo', name: 'Ground Cargo', cat: 'Bottoms', type: 'Cargos', shape: 'pants', price: 96, print: 'thigh', col: 'Ascend', soldSizes: ['S'],
      colors: [C.olive, C.black, C.sand],
      desc: 'Wide-leg cargo pant with flap pockets, an adjustable waist and a small logo on the thigh.',
      fit: 'Wide straight leg, mid rise. Take your usual waist size.' },
    { id: 'night-cargo', name: 'Night Shift Cargo', cat: 'Bottoms', type: 'Cargos', shape: 'pants', price: 98, tag: 'New', print: 'thigh', col: 'Night Shift',
      colors: [C.black, C.navy],
      desc: 'Black ripstop cargo with chrome hardware and a reflective thigh logo.',
      fit: 'Relaxed taper, mid rise.' },
    { id: 'stairwell-short', name: 'Stairwell Short', cat: 'Bottoms', type: 'Shorts', shape: 'shorts', price: 44, was: 54, print: 'thigh', col: 'Basics',
      colors: [C.black, C.steel, C.cream],
      desc: 'Above-the-knee fleece short with deep side pockets and a drawcord waist.',
      fit: '7-inch inseam, relaxed leg.' },
    { id: 'contour-cap', name: 'Contour Cap', cat: 'Accessories', type: 'Caps', shape: 'cap', price: 32, print: 'front', col: 'Chrome Club',
      colors: [C.black, C.cream, C.olive],
      desc: 'Six-panel cap with the chrome LVL logo on the front and a curved brim.',
      fit: 'One size, adjustable strap at the back.' },
    { id: 'tonal-cap', name: 'Tonal Cap', cat: 'Accessories', type: 'Caps', shape: 'cap', price: 32, print: 'tonal', col: 'Basics', soldOut: true,
      colors: [C.mocha, C.navy],
      desc: 'Washed cotton cap with a tonal embroidered logo.',
      fit: 'One size, adjustable strap at the back.' }
  ];

  var MYSTERY = { id: 'mystery-box', name: 'Mystery Box 01', cat: 'Tops', type: 'T-shirts', shape: 'tee', price: 45, print: 'mystery', colors: [C.black],
    desc: 'One LVL tee, picked at random from the current drop (including pieces that are sold out). You find out which one when it arrives.',
    fit: 'Boxy. True to size.' };

  var COLLECTIONS = [
    { n: 'Chrome Club', blurb: 'The chrome logo pieces', bg: '#121315', light: true, show: 'chrome-club-tee', color: 0 },
    { n: 'Night Shift', blurb: 'Black, navy, after dark', bg: '#1F2A3A', light: true, show: 'top-floor-jacket', color: 0 },
    { n: 'Basics', blurb: 'Everyday heavyweights', bg: '#E9E1CF', light: false, show: 'base-crew', color: 1 },
    { n: 'Ascend', blurb: 'Olive, sand, mocha', bg: '#5B6146', light: true, show: 'ground-cargo', color: 2 }
  ];
  var CATS = ['All', 'Tops', 'Outerwear', 'Bottoms', 'Accessories'];
  var SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Shipping, in US dollars. Used for the bag totals and for Stripe.
  var SHIPPING = {
    freeOver: 100,       // standard shipping is free at or above this subtotal
    standard: 8,         // standard shipping below that
    express: 18,         // express is always this
    countries: ['US']    // countries you ship to (two-letter codes, e.g. 'CA', 'GB')
  };

  // Stripe payment link for the Mystery Box (Stripe → Payment Links).
  // This is the TEST link. When you go live, make the same link in live mode and paste it here.
  var MYSTERY_LINK = 'https://buy.stripe.com/test_cNi4gs09E4Zv1KGd11fw400';

  var catalog = {
    MYSTERY_LINK: MYSTERY_LINK,
    C: C, FAMILIES: FAMILIES, PRODUCTS: PRODUCTS, MYSTERY: MYSTERY,
    COLLECTIONS: COLLECTIONS, CATS: CATS, SIZES: SIZES, SHIPPING: SHIPPING
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = catalog;
  else root.LVL_CATALOG = catalog;
})(typeof window !== 'undefined' ? window : this);
