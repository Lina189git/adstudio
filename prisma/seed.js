"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    // Clear existing demo data
    await prisma.paintingOrder.deleteMany({
        where: {
            email: {
                contains: "demo@",
            },
        },
    });
    await prisma.orderItem.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    // Also clear any existing orders to avoid conflicts
    await prisma.paintingOrder.deleteMany();
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
            mode: "PRINT",
            canvasSize: "24x36",
            frameStyle: "gold",
            quantity: 1,
            amountCents: 15000,
            currency: "usd",
            status: "COMPLETED",
            paymentStatus: "PAID",
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
            mode: "PRINT",
            canvasSize: "16x20",
            frameStyle: "ornate",
            quantity: 1,
            amountCents: 12000,
            currency: "usd",
            status: "COMPLETED",
            paymentStatus: "PAID",
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
            mode: "DOWNLOAD",
            canvasSize: "32x32",
            frameStyle: "minimalist",
            quantity: 1,
            amountCents: 8000,
            currency: "usd",
            status: "COMPLETED",
            paymentStatus: "PAID",
            shareToGallery: true,
            galleryTitle: "Abstract Composition",
            galleryDisplayName: "Contemporary Artist",
            timelineEstimate: "1 week",
            notes: "Modern abstract oil painting with bold geometric shapes and vibrant colors.",
            isFeatured: true,
            sharedAt: new Date("2026-03-25"),
            paidAt: new Date("2026-03-25"),
            createdAt: new Date("2026-03-22"),
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
            mode: "PRINT",
            canvasSize: "20x24",
            frameStyle: "wood",
            quantity: 1,
            amountCents: 14000,
            currency: "usd",
            status: "COMPLETED",
            paymentStatus: "PAID",
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
            mode: "PRINT",
            canvasSize: "18x24",
            frameStyle: "silver",
            quantity: 1,
            amountCents: 11000,
            currency: "usd",
            status: "COMPLETED",
            paymentStatus: "PAID",
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
    console.log("✓ Seeding completed successfully!");
}
{
    reference: "DEMO-001",
        customerName;
    "Artist Studio",
        email;
    "demo@oilpainting.com",
        sourceImageUrl;
    "https://images.unsplash.com/photo-1579783902614-e3fb5141b0e9?w=1000",
        sourcePublicId;
    "demo-landscape-1",
        previewUrl;
    "https://images.unsplash.com/photo-1579783902614-e3fb5141b0e9?w=1000",
        stylePreset;
    "impressionist",
        mode;
    "PRINT",
        canvasSize;
    "24x36",
        frameStyle;
    "gold",
        quantity;
    1,
        amountCents;
    15000,
        currency;
    "usd",
        status;
    "COMPLETED",
        paymentStatus;
    "PAID",
        shareToGallery;
    true,
        galleryTitle;
    "Mountain Landscape",
        galleryDisplayName;
    "Studio Artist",
        timelineEstimate;
    "2 weeks",
        notes;
    "Beautiful impressionist oil painting of mountain landscape with vibrant colors.",
        isFeatured;
    true,
        sharedAt;
    new Date("2026-03-15"),
        paidAt;
    new Date("2026-03-15"),
        createdAt;
    new Date("2026-03-10"),
        updatedAt;
    new Date("2026-03-15"),
    ;
}
{
    reference: "DEMO-002",
        customerName;
    "Art Collector",
        email;
    "demo@artgallery.com",
        sourceImageUrl;
    "https://images.unsplash.com/photo-1561214115-6d2f1b0609fa?w=1000",
        sourcePublicId;
    "demo-portrait-1",
        previewUrl;
    "https://images.unsplash.com/photo-1561214115-6d2f1b0609fa?w=1000",
        stylePreset;
    "renaissance",
        mode;
    "PRINT",
        canvasSize;
    "16x20",
        frameStyle;
    "ornate",
        quantity;
    1,
        amountCents;
    12000,
        currency;
    "usd",
        status;
    "COMPLETED",
        paymentStatus;
    "PAID",
        shareToGallery;
    true,
        galleryTitle;
    "Classical Portrait",
        galleryDisplayName;
    "Renaissance Painter",
        timelineEstimate;
    "3 weeks",
        notes;
    "Classical oil portrait with Renaissance styling and rich color palette.",
        isFeatured;
    false,
        sharedAt;
    new Date("2026-03-20"),
        paidAt;
    new Date("2026-03-20"),
        createdAt;
    new Date("2026-03-15"),
        updatedAt;
    new Date("2026-03-20"),
    ;
}
{
    reference: "DEMO-003",
        customerName;
    "Modern Art Enthusiast",
        email;
    "demo@modernart.com",
        sourceImageUrl;
    "https://images.unsplash.com/photo-1561471696-d780ca3d64d6?w=1000",
        sourcePublicId;
    "demo-abstract-1",
        previewUrl;
    "https://images.unsplash.com/photo-1561471696-d780ca3d64d6?w=1000",
        stylePreset;
    "abstract",
        mode;
    "DOWNLOAD",
        canvasSize;
    "32x32",
        frameStyle;
    "minimalist",
        quantity;
    1,
        amountCents;
    8000,
        currency;
    "usd",
        status;
    "COMPLETED",
        paymentStatus;
    "PAID",
        shareToGallery;
    true,
        galleryTitle;
    "Abstract Composition",
        galleryDisplayName;
    "Contemporary Artist",
        timelineEstimate;
    "1 week",
        notes;
    "Modern abstract oil painting with bold geometric shapes and vibrant colors.",
        isFeatured;
    true,
        sharedAt;
    new Date("2026-03-25"),
        paidAt;
    new Date("2026-03-25"),
        createdAt;
    new Date("2026-03-22"),
        updatedAt;
    new Date("2026-03-25"),
    ;
}
{
    reference: "DEMO-004",
        customerName;
    "Nature Lover",
        email;
    "demo@nature.com",
        sourceImageUrl;
    "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=1000",
        sourcePublicId;
    "demo-seascape-1",
        previewUrl;
    "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=1000",
        stylePreset;
    "impressionist",
        mode;
    "PRINT",
        canvasSize;
    "20x24",
        frameStyle;
    "wood",
        quantity;
    1,
        amountCents;
    14000,
        currency;
    "usd",
        status;
    "COMPLETED",
        paymentStatus;
    "PAID",
        shareToGallery;
    true,
        galleryTitle;
    "Seascape at Sunset",
        galleryDisplayName;
    "Seascape Specialist",
        timelineEstimate;
    "2 weeks",
        notes;
    "Stunning seascape oil painting capturing the golden hour with waves and sky.",
        isFeatured;
    false,
        sharedAt;
    new Date("2026-03-28"),
        paidAt;
    new Date("2026-03-28"),
        createdAt;
    new Date("2026-03-25"),
        updatedAt;
    new Date("2026-03-28"),
    ;
}
{
    reference: "DEMO-005",
        customerName;
    "Floral Enthusiast",
        email;
    "demo@flowers.com",
        sourceImageUrl;
    "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=1000",
        sourcePublicId;
    "demo-floral-1",
        previewUrl;
    "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=1000",
        stylePreset;
    "romantic",
        mode;
    "PRINT",
        canvasSize;
    "18x24",
        frameStyle;
    "silver",
        quantity;
    1,
        amountCents;
    11000,
        currency;
    "usd",
        status;
    "COMPLETED",
        paymentStatus;
    "PAID",
        shareToGallery;
    true,
        galleryTitle;
    "Wild Flowers",
        galleryDisplayName;
    "Botanical Artist",
        timelineEstimate;
    "2 weeks",
        notes;
    "Beautiful oil painting of wild flowers with romantic soft brushstrokes.",
        isFeatured;
    false,
        sharedAt;
    new Date("2026-04-01"),
        paidAt;
    new Date("2026-04-01"),
        createdAt;
    new Date("2026-03-30"),
        updatedAt;
    new Date("2026-04-01"),
    ;
}
;
console.log(`Seeding database with ${demoPaintings.length} demo paintings...`);
for (const painting of demoPaintings) {
    const result = await prisma.paintingOrder.create({
        data: painting,
    });
    console.log(`✓ Created demo painting: ${result.galleryTitle} (${result.reference})`);
}
console.log("✓ Seeding completed successfully!");
main()
    .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
