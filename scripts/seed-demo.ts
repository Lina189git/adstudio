/**
 * Demo seed: 10 ecommerce products + influencer workflow demo data.
 * Safe to re-run — uses upsert by slug / email.
 */
import { PrismaClient, UserRole, ApplicationStatus, ShippingStatus, TaskStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// ─── 1. Categories ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: "Skincare & Beauty",   slug: "skincare-beauty",   sortOrder: 1, description: "Serums, masks, and beauty essentials for glowing skin." },
  { name: "Tech & Gadgets",      slug: "tech-gadgets",      sortOrder: 2, description: "Earbuds, chargers, and smart devices for modern life." },
  { name: "Fitness & Wellness",  slug: "fitness-wellness",  sortOrder: 3, description: "Gear and supplements to support an active lifestyle." },
  { name: "Home & Lifestyle",    slug: "home-lifestyle",    sortOrder: 4, description: "Diffusers, lamps, and home accessories for everyday comfort." },
  { name: "Fashion & Accessories", slug: "fashion-accessories", sortOrder: 5, description: "Silk, sustainable fabrics, and everyday fashion essentials." },
];

// ─── 2. Products ────────────────────────────────────────────────────────────

const PRODUCTS = [
  // ── Skincare & Beauty ──
  {
    slug: "hydrating-vitamin-c-serum",
    categorySlug: "skincare-beauty",
    name: "Hydrating Vitamin C Serum",
    shortDescription: "Brightens skin tone and boosts collagen with 20% vitamin C.",
    description: `Our Vitamin C Serum combines a stable 20% L-ascorbic acid complex with hyaluronic acid and niacinamide. Use every morning for visibly brighter, firmer skin within 4 weeks.

Key benefits:
• Reduces dark spots and hyperpigmentation
• Strengthens the skin barrier
• Oil-free, non-comedogenic formula
• Dermatologist tested & fragrance-free`,
    basePriceCents: 3499,
    commissionType: "PERCENTAGE",
    commissionRate: 0.15,
    sampleStock: 10,
    stockQuantity: 10,
    isFeatured: true,
    imageUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800",
    galleryImages: [
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600",
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600",
    ],
    taskRequirements: `Video brief — Hydrating Vitamin C Serum

MUST include:
1. Show the product clearly in good lighting
2. Demonstrate applying 3–4 drops to clean skin
3. Mention the 20% vitamin C and "visibly brighter skin in 4 weeks" claim
4. Personal testimonial — how does your skin feel after use?
5. End with discount code overlay: GLOW15

Platform: TikTok (60–90 s) or Instagram Reel (30–60 s)
Tone: authentic, conversational — not overly scripted`,
  },
  {
    slug: "brightening-collagen-sheet-mask",
    categorySlug: "skincare-beauty",
    name: "Brightening Collagen Sheet Mask 10-Pack",
    shortDescription: "Intense 15-minute collagen treatment — visible results after one use.",
    description: `Ten sheet masks, each packed with marine collagen, vitamin B5, and ceramide complex. Perfect for a weekly glow boost or pre-event skin prep.

Key benefits:
• Plumps and firms in 15 minutes
• Reduces the look of fine lines
• Cruelty-free, vegan formula
• Suitable for all skin types`,
    basePriceCents: 2499,
    commissionType: "PERCENTAGE",
    commissionRate: 0.20,
    sampleStock: 10,
    stockQuantity: 10,
    isFeatured: false,
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800",
    galleryImages: [
      "https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=600",
    ],
    taskRequirements: `Video brief — Collagen Sheet Mask

MUST include:
1. Unboxing the 10-pack
2. Apply the mask on camera (time-lapse or real-time)
3. Reaction reveal after 15 minutes
4. Mention "marine collagen" and "one mask, visible results"
5. Call-to-action: "Link in bio for 20% off"

Platform: TikTok (45–75 s) or YouTube Shorts
Tone: fun, relatable, skincare-routine vibe`,
  },

  // ── Tech & Gadgets ──
  {
    slug: "pro-wireless-noise-cancelling-earbuds",
    categorySlug: "tech-gadgets",
    name: "Pro Wireless Noise-Cancelling Earbuds",
    shortDescription: "40 dB active noise cancellation, 36 h battery, Hi-Fi audio.",
    description: `Premium true-wireless earbuds with hybrid active noise cancellation. Designed for commuters, remote workers, and audiophiles who won't compromise on sound quality.

Specifications:
• Driver: 11 mm dynamic + balanced armature
• ANC: 40 dB hybrid cancellation
• Battery: 9 h per charge + 27 h via case (36 h total)
• Connectivity: Bluetooth 5.3, multipoint (2 devices)
• Water resistance: IPX5
• Comes with 3 tip sizes + carry case`,
    basePriceCents: 8999,
    commissionType: "PERCENTAGE",
    commissionRate: 0.10,
    sampleStock: 10,
    stockQuantity: 10,
    isFeatured: true,
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800",
    galleryImages: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
      "https://images.unsplash.com/photo-1546435770-a3e736df6c1e?w=600",
    ],
    taskRequirements: `Video brief — Pro Wireless Earbuds

MUST include:
1. Unboxing with packaging shown
2. Pair the earbuds with your phone on camera
3. ANC demo: put them in a noisy environment, show the ANC toggle
4. Sound quality opinion — be genuine
5. Battery life mention: "36 hours total"
6. End card: "Use code SOUND10 for 10% off"

Platform: YouTube (3–6 min) or TikTok/Reels (60–90 s)
Tone: honest tech review, not a commercial`,
  },
  {
    slug: "20000mah-slim-power-bank",
    categorySlug: "tech-gadgets",
    name: "20,000 mAh Slim Power Bank",
    shortDescription: "Triple USB-C PD 65W — charges a laptop, phone, and watch simultaneously.",
    description: `Ultra-slim 20,000 mAh power bank featuring dual USB-C Power Delivery (65 W max) and one USB-A port. Charges a MacBook, iPhone, and Apple Watch at the same time.

Specifications:
• Capacity: 20,000 mAh / 74 Wh
• Output: 2× USB-C PD 65 W / 1× USB-A 18 W
• Input: USB-C 45 W (recharges in ~3 h)
• Dimensions: 148 × 68 × 15 mm — fits in a jacket pocket
• Airline carry-on compliant`,
    basePriceCents: 4999,
    commissionType: "PERCENTAGE",
    commissionRate: 0.12,
    sampleStock: 10,
    stockQuantity: 10,
    isFeatured: false,
    imageUrl: "https://images.unsplash.com/photo-1609592806596-4d6e6a38f91d?w=800",
    galleryImages: [],
    taskRequirements: `Video brief — Slim Power Bank

MUST include:
1. Size comparison: show it next to a phone (looks sleek, not bulky)
2. Plug in 2–3 devices simultaneously on camera
3. Mention: "20,000 mAh charges your phone 4–5×"
4. Travel use case: airport, hotel, working remotely
5. Call-to-action: "Get 12% off with my link below"

Platform: TikTok (30–60 s) or Instagram Reel
Tone: "this thing saved my trip" storytelling style`,
  },

  // ── Fitness & Wellness ──
  {
    slug: "premium-resistance-band-set",
    categorySlug: "fitness-wellness",
    name: "Premium Resistance Band Set (5 levels)",
    shortDescription: "Latex-free resistance bands for home gym, PT, and mobility work.",
    description: `Five-band set covering 5–150 lbs of resistance. Durable natural latex alternative — no snapping, no rolling. Each band is 41″ long with reinforced edges.

What's in the kit:
• 5 bands: yellow (5–15 lb), red (15–35 lb), black (35–65 lb), purple (65–90 lb), green (90–150 lb)
• Mesh carry bag
• Exercise guide with 30+ exercises
• Ankle strap + door anchor`,
    basePriceCents: 2999,
    commissionType: "PERCENTAGE",
    commissionRate: 0.18,
    sampleStock: 10,
    stockQuantity: 10,
    isFeatured: true,
    imageUrl: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800",
    galleryImages: [
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600",
    ],
    taskRequirements: `Video brief — Resistance Band Set

MUST include:
1. Unbox the 5-band set, show each resistance level
2. Demonstrate 3–4 exercises (e.g. squat, chest press, lateral walk, bicep curl)
3. Mention: "5 to 150 lbs — builds as you progress"
4. Home gym angle: "No gym, no problem"
5. End with: "Full home workout guide included — link in bio"

Platform: TikTok or Reels (60–90 s)
Tone: energetic, motivational, "let's go" vibe`,
  },
  {
    slug: "non-slip-cork-yoga-mat",
    categorySlug: "fitness-wellness",
    name: "Non-Slip Cork Yoga Mat — 6mm",
    shortDescription: "Natural cork surface + rubber base. Grippier the more you sweat.",
    description: `6mm thick yoga mat made from sustainably harvested cork and natural tree rubber. The cork surface actually becomes grippier as moisture builds — ideal for hot yoga, Pilates, and power flows.

Features:
• 183 × 61 cm, 6 mm thick (2.7 kg)
• Cork top layer: antimicrobial, self-cleaning
• Natural rubber base: zero slip on hardwood and carpet
• Alignment guide printed with eco-ink
• Carry strap included
• FSC-certified, free from PVC, TPE, and phthalates`,
    basePriceCents: 5999,
    commissionType: "PERCENTAGE",
    commissionRate: 0.15,
    sampleStock: 10,
    stockQuantity: 10,
    isFeatured: true,
    imageUrl: "https://images.unsplash.com/photo-1601925228965-94e3f8c7f3c4?w=800",
    galleryImages: [
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600",
    ],
    taskRequirements: `Video brief — Cork Yoga Mat

MUST include:
1. Show the mat unrolled in a good-light setting (natural light preferred)
2. Demonstrate grip: pour a small amount of water on it, press palm — show zero slip
3. Do a 60–90 second flow sequence on the mat
4. Mention: "Gets grippier as you sweat — perfect for hot yoga"
5. Sustainability callout: "Natural cork, zero PVC"
6. End card with discount code: FLOW20

Platform: Instagram Reel or TikTok (60–90 s)
Tone: calm, aspirational, wellness aesthetic`,
  },
  {
    slug: "insulated-stainless-steel-water-bottle",
    categorySlug: "fitness-wellness",
    name: "32 oz Insulated Stainless Steel Water Bottle",
    shortDescription: "Triple-wall vacuum keeps drinks cold 48 h or hot 24 h.",
    description: `Engineered for endurance. Triple-wall vacuum insulation with 18/8 food-grade stainless steel inner and outer walls. Zero condensation, zero plastic taste.

Features:
• 32 oz (946 ml) capacity
• Keeps cold 48 h / hot 24 h
• Leak-proof twist lid + wide mouth (fits ice cubes)
• BPA-free, phthalate-free
• Powder-coated exterior — scratch and dent resistant
• Fits standard cup holders
• Lifetime warranty`,
    basePriceCents: 3299,
    commissionType: "PERCENTAGE",
    commissionRate: 0.15,
    sampleStock: 10,
    stockQuantity: 10,
    isFeatured: false,
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800",
    galleryImages: [],
    taskRequirements: `Video brief — Insulated Water Bottle

MUST include:
1. Fill with ice water — show no condensation after 2 minutes
2. Morning routine angle: filling it up as part of your day
3. Mention: "Cold for 48 hours" with an honest test
4. Wide mouth + cup-holder size demo
5. "Lifetime warranty" as a trust builder
6. CTA: "Get yours — link in bio"

Platform: TikTok (30–60 s) or YouTube Shorts
Tone: lifestyle, day-in-the-life, authentic`,
  },

  // ── Home & Lifestyle ──
  {
    slug: "ultrasonic-essential-oil-diffuser",
    categorySlug: "home-lifestyle",
    name: "Ultrasonic Essential Oil Diffuser",
    shortDescription: "700 ml, 7-colour LED, whisper-quiet ultrasonic — runs 12 h.",
    description: `Create spa-quality ambience at home. This 700 ml ultrasonic diffuser uses cold-water mist technology to disperse essential oils without heat, preserving their therapeutic properties.

Features:
• 700 ml tank — continuous mist for up to 12 hours
• 7-colour LED ambient light (cycle or hold single colour)
• 3 mist modes: continuous, intermittent, auto-off
• Whisper-quiet (<30 dB) — safe for bedrooms and offices
• Auto shut-off when water runs out
• BPA-free food-grade materials`,
    basePriceCents: 4499,
    commissionType: "PERCENTAGE",
    commissionRate: 0.15,
    sampleStock: 10,
    stockQuantity: 10,
    isFeatured: false,
    imageUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800",
    galleryImages: [],
    taskRequirements: `Video brief — Ultrasonic Essential Oil Diffuser

MUST include:
1. Set up on camera — fill with water, add drops of oil, show mist rising
2. Night or evening setting — show the LED glow in a cosy room
3. Mention: "12 hours of scent" and "whisper-quiet"
4. Your favourite oil combination (makes it personal)
5. "Perfect for sleep, focus, or unwinding after work"
6. CTA with code: MIST15 for 15% off

Platform: TikTok or Reels (30–60 s)
Tone: calming, cosy home aesthetic, ASMR vibes welcome`,
  },
  {
    slug: "smart-led-desk-lamp",
    categorySlug: "home-lifestyle",
    name: "Smart LED Desk Lamp — Touch Dimmer & USB-C Charging",
    shortDescription: "Eye-care mode, 5 colour temperatures, built-in 18W USB-C port.",
    description: `The all-in-one desk companion. Adjustable arm, 5 colour temperatures (2700–6500K), 10 brightness levels, and an eye-care mode that filters blue light for late-night work sessions.

Features:
• 5 colour temps: warm (2700K) to daylight (6500K)
• 10 brightness levels via touch slider
• Eye-care mode: reduces blue light by 40%
• Built-in 18W USB-C charging port
• Adjustable gooseneck arm (360°)
• Memory function — remembers last setting
• 50,000 hour LED lifespan`,
    basePriceCents: 3999,
    commissionType: "PERCENTAGE",
    commissionRate: 0.12,
    sampleStock: 10,
    stockQuantity: 10,
    isFeatured: false,
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    galleryImages: [],
    taskRequirements: `Video brief — Smart LED Desk Lamp

MUST include:
1. Desk setup reveal — show lamp as part of a clean workspace
2. Demonstrate colour temperature change (warm to daylight)
3. Show the USB-C charging port in use (charge your phone via the lamp)
4. Eye-care mode: "Reducing blue light for late-night work"
5. "Study setup / work from home essential"
6. CTA: "Get 12% off — code DESK12"

Platform: TikTok or Reels (45–75 s)
Tone: productivity aesthetic, minimal desk-setup vibe`,
  },

  // ── Fashion & Accessories ──
  {
    slug: "100-percent-silk-sleep-mask",
    categorySlug: "fashion-accessories",
    name: "100% Mulberry Silk Sleep Mask",
    shortDescription: "22 momme Grade 6A silk. Blocks 100% of light — zero pressure on lashes.",
    description: `Made from the finest 22 momme Grade 6A mulberry silk. The contoured nose bridge creates a light-blocking seal without pressing against your eyelashes or leaving marks on your face.

Features:
• 22 momme Grade 6A mulberry silk (inside & outside)
• 3D contoured eye cups — zero pressure on lashes
• Adjustable elastic strap — fits all head sizes
• Machine washable (cold, delicate cycle)
• Dermatologically tested — safe for sensitive skin
• Includes silk drawstring pouch for travel`,
    basePriceCents: 2299,
    commissionType: "PERCENTAGE",
    commissionRate: 0.20,
    sampleStock: 10,
    stockQuantity: 10,
    isFeatured: false,
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800",
    galleryImages: [],
    taskRequirements: `Video brief — Silk Sleep Mask

MUST include:
1. "Get ready for bed with me" or morning routine format
2. Show the silk texture close-up — silky, smooth, premium feel
3. Put it on — show the 3D contoured fit
4. "Zero light, zero pressure on my lashes"
5. Before/after: "Best sleep I've had in weeks"
6. End with: "Link in bio — use code SILK20"

Platform: TikTok or Instagram Reel (30–60 s)
Tone: relaxing, self-care, GRWM night routine aesthetic`,
  },
];

