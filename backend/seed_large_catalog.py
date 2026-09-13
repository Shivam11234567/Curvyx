import sys
import os
from decimal import Decimal
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.core.security import get_password_hash
from app.models.admin_user import AdminUser
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.product_variant import ProductVariant
from app.models.coupon import Coupon
from app.models.cart_item import CartItem
from app.models.wishlist_item import WishlistItem
from app.models.order_item import OrderItem

def clean_and_seed_catalog():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("Cleaning previous catalog data...")
        # Clean dependent items first to prevent FK constraint violations
        db.query(CartItem).delete()
        db.query(WishlistItem).delete()
        db.query(OrderItem).delete()
        db.query(ProductImage).delete()
        db.query(ProductVariant).delete()
        db.query(Product).delete()
        db.query(Category).delete()
        db.commit()
        print("Previous catalog data successfully cleared!")

        # 1. Admin & Test User Setup
        admin = db.query(AdminUser).filter(AdminUser.email == "admin@curvyx.com").first()
        if not admin:
            admin = AdminUser(
                name="Store Manager",
                email="admin@curvyx.com",
                password_hash=get_password_hash("Admin@123456"),
                role="admin",
                is_active=True
            )
            db.add(admin)

        user = db.query(User).filter(User.email == "customer@example.com").first()
        if not user:
            user = User(
                name="Priya Sharma",
                email="customer@example.com",
                phone="+919876543210",
                password_hash=get_password_hash("Customer@123456"),
                is_active=True
            )
            db.add(user)

        # 2. Coupons
        coupons_data = [
            {"code": "WELCOME10", "discount_type": "PERCENTAGE", "discount_value": Decimal("10.00"), "minimum_order_value": Decimal("999.00"), "maximum_discount": Decimal("300.00")},
            {"code": "CURVYX20", "discount_type": "PERCENTAGE", "discount_value": Decimal("20.00"), "minimum_order_value": Decimal("1999.00"), "maximum_discount": Decimal("800.00")},
            {"code": "LUXE15", "discount_type": "PERCENTAGE", "discount_value": Decimal("15.00"), "minimum_order_value": Decimal("1499.00"), "maximum_discount": Decimal("500.00")},
            {"code": "SEXY25", "discount_type": "PERCENTAGE", "discount_value": Decimal("25.00"), "minimum_order_value": Decimal("2499.00"), "maximum_discount": Decimal("1000.00")},
            {"code": "FLAT500", "discount_type": "FIXED", "discount_value": Decimal("500.00"), "minimum_order_value": Decimal("2999.00"), "maximum_discount": Decimal("500.00")},
        ]
        for cdata in coupons_data:
            existing_c = db.query(Coupon).filter(Coupon.code == cdata["code"]).first()
            if not existing_c:
                coupon = Coupon(
                    code=cdata["code"],
                    discount_type=cdata["discount_type"],
                    discount_value=cdata["discount_value"],
                    minimum_order_value=cdata["minimum_order_value"],
                    maximum_discount=cdata.get("maximum_discount"),
                    start_at=datetime.now(timezone.utc),
                    expires_at=datetime.now(timezone.utc) + timedelta(days=365),
                    is_active=True
                )
                db.add(coupon)
        db.commit()

        # 3. Categories & Subcategories
        categories_data = [
            {
                "name": "Bras & Bralettes",
                "slug": "bras",
                "description": "Sensual push-ups, French eyelash lace bralettes, seductive balconettes, and plunge underwires designed for breathtaking lift and support.",
                "image_url": "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80",
                "children": [
                    {"name": "Push-Up & Padded Bras", "slug": "push-up-bras", "description": "Graduated cleavage lift, sculpted plunge necklines, and dramatic shaping."},
                    {"name": "Lace Bralettes & Triangles", "slug": "lace-bralettes", "description": "Delicate unlined floral lace, sheer mesh, and romantic wire-free silhouettes."},
                    {"name": "Balconette & Demi Bras", "slug": "balconette-bras", "description": "Open neckline balconette cuts with supportive underwire lift and lace trims."},
                    {"name": "Strapless & Multiway Bras", "slug": "strapless-multiway", "description": "Silicone stay-put non-slip bands with convertible back straps."},
                    {"name": "Deep Plunge Bras", "slug": "plunge-bras", "description": "Low-cut deep V cleavage enhancers perfect for revealing necklines."},
                    {"name": "Everyday T-Shirt Bras", "slug": "everyday-bras", "description": "Ultra-smooth seamless microfiber cups that vanish under clothes."}
                ]
            },
            {
                "name": "Panties & Thongs",
                "slug": "panties",
                "description": "Seductive lace thongs, strappy cutouts, sheer bikini briefs, cheeky lace cuts, and laser-cut zero-line undergarments.",
                "image_url": "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&auto=format&fit=crop&q=80",
                "children": [
                    {"name": "Thongs & G-Strings", "slug": "thongs-g-strings", "description": "Minimal coverage with ultra-soft stretch lace and strappy cutout accents."},
                    {"name": "Sheer Lace Bikinis", "slug": "lace-bikinis", "description": "Low-rise cut with delicate scalloped lace edges and cotton gusset."},
                    {"name": "Cheeky Lace Briefs", "slug": "cheeky-briefs", "description": "Flattering mid-rear cut with scalloped lace trims that hug your hips."},
                    {"name": "High-Waist Sheer Briefs", "slug": "high-waist-panties", "description": "Vintage-inspired high-waist styling with semi-sheer floral lace."},
                    {"name": "Seamless Laser-Cut", "slug": "seamless-panties", "description": "Zero panty line second-skin microfiber that stays 100% invisible."}
                ]
            },
            {
                "name": "Lingerie Sets & Babydolls",
                "slug": "lingerie-sets",
                "description": "Exquisite 2-piece and 3-piece matching lace sets, sheer eyelash babydolls, sultry open-back teddies, and satin chemises.",
                "image_url": "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=800&auto=format&fit=crop&q=80",
                "children": [
                    {"name": "Matching 2-Piece Sets", "slug": "matching-lace-sets", "description": "Coordinated lace bralettes with matching cheeky panties and thongs."},
                    {"name": "Sheer Lace Babydolls", "slug": "sheer-babydolls", "description": "Flyaway sheer mesh babydolls with scalloped eyelash lace cups."},
                    {"name": "Lace Bodysuits & Teddies", "slug": "bodysuits-teddies", "description": "Form-fitting floral lace teddies with plunge necklines and snap closures."},
                    {"name": "Mulberry Satin Slips", "slug": "satin-slips", "description": "High-sheen liquid satin bias-cut slips with delicate lace trims."}
                ]
            },
            {
                "name": "Nightwear & Loungewear",
                "slug": "nightwear-loungewear",
                "description": "Luxurious liquid satin kimono robes, silky cami and ruffle shorts sets, and sultry maxi nightgowns.",
                "image_url": "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=80",
                "children": [
                    {"name": "Silk & Satin Robes", "slug": "silk-robes", "description": "Flowy kimono robes with wide bell sleeves and satin tie sashes."},
                    {"name": "Cami & Shorts Sets", "slug": "cami-shorts-sets", "description": "Sensual V-neck satin camisoles paired with ruffle hem sleep shorts."},
                    {"name": "Lace Trim Nightdresses", "slug": "lace-nightdresses", "description": "Floor-skimming modal and satin nightgowns with sheer lace side inserts."}
                ]
            },
            {
                "name": "Corsets & Shapewear",
                "slug": "corsets-shapewear",
                "description": "Structure boned lace bustiers, hourglass waist cinchers, and open-bust curve sculpting bodysuits.",
                "image_url": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
                "is_active": False,
                "children": [
                    {"name": "Lace Bustiers & Corsets", "slug": "bustier-corsets", "description": "Flexible boned waist definition with sweetheart neckline and underwire cups."},
                    {"name": "Curve Shaper Bodysuits", "slug": "body-sculptors", "description": "All-in-one open-bust firm compression bodysuits for instant hourglass shape."},
                    {"name": "Hourglass Waist Cinchers", "slug": "waist-cinchers", "description": "High-waist double-panel compression with flexible spiral steel bones."}
                ]
            }
        ]

        cat_map = {}
        for cdata in categories_data:
            cat = Category(
                name=cdata["name"],
                slug=cdata["slug"],
                description=cdata["description"],
                image_url=cdata["image_url"],
                is_active=cdata.get("is_active", True)
            )
            db.add(cat)
            db.flush()
            cat_map[cdata["slug"]] = cat

            for sub in cdata.get("children", []):
                subcat = Category(
                    name=sub["name"],
                    slug=sub["slug"],
                    description=sub["description"],
                    parent_id=cat.id,
                    image_url=cat.image_url,
                    is_active=sub.get("is_active", cdata.get("is_active", True))
                )
                db.add(subcat)
                db.flush()
                cat_map[sub["slug"]] = subcat

        # 4. Curated Luxury & Seductive Catalog
        catalog = [
            # ==================== BRAS & BRALETTES ====================
            {
                "name": "Luxe Noir Eyelash Lace Plunge Push-Up Bra",
                "slug": "luxe-noir-eyelash-lace-plunge-push-up-bra",
                "category_slug": "push-up-bras",
                "description": "Exquisite French eyelash lace crafted over contoured plunge cups with graduated push-up padding. Designed to provide sensational lift and a deeply sculpted, seductive neckline with ultra-soft underwires.",
                "product_details": "• Level 2 graduated push-up pads for +1 cup boost\n• Deep plunge neckline for low-cut tops\n• Scalloped eyelash lace overlay with gold sliders\n• Cushioned 3-row hook & eye closure",
                "material": "88% Polyamide Lace, 12% Elastane; Inner Cup: 100% Breathable Polyurethane Foam",
                "care_instructions": "Hand wash cold with gentle lingerie wash. Reshape cups gently before flat drying in shade.",
                "mrp": Decimal("1899.00"),
                "selling_price": Decimal("1299.00"),
                "is_featured": True,
                "images": [
                    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1596489370002-3cbe9d9cce54?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "LN-BLK-32B", "size": "32B", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1299.00"), "stock": 45},
                    {"sku": "LN-BLK-34B", "size": "34B", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1299.00"), "stock": 60},
                    {"sku": "LN-BLK-36C", "size": "36C", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1299.00"), "stock": 35},
                    {"sku": "LN-RED-34B", "size": "34B", "color": "Crimson Passion", "color_code": "#be123c", "price": Decimal("1299.00"), "stock": 50},
                    {"sku": "LN-BUR-34B", "size": "34B", "color": "Mulberry Wine", "color_code": "#881337", "price": Decimal("1299.00"), "stock": 40},
                    {"sku": "LN-NUD-34B", "size": "34B", "color": "Warm Nude", "color_code": "#d4b996", "price": Decimal("1299.00"), "stock": 55}
                ]
            },
            {
                "name": "Seductive Scarlet Underwire Balconette Lace Bra",
                "slug": "seductive-scarlet-underwire-balconette-lace-bra",
                "category_slug": "balconette-bras",
                "description": "Seductive open balconette silhouette with delicate semi-sheer floral lace and structured underwire support. Accented with satin ribbon piping and delicate scalloped borders for a breathtaking, alluring curve.",
                "product_details": "• Open-bust balconette cut creates natural upper-breast fullness\n• Flexible comfort-coated underwire support\n• Dual spaghetti shoulder straps with rose gold ring details\n• Sheer lace mesh wings for breathability",
                "material": "90% Nylon Lace, 10% Spandex",
                "care_instructions": "Hand wash in cool water. Lay flat to dry.",
                "mrp": Decimal("1999.00"),
                "selling_price": Decimal("1399.00"),
                "is_featured": True,
                "images": [
                    "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "SB-RED-32B", "size": "32B", "color": "Scarlet Red", "color_code": "#dc2626", "price": Decimal("1399.00"), "stock": 35},
                    {"sku": "SB-RED-34B", "size": "34B", "color": "Scarlet Red", "color_code": "#dc2626", "price": Decimal("1399.00"), "stock": 50},
                    {"sku": "SB-RED-36C", "size": "36C", "color": "Scarlet Red", "color_code": "#dc2626", "price": Decimal("1399.00"), "stock": 40},
                    {"sku": "SB-BLK-34B", "size": "34B", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1399.00"), "stock": 45},
                    {"sku": "SB-EMR-34B", "size": "34B", "color": "Emerald Luxe", "color_code": "#064e3b", "price": Decimal("1399.00"), "stock": 30}
                ]
            },
            {
                "name": "Gilded Champagne Sheer Triangle Lace Bralette",
                "slug": "gilded-champagne-sheer-triangle-lace-bralette",
                "category_slug": "lace-bralettes",
                "description": "Featherlight sheer mesh and shimmering floral lace triangles with a delicate scalloped edge and gold-tone sliders. Offers a barely-there feeling with effortless romantic elegance and zero poke.",
                "product_details": "• Unlined wireless triangle cups\n• Soft elastic underband for light comfort and lift\n• Adjustable halter neck and back strap\n• Great for layering under sheer tops and blazers",
                "material": "92% Polyamide, 8% Elastane",
                "care_instructions": "Hand wash cold. Dry flat in shade.",
                "mrp": Decimal("1499.00"),
                "selling_price": Decimal("999.00"),
                "is_featured": True,
                "images": [
                    "https://images.unsplash.com/photo-1596489370002-3cbe9d9cce54?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "TB-CHP-S", "size": "S", "color": "Champagne Gold", "color_code": "#e5d0ba", "price": Decimal("999.00"), "stock": 40},
                    {"sku": "TB-CHP-M", "size": "M", "color": "Champagne Gold", "color_code": "#e5d0ba", "price": Decimal("999.00"), "stock": 55},
                    {"sku": "TB-CHP-L", "size": "L", "color": "Champagne Gold", "color_code": "#e5d0ba", "price": Decimal("999.00"), "stock": 35},
                    {"sku": "TB-BLK-M", "size": "M", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("999.00"), "stock": 50},
                    {"sku": "TB-ROS-M", "size": "M", "color": "Blush Rose", "color_code": "#f43f5e", "price": Decimal("999.00"), "stock": 35}
                ]
            },
            {
                "name": "Midnight Velvet Strappy Back Demi Bra",
                "slug": "midnight-velvet-strappy-back-demi-bra",
                "category_slug": "push-up-bras",
                "description": "Lustrous plush velvet ribbon detailing paired with sultry cage-back strap accents and lightly padded demi cups for a striking, show-stopping silhouette under low-back dresses.",
                "product_details": "• Demi cup coverage with subtle cleavage enhancement\n• Geometric cage strappy back design\n• Plush velvet texture trimmed with sheer mesh\n• Underwired support with soft brushed inner casing",
                "material": "85% Polyester Velvet, 15% Spandex",
                "care_instructions": "Hand wash with gentle detergent. Do not tumble dry.",
                "mrp": Decimal("2199.00"),
                "selling_price": Decimal("1549.00"),
                "is_featured": True,
                "images": [
                    "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "VB-BLK-32B", "size": "32B", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1549.00"), "stock": 30},
                    {"sku": "VB-BLK-34B", "size": "34B", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1549.00"), "stock": 45},
                    {"sku": "VB-BLK-36C", "size": "36C", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1549.00"), "stock": 35},
                    {"sku": "VB-BUR-34B", "size": "34B", "color": "Mulberry Wine", "color_code": "#881337", "price": Decimal("1549.00"), "stock": 35}
                ]
            },
            {
                "name": "Silicone Non-Slip Strapless Multiway Push-Up Bra",
                "slug": "silicone-non-slip-strapless-multiway-push-up-bra",
                "category_slug": "strapless-multiway",
                "description": "Never slips down. Heavy-duty dual silicone grip lining along wings and underband provides rock-solid support without straps. Seamless microfiber cups give a smooth, rounded cleavage.",
                "product_details": "• Dual-layer silicone stay-put grip along top & bottom bands\n• Detachable clear and fabric straps\n• Lightly padded molded cups with underwire support\n• Side boning for upright structure",
                "material": "82% Polyamide, 18% Elastane",
                "care_instructions": "Hand wash cold. Avoid applying body oils or lotions near silicone grips.",
                "mrp": Decimal("1799.00"),
                "selling_price": Decimal("1249.00"),
                "is_featured": False,
                "images": [
                    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "ST-NUD-32B", "size": "32B", "color": "Warm Nude", "color_code": "#d4b996", "price": Decimal("1249.00"), "stock": 40},
                    {"sku": "ST-NUD-34B", "size": "34B", "color": "Warm Nude", "color_code": "#d4b996", "price": Decimal("1249.00"), "stock": 50},
                    {"sku": "ST-BLK-34B", "size": "34B", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1249.00"), "stock": 45},
                    {"sku": "ST-WHT-36B", "size": "36B", "color": "Pure White", "color_code": "#ffffff", "price": Decimal("1249.00"), "stock": 25}
                ]
            },
            {
                "name": "Barely-There Sheer Mesh Deep V Wireless Bra",
                "slug": "barely-there-sheer-mesh-deep-v-wireless-bra",
                "category_slug": "plunge-bras",
                "description": "Double-layered transparent Italian stretch mesh with an ultra-deep plunge V cut. Zero underwires, zero constrictions, pure seductive minimalism that hugs your natural contours.",
                "product_details": "• Deep V plunge front cut\n• Double-layer translucent power mesh\n• Brushed micro-elastic band for gentle support\n• Minimalist back clasp",
                "material": "80% Nylon Mesh, 20% Spandex",
                "care_instructions": "Hand wash cold in laundry bag. Dry flat.",
                "mrp": Decimal("1399.00"),
                "selling_price": Decimal("899.00"),
                "is_featured": False,
                "images": [
                    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "BM-BLK-S", "size": "S", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("899.00"), "stock": 35},
                    {"sku": "BM-BLK-M", "size": "M", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("899.00"), "stock": 50},
                    {"sku": "BM-RED-M", "size": "M", "color": "Scarlet Red", "color_code": "#dc2626", "price": Decimal("899.00"), "stock": 30}
                ]
            },
            {
                "name": "CloudSoft Seamless Second-Skin T-Shirt Bra",
                "slug": "cloudsoft-seamless-second-skin-t-shirt-bra",
                "category_slug": "everyday-bras",
                "description": "Ultra-smooth memory foam contour cups that adapt to your body heat, creating an invisible, no-show silhouette beneath fitted tops and tight tees.",
                "product_details": "• Ultra-thin breathable memory foam cups\n• Laser-cut smoothing side wings\n• Rose gold sliders\n• Invisible zero-show edges",
                "material": "84% Microfiber Polyamide, 16% Spandex",
                "care_instructions": "Hand wash cold. Reshape cups gently before flat drying.",
                "mrp": Decimal("1399.00"),
                "selling_price": Decimal("949.00"),
                "is_featured": False,
                "images": [
                    "https://images.unsplash.com/photo-1596489370002-3cbe9d9cce54?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "CS-NUD-32B", "size": "32B", "color": "Warm Nude", "color_code": "#d4b996", "price": Decimal("949.00"), "stock": 40},
                    {"sku": "CS-NUD-34B", "size": "34B", "color": "Warm Nude", "color_code": "#d4b996", "price": Decimal("949.00"), "stock": 60},
                    {"sku": "CS-BLK-34B", "size": "34B", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("949.00"), "stock": 50}
                ]
            },

            # ==================== PANTIES & THONGS ====================
            {
                "name": "Seductive Sheer Lace Brazilian Thong (Pack of 2)",
                "slug": "seductive-sheer-lace-brazilian-thong-pack-of-2",
                "category_slug": "thongs-g-strings",
                "description": "Ultra-fine scalloped floral lace with satin ribbon waist details and a breathable 100% pure organic cotton gusset. Minimal back coverage with maximum seductive allure.",
                "product_details": "• Pack of 2 luxurious colors\n• Scalloped floral lace edges prevent pinching\n• Low-rise cut sits perfectly on hips\n• 100% organic cotton double gusset",
                "material": "90% Polyamide, 10% Elastane; Gusset: 100% Organic Cotton",
                "care_instructions": "Hand wash cold. Lay flat to dry.",
                "mrp": Decimal("999.00"),
                "selling_price": Decimal("699.00"),
                "is_featured": True,
                "images": [
                    "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "BT-BLK-S", "size": "S", "color": "Midnight Noir & Crimson", "color_code": "#111827", "price": Decimal("699.00"), "stock": 50},
                    {"sku": "BT-BLK-M", "size": "M", "color": "Midnight Noir & Crimson", "color_code": "#111827", "price": Decimal("699.00"), "stock": 70},
                    {"sku": "BT-BLK-L", "size": "L", "color": "Midnight Noir & Crimson", "color_code": "#111827", "price": Decimal("699.00"), "stock": 45},
                    {"sku": "BT-NUD-M", "size": "M", "color": "Warm Nude & Rose", "color_code": "#d4b996", "price": Decimal("699.00"), "stock": 55}
                ]
            },
            {
                "name": "Luxe Crimson Satin & Eyelash Lace Bikini Briefs",
                "slug": "luxe-crimson-satin-and-eyelash-lace-bikini-briefs",
                "category_slug": "lace-bikinis",
                "description": "High-shine liquid stretch satin front panel framed by delicate French eyelash lace sides and rear. Low-rise fit with elastic-free comfort leg openings for no dig.",
                "product_details": "• Liquid satin front with eyelash lace trims\n• Low-rise cut with medium rear coverage\n• Anti-dig stretch leg bands\n• 100% pure cotton crotch lining",
                "material": "94% Polyester Satin, 6% Spandex; Lace: 90% Nylon, 10% Spandex",
                "care_instructions": "Hand wash cold gentle cycle. Do not bleach.",
                "mrp": Decimal("849.00"),
                "selling_price": Decimal("549.00"),
                "is_featured": True,
                "images": [
                    "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "SB-RED-S", "size": "S", "color": "Crimson Passion", "color_code": "#be123c", "price": Decimal("549.00"), "stock": 40},
                    {"sku": "SB-RED-M", "size": "M", "color": "Crimson Passion", "color_code": "#be123c", "price": Decimal("549.00"), "stock": 60},
                    {"sku": "SB-RED-L", "size": "L", "color": "Crimson Passion", "color_code": "#be123c", "price": Decimal("549.00"), "stock": 45},
                    {"sku": "SB-BLK-M", "size": "M", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("549.00"), "stock": 50}
                ]
            },
            {
                "name": "High-Waist Sheer Floral Lace Cheeky Panty",
                "slug": "high-waist-sheer-floral-lace-cheeky-panty",
                "category_slug": "high-waist-panties",
                "description": "Vintage-inspired high-waisted cut with semi-sheer patterned floral lace, scalloped waist trimming, and cheeky rear coverage that flatters and contours your hips.",
                "product_details": "• High-rise silhouette hugs and flatters hips\n• Scalloped lace waistband prevents rolling\n• Cheeky back cut accentuates natural curves\n• Breathable cotton gusset",
                "material": "88% Polyamide Lace, 12% Spandex",
                "care_instructions": "Machine wash cold in delicates bag. Line dry.",
                "mrp": Decimal("899.00"),
                "selling_price": Decimal("599.00"),
                "is_featured": True,
                "images": [
                    "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "HW-BLK-S", "size": "S", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("599.00"), "stock": 35},
                    {"sku": "HW-BLK-M", "size": "M", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("599.00"), "stock": 55},
                    {"sku": "HW-BLK-L", "size": "L", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("599.00"), "stock": 40},
                    {"sku": "HW-BUR-M", "size": "M", "color": "Mulberry Wine", "color_code": "#881337", "price": Decimal("599.00"), "stock": 35}
                ]
            },
            {
                "name": "Strappy Cutout Cage G-String (Pack of 3)",
                "slug": "strappy-cutout-cage-g-string-pack-of-3",
                "category_slug": "thongs-g-strings",
                "description": "Sultry multi-strap cutout design with rose gold ring hardware and embroidered floral accents. Pack of 3 alluring shades: Midnight Noir, Crimson Red, and Royal Emerald.",
                "product_details": "• Pack of 3 seductive colors\n• Multi-strap cage waistband detail\n• Gold-tone hardware accents\n• Ultra-soft elastic that doesn't dig into skin",
                "material": "85% Polyamide, 15% Spandex",
                "care_instructions": "Hand wash cold. Dry in shade.",
                "mrp": Decimal("1199.00"),
                "selling_price": Decimal("799.00"),
                "is_featured": True,
                "images": [
                    "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "CG-AST-S", "size": "S", "color": "Trio Noir, Crimson & Emerald", "color_code": "#111827", "price": Decimal("799.00"), "stock": 45},
                    {"sku": "CG-AST-M", "size": "M", "color": "Trio Noir, Crimson & Emerald", "color_code": "#111827", "price": Decimal("799.00"), "stock": 65},
                    {"sku": "CG-AST-L", "size": "L", "color": "Trio Noir, Crimson & Emerald", "color_code": "#111827", "price": Decimal("799.00"), "stock": 40}
                ]
            },
            {
                "name": "Second-Skin Laser Cut Zero-Line Cheeky (Pack of 3)",
                "slug": "second-skin-laser-cut-zero-line-cheeky-pack-of-3",
                "category_slug": "seamless-panties",
                "description": "100% invisible under bodycon dresses and tight leggings. Thermally bonded edges with cheeky back cut in buttery soft modal microfiber.",
                "product_details": "• Pack of 3 essential shades\n• Bonded laser-cut edges with zero stitching\n• Second-skin micro-modal stretch\n• Pure cotton glued gusset",
                "material": "80% Polyamide, 20% Elastane",
                "care_instructions": "Machine wash cold gentle. Do not iron.",
                "mrp": Decimal("999.00"),
                "selling_price": Decimal("699.00"),
                "is_featured": False,
                "images": [
                    "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "LC-NEU-S", "size": "S", "color": "Nude, Noir & Blush", "color_code": "#d4b996", "price": Decimal("699.00"), "stock": 50},
                    {"sku": "LC-NEU-M", "size": "M", "color": "Nude, Noir & Blush", "color_code": "#d4b996", "price": Decimal("699.00"), "stock": 70},
                    {"sku": "LC-NEU-L", "size": "L", "color": "Nude, Noir & Blush", "color_code": "#d4b996", "price": Decimal("699.00"), "stock": 50}
                ]
            },

            # ==================== LINGERIE SETS & BABYDOLLS ====================
            {
                "name": "Midnight Allure 2-Piece Floral Lace Lingerie Set",
                "slug": "midnight-allure-2-piece-floral-lace-lingerie-set",
                "category_slug": "matching-lace-sets",
                "description": "Matching wire-free scalloped lace bralette with adjustable crisscross back straps and matching sheer cheeky lace panty. Seductive comfort in premium stretch lace.",
                "product_details": "• Complete 2-piece coordinated set\n• Scalloped lace plunge triangle bralette\n• Matching low-rise cheeky lace panty\n• Gold-tone hardware adjustments",
                "material": "92% Polyamide Lace, 8% Elastane",
                "care_instructions": "Hand wash cold. Lay flat to dry.",
                "mrp": Decimal("2499.00"),
                "selling_price": Decimal("1699.00"),
                "is_featured": True,
                "images": [
                    "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "MA-BLK-S", "size": "S", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1699.00"), "stock": 35},
                    {"sku": "MA-BLK-M", "size": "M", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1699.00"), "stock": 50},
                    {"sku": "MA-BLK-L", "size": "L", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1699.00"), "stock": 35},
                    {"sku": "MA-RED-M", "size": "M", "color": "Crimson Passion", "color_code": "#be123c", "price": Decimal("1699.00"), "stock": 40},
                    {"sku": "MA-EMR-M", "size": "M", "color": "Emerald Luxe", "color_code": "#064e3b", "price": Decimal("1699.00"), "stock": 30}
                ]
            },
            {
                "name": "Enchanting Eyelash Lace Sheer Babydoll with Thong",
                "slug": "enchanting-eyelash-lace-sheer-babydoll-with-thong",
                "category_slug": "sheer-babydolls",
                "description": "Flowy, fly-away front babydoll crafted from ethereal sheer mesh with intricate eyelash lace cups, empire waist satin ribbon tie, and matching G-string thong.",
                "product_details": "• Sheer fly-away drape front\n• Unlined eyelash lace triangle cups\n• Adjustable crossover back straps\n• Includes matching sheer lace G-string",
                "material": "95% Polyester Mesh, 5% Spandex",
                "care_instructions": "Hand wash cold with mild detergent. Hang to dry in shade.",
                "mrp": Decimal("2299.00"),
                "selling_price": Decimal("1599.00"),
                "is_featured": True,
                "images": [
                    "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "EB-RED-S", "size": "S", "color": "Crimson Passion", "color_code": "#be123c", "price": Decimal("1599.00"), "stock": 30},
                    {"sku": "EB-RED-M", "size": "M", "color": "Crimson Passion", "color_code": "#be123c", "price": Decimal("1599.00"), "stock": 45},
                    {"sku": "EB-RED-L", "size": "L", "color": "Crimson Passion", "color_code": "#be123c", "price": Decimal("1599.00"), "stock": 30},
                    {"sku": "EB-BLK-M", "size": "M", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1599.00"), "stock": 40},
                    {"sku": "EB-WHT-M", "size": "M", "color": "Bridal White", "color_code": "#ffffff", "price": Decimal("1599.00"), "stock": 25}
                ]
            },
            {
                "name": "Seductive Backless Lace Teddy Bodysuit",
                "slug": "seductive-backless-lace-teddy-bodysuit",
                "category_slug": "bodysuits-teddies",
                "description": "All-over floral lace teddy with plunge V-neckline, dramatic open crisscross back, and high-cut leg openings. Features snap-crotch closure for convenience.",
                "product_details": "• Deep plunge neck with scalloped lace trim\n• Low back with adjustable crisscross ties\n• High-cut leg openings elongate the legs\n• Convenient 3-snap crotch closure",
                "material": "90% Nylon Lace, 10% Spandex",
                "care_instructions": "Hand wash cold. Lay flat to dry.",
                "mrp": Decimal("2699.00"),
                "selling_price": Decimal("1899.00"),
                "is_featured": True,
                "images": [
                    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "ST-BLK-S", "size": "S", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1899.00"), "stock": 35},
                    {"sku": "ST-BLK-M", "size": "M", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1899.00"), "stock": 50},
                    {"sku": "ST-BLK-L", "size": "L", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1899.00"), "stock": 35},
                    {"sku": "ST-BUR-M", "size": "M", "color": "Mulberry Wine", "color_code": "#881337", "price": Decimal("1899.00"), "stock": 30}
                ]
            },
            {
                "name": "Luxe Mulberry Silk Bias-Cut Satin Slip Chemise",
                "slug": "luxe-mulberry-silk-bias-cut-satin-slip-chemise",
                "category_slug": "satin-slips",
                "description": "High-sheen liquid satin slip cut on the bias to drape gracefully over natural curves. Accented with French eyelash lace trimming and low open back.",
                "product_details": "• Bias cut silhouette hugs natural curves smoothly\n• Scalloped lace trim at neckline and hem\n• Adjustable crossover straps\n• Mid-thigh length with seductive side slit",
                "material": "97% High-Sheen Polyester Satin, 3% Elastane",
                "care_instructions": "Hand wash cold or dry clean. Iron on reverse low steam.",
                "mrp": Decimal("2899.00"),
                "selling_price": Decimal("1999.00"),
                "is_featured": True,
                "images": [
                    "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "SC-EMR-S", "size": "S", "color": "Emerald Luxe", "color_code": "#064e3b", "price": Decimal("1999.00"), "stock": 25},
                    {"sku": "SC-EMR-M", "size": "M", "color": "Emerald Luxe", "color_code": "#064e3b", "price": Decimal("1999.00"), "stock": 40},
                    {"sku": "SC-EMR-L", "size": "L", "color": "Emerald Luxe", "color_code": "#064e3b", "price": Decimal("1999.00"), "stock": 30},
                    {"sku": "SC-BUR-M", "size": "M", "color": "Mulberry Wine", "color_code": "#881337", "price": Decimal("1999.00"), "stock": 35},
                    {"sku": "SC-BLK-M", "size": "M", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1999.00"), "stock": 45}
                ]
            },
            {
                "name": "Scarlet Passion Underwire 3-Piece Garter Lingerie Set",
                "slug": "scarlet-passion-underwire-3-piece-garter-lingerie-set",
                "category_slug": "matching-lace-sets",
                "description": "Complete 3-piece luxury set: underwired unlined lace bra, adjustable high-waisted garter belt with metal clips, and matching strappy Brazilian thong.",
                "product_details": "• 3-Piece Set: Bra + Garter Belt + Thong\n• Structured unlined underwire cups\n• 4 adjustable garter straps with durable metal clips\n• Alluring strappy cutout accents",
                "material": "92% Polyamide, 8% Spandex Lace",
                "care_instructions": "Hand wash cold. Lay flat to dry.",
                "mrp": Decimal("3499.00"),
                "selling_price": Decimal("2399.00"),
                "is_featured": True,
                "images": [
                    "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "GS-RED-S", "size": "S", "color": "Scarlet Red", "color_code": "#dc2626", "price": Decimal("2399.00"), "stock": 25},
                    {"sku": "GS-RED-M", "size": "M", "color": "Scarlet Red", "color_code": "#dc2626", "price": Decimal("2399.00"), "stock": 35},
                    {"sku": "GS-RED-L", "size": "L", "color": "Scarlet Red", "color_code": "#dc2626", "price": Decimal("2399.00"), "stock": 20},
                    {"sku": "GS-BLK-M", "size": "M", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("2399.00"), "stock": 30}
                ]
            },

            # ==================== NIGHTWEAR & LOUNGEWEAR ====================
            {
                "name": "Royal Emerald Silk Satin Kimono Wrap Robe",
                "slug": "royal-emerald-silk-satin-kimono-wrap-robe",
                "category_slug": "silk-robes",
                "description": "Flowy three-quarter bell sleeves trimmed with sheer scalloped lace, matching wide satin sash belt, and inner security ties. Opulent lounging luxury.",
                "product_details": "• Wide bell sleeves with delicate eyelash lace cuffs\n• Internal security tie and outer satin sash belt\n• Knee length coverage with elegant drape\n• Silky soft against bare skin",
                "material": "100% Polyester High-Sheen Satin",
                "care_instructions": "Hand wash cold. Line dry in shade.",
                "mrp": Decimal("2999.00"),
                "selling_price": Decimal("2099.00"),
                "is_featured": True,
                "images": [
                    "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "RB-EMR-M", "size": "M", "color": "Emerald Luxe", "color_code": "#064e3b", "price": Decimal("2099.00"), "stock": 30},
                    {"sku": "RB-EMR-L", "size": "L", "color": "Emerald Luxe", "color_code": "#064e3b", "price": Decimal("2099.00"), "stock": 25},
                    {"sku": "RB-BLK-M", "size": "M", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("2099.00"), "stock": 35},
                    {"sku": "RB-BUR-M", "size": "M", "color": "Mulberry Wine", "color_code": "#881337", "price": Decimal("2099.00"), "stock": 25}
                ]
            },
            {
                "name": "Rose Gold Satin Cami & Ruffle Sleep Shorts Set",
                "slug": "rose-gold-satin-cami-and-ruffle-sleep-shorts-set",
                "category_slug": "cami-shorts-sets",
                "description": "Silky smooth V-neck camisole with adjustable spaghetti straps paired with high-waist flutter hem shorts with elasticated comfort band.",
                "product_details": "• 2-piece lounge & sleep set\n• V-neckline camisole with lace trim\n• Ruffle flutter hem sleep shorts with elastic waistband\n• Breathable lightweight satin",
                "material": "95% Polyester Satin, 5% Spandex",
                "care_instructions": "Machine wash cold on delicate cycle. Line dry.",
                "mrp": Decimal("2399.00"),
                "selling_price": Decimal("1649.00"),
                "is_featured": True,
                "images": [
                    "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "CS-PNK-S", "size": "S", "color": "Blush Rose", "color_code": "#f43f5e", "price": Decimal("1649.00"), "stock": 30},
                    {"sku": "CS-PNK-M", "size": "M", "color": "Blush Rose", "color_code": "#f43f5e", "price": Decimal("1649.00"), "stock": 45},
                    {"sku": "CS-PNK-L", "size": "L", "color": "Blush Rose", "color_code": "#f43f5e", "price": Decimal("1649.00"), "stock": 30},
                    {"sku": "CS-BLK-M", "size": "M", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1649.00"), "stock": 40}
                ]
            },
            {
                "name": "Midnight Black Sheer Lace Inset Maxi Nightgown",
                "slug": "midnight-black-sheer-lace-inset-maxi-nightgown",
                "category_slug": "lace-nightdresses",
                "description": "Dramatic floor-skimming modal jersey gown with sheer lace side inserts, side thigh slit, and low scoop back. Effortlessly sensual and comfortable.",
                "product_details": "• Floor-length maxi silhouette\n• Sheer floral lace side contour panels\n• Thigh-high side slit for sensual movement\n• Buttery soft modal jersey fabric",
                "material": "92% Micro-Modal, 8% Elastane",
                "care_instructions": "Machine wash cold gentle. Lay flat to dry.",
                "mrp": Decimal("3199.00"),
                "selling_price": Decimal("2199.00"),
                "is_featured": False,
                "images": [
                    "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "MN-BLK-S", "size": "S", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("2199.00"), "stock": 20},
                    {"sku": "MN-BLK-M", "size": "M", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("2199.00"), "stock": 35},
                    {"sku": "MN-BLK-L", "size": "L", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("2199.00"), "stock": 25}
                ]
            },

            # ==================== CORSETS & SHAPEWEAR ====================
            {
                "name": "Victorian Floral Lace Boned Bustier Corset Top",
                "slug": "victorian-floral-lace-boned-bustier-corset-top",
                "category_slug": "bustier-corsets",
                "description": "12 flexible steel bones for structural waist definition with floral lace overlay, sweetheart neckline, underwire molded cups, and rear hook-and-eye closure.",
                "product_details": "• 12 flexible boning stays sculpt waist & posture\n• Underwire padded sweetheart cups\n• 5-row back hook & eye closure\n• Layer under jackets or style as seductive eveningwear",
                "material": "90% Polyester, 10% Spandex Lace with Steel Stays",
                "care_instructions": "Hand wash cold only. Do not wring or machine dry.",
                "mrp": Decimal("3299.00"),
                "selling_price": Decimal("2299.00"),
                "is_featured": True,
                "images": [
                    "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "CR-BLK-S", "size": "S", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("2299.00"), "stock": 25},
                    {"sku": "CR-BLK-M", "size": "M", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("2299.00"), "stock": 40},
                    {"sku": "CR-BLK-L", "size": "L", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("2299.00"), "stock": 30},
                    {"sku": "CR-BUR-M", "size": "M", "color": "Mulberry Wine", "color_code": "#881337", "price": Decimal("2299.00"), "stock": 25}
                ]
            },
            {
                "name": "Seamless All-in-One Open-Bust Shaper Bodysuit",
                "slug": "seamless-all-in-one-open-bust-shaper-bodysuit",
                "category_slug": "body-sculptors",
                "description": "Targeted 360-degree firm compression that contours the waist, flattens the tummy, and lifts the butt while allowing you to wear your own favorite bra.",
                "product_details": "• Open-bust U-shape lifts breasts\n• Double-layer tummy control panel\n• Butt-lifting ergonomic contour seams\n• Stay-put silicone hem prevents roll-up",
                "material": "78% Nylon, 22% Spandex",
                "care_instructions": "Machine wash gentle in laundry net. Air dry.",
                "mrp": Decimal("2499.00"),
                "selling_price": Decimal("1799.00"),
                "is_featured": False,
                "images": [
                    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "OB-NUD-S", "size": "S", "color": "Warm Nude", "color_code": "#d4b996", "price": Decimal("1799.00"), "stock": 30},
                    {"sku": "OB-NUD-M", "size": "M", "color": "Warm Nude", "color_code": "#d4b996", "price": Decimal("1799.00"), "stock": 45},
                    {"sku": "OB-NUD-L", "size": "L", "color": "Warm Nude", "color_code": "#d4b996", "price": Decimal("1799.00"), "stock": 40},
                    {"sku": "OB-BLK-M", "size": "M", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1799.00"), "stock": 35}
                ]
            },
            {
                "name": "Hourglass Lace-Trim High-Waist Tummy Cincher",
                "slug": "hourglass-lace-trim-high-waist-tummy-cincher",
                "category_slug": "waist-cinchers",
                "description": "Dual-layer micro-mesh front panel with 4 anti-roll spiral steel stays and delicate lace trim leg openings. Provides instant waist reduction and hourglass definition.",
                "product_details": "• 4 anti-roll spiral steel stays\n• Targeted firm waist & tummy compression\n• Breathable mesh rear prevents flattening\n• Scalloped lace leg trim prevents chafing",
                "material": "82% Polyamide, 18% Elastane",
                "care_instructions": "Hand wash cold. Line dry in shade.",
                "mrp": Decimal("1799.00"),
                "selling_price": Decimal("1199.00"),
                "is_featured": False,
                "images": [
                    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "TC-NUD-S", "size": "S", "color": "Warm Nude", "color_code": "#d4b996", "price": Decimal("1199.00"), "stock": 30},
                    {"sku": "TC-NUD-M", "size": "M", "color": "Warm Nude", "color_code": "#d4b996", "price": Decimal("1199.00"), "stock": 50},
                    {"sku": "TC-NUD-L", "size": "L", "color": "Warm Nude", "color_code": "#d4b996", "price": Decimal("1199.00"), "stock": 35},
                    {"sku": "TC-BLK-M", "size": "M", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1199.00"), "stock": 40}
                ]
            },
            {
                "name": "Siren Cross-Back Strappy Push-Up Lace Bra",
                "slug": "siren-cross-back-strappy-push-up-lace-bra",
                "category_slug": "push-up-bras",
                "description": "Intricate cross-back strap geometry combined with plunge push-up padding. Lifts and accentuates cleavage while turning heads with an exposed back detail.",
                "product_details": "• Level 2 graduated push-up boost\n• Multi-crossover back straps\n• Floral lace overlay cups with front closure clasp\n• Underwire support",
                "material": "86% Polyamide, 14% Spandex",
                "care_instructions": "Hand wash cold. Lay flat to dry.",
                "mrp": Decimal("2099.00"),
                "selling_price": Decimal("1449.00"),
                "is_featured": True,
                "images": [
                    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "SB-CR-BLK-34B", "size": "34B", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1449.00"), "stock": 40},
                    {"sku": "SB-CR-RED-34B", "size": "34B", "color": "Crimson Red", "color_code": "#dc2626", "price": Decimal("1449.00"), "stock": 35},
                    {"sku": "SB-CR-BLK-36C", "size": "36C", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1449.00"), "stock": 30}
                ]
            },
            {
                "name": "Sheer Eyelash Lace Halter Neck Bralette",
                "slug": "sheer-eyelash-lace-halter-neck-bralette",
                "category_slug": "lace-bralettes",
                "description": "Dramatic high-apex halter neckline with scalloped eyelash lace that traces the collarbones. Wire-free with a broad lace underbust band.",
                "product_details": "• Halter neck tie with scalloped edge\n• Sheer unlined floral lace\n• Wide elastic underband for soft lift\n• Perfect for layering under blazers",
                "material": "90% Nylon, 10% Spandex",
                "care_instructions": "Hand wash cold gentle. Line dry.",
                "mrp": Decimal("1599.00"),
                "selling_price": Decimal("1099.00"),
                "is_featured": False,
                "images": [
                    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "HB-BLK-S", "size": "S", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1099.00"), "stock": 30},
                    {"sku": "HB-BLK-M", "size": "M", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1099.00"), "stock": 45},
                    {"sku": "HB-BUR-M", "size": "M", "color": "Mulberry Wine", "color_code": "#881337", "price": Decimal("1099.00"), "stock": 25}
                ]
            },
            {
                "name": "Satin & Sheer Keyhole Cheeky Lace Brief",
                "slug": "satin-and-sheer-keyhole-cheeky-lace-brief",
                "category_slug": "cheeky-briefs",
                "description": "Sultry back keyhole cutout framed with satin bows and sheer scalloped floral lace. Cheeky coverage with zero panty line edges.",
                "product_details": "• Flirty back keyhole cutout with mini bow\n• Stretch floral lace side wings\n• Smooth satin front panel\n• Breathable organic cotton gusset",
                "material": "90% Polyamide, 10% Elastane",
                "care_instructions": "Hand wash cold.",
                "mrp": Decimal("799.00"),
                "selling_price": Decimal("529.00"),
                "is_featured": True,
                "images": [
                    "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "KC-BLK-S", "size": "S", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("529.00"), "stock": 35},
                    {"sku": "KC-BLK-M", "size": "M", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("529.00"), "stock": 50},
                    {"sku": "KC-RED-M", "size": "M", "color": "Scarlet Red", "color_code": "#dc2626", "price": Decimal("529.00"), "stock": 40}
                ]
            },
            {
                "name": "High-Waist Suspender Lace Panty with Garter Straps",
                "slug": "high-waist-suspender-lace-panty-with-garter-straps",
                "category_slug": "high-waist-panties",
                "description": "High-waisted sheer lace brief with 4 built-in adjustable suspender garter straps. Accentuates the waist and hips with romantic vintage seduction.",
                "product_details": "• High-rise waist with scalloped trim\n• 4 attached adjustable garter straps\n• Sheer floral mesh front & rear\n• Soft cotton crotch lining",
                "material": "88% Nylon Lace, 12% Spandex",
                "care_instructions": "Hand wash cold. Lay flat to dry.",
                "mrp": Decimal("1299.00"),
                "selling_price": Decimal("899.00"),
                "is_featured": False,
                "images": [
                    "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "SP-BLK-S", "size": "S", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("899.00"), "stock": 25},
                    {"sku": "SP-BLK-M", "size": "M", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("899.00"), "stock": 40},
                    {"sku": "SP-BUR-M", "size": "M", "color": "Mulberry Wine", "color_code": "#881337", "price": Decimal("899.00"), "stock": 25}
                ]
            },
            {
                "name": "Seductive 3-Piece Floral Mesh & Lace Bralette Set",
                "slug": "seductive-3-piece-floral-mesh-and-lace-bralette-set",
                "category_slug": "matching-lace-sets",
                "description": "Alluring 3-piece set comprising an unlined lace bralette, matching garter belt, and strappy G-string thong. Crafted with gold-accented hardware.",
                "product_details": "• 3-Piece: Bralette + Garter Belt + Thong\n• Unlined scalloped cups with adjustable halter\n• Garter belt with 4 adjustable clips\n• Barely-there G-string thong",
                "material": "90% Polyamide, 10% Spandex",
                "care_instructions": "Hand wash cold. Dry flat.",
                "mrp": Decimal("2899.00"),
                "selling_price": Decimal("1999.00"),
                "is_featured": True,
                "images": [
                    "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "MS-BLK-S", "size": "S", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1999.00"), "stock": 25},
                    {"sku": "MS-BLK-M", "size": "M", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1999.00"), "stock": 40},
                    {"sku": "MS-RED-M", "size": "M", "color": "Scarlet Red", "color_code": "#dc2626", "price": Decimal("1999.00"), "stock": 30}
                ]
            },
            {
                "name": "Crimson Velvet & Sheer Lace Chemise",
                "slug": "crimson-velvet-and-sheer-lace-chemise",
                "category_slug": "sheer-babydolls",
                "description": "Luxe crimson stretch velvet bodice paired with sheer scalloped lace skirt and low cross-back straps. Radiates sophisticated glamour.",
                "product_details": "• Stretch crushed velvet bodice with sweetheart cut\n• Sheer lace skirt panel\n• Low back with crisscross straps\n• Includes matching velvet-trimmed thong",
                "material": "92% Polyester Velvet, 8% Spandex",
                "care_instructions": "Hand wash cold gentle. Do not iron.",
                "mrp": Decimal("2699.00"),
                "selling_price": Decimal("1849.00"),
                "is_featured": True,
                "images": [
                    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "VC-RED-S", "size": "S", "color": "Crimson Passion", "color_code": "#be123c", "price": Decimal("1849.00"), "stock": 20},
                    {"sku": "VC-RED-M", "size": "M", "color": "Crimson Passion", "color_code": "#be123c", "price": Decimal("1849.00"), "stock": 35},
                    {"sku": "VC-BLK-M", "size": "M", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1849.00"), "stock": 30}
                ]
            },
            {
                "name": "Sheer Lace Trim Backless Satin Romper",
                "slug": "sheer-lace-trim-backless-satin-romper",
                "category_slug": "cami-shorts-sets",
                "description": "Sensual one-piece sleep romper in liquid satin with deep plunge lace V-neckline, low open back, and fluttery scalloped leg openings.",
                "product_details": "• 1-Piece slip romper silhouette\n• Deep plunge front with lace trim\n• Low back with halter tie closure\n• Elasticated cinched waist",
                "material": "95% Polyester Satin, 5% Elastane",
                "care_instructions": "Hand wash cold. Line dry in shade.",
                "mrp": Decimal("2499.00"),
                "selling_price": Decimal("1699.00"),
                "is_featured": False,
                "images": [
                    "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "SR-EMR-S", "size": "S", "color": "Emerald Luxe", "color_code": "#064e3b", "price": Decimal("1699.00"), "stock": 20},
                    {"sku": "SR-EMR-M", "size": "M", "color": "Emerald Luxe", "color_code": "#064e3b", "price": Decimal("1699.00"), "stock": 30},
                    {"sku": "SR-BLK-M", "size": "M", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("1699.00"), "stock": 30}
                ]
            },
            {
                "name": "Mulberry Silk Longline Kimono Gown",
                "slug": "mulberry-silk-longline-kimono-gown",
                "category_slug": "silk-robes",
                "description": "Floor-length flowing kimono gown with sheer floral lace sleeve insets and a wide satin belt. Epitome of high-end evening luxury.",
                "product_details": "• Floor-length maxi silhouette\n• Wide bell sleeves with sheer lace inserts\n• Internal ties and wide satin outer sash\n• Deep side walking slits",
                "material": "100% High-Sheen Satin",
                "care_instructions": "Hand wash cold or dry clean.",
                "mrp": Decimal("3599.00"),
                "selling_price": Decimal("2499.00"),
                "is_featured": True,
                "images": [
                    "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=80"
                ],
                "variants": [
                    {"sku": "LG-BLK-M", "size": "M", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("2499.00"), "stock": 25},
                    {"sku": "LG-BLK-L", "size": "L", "color": "Midnight Noir", "color_code": "#111827", "price": Decimal("2499.00"), "stock": 20},
                    {"sku": "LG-BUR-M", "size": "M", "color": "Mulberry Wine", "color_code": "#881337", "price": Decimal("2499.00"), "stock": 25}
                ]
            }
        ]

        # 5. Insert Products, Images, and Variants
        for pdata in catalog:
            cat = cat_map.get(pdata["category_slug"])
            if not cat:
                print(f"Warning: Category slug {pdata['category_slug']} not found!")
                continue

            discount = ((pdata["mrp"] - pdata["selling_price"]) / pdata["mrp"] * 100).quantize(Decimal("0.01"))
            prod = Product(
                name=pdata["name"],
                slug=pdata["slug"],
                description=pdata["description"],
                product_details=pdata["product_details"],
                material=pdata["material"],
                care_instructions=pdata["care_instructions"],
                category_id=cat.id,
                mrp=pdata["mrp"],
                selling_price=pdata["selling_price"],
                discount_percentage=discount,
                is_featured=pdata.get("is_featured", False),
                is_active=True
            )
            db.add(prod)
            db.flush()

            # Product Images
            for idx, img_url in enumerate(pdata.get("images", [])):
                db.add(ProductImage(
                    product_id=prod.id,
                    image_url=img_url,
                    is_primary=(idx == 0),
                    sort_order=idx
                ))

            # Variants
            for vdata in pdata.get("variants", []):
                db.add(ProductVariant(
                    product_id=prod.id,
                    sku=vdata["sku"],
                    size=vdata["size"],
                    color=vdata["color"],
                    color_code=vdata.get("color_code"),
                    price=vdata["price"],
                    stock_quantity=vdata["stock"],
                    is_active=True
                ))

        db.commit()
        print(f"Successfully wiped and re-seeded catalog with {len(catalog)} luxury & seductive products, complete images, and variants!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding catalog: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    clean_and_seed_catalog()
