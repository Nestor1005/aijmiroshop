-- =====================================================
-- AIJMIROSHOP - Schema SQL para Supabase
-- =====================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: users (Usuarios del sistema)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'operator')),
    name VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- TABLA: products (Inventario de productos)
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(100) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    cost DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para products
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_stock ON products(stock);

-- =====================================================
-- TABLA: clients (Clientes)
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ci VARCHAR(50) NOT NULL,
    complement VARCHAR(10),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ci, complement)
);

-- Índices para clients
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_ci ON clients(ci);

-- =====================================================
-- TABLA: sales (Ventas)
-- =====================================================
CREATE TABLE IF NOT EXISTS sales (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(255),
    client_ci VARCHAR(50),
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    shipping DECIMAL(10, 2) NOT NULL DEFAULT 0,
    shipping_address TEXT,
    total DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('efectivo', 'qr', 'transferencia', 'otro')),
    user_name VARCHAR(100) NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para sales
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX idx_sales_payment_method ON sales(payment_method);
CREATE INDEX idx_sales_user_id ON sales(user_id);

-- =====================================================
-- TABLA: sale_items (Items de cada venta)
-- =====================================================
CREATE TABLE IF NOT EXISTS sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_color VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para sale_items
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- =====================================================
-- TABLA: settings (Configuraciones del sistema)
-- =====================================================
CREATE TABLE IF NOT EXISTS settings (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para settings
CREATE INDEX idx_settings_key ON settings(key);

-- =====================================================
-- TRIGGERS para updated_at
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Usuario Admin (contraseña: admin123 - CAMBIAR EN PRODUCCIÓN)
INSERT INTO users (id, username, password, role, name) VALUES
(1, 'admin', 'admin123', 'admin', 'Administrador')
ON CONFLICT (username) DO NOTHING;

-- Usuario Operador (contraseña: oper123 - CAMBIAR EN PRODUCCIÓN)
INSERT INTO users (id, username, password, role, name, active) VALUES
(2, 'operador', 'oper123', 'operator', 'Operador', true)
ON CONFLICT (username) DO NOTHING;

-- Configuración de tickets por defecto
INSERT INTO settings (key, value) VALUES
('ticketSettings', '{
    "companyName": "AIJMIROSHOP",
    "subtitle": "Sistema de Gestión de Inventario",
    "startNumber": 1,
    "footerMessage": "¡Gracias por su compra!"
}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Productos de ejemplo
INSERT INTO products (name, color, stock, cost, price, image) VALUES
('Camiseta Deportiva', 'Rojo', 50, 45.50, 89.90, ''),
('Pantalón Jean', 'Azul', 25, 120.00, 199.00, ''),
('Zapatillas Running', 'Negro', 8, 280.00, 450.00, '')
ON CONFLICT DO NOTHING;

-- Clientes de ejemplo
INSERT INTO clients (name, ci, complement, phone, address) VALUES
('Juan Pérez López', '12345678', '1A', '70123456', 'Av. América #123, Zona Central'),
('María González', '87654321', '', '71234567', 'Calle Libertad #456'),
('Carlos Rodríguez', '11223344', '2B', '72345678', 'Av. Ballivián #789')
ON CONFLICT (ci, complement) DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - IMPORTANTE
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Políticas para lectura pública (ajustar según necesidad)
CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public read clients" ON clients FOR SELECT USING (true);
CREATE POLICY "Allow public read sales" ON sales FOR SELECT USING (true);
CREATE POLICY "Allow public read sale_items" ON sale_items FOR SELECT USING (true);
CREATE POLICY "Allow public read settings" ON settings FOR SELECT USING (true);

-- Políticas para escritura pública (CAMBIAR EN PRODUCCIÓN con autenticación real)
CREATE POLICY "Allow public insert products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update products" ON products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete products" ON products FOR DELETE USING (true);

CREATE POLICY "Allow public insert clients" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update clients" ON clients FOR UPDATE USING (true);
CREATE POLICY "Allow public delete clients" ON clients FOR DELETE USING (true);

CREATE POLICY "Allow public insert sales" ON sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert sale_items" ON sale_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete users" ON users FOR DELETE USING (true);

CREATE POLICY "Allow public insert settings" ON settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update settings" ON settings FOR UPDATE USING (true);

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de ventas con detalles completos
CREATE OR REPLACE VIEW sales_with_details AS
SELECT 
    s.*,
    json_agg(
        json_build_object(
            'id', si.id,
            'product_name', si.product_name,
            'product_color', si.product_color,
            'quantity', si.quantity,
            'price', si.price
        )
    ) as items
FROM sales s
LEFT JOIN sale_items si ON s.id = si.sale_id
GROUP BY s.id;

-- =====================================================
-- FUNCIONES ÚTILES
-- =====================================================

-- Función para obtener el siguiente ID de venta
CREATE OR REPLACE FUNCTION get_next_sale_id()
RETURNS INTEGER AS $$
DECLARE
    max_id INTEGER;
    start_number INTEGER;
BEGIN
    -- Obtener el máximo ID actual
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM sales;
    
    -- Obtener el número inicial configurado
    SELECT COALESCE((value->>'startNumber')::INTEGER, 1) 
    INTO start_number 
    FROM settings 
    WHERE key = 'ticketSettings';
    
    -- Retornar el mayor entre max_id + 1 y start_number
    RETURN GREATEST(max_id + 1, start_number);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INFORMACIÓN
-- =====================================================

COMMENT ON TABLE users IS 'Usuarios del sistema (admin y operadores)';
COMMENT ON TABLE products IS 'Inventario de productos';
COMMENT ON TABLE clients IS 'Base de datos de clientes';
COMMENT ON TABLE sales IS 'Registro de ventas';
COMMENT ON TABLE sale_items IS 'Items/productos de cada venta';
COMMENT ON TABLE settings IS 'Configuraciones del sistema en formato JSON';

-- =====================================================
-- FIN DEL SCHEMA
-- =====================================================