// ─── 3. Demo influencer workflow data ───────────────────────────────────────

async function seedWorkflow(
  influencerId: string,
  products: { id: string; slug: string; commissionRate: number }[],
) {
  const find = (s: string) => products.find((p) => p.slug === s)!;

  // Application 1: APPROVED → sample DELIVERED → ACTIVE task (influencer can submit)
  const serum = find("hydrating-vitamin-c-serum");
  {
    let app = await prisma.adApplication.findFirst({
      where: { influencerId, productId: serum.id },
    });
    if (!app) {
      app = await prisma.adApplication.create({
        data: {
          productId:      serum.id,
          influencerId,
          status:         ApplicationStatus.APPROVED,
          pitch:          "I have 42 k skincare followers on TikTok and focus on clean-beauty content. My audience is 25–35 y/o women who actively buy skincare.",
          plannedContent: "60-second morning routine video: apply the serum, discuss texture, show before/after glow. Mention the 4-week claim with a follow-up video at week 2.",
          agreedRate:     serum.commissionRate,
          approvedAt:     new Date("2026-08-01"),
        },
      });
    }

    await prisma.productSample.upsert({
      where:  { applicationId: app.id },
      update: {},
      create: {
        applicationId:  app.id,
        carrier:        "FedEx",
        trackingNumber: "784512369874",
        status:         ShippingStatus.DELIVERED,
        shippedAt:      new Date("2026-08-03"),
        deliveredAt:    new Date("2026-08-06"),
        shippingAddress: {
          name: "Demo Influencer", address1: "123 Creator Ave", city: "Los Angeles", state: "CA", zip: "90001", country: "US",
        },
      },
    });

    let task = await prisma.adTask.findFirst({ where: { applicationId: app.id } });
    if (!task) {
      task = await prisma.adTask.create({
        data: {
          applicationId: app.id,
          productId:     serum.id,
          influencerId,
          status:        TaskStatus.ACTIVE,
          deadline:      new Date("2026-09-15"),
          readme:        `# Vitamin C Serum — Ad Task Brief

Welcome! Your sample was delivered on Aug 6. Here's everything you need to create a great ad video.

## Goal
Produce one authentic TikTok or Instagram Reel (60–90 s) showcasing the Hydrating Vitamin C Serum as part of a morning skincare routine.

## Requirements checklist
- [ ] Product clearly visible in good lighting
- [ ] Apply 3–4 drops to clean skin on camera
- [ ] Mention "20% vitamin C" and "brighter skin in 4 weeks"
- [ ] Personal testimonial (texture, scent, how skin feels)
- [ ] Discount code overlay at end: **GLOW15**

## Deadlines
- First draft upload: **September 15, 2026**
- Revisions (if any): within 5 days of feedback

## Commission
15% of every sale made through your unique link.

Questions? Message us through the platform.`,
          requirements:  [
            "Show the product in natural lighting",
            "Apply 3–4 drops to clean, dry face",
            "Mention '20% vitamin C' and '4-week results'",
            "Include discount code GLOW15 in the video",
            "Upload original file — no heavy filters",
          ],
        },
      });
    }
  }

  // Application 2: APPROVED → sample SHIPPED (in transit)
  const earbuds = find("pro-wireless-noise-cancelling-earbuds");
  {
    let app = await prisma.adApplication.findFirst({
      where: { influencerId, productId: earbuds.id },
    });
    if (!app) {
      app = await prisma.adApplication.create({
        data: {
          productId:      earbuds.id,
          influencerId,
          status:         ApplicationStatus.APPROVED,
          pitch:          "I review tech for 68 k YouTube subscribers and 30 k TikTok followers. My audience trusts detailed, honest reviews — not sponsored fluff.",
          plannedContent: "3-minute YouTube review + 60-second Reel. ANC test in a café, sound quality demo, and battery life comparison vs the previous pair.",
          agreedRate:     earbuds.commissionRate,
          approvedAt:     new Date("2026-08-10"),
        },
      });
    }

    await prisma.productSample.upsert({
      where:  { applicationId: app.id },
      update: {},
      create: {
        applicationId:  app.id,
        carrier:        "UPS",
        trackingNumber: "1Z999AA10123456784",
        status:         ShippingStatus.SHIPPED,
        shippedAt:      new Date("2026-08-12"),
        shippingAddress: {
          name: "Demo Influencer", address1: "123 Creator Ave", city: "Los Angeles", state: "CA", zip: "90001", country: "US",
        },
      },
    });
  }

  // Application 3: PENDING (just applied)
  const yogaMat = find("non-slip-cork-yoga-mat");
  {
    const existing = await prisma.adApplication.findFirst({
      where: { influencerId, productId: yogaMat.id },
    });
    if (!existing) {
      await prisma.adApplication.create({
        data: {
          productId:      yogaMat.id,
          influencerId,
          status:         ApplicationStatus.PENDING,
          pitch:          "Yoga instructor with 25 k Instagram followers. My community is always asking for gear recommendations — an honest review from me converts really well.",
          plannedContent: "Morning flow on the mat. Grip test in a sweaty session. Sustainability angle because my audience cares about eco-friendly gear.",
        },
      });
    }
  }

  // Application 4: PENDING (Vitamin C mask — different product, same influencer)
  const mask = find("brightening-collagen-sheet-mask");
  {
    const existing = await prisma.adApplication.findFirst({
      where: { influencerId, productId: mask.id },
    });
    if (!existing) {
      await prisma.adApplication.create({
        data: {
          productId:      mask.id,
          influencerId,
          status:         ApplicationStatus.PENDING,
          pitch:          "Skincare-routine content is my niche. I post a weekly #SkincareSunday series that my audience loves.",
          plannedContent: "GRWM format: apply the mask, relax, reveal. Side-by-side skin comparison before and after.",
        },
      });
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n══════════════════════════════════════════════");
  console.log("  AdStudio Demo Seed");
  console.log("══════════════════════════════════════════════\n");

  // ── Categories ──
  console.log("▶ Upserting categories…");
  const catMap: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where:  { slug: c.slug },
      update: { name: c.name, description: c.description, sortOrder: c.sortOrder, isActive: true },
      create: { ...c, isActive: true },
    });
    catMap[c.slug] = cat.id;
    console.log(`  ✓ ${cat.name}`);
  }

  // ── Products ──
  console.log("\n▶ Upserting products…");
  const createdProducts: { id: string; slug: string; commissionRate: number }[] = [];

  for (const p of PRODUCTS) {
    const { categorySlug, ...rest } = p;
    const product = await prisma.product.upsert({
      where:  { slug: p.slug },
      update: {
        ...rest,
        categoryId:   catMap[categorySlug],
        isActive:     true,
        currency:     "usd",
        commissionFixed: 0,
      },
      create: {
        ...rest,
        categoryId:   catMap[categorySlug],
        isActive:     true,
        currency:     "usd",
        commissionFixed: 0,
      },
    });
    createdProducts.push({ id: product.id, slug: product.slug, commissionRate: product.commissionRate });
    console.log(`  ✓ ${product.name}  (${product.sampleStock} samples, ${(product.commissionRate * 100).toFixed(0)}% commission)`);
  }

  // ── Demo influencer ──
  console.log("\n▶ Upserting demo influencer…");
  const pw = await hash("test123!", 12);
  const influencer = await prisma.user.findUnique({ where: { email: "influencer@adstudio.com" } });
  let influencerId: string;

  if (influencer) {
    await prisma.user.updateMany({
      where: { email: "influencer@adstudio.com" },
      data:  { name: "Alex Rivera", role: UserRole.INFLUENCER, password: pw },
    });
    influencerId = influencer.id;
    console.log("  ✓ Updated influencer@adstudio.com");
  } else {
    const created = await prisma.user.create({
      data: { email: "influencer@adstudio.com", name: "Alex Rivera", role: UserRole.INFLUENCER, password: pw },
    });
    influencerId = created.id;
    console.log("  ✓ Created influencer@adstudio.com");
  }

  await prisma.influencerProfile.upsert({
    where:  { userId: influencerId },
    update: {},
    create: {
      userId:        influencerId,
      bio:           "Skincare & wellness creator based in LA. 42 k TikTok · 68 k YouTube · 25 k IG. I only recommend what I actually use.",
      instagram:     "@alexrivera.skin",
      youtube:       "Alex Rivera Reviews",
      tiktok:        "@alexrivera",
      followerCount: 135000,
      niche:         ["skincare", "wellness", "tech", "lifestyle"],
      country:       "US",
      city:          "Los Angeles",
      isApproved:    true,
      approvedAt:    new Date("2026-07-01"),
      shippingAddress: {
        name: "Alex Rivera", address1: "123 Creator Ave", address2: "Apt 4B",
        city: "Los Angeles", state: "CA", zip: "90001", country: "US",
      },
    },
  });

  // ── Workflow demo ──
  console.log("\n▶ Seeding workflow demo (applications, samples, tasks)…");
  await seedWorkflow(influencerId, createdProducts);

  console.log("\n══════════════════════════════════════════════");
  console.log("  Done! Summary");
  console.log("══════════════════════════════════════════════");
  console.log(`  Categories : ${CATEGORIES.length}`);
  console.log(`  Products   : ${PRODUCTS.length}  (10 samples each)`);
  console.log("  Influencer : influencer@adstudio.com  (pw: test123!)");
  console.log("  Workflow   :");
  console.log("    App 1 — Vitamin C Serum     → APPROVED · sample DELIVERED · task ACTIVE");
  console.log("    App 2 — Wireless Earbuds    → APPROVED · sample SHIPPED (in transit)");
  console.log("    App 3 — Cork Yoga Mat       → PENDING review");
  console.log("    App 4 — Collagen Sheet Mask → PENDING review");
  console.log("");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
