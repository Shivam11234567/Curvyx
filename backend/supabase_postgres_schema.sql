CREATE TABLE admin_users (
	id VARCHAR(36) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	role VARCHAR(64) NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE audit_logs (
	id VARCHAR(36) NOT NULL, 
	admin_id VARCHAR(36) NOT NULL, 
	action VARCHAR(100) NOT NULL, 
	entity VARCHAR(100) NOT NULL, 
	entity_id VARCHAR(100), 
	details JSON, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE categories (
	id VARCHAR(36) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	slug VARCHAR(255) NOT NULL, 
	description TEXT, 
	parent_id VARCHAR(36), 
	image_url VARCHAR(1024), 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(parent_id) REFERENCES categories (id) ON DELETE SET NULL
);

CREATE TABLE coupons (
	id VARCHAR(36) NOT NULL, 
	code VARCHAR(50) NOT NULL, 
	discount_type VARCHAR(20) NOT NULL, 
	discount_value NUMERIC(10, 2) NOT NULL, 
	minimum_order_value NUMERIC(10, 2) NOT NULL, 
	maximum_discount NUMERIC(10, 2), 
	usage_limit INTEGER, 
	used_count INTEGER NOT NULL, 
	start_at TIMESTAMP WITHOUT TIME ZONE, 
	expires_at TIMESTAMP WITHOUT TIME ZONE, 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE users (
	id VARCHAR(36) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	phone VARCHAR(32), 
	password_hash VARCHAR(255) NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE addresses (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	phone VARCHAR(32) NOT NULL, 
	address_line_1 VARCHAR(255) NOT NULL, 
	address_line_2 VARCHAR(255), 
	city VARCHAR(100) NOT NULL, 
	state VARCHAR(100) NOT NULL, 
	postal_code VARCHAR(20) NOT NULL, 
	country VARCHAR(100) NOT NULL, 
	is_default BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE carts (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE orders (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36), 
	order_number VARCHAR(64) NOT NULL, 
	subtotal NUMERIC(10, 2) NOT NULL, 
	discount NUMERIC(10, 2) NOT NULL, 
	shipping_amount NUMERIC(10, 2) NOT NULL, 
	tax_amount NUMERIC(10, 2) NOT NULL, 
	total_amount NUMERIC(10, 2) NOT NULL, 
	payment_status VARCHAR(32) NOT NULL, 
	order_status VARCHAR(32) NOT NULL, 
	shipping_address_snapshot JSON NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE products (
	id VARCHAR(36) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	slug VARCHAR(255) NOT NULL, 
	description TEXT, 
	product_details TEXT, 
	material VARCHAR(255), 
	care_instructions TEXT, 
	category_id VARCHAR(36) NOT NULL, 
	mrp NUMERIC(10, 2) NOT NULL, 
	selling_price NUMERIC(10, 2) NOT NULL, 
	discount_percentage NUMERIC(5, 2) NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	is_featured BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(category_id) REFERENCES categories (id) ON DELETE RESTRICT
);

CREATE TABLE wishlists (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE order_items (
	id VARCHAR(36) NOT NULL, 
	order_id VARCHAR(36) NOT NULL, 
	product_variant_id VARCHAR(36), 
	product_name_snapshot VARCHAR(255) NOT NULL, 
	sku_snapshot VARCHAR(100) NOT NULL, 
	size_snapshot VARCHAR(50) NOT NULL, 
	color_snapshot VARCHAR(50) NOT NULL, 
	image_url_snapshot VARCHAR(1024), 
	unit_price NUMERIC(10, 2) NOT NULL, 
	quantity INTEGER NOT NULL, 
	total_price NUMERIC(10, 2) NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(order_id) REFERENCES orders (id) ON DELETE CASCADE
);

CREATE TABLE payments (
	id VARCHAR(36) NOT NULL, 
	order_id VARCHAR(36) NOT NULL, 
	razorpay_order_id VARCHAR(255) NOT NULL, 
	razorpay_payment_id VARCHAR(255), 
	razorpay_signature VARCHAR(255), 
	amount NUMERIC(10, 2) NOT NULL, 
	currency VARCHAR(10) NOT NULL, 
	status VARCHAR(32) NOT NULL, 
	raw_response JSON, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(order_id) REFERENCES orders (id) ON DELETE CASCADE
);

CREATE TABLE product_images (
	id VARCHAR(36) NOT NULL, 
	product_id VARCHAR(36) NOT NULL, 
	image_url VARCHAR(1024) NOT NULL, 
	is_primary BOOLEAN NOT NULL, 
	sort_order INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(product_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE TABLE product_variants (
	id VARCHAR(36) NOT NULL, 
	product_id VARCHAR(36) NOT NULL, 
	sku VARCHAR(100) NOT NULL, 
	size VARCHAR(50) NOT NULL, 
	color VARCHAR(50) NOT NULL, 
	color_code VARCHAR(20), 
	price NUMERIC(10, 2) NOT NULL, 
	stock_quantity INTEGER NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(product_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE TABLE wishlist_items (
	id VARCHAR(36) NOT NULL, 
	wishlist_id VARCHAR(36) NOT NULL, 
	product_id VARCHAR(36) NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_wishlist_product UNIQUE (wishlist_id, product_id), 
	FOREIGN KEY(wishlist_id) REFERENCES wishlists (id) ON DELETE CASCADE, 
	FOREIGN KEY(product_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE TABLE cart_items (
	id VARCHAR(36) NOT NULL, 
	cart_id VARCHAR(36) NOT NULL, 
	product_variant_id VARCHAR(36) NOT NULL, 
	quantity INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(cart_id) REFERENCES carts (id) ON DELETE CASCADE, 
	FOREIGN KEY(product_variant_id) REFERENCES product_variants (id) ON DELETE CASCADE
);

