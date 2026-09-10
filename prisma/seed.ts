import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  console.log("Creating admin user...");
  const adminPassword = await hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@oilpaint.com" },
    update: {
      name: "Oil Painting Admin",
      role: "ADMIN",
      password: adminPassword,
    },
    create: {
      name: "Oil Painting Admin",
      email: "admin@oilpaint.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("✓ Admin user created/updated: admin@oilpaint.com");

  // Clear existing demo data
  await prisma.paintingOrder.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // Create categories
  const categories = [
    {
      name: "Portraits",
      slug: "portraits",
      description: "Oil paintings of people, capturing personality and emotion",
      imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
      sortOrder: 1,
    },
    {
      name: "Landscapes",
      slug: "landscapes",
      description: "Scenic oil paintings of nature, mountains, and seascapes",
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
      sortOrder: 2,
    },
    {
      name: "Abstract",
      slug: "abstract",
      description: "Modern abstract oil paintings with bold colors and shapes",
      imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800",
      sortOrder: 3,
    },
    {
      name: "Floral & Botanical",
      slug: "floral-botanical",
      description: "Beautiful oil paintings of flowers, gardens, and botanical subjects",
      imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800",
      sortOrder: 4,
    },
  ];

  console.log("Creating categories...");
  const createdCategories = [];
  for (const category of categories) {
    const result = await prisma.category.create({ data: category });
    createdCategories.push(result);
    console.log(`✓ Created category: ${result.name}`);
  }

  // Create products
  const products = [
    {
      name: "Classic Portrait",
      slug: "classic-portrait",
      description: "A timeless oil portrait capturing the essence of the subject with masterful brushwork and rich colors.",
      shortDescription: "Timeless oil portrait with rich colors",
      basePriceCents: 8900, // $89 base price
      categoryId: createdCategories[0].id,
      imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
      isFeatured: true,
      stockQuantity: 10,
    },
    {
      name: "Mountain Landscape",
      slug: "mountain-landscape",
      description: "Majestic mountain landscape oil painting showcasing dramatic peaks, valleys, and natural beauty.",
      shortDescription: "Dramatic mountain landscape",
      basePriceCents: 12900, // $129 base price
      categoryId: createdCategories[1].id,
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
      isFeatured: true,
      stockQuantity: 8,
    },
    {
      name: "Abstract Composition",
      slug: "abstract-composition",
      description: "Modern abstract oil painting featuring bold geometric shapes and vibrant color combinations.",
      shortDescription: "Bold geometric abstract art",
      basePriceCents: 7900, // $79 base price
      categoryId: createdCategories[2].id,
      imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800",
      isFeatured: false,
      stockQuantity: 15,
    },
    {
      name: "Wildflower Garden",
      slug: "wildflower-garden",
      description: "Vibrant oil painting of wildflowers in a garden setting, capturing the beauty of nature's palette.",
      shortDescription: "Vibrant wildflower garden scene",
      basePriceCents: 9900, // $99 base price
      categoryId: createdCategories[3].id,
      imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800",
      isFeatured: false,
      stockQuantity: 12,
    },
  ];

  console.log("Creating products...");
  const createdProducts = [];
  for (const product of products) {
    const result = await prisma.product.create({ data: product });
    createdProducts.push(result);
    console.log(`✓ Created product: ${result.name}`);
  }

  // Create product variants (size and frame combinations)
  const canvasSizes = ["8x10", "12x16", "16x20", "18x24", "20x24", "24x30", "24x36"];
  const frameStyles = ["none", "black_wood", "walnut", "gold_gallery"];

  console.log("Creating product variants...");
  for (const product of createdProducts) {
    let variantIndex = 1;
    for (const size of canvasSizes) {
      for (const frame of frameStyles) {
        // Calculate additional price based on size and frame
        const sizeMultiplier = canvasSizes.indexOf(size) + 1;
        const frameMultiplier = frame === "none" ? 0 : frame === "gold_gallery" ? 3 : 2;
        const additionalPrice = (sizeMultiplier * 500) + (frameMultiplier * 1500); // $5-$35 extra per size, $15-$45 for frames

        const variant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: `${size} ${frame.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
            sku: `${product.slug}-${size}-${frame}-${variantIndex}`.toUpperCase(),
            canvasSize: size,
            frameStyle: frame,
            priceCents: additionalPrice,
            stockQuantity: Math.floor(Math.random() * 20) + 5, // 5-25 stock
          },
        });
        console.log(`✓ Created variant: ${variant.name} (${variant.sku})`);
        variantIndex++;
      }
    }
  }

  // Create demo paintings for the gallery (keeping existing demo data)
  const demoPaintings = [
    {
      reference: "DEMO-001",
      customerName: "Artist Studio",
      email: "demo@oilpainting.com",
      sourceImageUrl: "https://images.unsplash.com/photo-1579783902614-e3fb5141b0e9?w=1000",
      sourcePublicId: "demo-landscape-1",
      previewUrl: "https://images.unsplash.com/photo-1579783902614-e3fb5141b0e9?w=1000",
      stylePreset: "impressionist",
      mode: "PRINT" as const,
      canvasSize: "24x36",
      frameStyle: "gold",
      quantity: 1,
      amountCents: 15000,
      currency: "usd",
      status: "COMPLETED" as const,
      paymentStatus: "PAID" as const,
      shareToGallery: true,
      galleryTitle: "Mountain Landscape",
      galleryDisplayName: "Studio Artist",
      timelineEstimate: "2 weeks",
      notes: "Beautiful impressionist oil painting of mountain landscape with vibrant colors.",
      isFeatured: true,
      sharedAt: new Date("2026-03-15"),
      paidAt: new Date("2026-03-15"),
      createdAt: new Date("2026-03-10"),
      updatedAt: new Date("2026-03-15"),
    },
    {
      reference: "DEMO-002",
      customerName: "Art Collector",
      email: "demo@artgallery.com",
      sourceImageUrl: "https://images.unsplash.com/photo-1561214115-6d2f1b0609fa?w=1000",
      sourcePublicId: "demo-portrait-1",
      previewUrl: "https://images.unsplash.com/photo-1561214115-6d2f1b0609fa?w=1000",
      stylePreset: "renaissance",
      mode: "PRINT" as const,
      canvasSize: "16x20",
      frameStyle: "ornate",
      quantity: 1,
      amountCents: 12000,
      currency: "usd",
      status: "COMPLETED" as const,
      paymentStatus: "PAID" as const,
      shareToGallery: true,
      galleryTitle: "Classical Portrait",
      galleryDisplayName: "Renaissance Painter",
      timelineEstimate: "3 weeks",
      notes: "Classical oil portrait with Renaissance styling and rich color palette.",
      isFeatured: false,
      sharedAt: new Date("2026-03-20"),
      paidAt: new Date("2026-03-20"),
      createdAt: new Date("2026-03-15"),
      updatedAt: new Date("2026-03-20"),
    },
    {
      reference: "DEMO-003",
      customerName: "Modern Art Enthusiast",
      email: "demo@modernart.com",
      sourceImageUrl: "https://images.unsplash.com/photo-1561471696-d780ca3d64d6?w=1000",
      sourcePublicId: "demo-abstract-1",
      previewUrl: "https://images.unsplash.com/photo-1561471696-d780ca3d64d6?w=1000",
      stylePreset: "abstract",
      mode: "DOWNLOAD" as const,
      canvasSize: "32x32",
      frameStyle: "minimalist",
      quantity: 1,
      amountCents: 8000,
      currency: "usd",
      status: "COMPLETED" as const,
      paymentStatus: "PAID" as const,
      shareToGallery: true,
      galleryTitle: "Abstract Composition",
      galleryDisplayName: "Contemporary Artist",
      timelineEstimate: "1 week",
      notes: "Modern abstract oil painting with bold geometric shapes and vibrant colors.",
      isFeatured: true,
      sharedAt: new Date("2026-03-25"),
      paidAt: new Date("2026-03-25"),
      createdAt: new Date("2026-03-20"),
      updatedAt: new Date("2026-03-25"),
    },
    {
      reference: "DEMO-004",
      customerName: "Nature Lover",
      email: "demo@nature.com",
      sourceImageUrl: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=1000",
      sourcePublicId: "demo-seascape-1",
      previewUrl: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=1000",
      stylePreset: "impressionist",
      mode: "PRINT" as const,
      canvasSize: "20x24",
      frameStyle: "wood",
      quantity: 1,
      amountCents: 14000,
      currency: "usd",
      status: "COMPLETED" as const,
      paymentStatus: "PAID" as const,
      shareToGallery: true,
      galleryTitle: "Seascape at Sunset",
      galleryDisplayName: "Seascape Specialist",
      timelineEstimate: "2 weeks",
      notes: "Stunning seascape oil painting capturing the golden hour with waves and sky.",
      isFeatured: false,
      sharedAt: new Date("2026-03-28"),
      paidAt: new Date("2026-03-28"),
      createdAt: new Date("2026-03-25"),
      updatedAt: new Date("2026-03-28"),
    },
    {
      reference: "DEMO-005",
      customerName: "Floral Enthusiast",
      email: "demo@flowers.com",
      sourceImageUrl: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=1000",
      sourcePublicId: "demo-floral-1",
      previewUrl: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=1000",
      stylePreset: "romantic",
      mode: "PRINT" as const,
      canvasSize: "18x24",
      frameStyle: "silver",
      quantity: 1,
      amountCents: 11000,
      currency: "usd",
      status: "COMPLETED" as const,
      paymentStatus: "PAID" as const,
      shareToGallery: true,
      galleryTitle: "Wild Flowers",
      galleryDisplayName: "Botanical Artist",
      timelineEstimate: "2 weeks",
      notes: "Beautiful oil painting of wild flowers with romantic soft brushstrokes.",
      isFeatured: false,
      sharedAt: new Date("2026-04-01"),
      paidAt: new Date("2026-04-01"),
      createdAt: new Date("2026-03-30"),
      updatedAt: new Date("2026-04-01"),
    },
  ];

  console.log(`Seeding database with ${demoPaintings.length} demo paintings...`);

  for (const painting of demoPaintings) {
    const result = await prisma.paintingOrder.create({
      data: painting,
    });
    console.log(`✓ Created demo painting: ${result.galleryTitle} (${result.reference})`);
  }

  // ── Commission requests (mock data for admin assignment flow) ─────────────

  console.log("Seeding commission requests...");

  // Clear old commissions so seeding is idempotent
  await prisma.workUpdate.deleteMany();
  await prisma.commissionRequest.deleteMany({ where: { reference: { startsWith: "ART-DEMO-" } } });

  const commissionData = [
    {
      reference:    "ART-DEMO-001",
      customerName: "Sophie Williams",
      email:        "sophie.williams@example.com",
      phone:        "+1 (555) 234-5678",
      paintingType: "portrait",
      size:         "medium",
      surface:      "canvas",
      style:        "impressionist",
      quantity:     "1",
      deadline:     "2026-08-15",
      budget:       "$300–$500",
      deliveryCity: "New York, NY",
      notes:        "Family portrait of my parents on their 40th anniversary. Warm tones preferred.",
      referenceImageUrls: [],
      estimatedRange: "$270 – $365",
      timeline:     "10 – 14 business days",
      status:       "PENDING" as const,
    },
    {
      reference:    "ART-DEMO-002",
      customerName: "James Chen",
      email:        "james.chen@example.com",
      phone:        "+1 (555) 345-6789",
      paintingType: "landscape",
      size:         "large",
      surface:      "canvas",
      style:        "monet",
      quantity:     "1",
      deadline:     "2026-09-01",
      budget:       "$600–$900",
      deliveryCity: "San Francisco, CA",
      notes:        "Impressionist style landscape of Yosemite Valley. Capturing the golden hour light.",
      referenceImageUrls: [],
      estimatedRange: "$396 – $535",
      timeline:     "14 – 21 business days",
      status:       "QUOTED" as const,
    },
    {
      reference:    "ART-DEMO-003",
      customerName: "Maria Rossi",
      email:        "maria.rossi@example.com",
      phone:        "+1 (555) 456-7890",
      paintingType: "pet",
      size:         "small",
      surface:      "canvas",
      style:        "realism",
      quantity:     "1",
      deadline:     "2026-07-20",
      budget:       "$150–$250",
      deliveryCity: "Chicago, IL",
      notes:        "Portrait of my golden retriever Max. He loves to play outdoors.",
      referenceImageUrls: [],
      estimatedRange: "$160 – $216",
      timeline:     "7 – 10 business days",
      status:       "APPROVED" as const,
    },
    {
      reference:    "ART-DEMO-004",
      customerName: "David Park",
      email:        "david.park@example.com",
      phone:        "+1 (555) 567-8901",
      paintingType: "interior",
      size:         "large",
      surface:      "linen",
      style:        "contemporary",
      quantity:     "2",
      deadline:     "2026-08-30",
      budget:       "$800–$1200",
      deliveryCity: "Seattle, WA",
      notes:        "Two matching paintings for living room. Abstract interpretation of the Pacific Northwest forest.",
      referenceImageUrls: [],
      estimatedRange: "$1080 – $1458",
      timeline:     "14 – 21 business days",
      status:       "APPROVED" as const,
    },
    {
      reference:    "ART-DEMO-005",
      customerName: "Emma Thompson",
      email:        "emma.thompson@example.com",
      phone:        "+1 (555) 678-9012",
      paintingType: "custom",
      size:         "medium",
      surface:      "canvas",
      style:        "watercolor",
      quantity:     "1",
      deadline:     "2026-07-01",
      budget:       "$200–$400",
      deliveryCity: "Austin, TX",
      notes:        "Wedding gift for my sister — she loves gardens and florals. Soft pastel palette.",
      referenceImageUrls: [],
      estimatedRange: "$351 – $474",
      timeline:     "10 – 14 business days",
      status:       "PENDING" as const,
    },
    {
      reference:    "ART-DEMO-006",
      customerName: "Robert Kim",
      email:        "robert.kim@example.com",
      phone:        "+1 (555) 789-0123",
      paintingType: "portrait",
      size:         "large",
      surface:      "canvas",
      style:        "classical",
      quantity:     "1",
      deadline:     "2026-09-15",
      budget:       "$700–$1000",
      deliveryCity: "Boston, MA",
      notes:        "Executive portrait for office lobby. Professional attire, neutral background.",
      referenceImageUrls: [],
      estimatedRange: "$396 – $535",
      timeline:     "14 – 21 business days",
      status:       "QUOTED" as const,
    },
  ];

  for (const c of commissionData) {
    await prisma.commissionRequest.upsert({
      where:  { reference: c.reference },
      update: c,
      create: c,
    });
    console.log(`✓ Commission: ${c.reference} — ${c.customerName} (${c.status})`);
  }

  console.log("✓ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
